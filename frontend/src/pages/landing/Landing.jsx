import { Link } from 'react-router-dom';

const Landing = () => {

  const features = [
    {
      icon: 'upload_file',
      title: 'Upload Notes',
      desc: 'Upload PDFs, DOCX files, or images. Our AI parses and structures notes instantly.',
    },
    {
      icon: 'auto_awesome',
      title: 'AI Summaries',
      desc: 'Get auto-generated flashcards, high-yield summaries, and key takeaways.',
    },
    {
      icon: 'quiz',
      title: 'Quiz Generation',
      desc: 'Generate custom multiple-choice or short-answer tests to assess your learning.',
    },
    {
      icon: 'psychology',
      title: 'Knowledge Gaps',
      desc: 'Visualize weak areas with detailed mastery indexes and focus suggestions.',
    },
    {
      icon: 'calendar_today',
      title: 'Study Planner',
      desc: 'Build dynamic timelines and checklists that automatically adapt to your exam date.',
    },
    {
      icon: 'record_voice_over',
      title: 'Resume & Interview',
      desc: 'Scan your resume for ATS optimization and practice with an interactive AI mock interviewer.',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-[#D6E6F3]/40 via-white to-white min-h-screen flex flex-col font-sans antialiased text-[#000926] relative overflow-x-hidden">
      {/* Decorative background glow circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#D6E6F3] rounded-full blur-[120px] opacity-50 -z-10 animate-pulse duration-10000" />
      <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] bg-[#0F52BA]/5 rounded-full blur-[100px] opacity-40 -z-10" />

      {/* NAVBAR */}
      <header className="h-topbar_height fixed top-0 left-0 right-0 bg-white/75 backdrop-blur-md border-b border-[#D6E6F3] px-6 md:px-12 flex items-center justify-between z-50 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-[26px] font-fill-1 animate-pulse">bolt</span>
          <span className="font-h1 text-[17px] font-extrabold text-[#000926] tracking-tight">Preparation Mate</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-[#5B6775] select-none">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
        </nav>
        <div className="flex items-center gap-3 select-none">
          <Link to="/login">
            <button className="h-[36px] px-4 text-[#5B6775] hover:text-[#000926] text-xs font-bold transition-colors">
              Log in
            </button>
          </Link>
          <Link to="/register">
            <button className="h-[36px] px-4 bg-primary text-white text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all">
              Get Started
            </button>
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-[130px] pb-16 px-6 md:px-12 text-center max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[90vh]">
        <div className="inline-flex items-center gap-1.5 bg-primary-fixed text-primary px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase mb-6 select-none animate-fade-up">
          <span>Now with Adaptive AI</span>
          <span className="text-[12px] animate-spin-slow">✦</span>
        </div>
        <h1 className="text-[38px] sm:text-[56px] font-extrabold text-[#000926] leading-[1.1] mb-6 tracking-tight max-w-3xl select-none animate-fade-up">
          Stop studying more. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#3A7BFF]">Start studying smarter.</span>
        </h1>
        <p className="text-sm sm:text-base text-[#5B6775] font-semibold max-w-xl mb-8 leading-relaxed select-none animate-fade-up animation-delay-100">
          One platform that reads your notes, finds your knowledge gaps, and builds a revision plan that adapts as you study.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-16 select-none animate-fade-up animation-delay-200">
          <Link to="/register" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto h-[46px] px-7 bg-primary text-white text-sm font-bold rounded-lg hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              Get started
            </button>
          </Link>
        </div>

        {/* Dashboard Mockup Frame */}
        <div className="w-full max-w-4xl bg-white/90 border border-[#D6E6F3] rounded-2xl shadow-[0_30px_80px_rgba(15,82,186,0.1)] overflow-hidden transition-all duration-300 hover:shadow-[0_40px_100px_rgba(15,82,186,0.18)] hover:-translate-y-1 md:block animate-fade-up animation-delay-300">
          {/* Browser Header Bar */}
          <div className="h-10 bg-primary-fixed/30 border-b border-[#D6E6F3] px-4 flex items-center justify-between select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
            </div>
            <div className="bg-white/80 px-8 py-1 rounded-md text-[11px] text-[#5B6775] font-semibold font-mono border border-[#D6E6F3] w-64 truncate">
              prepmate.app/dashboard
            </div>
            <div className="w-12"></div>
          </div>

          {/* Mock Dashboard Body */}
          <div className="p-6 text-left bg-gradient-to-br from-[#D6E6F3]/10 to-white grid grid-cols-1 md:grid-cols-12 gap-5 pointer-events-none select-none">
            {/* Left Col - Stats & Gaps */}
            <div className="md:col-span-8 space-y-4">
              <div className="bg-white/80 border border-[#D6E6F3] rounded-xl p-4 flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="text-primary text-[10px] font-bold uppercase tracking-wider">Active Plan Progress</h3>
                  <p className="text-base font-extrabold text-[#000926] mt-0.5">Software Engineering Final</p>
                </div>
                <div className="text-right">
                  <span className="text-primary font-extrabold text-sm">52% Done</span>
                  <p className="text-[10px] text-[#5B6775] font-bold">10 days left</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/80 border border-[#D6E6F3] rounded-xl p-3 shadow-sm">
                  <p className="text-[10px] text-[#5B6775] uppercase font-bold tracking-wider">Notes</p>
                  <p className="text-lg font-extrabold mt-0.5 text-[#000926]">12 files</p>
                </div>
                <div className="bg-white/80 border border-[#D6E6F3] rounded-xl p-3 shadow-sm">
                  <p className="text-[10px] text-[#5B6775] uppercase font-bold tracking-wider">Quizzes</p>
                  <p className="text-lg font-extrabold mt-0.5 text-[#000926]">34 sets</p>
                </div>
                <div className="bg-white/80 border border-[#D6E6F3] rounded-xl p-3 shadow-sm">
                  <p className="text-[10px] text-[#5B6775] uppercase font-bold tracking-wider">Avg Score</p>
                  <p className="text-lg font-extrabold mt-0.5 text-success">78%</p>
                </div>
              </div>
              {/* Gap bar preview */}
              <div className="bg-white/80 border border-[#D6E6F3] rounded-xl p-4 space-y-3 shadow-sm">
                <h4 className="text-xs font-bold text-[#000926] uppercase tracking-wider">Identified Knowledge Gaps</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-[#5B6775]">
                    <span>DB Normalization</span>
                    <span className="text-danger">32% Mastery</span>
                  </div>
                  <div className="w-full bg-primary-fixed-dim/20 rounded-full h-1.5">
                    <div className="bg-danger h-1.5 rounded-full" style={{ width: '32%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-[#5B6775]">
                    <span>OS Scheduling Algorithms</span>
                    <span className="text-warning">41% Mastery</span>
                  </div>
                  <div className="w-full bg-primary-fixed-dim/20 rounded-full h-1.5">
                    <div className="bg-warning h-1.5 rounded-full" style={{ width: '41%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Right Col - Quick checklist */}
            <div className="md:col-span-4 bg-white/80 border border-[#D6E6F3] rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <div>
                <h4 className="text-xs font-bold text-[#000926] uppercase tracking-wider mb-3">Today's Schedule</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-success text-[16px] font-fill-1">check_circle</span>
                    <span className="text-[11px] text-[#5B6775]/60 font-semibold line-through">OS Thread States</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded border border-[#D6E6F3] bg-white shrink-0"></span>
                    <span className="text-[11px] text-[#000926] font-semibold">Review 3NF Normalization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded border border-[#D6E6F3] bg-white shrink-0"></span>
                    <span className="text-[11px] text-[#000926] font-semibold">Practice 10 MCQ Questions</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-[#D6E6F3] mt-4 text-center">
                <span className="text-xs text-primary font-bold">Launch AI Assistant →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section className="bg-primary-fixed/20 border-y border-[#D6E6F3] py-4 px-6 text-center select-none">
        <p className="text-[11px] font-bold text-[#5B6775] uppercase tracking-wider">
          Trusted by students at · MUET Jamshoro · NUST · FAST-NUCES · NED University
        </p>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-24 px-6 md:px-12 bg-white relative scroll-mt-topbar_height">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2 select-none">
            <span className="text-primary font-bold text-xs uppercase tracking-widest block">WHAT YOU GET</span>
            <h2 className="text-[28px] sm:text-[34px] font-extrabold text-[#000926] tracking-tight">
              Everything you need in one place
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feat, idx) => (
              <div key={idx} className="group premium-card !p-8 flex flex-col items-start relative overflow-hidden background hover:-translate-y-1.5 transition-all duration-300">
                {/* Subtle decorative glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-primary/10 group-hover:scale-150 pointer-events-none"></div>

                <div className="flex items-center gap-4 mb-4 relative z-10 w-full select-none">
                  <div className="w-12 h-12 rounded-2xl bg-[#D6E6F3] text-primary flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:scale-105 shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-[24px]">{feat.icon}</span>
                  </div>

                  <h3 className="text-base font-extrabold text-[#000926] tracking-tight group-hover:text-primary transition-colors">
                    {feat.title}
                  </h3>
                </div>

                <p className="text-[#5B6775] text-xs font-semibold leading-relaxed relative z-10 text-left">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6 md:px-12 bg-gradient-to-b from-white to-[#D6E6F3]/25 scroll-mt-topbar_height border-t border-[#D6E6F3]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[28px] font-extrabold text-[#000926] text-center mb-16 tracking-tight select-none">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative select-none">
            {/* Connecting lines for desktop */}
            <div className="hidden md:block absolute top-4 left-[15%] right-[15%] h-[1px] bg-primary-fixed-dim -z-0"></div>

            <div className="flex flex-col items-center text-center space-y-3 relative z-10">
              <div className="w-[34px] h-[34px] rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-md shadow-primary/20">
                1
              </div>
              <h3 className="text-sm font-extrabold text-[#000926]">Upload your PDF</h3>
              <p className="text-xs text-[#5B6775] font-semibold max-w-xs leading-relaxed">
                Import lectures, slides, syllabus briefs, or notes.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 relative z-10">
              <div className="w-[34px] h-[34px] rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-md shadow-primary/20">
                2
              </div>
              <h3 className="text-sm font-extrabold text-[#000926]">AI builds your profile</h3>
              <p className="text-xs text-[#5B6775] font-semibold max-w-xs leading-relaxed">
                Gemini identifies core concepts, gaps, and question paths.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 relative z-10">
              <div className="w-[34px] h-[34px] rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-md shadow-primary/20">
                3
              </div>
              <h3 className="text-sm font-extrabold text-[#000926]">Study smarter every day</h3>
              <p className="text-xs text-[#5B6775] font-semibold max-w-xs leading-relaxed">
                Take tests, track your streak, and recalculate tasks dynamically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gradient-to-r from-[#000926] to-[#0F52BA] py-12 px-6 md:px-12 mt-auto border-t border-white/10 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-white text-[24px] font-fill-1">bolt</span>
            <span className="font-h1 text-sm font-extrabold text-white tracking-tight">Preparation Mate</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs font-bold text-white/80">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <Link to="/login" className="hover:text-white transition-colors">Log in</Link>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </nav>
          <span className="text-xs font-semibold text-white/50 shrink-0 text-center md:text-right">
            &copy; {new Date().getFullYear()} Preparation Mate. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
