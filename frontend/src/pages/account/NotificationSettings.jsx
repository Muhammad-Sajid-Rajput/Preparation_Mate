import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Bell } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/layout/PageHeader';

const DEFAULTS = {
  studyReminders: true,
  reminderTime: '09:00',
  streakAlerts: true,
  quizResults: true,
  noteProcessing: true,
  planAlerts: true,
  emailSummary: false,
};

const NotificationSettings = () => {
  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem('pm_notification_prefs');
      return stored ? JSON.parse(stored) : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  const toggle = (key) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTimeChange = (e) => {
    setPrefs((prev) => ({
      ...prev,
      reminderTime: e.target.value,
    }));
  };

  const handleSave = () => {
    localStorage.setItem('pm_notification_prefs', JSON.stringify(prefs));
    toast.success('Preferences saved');
  };

  const handleReset = () => {
    setPrefs(DEFAULTS);
    localStorage.removeItem('pm_notification_prefs');
    toast.success('Reset to defaults');
  };

  return (
    <div className="flex flex-col items-center w-full py-4 text-left animate-fade-up">
      <Toaster position="top-right" />

      <div className="w-full max-w-[560px]">
        {/* Header */}
        <PageHeader
          icon={Bell}
          title="Notifications"
          subtitle="Notifications and account preferences"
        />

        {/* Settings Card */}
        <Card className="!p-0 overflow-hidden mb-4 border border-primary-fixed-dim/60 shadow-sm">
          {/* Row 1: Study Reminders */}
          <div className="group border-b border-primary-fixed-dim/40">
            <div className="flex items-center justify-between h-[56px] px-4 hover:bg-primary-fixed/20 transition-colors select-none">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-base">schedule</span>
                <span className="text-xs font-bold text-on-primary-fixed-variant uppercase tracking-wider">
                  Study Reminders
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggle('studyReminders')}
                className={`w-8 rounded-full relative transition-colors duration-200 outline-none ${
                  prefs.studyReminders ? 'bg-primary' : 'bg-primary-fixed-dim/40'
                }`}
                style={{ width: '32px', height: '18px' }}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 left-0.5 transition-transform duration-200 ${
                    prefs.studyReminders ? 'translate-x-[14px]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Conditional Sub-row */}
            {prefs.studyReminders && (
              <div className="px-4 py-3 bg-primary-fixed/10 flex items-center justify-between border-t border-primary-fixed-dim/30 transition-all select-none">
                <span className="text-xs font-bold text-primary">
                  Daily at:
                </span>
                <div className="relative flex items-center">
                  <select
                    value={prefs.reminderTime}
                    onChange={handleTimeChange}
                    className="h-[32px] px-3 bg-white/70 border border-primary-fixed-dim rounded-lg font-semibold text-xs pr-8 cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-on-primary-fixed-variant"
                  >
                    <option value="08:00">08:00 AM</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                    <option value="20:00">08:00 PM</option>
                    <option value="22:00">10:00 PM</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 pointer-events-none text-primary text-[16px]">
                    expand_more
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Streak Alerts */}
          <div className="flex items-center justify-between h-[56px] px-4 border-b border-primary-fixed-dim/40 hover:bg-primary-fixed/20 transition-colors select-none">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-base">local_fire_department</span>
              <span className="text-xs font-bold text-on-primary-fixed-variant uppercase tracking-wider">
                Streak Alerts
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggle('streakAlerts')}
              className={`w-8 rounded-full relative transition-colors duration-200 outline-none ${
                prefs.streakAlerts ? 'bg-primary' : 'bg-primary-fixed-dim/40'
              }`}
              style={{ width: '32px', height: '18px' }}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 left-0.5 transition-transform duration-200 ${
                  prefs.streakAlerts ? 'translate-x-[14px]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Row 3: Quiz Results */}
          <div className="flex items-center justify-between h-[56px] px-4 border-b border-primary-fixed-dim/40 hover:bg-primary-fixed/20 transition-colors select-none">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-base">assignment_turned_in</span>
              <span className="text-xs font-bold text-on-primary-fixed-variant uppercase tracking-wider">
                Quiz Results
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggle('quizResults')}
              className={`w-8 rounded-full relative transition-colors duration-200 outline-none ${
                prefs.quizResults ? 'bg-primary' : 'bg-primary-fixed-dim/40'
              }`}
              style={{ width: '32px', height: '18px' }}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 left-0.5 transition-transform duration-200 ${
                  prefs.quizResults ? 'translate-x-[14px]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Row 4: Note Processing */}
          <div className="flex items-center justify-between h-[56px] px-4 border-b border-primary-fixed-dim/40 hover:bg-primary-fixed/20 transition-colors select-none">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-base">auto_awesome</span>
              <span className="text-xs font-bold text-on-primary-fixed-variant uppercase tracking-wider">
                Note Processing
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggle('noteProcessing')}
              className={`w-8 rounded-full relative transition-colors duration-200 outline-none ${
                prefs.noteProcessing ? 'bg-primary' : 'bg-primary-fixed-dim/40'
              }`}
              style={{ width: '32px', height: '18px' }}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 left-0.5 transition-transform duration-200 ${
                  prefs.noteProcessing ? 'translate-x-[14px]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Row 5: Plan Alerts */}
          <div className="flex items-center justify-between h-[56px] px-4 border-b border-primary-fixed-dim/40 hover:bg-primary-fixed/20 transition-colors select-none">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-base">event_note</span>
              <span className="text-xs font-bold text-on-primary-fixed-variant uppercase tracking-wider">
                Plan Alerts
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggle('planAlerts')}
              className={`w-8 rounded-full relative transition-colors duration-200 outline-none ${
                prefs.planAlerts ? 'bg-primary' : 'bg-primary-fixed-dim/40'
              }`}
              style={{ width: '32px', height: '18px' }}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 left-0.5 transition-transform duration-200 ${
                  prefs.planAlerts ? 'translate-x-[14px]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Row 6: Email Summary */}
          <div className="flex items-center justify-between h-[56px] px-4 hover:bg-primary-fixed/20 transition-colors select-none">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-base">mail</span>
              <span className="text-xs font-bold text-on-primary-fixed-variant uppercase tracking-wider">
                Email Weekly Summary
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggle('emailSummary')}
              className={`w-8 rounded-full relative transition-colors duration-200 outline-none ${
                prefs.emailSummary ? 'bg-primary' : 'bg-primary-fixed-dim/40'
              }`}
              style={{ width: '32px', height: '18px' }}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 left-0.5 transition-transform duration-200 ${
                  prefs.emailSummary ? 'translate-x-[14px]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Footer Buttons */}
        <div className="mt-8 flex items-center justify-end gap-3 select-none">
          <Button
            variant="secondary"
            onClick={handleReset}
            className="px-5 text-xs h-10 font-bold"
          >
            Reset to defaults
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="px-6 text-xs h-10 font-bold shadow-md shadow-primary/10"
          >
            Save preferences
          </Button>
        </div>

        {/* Decorative Abstract Background Widget */}
        <div className="mt-12 opacity-40 select-none">
          <div className="relative w-full h-20 rounded-2xl overflow-hidden border border-primary-fixed-dim/40">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/10"></div>
            <div className="absolute top-0 right-0 w-full h-full flex items-center justify-center">
              <div className="grid grid-cols-4 gap-4 w-full p-8 opacity-20">
                <div className="h-[2px] bg-primary/40 rounded-full"></div>
                <div className="h-[2px] bg-primary/20 rounded-full"></div>
                <div className="h-[2px] bg-primary/60 rounded-full"></div>
                <div className="h-[2px] bg-primary/30 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
