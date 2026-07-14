# 🖥️ Preparation Mate Backend API

This directory contains the Express-based Node.js backend for the Preparation Mate application. It manages users, processes notes (parsing PDFs), runs background cron tasks (for streak and quota tracking), and integrates with Gemini & Groq APIs to power AI features.

---

## 🛠️ Tech Stack & Dependencies

*   **Runtime Environment**: Node.js
*   **Framework**: Express.js
*   **Database**: MongoDB (via Mongoose ODM)
*   **AI/LLM APIs**: `@google/generative-ai` (Gemini SDK) and `groq-sdk` (Llama/Mixtral)
*   **Scheduler**: `node-cron`
*   **Security & Helpers**: `helmet`, `cors`, `cookie-parser`, `bcrypt`, `jsonwebtoken`, `morgan`
*   **File Handling**: `multer`, `multer-storage-cloudinary` (Cloudinary integrations), `pdf-parse`

---

## ⚙️ Environment Configuration

Before running the server, copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Key | Default / Sample | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for the Express server to listen on. |
| `NODE_ENV` | `development` | Environment mode (`development` or `production`). |
| `MONGODB_URI` | `mongodb://localhost:27017/prep_mate` | MongoDB connection URI. |
| `JWT_ACCESS_SECRET` | `change_this_access_secret_min_32_chars` | Secret key for JWT access tokens. |
| `JWT_REFRESH_SECRET`| `change_this_refresh_secret_min_32_chars` | Secret key for JWT refresh tokens. |
| `JWT_ACCESS_EXPIRES`| `15m` | Lifetime duration for access tokens. |
| `JWT_REFRESH_EXPIRES`| `7d` | Lifetime duration for refresh tokens. |
| `CLIENT_URL` | `http://localhost:5173` | The URL of the frontend (for CORS configuration). |
| `GEMINI_API_KEY_1` | `your_gemini_api_key_1` | Primary Google Gemini API Key for study parsing and chat. |
| `GEMINI_API_KEY_2` | `your_gemini_api_key_2` | Secondary Google Gemini API Key fallback. |
| `GEMINI_API_KEY_3` | `your_gemini_api_key_3` | Tertiary Google Gemini API Key fallback. |
| `GEMINI_FLASH_MODEL`| `gemini-1.5-flash` | Model identifier for fast text and document summaries. |
| `GEMINI_PRO_MODEL` | `gemini-2.0-flash` | Model identifier for deep study summaries and parser. |
| `GEMINI_PLANNER_MODEL`| `gemini-3.5-flash` | Model identifier for study planner generation. |
| `GEMINI_EMBED_MODEL`| `gemini-embedding-2` | Model identifier for text embeddings. |
| `GROQ_API_KEY_1` | `your_groq_api_key_1` | Primary Groq API Key for quizzes and interview simulators. |
| `GROQ_API_KEY_2` | `your_groq_api_key_2` | Secondary Groq API Key fallback. |
| `GROQ_API_KEY_3` | `your_groq_api_key_3` | Tertiary Groq API Key fallback. |
| `GROQ_MAIN_MODEL` | `openai/gpt-oss-120b` | Main model identifier for Groq simulations and quizzes. |
| `GROQ_FALLBACK_MODEL`| `meta-llama/Llama-3.3-70B-Instruct` | Fallback model identifier for Groq simulations. |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Cloudinary credentials for profile/doc storage. |
| `CLOUDINARY_API_KEY` | `your_api_key` | Cloudinary API Key. |
| `CLOUDINARY_API_SECRET`| `your_api_secret` | Cloudinary API Secret. |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP host server for user emails. |
| `EMAIL_PORT` | `587` | SMTP host port. |
| `EMAIL_USER` | `your_email@gmail.com` | SMTP credential username. |
| `EMAIL_PASS` | `your_smtp_app_password` | SMTP credential password / app password. |
| `EMAIL_FROM` | `Preparation Mate <noreply@preparationmate.com>` | Sender identity for platform transactional emails. |
| `DAILY_BUDGET_USD` | `10` | Daily USD spending budget cap. |
| `DAILY_QUIZ_LIMIT` | `20` | Daily quiz creation rate limit per user. |
| `DAILY_CHAT_LIMIT` | `50` | Daily AI assistant messages rate limit per user. |
| `DAILY_RESUME_LIMIT`| `2` | Daily resume scans rate limit per user. |
| `DAILY_PDF_LIMIT` | `10` | Daily PDF notes uploads rate limit per user. |

---

## 📂 Backend Architecture & Files

```
backend/
├── config/             # DB connection & Cloudinary setup
├── jobs/               # Cron job scripts (Streak checks & Daily Quota resets)
│   ├── checkStreaks.js # Reset login streaks for inactive users
│   └── resetQuotas.js  # Reset daily limits (Gemini/Groq calls)
├── middleware/         # Custom Middlewares (JWT verification, uploads, error handling)
├── models/             # Mongoose schemas
│   ├── ApiUsageLog.js  # Tracks API usage stats, tokens used, and call durations
│   ├── ChatSession.js  # Manages study chat history and sessions
│   ├── InterviewSession.js # Manages simulated job interview history and logs
│   ├── Note.js         # Stores document metadata, summary cards, and file locations
│   ├── NoteChunk.js    # Stores split document chunks with text embeddings for chat
│   ├── PasswordResetToken.js # Manages authorization tokens for password resets
│   ├── Quiz.js         # Stores AI generated quiz configs and custom options
│   ├── QuizResult.js   # Stores student answers and detailed quiz scores
│   ├── ResumeReview.js # Stores ATS scanning results, scores, and keyword recommendations
│   ├── StudyPlan.js    # Stores customized daily calendars and study target goals
│   ├── Task.js         # Stores detailed task lists belonging to planner schedulers
│   ├── TopicMastery.js # Tracks score ratings and learning weaknesses per subject
│   └── User.js         # Credentials, streak counters, and model rate limit trackers
├── routes/             # Express Route handlers
├── services/           # External API utilities (Gemini, Groq, Nodemailer)
├── app.js              # Configures Express middleware and routes
└── server.js           # Database connection and server initialization
```

---

## 🛣️ API Endpoints

The API is structured under the prefix `/api`:

| Domain | Route Prefix | Description |
| :--- | :--- | :--- |
| 🔐 **Authentication** | `/api/auth` | Register, Login, Refresh Token, Verification, and Password Reset |
| 👤 **Users & Profiles**| `/api/users` | Profile retrieval, settings, and streak information |
| 📂 **Study Notes** | `/api/notes` | Create, list, retrieve study summaries, and parse PDF documents |
| 📝 **AI Quizzes** | `/api/quizzes`| Generate custom AI quizzes and record timed quiz test scores |
| 💬 **AI Chat** | `/api/chat` | AI conversational responses utilizing study notes as context |
| 📅 **Planner** | `/api/planner` | Create daily study logs and manage scheduled daily targets |
| 🧠 **Knowledge Gaps**| `/api/gaps` | Statistics regarding subject weaknesses and target recommendations |
| 🎙️ **Mock Interviews**| `/api/career/interview` | Setup simulator setups, request QA lists, and view history |
| 📄 **ATS Resume Scan**| `/api/career/resume` | ATS scoring system scan, recommendations, and text parsing |
| 👑 **Admin Controls** | `/api/admin` | Retrieve API logs, monthly AI pricing budgets, and user stats |
| 🩺 **Health Check**  | `/api/health` | Check backend server status, database connection, and environment info |

---

## ⏰ Cron Jobs

The backend features two background jobs managed via `node-cron` in `server.js`:

1.  **Daily Quota Reset**: Runs daily at `00:00 UTC` to reset daily limits (Gemini/Groq API calls, PDF upload counts) for all users.
2.  **Streak Verification**: Runs daily at `23:00 UTC` to verify active users and reset login streaks for inactive ones.

---

## 💻 Running Separately

If you prefer to run the backend separately from the root directory setup:

```bash
# Navigate to backend directory (if not already there)
cd backend

# Install dependencies
npm install

# Start in development mode (with nodemon auto-restart)
npm run dev

# Start in production mode
npm start
```
