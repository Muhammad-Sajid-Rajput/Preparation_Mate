import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { updatePassword, deleteMe } from '../../api/userApi';
import * as notesApi from '../../api/notesApi';
import * as quizzesApi from '../../api/quizzesApi';
import { handleApiError } from '../../utils/handleApiError';
import { validatePassword } from '../../utils/validators';
import { ROUTES } from '../../constants/routes';
import { Settings2 } from 'lucide-react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/layout/PageHeader';

const AccountSettings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  // Password visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const passErr = validatePassword(newPassword);
    if (passErr) {
      setPwError(passErr);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }
    setPwLoading(true);
    setPwError(null);
    try {
      await updatePassword({ currentPassword, newPassword });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(handleApiError(err).message);
    } finally {
      setPwLoading(false);
    }
  };

  const handleDownloadExport = async () => {
    try {
      const [notes, quizzes] = await Promise.all([
        notesApi.getNotes(),
        quizzesApi.getQuizHistory(),
      ]);
      const blob = new Blob(
        [JSON.stringify({ notes, quizzes }, null, 2)],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preparation-mate-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (err) {
      toast.error('Export failed. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteMe();
      logout(); // clear AuthContext
      navigate(ROUTES.LOGIN);
      toast.success('Account deleted.');
    } catch (err) {
      toast.error(handleApiError(err).message);
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full py-4 text-left animate-fade-up">
      <Toaster position="top-right" />

      <div className="w-full max-w-[560px] flex flex-col gap-6">
        {/* Header Section */}
        <PageHeader
          icon={Settings2}
          title="Account Settings"
          subtitle="Notifications and account preferences"
        />

        {/* SECURITY SECTION */}
        <Card className="!p-6 flex flex-col gap-4">
          <header className="flex flex-col gap-1 border-b border-primary-fixed-dim/40 pb-2 select-none">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Security
            </span>
          </header>

          {pwError && <ErrorBanner message={pwError} onDismiss={() => setPwError(null)} />}
          
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-primary uppercase tracking-wider block">
                Current password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={pwLoading}
                  className="w-full h-10 px-3 bg-white/70 border border-primary-fixed-dim rounded-lg text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  disabled={pwLoading}
                  className="absolute right-3 text-primary-fixed-dim hover:text-primary transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showCurrent ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-primary uppercase tracking-wider block">
                New password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={pwLoading}
                  className="w-full h-10 px-3 bg-white/70 border border-primary-fixed-dim rounded-lg text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  disabled={pwLoading}
                  className="absolute right-3 text-primary-fixed-dim hover:text-primary transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showNew ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-primary uppercase tracking-wider block">
                Confirm new password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={pwLoading}
                  className="w-full h-10 px-3 bg-white/70 border border-primary-fixed-dim rounded-lg text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  disabled={pwLoading}
                  className="absolute right-3 text-primary-fixed-dim hover:text-primary transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showConfirm ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={pwLoading}
                className="h-10 px-6 text-xs shadow-md shadow-primary/10"
              >
                Update password
              </Button>
            </div>
          </form>
        </Card>

        {/* DATA SECTION */}
        <Card className="!p-6 flex flex-col gap-4">
          <span className="text-xs font-bold text-primary uppercase tracking-wider border-b border-primary-fixed-dim/40 pb-2 select-none text-left">
            Data
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5 text-left">
              <h3 className="text-xs font-bold text-on-primary-fixed-variant">Download my data</h3>
              <p className="text-[11px] text-primary-fixed-dim font-bold">
                Get a copy of your personal data in a JSON file.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadExport}
              className="px-4 text-xs font-bold"
            >
              Download export
            </Button>
          </div>
        </Card>

        {/* LOGOUT SECTION */}
        <Card className="!p-6 flex flex-col gap-4">
          <span className="text-xs font-bold text-primary uppercase tracking-wider border-b border-primary-fixed-dim/40 pb-2 select-none text-left">
            Session
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5 text-left">
              <h3 className="text-xs font-bold text-on-primary-fixed-variant">Sign out</h3>
              <p className="text-[11px] text-primary-fixed-dim font-bold">
                End your current session. You can sign back in at any time.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-4 text-xs font-bold flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              {loggingOut ? 'Signing out...' : 'Sign out'}
            </Button>
          </div>
        </Card>

        {/* DANGER ZONE SECTION */}
        <Card className="!p-6 flex flex-col gap-4 border border-red-200/60 bg-red-50/15">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider border-b border-red-200/50 pb-2 select-none text-left">
            Danger zone
          </span>
          <div className="bg-red-100/50 border border-red-200/50 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5 text-left">
              <h3 className="text-xs font-bold text-red-950">Delete account</h3>
              <p className="text-[10px] text-red-900 font-bold leading-relaxed">
                This action is permanent and cannot be undone. All study progress will be lost.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 text-xs font-bold border border-red-600/20"
            >
              Delete account
            </Button>
          </div>
        </Card>

        {/* Footer Meta */}
        <footer className="pt-6 pb-8 border-t border-primary-fixed-dim/30 flex justify-between items-center text-[10px] font-bold text-primary-fixed-dim select-none uppercase tracking-wider">
          <p>© 2026 Preparation Mate Inc.</p>
          <div className="flex gap-4">
            <a className="hover:text-primary" href="#">Privacy Policy</a>
            <a className="hover:text-primary" href="#">Terms of Service</a>
          </div>
        </footer>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete your account?"
        body="This permanently deletes all your notes, quizzes, plans, and data. This action cannot be undone."
        confirmLabel={deleting ? "Deleting..." : "Delete my account"}
        danger={true}
        onConfirm={handleDeleteAccount}
        onCancel={() => !deleting && setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default AccountSettings;
