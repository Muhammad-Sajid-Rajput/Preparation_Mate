# 🎨 Preparation Mate — Frontend Application

This directory contains the Vite-powered React frontend for the Preparation Mate application. It features a modern user interface designed with Tailwind CSS, custom HSL color systems, fluid responsiveness, and premium micro-interactions.

---

## 🚀 Key Features & Modules

*   📊 **Interactive Dashboard**: Track study pacing goals, average quiz scores, pending tasks, and recent learning activities.
*   📂 **My Notes & Study Parser**: Upload notes (PDF/TXT) into the study engine to parse details, review summary cards, and browse auto-generated chapter highlights.
*   📝 **AI Quiz Generator**: Build custom quizzes from study material, complete timed tests with interactive questionnaires, and review results with detailed AI explanation cards.
*   🧠 **Knowledge Gaps Dashboard**: View mastery status bars (color-coded red to green based on score percentages) and discover weak topics needing focus.
*   💬 **AI Study Assistant**: Discuss subjects with a dual-panel conversational chat interface, context files selector, typing indicators, and specific document source chips.
*   📅 **Study Planner Wizard**: Build a personalized daily calendar with step-by-step schedulers, target hours buttons, and upcoming day grids.
*   🎙️ **Mock Interview Simulator**: Customize target roles, experience levels (Entry/Mid/Senior), and specialization parameters to practice questions with models, answers lists, and checklists.
*   📄 **ATS Resume Review**: Drag and drop CV/Resume files to run multi-step keyword scanning loaders, compute ATS match scores, highlight strengths/weaknesses, and review side-by-side improvements.
*   ⚙️ **Profile & Account Settings**: Manage initials avatar heads, editable backgrounds, slider switches, and time-of-day reminders.
*   👑 **Admin Console**: Monitor platform budgets (GPT-4o/Claude cost splits), server latency statuses, downloadable CSV log tables, and filterable user tables.

---

## 🛠️ Technology Stack

*   **Core Framework**: React (Vite-powered for high-performance HMR)
*   **Styling**: Tailwind CSS v3 (using tailored HSL palettes, customized fonts, and fluid sizing tokens)
*   **Icons**: `lucide-react` (for UI icons) and `Material Symbols Outlined` (for high-fidelity fill-toggled indicators)
*   **Routing**: React Router DOM (v6 nested routes)
*   **State Management**: React Context (e.g., `AuthContext`, `ToastContext`, etc.)
*   **Toasts**: React Hot Toast (success/error notifications)
*   **HTTP Client**: Axios (for API requests to the backend)

---

## 📂 Project Structure

```
frontend/
├── public/                # Static assets & public resources
├── src/
│   ├── api/               # Axios client configurations and API functions
│   ├── components/
│   │   ├── layout/        # AppShell, Sidebar, Topbar, BottomTabBar, PageHeader
│   │   ├── planner/       # TodaysMission and planner components
│   │   └── ui/            # Reusable UI elements (Buttons, Badges, MasteryBars, ScoreRings, FileDropZones, Modals)
│   ├── config/            # Frontend environment & endpoint setup configurations
│   ├── constants/         # Frontend routing definitions and settings constants
│   ├── context/           # AuthContext and ToastContext for session state and toast notifications
│   ├── hooks/             # Custom React hooks
│   ├── pages/
│   │   ├── account/       # Profile.jsx, NotificationSettings.jsx, AccountSettings.jsx
│   │   ├── admin/         # AdminDashboard.jsx
│   │   ├── auth/          # Login.jsx, Register.jsx, ForgotPassword.jsx, ResetPassword.jsx, PasswordResetSuccess.jsx
│   │   ├── chat/          # AIAssistant.jsx
│   │   ├── dashboard/     # Dashboard.jsx
│   │   ├── gaps/          # KnowledgeGaps.jsx
│   │   ├── interview/     # InterviewSetup.jsx, InterviewQA.jsx, InterviewHistory.jsx
│   │   ├── landing/       # Landing.jsx
│   │   ├── notes/         # NotesList.jsx, NoteDetail.jsx, UploadModal.jsx
│   │   ├── planner/       # ActivePlan.jsx, CreatePlan.jsx
│   │   ├── quizzes/       # QuizHistory.jsx, QuizGenerate.jsx, QuizTaking.jsx, QuizResults.jsx
│   │   └── resume/        # ResumeUpload.jsx, ResumeAnalysis.jsx
│   ├── routes/            # Route guards (ProtectedRoute, AdminRoute) and route configuration maps (AppRoutes)
│   ├── utils/             # Helper functions, local date formatters, validation utilities
│   ├── App.jsx            # Main app router wrapper
│   ├── index.css          # Google Fonts imports, custom variables, scrollbar utilities
│   └── main.jsx           # Vite entrypoint
├── tailwind.config.js     # Extended border-radius, spacing, colors, and font-size tokens
└── vite.config.js         # Build and dev server options
```

---

## 💻 Running Locally

This frontend is configured to run as part of the full-stack monorepo workspace.

### Running with Backend (Recommended)
To run both the frontend and backend concurrently from the workspace root:
1.  Navigate to the root directory `Preparation_Mate/`.
2.  Install all dependencies: `npm run install:all`
3.  Spin up both dev servers: `npm run dev`

### Running Frontend Separately
If you only need to work on the frontend mock designs without running the backend API:
1.  Navigate to this directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies inside this directory:
    ```bash
    npm install
    ```
3.  Start the local Vite HMR server:
    ```bash
    npm run dev
    ```
    Open your browser and navigate to [http://localhost:5173](http://localhost:5173).

### Production Build
Compile optimized assets for production hosting:
```bash
npm run build
```
This produces static bundles under the `dist/` directory.

---

## 📄 Licensing & Context

This project was migrated from high-fidelity Google Stitch SaaS exports into an interactive single-page React application, maintaining mock states and fully functional UI behaviors. All data is managed locally via React states.
