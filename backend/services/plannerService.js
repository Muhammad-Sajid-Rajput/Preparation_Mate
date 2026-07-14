const { generateWithFallback } = require('./ai/geminiService')
const StudyPlan  = require('../models/StudyPlan')
const Task       = require('../models/Task')
const Note       = require('../models/Note')
const TopicMastery = require('../models/TopicMastery')
const ApiUsageLog  = require('../models/ApiUsageLog')

// ─── HELPERS ────────────────────────────────────────────

const getTodayStr = () => new Date().toISOString().split('T')[0]

const parseAITasks = (raw) => {
  if (!raw) throw new Error('Empty response from AI.');
  
  // Find JSON array start and end boundaries
  const startIdx = raw.indexOf('[');
  const endIdx = raw.lastIndexOf(']');
  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
    throw new Error('Response is not a valid JSON array.');
  }
  
  let jsonStr = raw.substring(startIdx, endIdx + 1);
  
  // Strip potential trailing commas in JSON object/array items
  jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
  
  return JSON.parse(jsonStr);
};

const getDaysUntilExam = (examDate) =>
  Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24))

const getAvailableHoursForDate = (plan, dateStr) => {
  const day = new Date(dateStr).getDay() // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 6
  if (isWeekend && plan.weekendHours != null) return plan.weekendHours
  if (!isWeekend && plan.weekdayHours != null) return plan.weekdayHours
  return plan.dailyTargetHours
}

// ─── GET SUGGESTED TOPICS ───────────────────────────────

exports.getSuggestedTopics = async (userId) => {
  const [notes, weakTopics] = await Promise.all([
    Note.find({ userId, processingStatus: 'ready' })
      .select('title extractedTopics'),
    TopicMastery.find({ userId, weakFlag: true })
      .sort({ masteryScore: 1 })
      .select('topic masteryScore'),
  ])

  const weakNames = new Set(weakTopics.map(t => t.topic))

  const noteTopics = notes.flatMap(n =>
    (n.extractedTopics || []).map(topic => ({
      topic,
      source:     n.title,
      sourceId:   n._id.toString(),
      priority:   weakNames.has(topic) ? 'high' : 'medium',
      hours:      weakNames.has(topic) ? 2 : 1,
      isWeak:     weakNames.has(topic),
      mastery:    weakTopics.find(w => w.topic === topic)?.masteryScore ?? null,
    }))
  )

  const weakSuggestions = weakTopics.map(t => ({
    topic:     t.topic,
    source:    'Knowledge Gaps',
    sourceId:  null,
    priority:  'high',
    hours:     2,
    isWeak:    true,
    mastery:   t.masteryScore,
  }))

  // Merge: weak topics first, deduplicated
  const seen = new Set()
  const merged = [...weakSuggestions, ...noteTopics].filter(t => {
    if (seen.has(t.topic)) return false
    seen.add(t.topic)
    return true
  })

  return merged.slice(0, 25)
}

// ─── CREATE PLAN ────────────────────────────────────────

exports.createPlan = async ({
  userId, examName, examDate, dailyTargetHours,
  weekdayHours, weekendHours, topics, sourceNotes,
}) => {


  const daysAvailable = Math.max(1, getDaysUntilExam(examDate))
  const today = new Date()
  today.setHours(0,0,0,0)

  // Fetch note details for task generation
  const noteIds = (sourceNotes || []).filter(Boolean)
  const notes = noteIds.length > 0
    ? await Note.find({ _id: { $in: noteIds }, userId })
        .select('title extractedTopics pageCount')
    : []

  const topicList = (topics || [])
    .map(t => `- ${t.topic} (Priority: ${t.priority}, Est. ${t.hours}h, Source: ${t.source || 'manual'})`)
    .join('\n')

  const noteList = notes
    .map(n => `- "${n.title}" (${n.pageCount || '?'} pages, topics: ${(n.extractedTopics || []).join(', ')})`)
    .join('\n')

  const prompt = `
You are a university exam study planner.
Generate a complete day-by-day task schedule.

EXAM: ${examName}
EXAM DATE: ${new Date(examDate).toISOString().split('T')[0]}
TODAY: ${today.toISOString().split('T')[0]}
DAYS AVAILABLE: ${daysAvailable}
DAILY STUDY HOURS: ${dailyTargetHours}h

${notes.length > 0 ? `UPLOADED NOTES:\n${noteList}` : ''}
${topics?.length > 0 ? `TOPICS TO COVER:\n${topicList}` : ''}

Generate a structured daily plan with SPECIFIC TASKS of these types:
- "read": Reading a note or section (title: "Read: [Note Title]")
- "quiz": Practice quiz on a topic (title: "Quiz: [Topic]")
- "review": Review mistakes/weak areas (title: "Review: [Topic]")
- "manual": Any other study activity

Each day should have 2-4 tasks. Mix types for variety.
Last 2 days before exam: only "review" type tasks.

Return ONLY a valid JSON array:
[
  {
    "date": "YYYY-MM-DD",
    "title": "Read: Testing Chapter 1",
    "type": "read",
    "topic": "Software Testing",
    "estimatedMins": 45,
    "priority": "high",
    "sourceNoteTitle": "Software Engineering Notes",
    "metadata": {
      "suggestedPages": "Pages 1-20"
    },
    "goal": "Improve Software Testing Fundamentals",
    "whyThisMatters": "Software Testing accounts for approximately 18% of your exam. Improving this topic increases your overall readiness.",
    "expectedImpact": "Topic Mastery: 42% -> 55%, Exam Readiness: +4%"
  }
]

Rules:
- Start from tomorrow
- Respect daily hour limit (estimatedMins per day total)
- High priority topics get more tasks
- Alternate read → quiz → review for each topic
- Return ONLY the JSON array, no markdown
`

  const start = Date.now()
  let taskData = []

  try {
    const { text: raw, modelUsed } = await generateWithFallback(
      prompt, {
        modelOverride: process.env.GEMINI_PLANNER_MODEL || 'gemini-3.5-flash',
        userId,
        endpoint: '/planner/create',
        feature: 'planner'
      }
    )
    taskData = parseAITasks(raw)
  } catch (err) {
    throw Object.assign(
      new Error(`Could not generate study plan. Please try again. Details: ${err.message}`),
      { statusCode: 500 }
    )
  }

  // Delete existing plan and its tasks only after AI generation succeeds
  const existing = await StudyPlan.findOne({ userId })
  if (existing) {
    await Task.deleteMany({ planId: existing._id })
    await StudyPlan.findByIdAndDelete(existing._id)
  }

  const plan = await StudyPlan.create({
    userId, examName,
    examDate: new Date(examDate),
    dailyTargetHours,
    weekdayHours: weekdayHours || null,
    weekendHours: weekendHours || null,
    status: 'active',
    healthStatus: 'on_track',
  })

  // Match note IDs to tasks
  const noteMap = {}
  notes.forEach(n => { noteMap[n.title] = n._id })

  const taskDocs = taskData.map(t => ({
    planId:          plan._id,
    userId,
    title:           t.title,
    type:            t.type || 'manual',
    topic:           t.topic || '',
    dateAssigned:    new Date(t.date),
    estimatedMins:   t.estimatedMins || 30,
    priority:        t.priority || 'medium',
    completed:       false,
    sourceNoteTitle: t.sourceNoteTitle || null,
    sourceNoteId:    t.sourceNoteTitle ? noteMap[t.sourceNoteTitle] || null : null,
    metadata:        t.metadata || {},
    goal:            t.goal || '',
    whyThisMatters:  t.whyThisMatters || '',
    expectedImpact:  t.expectedImpact || '',
  }))

  await Task.insertMany(taskDocs)

  const allTasks = await Task.find({ planId: plan._id })
    .sort({ dateAssigned: 1 })

  // Return formatted fields
  const formattedTasks = allTasks.map(t => ({
    ...t.toObject(),
    id: t._id.toString(),
    date: t.dateAssigned,
  }))

  return { ...plan.toObject(), tasks: formattedTasks }
}

// ─── GET PLAN WITH HEALTH ────────────────────────────────

exports.getPlan = async (userId) => {
  const plan = await StudyPlan.findOne({ userId, status: 'active' })
  if (!plan) return null

  const tasks = await Task.find({ planId: plan._id })
    .sort({ dateAssigned: 1 })

  const today = new Date()
  today.setHours(0,0,0,0)
  const todayStr = today.toISOString().split('T')[0]

  // Health calculation
  const pastTasks = tasks.filter(
    t => new Date(t.dateAssigned) < today
  )
  const overdueTasks = pastTasks.filter(t => !t.completed)
  const overduePct = pastTasks.length > 0
    ? overdueTasks.length / pastTasks.length
    : 0

  const totalTasks     = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const progressPct    = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0

  const daysUntilExam = getDaysUntilExam(plan.examDate)

  // 1. Determine Health Status
  let healthStatus = 'on_track'
  if (overduePct >= 0.20) healthStatus = 'critical'
  else if (overduePct >= 0.10) healthStatus = 'falling_behind'

  // 2. Determine Recovery Mode
  let recoveryMode = plan.recoveryMode || false
  if (healthStatus === 'critical') {
    recoveryMode = true
  } else if (overduePct === 0) {
    recoveryMode = false
  }

  // 3. Compute Readiness Score (Completion 50% + Mastery 40% + Time progress 10%)
  const TopicMastery = require('../models/TopicMastery')
  const mastery = await TopicMastery.find({ userId })
  const avgMastery = mastery.length > 0
    ? mastery.reduce((s, t) => s + t.masteryScore, 0) / mastery.length
    : 50
  const masteryFactor = avgMastery / 100

  const daysLeft     = Math.max(0, daysUntilExam)
  const totalDays    = Math.max(1, daysUntilExam +
    Math.ceil((new Date() - new Date(plan.createdAt)) / 86400000))
  const timeFactor   = 1 - (daysLeft / totalDays) * 0.3
  const completionFactor = completedTasks / totalTasks

  const readiness = Math.round(
    (completionFactor * 0.5 + masteryFactor * 0.4 + timeFactor * 0.1) * 100
  )
  const currentReadiness = Math.min(100, Math.max(0, readiness))

  // 4. Compute Potential Increase if today's tasks are completed
  const todayTasks = tasks.filter(
    t => t.dateAssigned.toISOString().split('T')[0] === todayStr
  )
  const todayIncompleteCount = todayTasks.filter(t => !t.completed).length
  const hypotheticalCompleted = completedTasks + todayIncompleteCount
  const hypotheticalCompletionFactor = hypotheticalCompleted / totalTasks
  const hypotheticalReadiness = Math.round(
    (hypotheticalCompletionFactor * 0.5 + masteryFactor * 0.4 + timeFactor * 0.1) * 100
  )
  const potentialIncrease = Math.max(0, hypotheticalReadiness - currentReadiness)

  // Update health status, recoveryMode, readinessScore in DB if changed
  if (
    healthStatus !== plan.healthStatus ||
    recoveryMode !== plan.recoveryMode ||
    currentReadiness !== plan.readinessScore
  ) {
    await StudyPlan.findByIdAndUpdate(plan._id, {
      healthStatus,
      recoveryMode,
      readinessScore: currentReadiness,
      lastHealthCheck: new Date(),
      recalcNeeded: healthStatus === 'critical',
    })
  }

  // Auto-recalculate if critical and autoRecalc enabled
  if (healthStatus === 'critical' && plan.autoRecalc && overdueTasks.length > 0) {
    try {
      await exports.recalculatePlan(userId)
      // Refresh tasks after recalc
      const newTasks = await Task.find({ planId: plan._id })
        .sort({ dateAssigned: 1 })
      return buildPlanResponse(plan, newTasks, today, todayStr, progressPct, 0, 'on_track', daysUntilExam, true, currentReadiness, potentialIncrease)
    } catch {
      // Auto-recalc failed silently — return current state
    }
  }

  return buildPlanResponse(
    plan, tasks, today, todayStr,
    progressPct, overdueTasks.length, healthStatus,
    daysUntilExam, false, currentReadiness, potentialIncrease
  )
}

const buildPlanResponse = (
  plan, tasks, today, todayStr,
  progressPct, overdueCount, healthStatus,
  daysUntilExam, wasAutoRecalculated,
  readinessScore = 0, potentialIncrease = 0
) => {
  const totalTasks     = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length

  const todayTasks = tasks.filter(
    t => t.dateAssigned.toISOString().split('T')[0] === todayStr
  )
  const tomorrowStr = new Date(today.getTime() + 86400000)
    .toISOString().split('T')[0]
  const tomorrowTasks = tasks.filter(
    t => t.dateAssigned.toISOString().split('T')[0] === tomorrowStr
  )

  const todayEstimatedMins = todayTasks.reduce(
    (sum, t) => sum + (t.estimatedMins || 30), 0
  )

  const formattedTasks = tasks.map(t => ({
    ...t.toObject(),
    id: t._id.toString(),
    date: t.dateAssigned,
  }))

  return {
    ...plan.toObject(),
    tasks: formattedTasks,
    readinessScore: readinessScore || plan.readinessScore || 0,
    recoveryMode: plan.recoveryMode || false,
    meta: {
      totalTasks,
      completedTasks,
      overdueTasks:   overdueCount,
      progressPct,
      daysUntilExam,
      healthStatus,
      recalcNeeded:   healthStatus === 'critical',
      wasAutoRecalculated,
      todayTasks:     todayTasks.length,
      todayEstimatedMins,
      tomorrowTasks:  tomorrowTasks.length,
      readinessScore: readinessScore || plan.readinessScore || 0,
      potentialIncrease,
      recoveryMode: plan.recoveryMode || false,
    }
  }
}

// ─── GET TODAY'S MISSION ────────────────────────────────

exports.getTodaysMission = async (userId) => {
  const plan = await StudyPlan.findOne({ userId, status: 'active' })
  if (!plan) return null

  const todayStr = new Date().toISOString().split('T')[0]
  const tasks = await Task.find({
    planId: plan._id,
    dateAssigned: {
      $gte: new Date(todayStr + 'T00:00:00.000Z'),
      $lt:  new Date(todayStr + 'T23:59:59.999Z'),
    },
  }).sort({ priority: -1, type: 1 })

  const totalMins    = tasks.reduce((s, t) => s + (t.estimatedMins || 30), 0)
  const completedNow = tasks.filter(t => t.completed).length

  const formattedTasks = tasks.map(t => ({
    ...t.toObject(),
    id: t._id.toString(),
    date: t.dateAssigned,
  }))

  return {
    examName:   plan.examName,
    examDate:   plan.examDate,
    daysLeft:   getDaysUntilExam(plan.examDate),
    tasks:      formattedTasks,
    totalMins,
    completedCount: completedNow,
    totalCount:     tasks.length,
    allDone:        tasks.length > 0 && completedNow === tasks.length,
  }
}

// ─── RECALCULATE PLAN ────────────────────────────────────

exports.recalculatePlan = async (userId) => {
  const plan = await StudyPlan.findOne({ userId, status: 'active' })
  if (!plan) throw Object.assign(
    new Error('No active plan.'), { statusCode: 404 }
  )

  const today = new Date()
  today.setHours(0,0,0,0)
  const daysLeft = getDaysUntilExam(plan.examDate)

  if (daysLeft <= 0) throw Object.assign(
    new Error('Exam has passed.'), { statusCode: 400 }
  )

  const incompleteTasks = await Task.find({
    planId: plan._id, completed: false,
    dateAssigned: { $gte: today },
  })

  if (incompleteTasks.length === 0) {
    return { message: 'All tasks are complete.', isTight: false }
  }

  const weakTopics = await TopicMastery.find({ userId, weakFlag: true })
    .sort({ masteryScore: 1 }).limit(5)
  const weakNames = weakTopics.map(t => t.topic)

  const totalMinsNeeded = incompleteTasks.reduce(
    (s, t) => s + (t.estimatedMins || 30), 0
  )
  const totalMinsAvailable = daysLeft * plan.dailyTargetHours * 60
  const isTight = totalMinsNeeded > totalMinsAvailable

  const taskSummary = [
    ...new Map(
      incompleteTasks.map(t => [t.topic || t.title, t])
    ).values()
  ].map(t => ({
    topic:    t.topic || t.title,
    type:     t.type,
    mins:     t.estimatedMins || 30,
    priority: weakNames.includes(t.topic) ? 'high' : t.priority,
  }))

  const tomorrow = new Date(today.getTime() + 86400000)

  const prompt = `
You are a study planner. Reschedule incomplete study tasks.

EXAM: ${plan.examName}
EXAM DATE: ${new Date(plan.examDate).toISOString().split('T')[0]}
TODAY: ${today.toISOString().split('T')[0]}
DAYS LEFT: ${daysLeft}
DAILY HOURS: ${plan.dailyTargetHours}h
TIME TIGHT: ${isTight ? 'YES' : 'NO'}
RECOVERY MODE ACTIVATED: ${plan.recoveryMode ? 'YES' : 'NO'}

${plan.recoveryMode ? 'CRITICAL: Recovery Mode is active because the student has missed multiple study days. Please compress the remaining schedule, prioritize weak topics, remove low-value review sessions, and focus strictly on high-impact concepts to guide them back to exam readiness.' : ''}

WEAK TOPICS (prioritize): ${weakNames.join(', ') || 'none'}

TASKS TO RESCHEDULE:
${taskSummary.map(t => `- ${t.topic} (${t.type}, ${t.mins}min, ${t.priority})`).join('\n')}

Return ONLY a JSON array starting from ${tomorrow.toISOString().split('T')[0]}:
[
  {
    "date": "YYYY-MM-DD",
    "title": "Task title",
    "type": "read|quiz|review|manual",
    "topic": "Topic name",
    "estimatedMins": 30,
    "priority": "high|medium|low",
    "goal": "Improve Software Testing Fundamentals",
    "whyThisMatters": "Software Testing accounts for approximately 18% of your exam. Improving this topic increases your overall readiness.",
    "expectedImpact": "Topic Mastery: 42% -> 55%, Exam Readiness: +4%"
  }
]

Rules:
- Never schedule on or before today
- Max ${plan.dailyTargetHours}h per day total
- Last 2 days: review only
- If tight or in recovery mode: drop low priority, focus on high and weak topics
- Return ONLY the JSON array, no markdown
`

  const start = Date.now()
  let newTaskData = []

  try {
    const { text: raw } = await generateWithFallback(
      prompt, {
        modelOverride: process.env.GEMINI_PLANNER_MODEL || 'gemini-3.5-flash',
        userId,
        endpoint: '/planner/recalculate',
        feature: 'planner'
      }
    )
    newTaskData = parseAITasks(raw)
  } catch (err) {
    throw Object.assign(
      new Error(`Recalculation failed. Details: ${err.message}`),
      { statusCode: 500 }
    )
  }

  // Delete old incomplete future tasks
  await Task.deleteMany({
    planId: plan._id, completed: false,
    dateAssigned: { $gt: today },
  })

  // Fetch note IDs to link source notes for rescheduled tasks
  const notes = await Note.find({ userId }).select('title extractedTopics')
  const getNoteForTopic = (topicName) => {
    if (!topicName) return { id: null, title: null };
    const matchingNote = notes.find(n =>
      (n.extractedTopics || []).some(t => t.toLowerCase() === topicName.toLowerCase())
    );
    return matchingNote
      ? { id: matchingNote._id, title: matchingNote.title }
      : { id: null, title: null };
  };

  // Insert new tasks
  await Task.insertMany(newTaskData.map(t => {
    const noteRef = getNoteForTopic(t.topic);
    return {
      planId:        plan._id,
      userId,
      title:         t.title,
      type:          t.type || 'manual',
      topic:         t.topic || '',
      dateAssigned:  new Date(t.date),
      estimatedMins: t.estimatedMins || 30,
      priority:      t.priority || 'medium',
      completed:     false,
      sourceNoteId:    noteRef.id,
      sourceNoteTitle: noteRef.title,
      goal:            t.goal || '',
      whyThisMatters:  t.whyThisMatters || '',
      expectedImpact:  t.expectedImpact || '',
    };
  }))

  await StudyPlan.findByIdAndUpdate(plan._id, {
    healthStatus: 'on_track',
    recalcNeeded: false,
    lastHealthCheck: new Date(),
  })

  const outcome = isTight ? 'tight' : 'ok'
  return {
    message: isTight
      ? `Schedule compressed. Focused on ${weakNames.slice(0,3).join(', ') || 'priority topics'}.`
      : `Rescheduled ${newTaskData.length} tasks across ${daysLeft} days. Back on track.`,
    isTight,
    tasksScheduled: newTaskData.length,
    outcome,
  }
}

// ─── UPDATE TASK ─────────────────────────────────────────

exports.updateTask = async (taskId, userId, completed, confidenceBefore = null, confidenceAfter = null) => {
  const updateFields = { completed, completedAt: completed ? new Date() : null };

  if (confidenceBefore !== null && confidenceBefore !== undefined) {
    updateFields.confidenceBefore = Number(confidenceBefore);
  }
  if (confidenceAfter !== null && confidenceAfter !== undefined) {
    updateFields.confidenceAfter = Number(confidenceAfter);
    const currentTask = await Task.findOne({ _id: taskId, userId });
    const beforeVal = (confidenceBefore !== null && confidenceBefore !== undefined)
      ? Number(confidenceBefore)
      : (currentTask?.confidenceBefore || 3);
    updateFields.confidenceGain = Number(confidenceAfter) - beforeVal;
  }

  const task = await Task.findOneAndUpdate(
    { _id: taskId, userId },
    updateFields,
    { new: true }
  )
  if (!task) throw Object.assign(
    new Error('Task not found.'), { statusCode: 404 }
  )

  // Update study streak on completion
  if (completed) {
    const User = require('../models/User')
    const user = await User.findById(userId)
    if (user) {
      const todayStr = new Date().toISOString().split('T')[0]
      const lastStr  = user.lastActiveDate?.toISOString().split('T')[0]

      if (lastStr !== todayStr) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        const wasYesterday = lastStr === yesterdayStr
        await User.findByIdAndUpdate(userId, {
          lastActiveDate: new Date(),
          studyStreak: wasYesterday ? (user.studyStreak || 0) + 1 : 1,
        })
      }
    }
  }

  // Return task formatted with id and date
  return {
    ...task.toObject(),
    id: task._id.toString(),
    date: task.dateAssigned,
  }
}

// ─── READINESS SCORE ─────────────────────────────────────

exports.getReadinessScore = async (userId) => {
  const plan = await StudyPlan.findOne({ userId, status: 'active' })
  if (!plan) return 0

  const tasks = await Task.find({ planId: plan._id })
  const mastery = await TopicMastery.find({ userId })

  const totalTasks = tasks.length || 1
  const completedTasks = tasks.filter(t => t.completed).length

  const completionFactor = completedTasks / totalTasks

  const avgMastery = mastery.length > 0
    ? mastery.reduce((s, t) => s + t.masteryScore, 0) / mastery.length
    : 50

  const masteryFactor = avgMastery / 100

  const daysLeft     = Math.max(0, getDaysUntilExam(plan.examDate))
  const totalDays    = Math.max(1, getDaysUntilExam(plan.examDate) +
    Math.ceil((new Date() - new Date(plan.createdAt)) / 86400000))
  const timeFactor   = 1 - (daysLeft / totalDays) * 0.3

  const readiness = Math.round(
    (completionFactor * 0.5 + masteryFactor * 0.4 + timeFactor * 0.1) * 100
  )

  const score = Math.min(100, Math.max(0, readiness))

  await StudyPlan.findByIdAndUpdate(plan._id, { readinessScore: score })

  return score
}
