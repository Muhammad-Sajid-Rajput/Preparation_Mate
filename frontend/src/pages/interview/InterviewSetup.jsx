import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic } from 'lucide-react';
import { setupInterview } from '../../api/careerApi';
import { handleApiError } from '../../utils/handleApiError';
import { EXPERIENCE_LEVEL } from '../../constants/enums';
import { ROUTES } from '../../constants/routes';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/layout/PageHeader';

const InterviewSetup = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState('Software Engineer (Frontend)');
  const [level, setLevel] = useState(EXPERIENCE_LEVEL.MID);
  const [specialization, setSpecialization] = useState('React.js, Node.js, REST APIs');
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Dots progress animation state
  const [dotsCount, setDotsCount] = useState(0);

  useEffect(() => {
    let intervalId;
    if (generating) {
      intervalId = setInterval(() => {
        setDotsCount((prev) => (prev + 1) % 11);
      }, 400);
    } else {
      setDotsCount(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [generating]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!role.trim()) {
      setError('Please enter a target role');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const session = await setupInterview({
        role,
        experienceLevel: level,
        specialization,
        count
      });
      navigate(ROUTES.INTERVIEW_QA.replace(':id', session.id), {
        state: { session }
      });
    } catch (err) {
      setError(handleApiError(err).message);
      setGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-[560px] mx-auto py-8 px-4 text-left select-none -mt-4 font-sans animate-fade-up">
      {/* Page Header */}
      <PageHeader
        icon={Mic}
        title="Interview Prep"
        subtitle="Practice for your target role"
      />

      {error && !generating && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {/* Setup Card */}
      <Card className="!p-7">
        {generating ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[350px]">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 animate-bounce">
              <span className="material-symbols-outlined text-primary animate-spin !text-[28px]">
                autorenew
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-primary-fixed-variant">
                Generating {count} interview questions...
              </p>
              <p className="text-xs text-primary-fixed-dim font-bold mt-1.5">
                Tailored for {role} · {level} level
              </p>
            </div>
            {/* Progress dots animation */}
            <div className="flex gap-2 justify-center text-[22px] select-none text-primary tracking-widest font-mono">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className={`transition-all duration-300 ${i < dotsCount ? 'opacity-100 scale-125' : 'opacity-25 scale-100'}`}>
                  ●
                </span>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Field 1: Role Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider">Target Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-10 px-4 bg-white/75 border border-primary-fixed-dim rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-xs font-bold transition-all appearance-none cursor-pointer"
                >
                  <option value="Software Engineer (Frontend)">Software Engineer (Frontend)</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary-fixed-dim">expand_more</span>
              </div>

              {/* Quick-pick Chips */}
              <div className="flex flex-wrap gap-2 pt-1 select-none">
                <button
                  type="button"
                  onClick={() => setRole('Software Engineer (Frontend)')}
                  className={`px-3 py-1 rounded-full text-[10px] flex items-center gap-1 font-bold transition-all duration-200 ${
                    role === 'Software Engineer (Frontend)' ? 'bg-primary text-white shadow-sm' : 'bg-primary-fixed/30 text-on-primary-fixed-variant border border-primary-fixed-dim/30 hover:bg-primary-fixed/50'
                  }`}
                >
                  Software Eng {role === 'Software Engineer (Frontend)' && <span className="material-symbols-outlined text-[12px]">check</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Data Analyst')}
                  className={`px-3 py-1 rounded-full text-[10px] flex items-center gap-1 font-bold transition-all duration-200 ${
                    role === 'Data Analyst' ? 'bg-primary text-white shadow-sm' : 'bg-primary-fixed/30 text-on-primary-fixed-variant border border-primary-fixed-dim/30 hover:bg-primary-fixed/50'
                  }`}
                >
                  Data Analyst {role === 'Data Analyst' && <span className="material-symbols-outlined text-[12px]">check</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Product Manager')}
                  className={`px-3 py-1 rounded-full text-[10px] flex items-center gap-1 font-bold transition-all duration-200 ${
                    role === 'Product Manager' ? 'bg-primary text-white shadow-sm' : 'bg-primary-fixed/30 text-on-primary-fixed-variant border border-primary-fixed-dim/30 hover:bg-primary-fixed/50'
                  }`}
                >
                  Product Manager {role === 'Product Manager' && <span className="material-symbols-outlined text-[12px]">check</span>}
                </button>
              </div>
            </div>

            {/* Field 2: Experience Level */}
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2.5">Experience level</label>
              <div className="grid grid-cols-3 gap-3 select-none">
                {Object.values(EXPERIENCE_LEVEL).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`h-10 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${
                      level === lvl
                        ? 'bg-primary text-white shadow-md shadow-primary/20 hover:-translate-y-0.5'
                        : 'border border-primary-fixed-dim bg-primary-fixed/20 text-on-primary-fixed-variant hover:bg-primary-fixed/40 hover:-translate-y-0.5'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3: Specialization */}
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Specialization (optional)</label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full h-10 px-4 bg-white/75 border border-primary-fixed-dim rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-xs font-bold transition-all"
                placeholder="React.js, Node.js, REST APIs"
              />
              <p className="text-primary-fixed-dim text-[10px] font-bold mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Helps tailor questions to your tech stack
              </p>
            </div>

            {/* Field 4: Number of Questions */}
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2.5">Number of questions</label>
              <div className="grid grid-cols-3 gap-3 select-none">
                {[5, 10, 15].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCount(c)}
                    className={`h-10 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${
                      count === c
                        ? 'bg-primary text-white shadow-md shadow-primary/20 hover:-translate-y-0.5'
                        : 'border border-primary-fixed-dim bg-primary-fixed/20 text-on-primary-fixed-variant hover:bg-primary-fixed/40 hover:-translate-y-0.5'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-primary-fixed-dim/40 pt-3"></div>

            {/* Generate Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={generating}
              className="w-full h-10 text-xs shadow-md shadow-primary/10"
            >
              Generate Questions
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default InterviewSetup;
