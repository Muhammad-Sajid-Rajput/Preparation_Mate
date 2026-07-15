# 🎓 Preparation Mate — Full-Stack AI-Powered Study Companion

<p align="center">
  <img src="frontend/public/preparation_mate_banner.webp" alt="Preparation Mate Banner" width="100%" />
</p>

Preparation Mate is an advanced, high-fidelity AI-powered study companion and career preparation platform. It is engineered to help students, learners, and job seekers streamline their study processes, discover knowledge gaps, schedule study paths, simulate mock interviews, and optimize resumes for ATS scanner systems.

This project is organized as a monorepo containing a **Vite + React frontend** and an **Express + Node.js backend** powered by MongoDB, Google Gemini, and Groq APIs.

---

## 🚀 Key Modules & Features

*   📊 **Interactive Dashboard**: Track study pacing goals, average quiz scores, pending tasks, and recent learning activities in real-time.
*   📂 **My Notes & Study Parser**: Upload study materials (PDF/TXT) to parse details, review summary cards, and browse auto-generated highlights.
*   📝 **AI Quiz Generator**: Generate custom quizzes from study materials, complete timed tests, and review results with detailed AI explanation cards.
*   🧠 **Knowledge Gaps Dashboard**: View mastery status bars (dynamic red-to-green grading) and discover weak topics needing focus.
*   💬 **AI Study Assistant**: Chat in real-time with an AI bot using specific source document context, file selectors, and typing indicators.
*   📅 **Study Planner Wizard**: Build a personalized daily calendar with step-by-step schedulers and daily target hours.
*   🎙️ **Mock Interview Simulator**: Customize target roles and experience levels (Entry, Mid, Senior) to practice interview questions with real-time feedback.
*   📄 **ATS Resume Review**: Upload resumes to calculate ATS match scores, scan keywords, and view side-by-side improvements.
*   ⚙️ **Profile & Settings**: Manage initials-based avatars, editable backgrounds, and custom reminders.
*   👑 **Admin Console**: Monitor platform budgets (model cost splits), server latency, download CSV logs, and filter users.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) | Single Page Application with Hot Module Replacement (HMR) |
| **Styling** | Tailwind CSS v3 | Custom HSL color palettes, typography, and fluid sizing tokens |
| **Backend** | Node.js + Express | RESTful API server handling authentication, parsing, and AI prompts |
| **Database** | MongoDB + Mongoose | Document database for user data, plans, notes, quizzes, and chat logs |
| **AI Engines** | Gemini SDK & Groq SDK | Powering study assistance, quiz generation, and ATS analysis |
| **Storage** | Cloudinary | Asset storage for user profile images and resume/notes uploads |

---

## 📂 Project Structure

```
Preparation_Mate/
├── backend/               # Express API backend server
│   ├── config/            # DB and Cloudinary configuration
│   ├── jobs/              # Cron job scripts (Streak checks & Daily Quota resets)
│   ├── middleware/        # JWT auth, file upload, error handling
│   ├── models/            # Mongoose schemas (User, Note, Quiz, etc.)
│   ├── routes/            # API endpoint routes
│   ├── services/          # AI integrations (Gemini, Groq) and email delivery
│   ├── utils/             # Helper functions and constants
│   ├── package.json       # Backend script definitions and dependencies
│   └── server.js          # Backend server entry point
├── frontend/              # Vite + React frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── api/           # Axios client configurations and API functions
│   │   ├── components/    # Layout components and reusable UI elements (Buttons, MasteryBars, Modals)
│   │   ├── config/        # Environment and app configuration overrides
│   │   ├── constants/     # Routing paths and configuration constants
│   │   ├── context/       # Authentication and toast notification state contexts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Feature page modules (Dashboard, AI Assistant, ATS Review)
│   │   ├── routes/        # App routing maps and guards (AppRoutes, ProtectedRoute)
│   │   ├── utils/         # Helper functions, formatters, and validators
│   │   ├── App.jsx        # Routing configuration wrapper
│   │   ├── index.css      # Core global styles
│   │   └── main.jsx       # Vite entry point
│   ├── package.json       # Frontend scripts and dependencies
│   └── tailwind.config.js # Styling configurations
├── package.json           # Root package runner configurations
└── README.md              # Project documentation (this file)
```

---

## 💻 Quick Start (Running from Root)

You can run and manage the entire application directly from this root directory.

### Prerequisites
Make sure you have:
*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   [MongoDB](https://www.mongodb.com/) installed and running locally, or have access to a MongoDB Atlas cluster URI.

### 1. Install Dependencies
Run the install script from the root directory to install packages for the root, frontend, and backend projects:
```bash
# Installs root helper dependencies (e.g., concurrently)
npm install

# Installs dependencies inside backend/ and frontend/
npm run install:all
```

### 2. Environment Configuration
Create a `.env` file inside the `backend` folder. You can use `backend/.env.example` as a template:
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and fill in the required credentials:
*   `PORT` (e.g., `5000`)
*   `NODE_ENV` (`development` or `production`)
*   `MONGODB_URI` (MongoDB connection URI)
*   `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (Keys for user access/refresh tokens)
*   `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES` (JWT token durations, e.g., `15m` / `7d`)
*   `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3` (Rotated Google Gemini API keys)
*   `GEMINI_FLASH_MODEL` / `GEMINI_PRO_MODEL` / `GEMINI_PLANNER_MODEL` / `GEMINI_EMBED_MODEL` (Gemini model versions configuration)
*   `GROQ_API_KEY_1`, `GROQ_API_KEY_2`, `GROQ_API_KEY_3` (Rotated Groq API keys)
*   `GROQ_MAIN_MODEL` / `GROQ_FALLBACK_MODEL` (Groq model configurations)
*   `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` (Cloudinary file storage configurations)
*   SMTP configs (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`)
*   `CLIENT_URL` (Frontend URL for CORS setup, e.g., `http://localhost:5173`)
*   `DAILY_BUDGET_USD` (Daily usage budget check)
*   Daily Rate Limits (`DAILY_QUIZ_LIMIT`, `DAILY_CHAT_LIMIT`, `DAILY_RESUME_LIMIT`, `DAILY_PDF_LIMIT`)

### 3. Run Development Servers
Start both the Vite dev server and the backend Express nodemon server concurrently with a single command:
```bash
npm run dev
```
*   **Frontend** will be accessible at: [http://localhost:5173](http://localhost:5173)
*   **Backend** API will be running at: [http://localhost:5000](http://localhost:5000)
*   **API Health Check**: Verify status at [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 4. Run in Production Mode
To compile the frontend and start the full-stack application in production mode:
```bash
npm start
```
This command automatically builds the frontend React production bundle, hosts the preview, and starts the backend service concurrently.

---

## ⚙️ Available Scripts

The following scripts can be executed from the root folder:

| Script | Description |
| :--- | :--- |
| `npm run install:all` | Installs npm modules inside both frontend and backend subfolders. |
| `npm run dev` | Launches both the frontend dev server and backend Express server concurrently. |
| `npm run dev:frontend` | Launches the frontend development server individually. |
| `npm run dev:backend` | Launches the backend development server (with nodemon) individually. |
| `npm run build:frontend` | Compiles the React production bundle into `frontend/dist`. |
| `npm run start` | Previews the production-ready frontend and starts the backend service. |

---

## 🔒 Security & Best Practices

1.  **Never commit env secrets**: Make sure `backend/.env` and `frontend/.env` (if any) are never committed. They are excluded in `.gitignore` by default.
2.  **API Rate Limiting**: The backend comes configured with `express-rate-limit` to prevent brute force attacks on auth routes.
3.  **Security Headers**: Integrated `helmet` in backend for secure HTTP headers.
