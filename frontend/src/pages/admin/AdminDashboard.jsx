import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Shield } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Skeleton from '../../components/ui/Skeleton';
import ErrorBanner from '../../components/ui/ErrorBanner';
import {
  getMetrics,
  getApiUsage,
  getErrorLogs,
  getAdminUsers,
  updateAdminUser
} from '../../api/adminApi';
import { handleApiError } from '../../utils/handleApiError';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';
import { useDebounce } from '../../hooks/useDebounce';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/layout/PageHeader';

const AdminDashboard = () => {
  // State variables
  const [metrics, setMetrics] = useState(null);
  const [apiUsage, setApiUsage] = useState(null);
  const [errors, setErrors] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [errorPage, setErrorPage] = useState(1);
  const [errorsTotal, setErrorsTotal] = useState(0);
  const [usageDays, setUsageDays] = useState(7);
  const [loading, setLoading] = useState({
    metrics: true,
    usage: true,
    errors: true,
    users: true,
  });

  const [activeUserMenu, setActiveUserMenu] = useState(null); // stores user id for dropdown
  const [showGlobalAction, setShowGlobalAction] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  // Debounced search
  const debouncedSearch = useDebounce(userSearch, 300);

  // Fetch logic
  const fetchMetrics = async () => {
    try {
      setLoading((p) => ({ ...p, metrics: true }));
      const data = await getMetrics();
      setMetrics(data);
    } catch (err) {
      // Fail silently
    } finally {
      setLoading((p) => ({ ...p, metrics: false }));
    }
  };

  const fetchApiUsage = async () => {
    try {
      setLoading((p) => ({ ...p, usage: true }));
      const data = await getApiUsage(usageDays);
      setApiUsage(data);
    } catch (err) {
      // Fail silently
    } finally {
      setLoading((p) => ({ ...p, usage: false }));
    }
  };

  const fetchErrors = async () => {
    try {
      setLoading((p) => ({ ...p, errors: true }));
      const data = await getErrorLogs(errorPage);
      setErrors(data.logs || []);
      setErrorsTotal(data.total || 0);
    } catch (err) {
      // Fail silently
    } finally {
      setLoading((p) => ({ ...p, errors: false }));
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading((p) => ({ ...p, users: true }));
      const data = await getAdminUsers(userPage, debouncedSearch);
      setUsers(data.users || []);
      setUsersTotal(data.total || 0);
    } catch (err) {
      // Fail silently
    } finally {
      setLoading((p) => ({ ...p, users: false }));
    }
  };

  // Triggers
  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchApiUsage();
  }, [usageDays]);

  useEffect(() => {
    fetchErrors();
  }, [errorPage]);

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, userPage]);

  // Actions
  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateAdminUser(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      toast.success('Role updated');
    } catch (err) {
      toast.error(handleApiError(err).message);
    } finally {
      setActiveUserMenu(null);
    }
  };

  const handleQuotaReset = async (userId) => {
    try {
      await updateAdminUser(userId, { resetQuota: true });
      toast.success('Daily quota reset for user');
    } catch (err) {
      toast.error(handleApiError(err).message);
    } finally {
      setActiveUserMenu(null);
    }
  };

  const handleGlobalActionSubmit = (e) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    toast.success(`Global Announcement Dispatched: "${announcementText}"`);
    setAnnouncementText('');
    setShowGlobalAction(false);
  };

  const handleDownloadLogs = () => {
    if (errors.length === 0) {
      toast.error('No logs available to download.');
      return;
    }
    let csvContent = 'data:text/csv;charset=utf-8,Provider,Endpoint,Severity,Timestamp,Message\n';
    errors.forEach((err) => {
      const msg = (err.errorMessage || '').replace(/"/g, '""');
      csvContent += `"${err.provider || 'unknown'}","${err.endpoint || ''}","${
        err.status || 'error'
      }","${err.createdAt || ''}","${msg}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'system_error_logs.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Logs CSV download initiated.');
  };

  // Helpers
  const getInitials = (n) => {
    if (!n) return 'U';
    return n
      .split(' ')
      .filter(Boolean)
      .map((i) => i[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSeverityBadge = (log) => {
    const isCrit = log.status === 'error';
    const isWarn =
      log.status === 'warning' ||
      (log.errorMessage &&
        (log.errorMessage.toLowerCase().includes('warn') ||
          log.errorMessage.toLowerCase().includes('rate limit')));
    if (isCrit) return <Badge variant="danger">CRIT</Badge>;
    if (isWarn) return <Badge variant="warning">WARN</Badge>;
    return <Badge variant="gray">INFO</Badge>;
  };

  const budgetUsedPct = apiUsage?.budgetUsedPct ?? 0;
  const costVal = parseFloat((apiUsage?.estimatedCost || '$0').replace('$', ''));
  const isCostHigh = costVal > 7;

  return (
    <div className="space-y-8 relative text-left animate-fade-up">
      <Toaster position="top-right" />

      {/* Page Title */}
      <PageHeader
        icon={Shield}
        title="Admin Dashboard"
        subtitle="Platform metrics and monitoring"
      />

      {/* User Metrics Grid */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-[20px]">group</span>
          User Metrics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {loading.metrics ? (
            <>
              <Skeleton className="h-[108px] w-full rounded-xl bg-primary-fixed/30" />
              <Skeleton className="h-[108px] w-full rounded-xl bg-primary-fixed/30" />
              <Skeleton className="h-[108px] w-full rounded-xl bg-primary-fixed/30" />
              <Skeleton className="h-[108px] w-full rounded-xl bg-primary-fixed/30" />
            </>
          ) : (
            <>
              <StatCard
                title="Total Users"
                value={metrics?.totalUsers !== undefined ? metrics.totalUsers.toLocaleString() : '--'}
                trend="none"
              />
              <StatCard
                title="Active 7d"
                value={metrics?.activeUsers7d !== undefined ? metrics.activeUsers7d.toLocaleString() : '--'}
                trend="none"
              />
              <StatCard
                title="New Today"
                value={metrics?.newToday !== undefined ? metrics.newToday.toLocaleString() : '--'}
                trend="none"
              />
              <StatCard
                title="Churn"
                value={metrics?.churnRate !== undefined ? `${metrics.churnRate}%` : '2.4%'}
                trend="none"
              />
            </>
          )}
        </div>
      </section>

      {/* Usage Metrics Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-[20px]">
            monitoring
          </span>
          Usage Metrics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {loading.metrics ? (
            <>
              <Skeleton className="h-20 w-full rounded-xl bg-primary-fixed/30" />
              <Skeleton className="h-20 w-full rounded-xl bg-primary-fixed/30" />
              <Skeleton className="h-20 w-full rounded-xl bg-primary-fixed/30" />
              <Skeleton className="h-20 w-full rounded-xl bg-primary-fixed/30" />
            </>
          ) : (
            <>
              <Card className="!p-5 hover:bg-primary-fixed/20 transition-colors group cursor-default select-none border border-primary-fixed-dim/60 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0 shadow-sm">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                    Notes Created
                  </span>
                  <div className="text-on-primary-fixed-variant font-bold text-lg leading-tight mt-0.5">
                    {metrics?.totalNotes !== undefined ? metrics.totalNotes.toLocaleString() : '--'}
                  </div>
                </div>
              </Card>

              <Card className="!p-5 hover:bg-primary-fixed/20 transition-colors group cursor-default select-none border border-primary-fixed-dim/60 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0 shadow-sm">
                  <span className="material-symbols-outlined">quiz</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                    Quizzes Taken
                  </span>
                  <div className="text-on-primary-fixed-variant font-bold text-lg leading-tight mt-0.5">
                    {metrics?.totalQuizzes !== undefined ? metrics.totalQuizzes.toLocaleString() : '--'}
                  </div>
                </div>
              </Card>

              <Card className="!p-5 hover:bg-primary-fixed/20 transition-colors group cursor-default select-none border border-primary-fixed-dim/60 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0 shadow-sm">
                  <span className="material-symbols-outlined">forum</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                    AI Chats
                  </span>
                  <div className="text-on-primary-fixed-variant font-bold text-lg leading-tight mt-0.5">
                    {metrics?.totalChats !== undefined ? metrics.totalChats.toLocaleString() : '--'}
                  </div>
                </div>
              </Card>

              <Card className="!p-5 hover:bg-primary-fixed/20 transition-colors group cursor-default select-none border border-primary-fixed-dim/60 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0 shadow-sm">
                  <span className="material-symbols-outlined">article</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                    Resumes Reviewed
                  </span>
                  <div className="text-on-primary-fixed-variant font-bold text-lg leading-tight mt-0.5">
                    {metrics?.totalResumes !== undefined ? metrics.totalResumes.toLocaleString() : '--'}
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </section>

      {/* Grid: AI Usage & Cost Breakdown + Error Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Usage Card */}
        <Card className="!p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4 select-none">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">smart_toy</span>
              AI Usage &amp; Costs
            </h3>
            <div className="flex items-center gap-1.5">
              <select
                value={usageDays}
                onChange={(e) => setUsageDays(parseInt(e.target.value))}
                className="text-xs border border-primary-fixed-dim bg-white/70 rounded p-1 outline-none cursor-pointer text-on-primary-fixed-variant font-bold"
              >
                <option value="1">Today</option>
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
              </select>
            </div>
          </div>

          {loading.usage ? (
            <Skeleton className="h-full min-h-[220px] w-full rounded-lg bg-primary-fixed/30 animate-pulse" />
          ) : (
            <div className="flex flex-col flex-1 justify-between gap-4">
              <div className="grid grid-cols-2 gap-6 text-left">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
                    Total API Calls
                  </span>
                  <span className="text-2xl font-bold text-on-primary-fixed-variant font-data-mono">
                    {apiUsage?.totalCalls !== undefined ? apiUsage.totalCalls.toLocaleString() : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
                    Estimated Cost
                  </span>
                  <span
                    className={`text-2xl font-bold font-data-mono ${
                      isCostHigh ? 'text-amber-600' : 'text-on-primary-fixed-variant'
                    }`}
                  >
                    {apiUsage?.estimatedCost || '--'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between text-xs font-semibold select-none">
                  <span className="font-bold text-primary">Daily Budget Usage</span>
                  <span className="text-on-primary-fixed-variant font-bold">
                    {budgetUsedPct}% of {apiUsage?.dailyBudget || '$10'}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[#D6E6F3] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      budgetUsedPct >= 90
                        ? 'bg-red-500'
                        : budgetUsedPct >= 70
                        ? 'bg-amber-500'
                        : 'bg-primary'
                    }`}
                    style={{ width: `${budgetUsedPct}%` }}
                  ></div>
                </div>
                {budgetUsedPct >= 90 && (
                  <span className="text-[10px] text-red-500 font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined !text-[12px] font-fill-1">warning</span>
                    System daily budget alert: nearing limits
                  </span>
                )}
              </div>

              <div className="pt-4 border-t border-primary-fixed-dim/40 text-left">
                <span className="text-[10px] font-bold uppercase text-primary block mb-2 select-none">
                  Provider Breakdown ({apiUsage?.avgResponseMs ? `Avg response: ${apiUsage.avgResponseMs}` : '--'})
                </span>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-bold text-on-primary-fixed-variant">
                  {apiUsage?.providers && apiUsage.providers.length > 0 ? (
                    apiUsage.providers.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-sm ${
                            p.name === 'gemini'
                              ? 'bg-primary'
                              : p.name === 'groq'
                              ? 'bg-secondary'
                              : 'bg-primary-fixed-dim'
                          }`}
                        ></div>
                        <span className="capitalize">
                          {p.name}: {p.calls.toLocaleString()} ({p.pct}%)
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-primary-fixed-dim text-xs italic font-bold">No provider data</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Error Monitoring Table */}
        <Card className="!p-5 flex flex-col h-[400px] shadow-sm">
          <div className="flex items-center justify-between mb-4 select-none">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-base">warning</span>
              Error Monitoring
            </h3>
            <button
              onClick={handleDownloadLogs}
              disabled={loading.errors || errors.length === 0}
              className="text-xs font-bold text-primary hover:underline disabled:opacity-50"
            >
              Download CSV
            </button>
          </div>

          <div className="flex-grow overflow-y-auto border border-primary-fixed-dim/60 rounded-lg bg-white/60 scrollbar-hide">
            {loading.errors ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-6 w-full bg-primary-fixed/30" />
                <Skeleton className="h-6 w-full bg-primary-fixed/30" />
                <Skeleton className="h-6 w-full bg-primary-fixed/30" />
                <Skeleton className="h-6 w-full bg-primary-fixed/30" />
                <Skeleton className="h-6 w-full bg-primary-fixed/30" />
              </div>
            ) : errors.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-primary-fixed-dim italic font-bold">
                No system errors recorded.
              </div>
            ) : (
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead className="sticky top-0 bg-primary-fixed border-b border-outline z-10 select-none">
                  <tr className="text-[10px] text-on-primary-fixed font-bold uppercase tracking-wider">
                    <th className="p-3">Severity</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Endpoint</th>
                    <th className="p-3">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((log, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-[#F4F8FC] border-b border-outline-variant transition-colors h-[40px] text-on-primary-fixed-variant font-semibold"
                    >
                      <td className="p-3">{getSeverityBadge(log)}</td>
                      <td className="p-3 text-primary-fixed-dim font-bold whitespace-nowrap">
                        {formatRelativeTime(log.createdAt)}
                      </td>
                      <td className="p-3 text-primary truncate max-w-[120px]" title={log.endpoint}>
                        {log.endpoint}
                      </td>
                      <td
                        className="p-3 text-on-primary-fixed-variant truncate max-w-[200px]"
                        title={log.errorMessage}
                      >
                        {log.errorMessage}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold text-primary select-none">
            <span>Total: {errorsTotal} errors</span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setErrorPage((p) => Math.max(1, p - 1))}
                disabled={errorPage === 1 || loading.errors}
                className="h-8 text-[11px] font-semibold"
              >
                Previous
              </Button>
              <span className="self-center px-1 font-bold text-on-primary-fixed-variant">Page {errorPage}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setErrorPage((p) => p + 1)}
                disabled={errorPage * 20 >= errorsTotal || loading.errors}
                className="h-8 text-[11px] font-semibold"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* User Management Section */}
      <Card className="!p-0 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-primary-fixed-dim/40 select-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">User Management</h3>

            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-primary-fixed-dim text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  className="pl-9 h-10 w-64 bg-white/70 border border-primary-fixed-dim rounded-lg text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto relative min-h-[200px]">
          {loading.users ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full bg-primary-fixed/30" />
              <Skeleton className="h-8 w-full bg-primary-fixed/30" />
              <Skeleton className="h-8 w-full bg-primary-fixed/30" />
              <Skeleton className="h-8 w-full bg-primary-fixed/30" />
              <Skeleton className="h-8 w-full bg-primary-fixed/30" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-primary-fixed-dim text-xs italic font-bold select-none">
              No users matching query found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead className="select-none">
                <tr className="bg-primary-fixed text-[10px] font-bold text-on-primary-fixed border-b border-outline uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Usage Stats (Today)</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-on-primary-fixed-variant font-semibold">
                {users.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-[#F4F8FC] transition-colors h-[56px] text-xs"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm select-none">
                          {getInitials(item.name)}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-on-primary-fixed-variant">{item.name}</span>
                          <span className="text-[10px] text-primary-fixed-dim font-bold mt-0.5">{item.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={item.isVerified ? 'success' : 'warning'}>
                        {item.isVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={item.role === 'admin' ? 'danger' : 'gray'}>
                        {item.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">
                      <span>N:{item.usageStats?.pdfCount || 0}</span>
                      <span className="mx-2 text-primary-fixed-dim/40">|</span>
                      <span>Q:{item.usageStats?.quizCount || 0}</span>
                      <span className="mx-2 text-primary-fixed-dim/40">|</span>
                      <span>C:{item.usageStats?.chatCount || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-primary-fixed-dim font-bold">
                      {item.createdAt ? formatDate(item.createdAt) : '--'}
                    </td>
                    <td className="px-6 py-4 relative">
                      <button
                        onClick={() =>
                          setActiveUserMenu(activeUserMenu === item._id ? null : item._id)
                        }
                        className="w-8 h-8 rounded-full hover:bg-primary-fixed-dim/30 text-primary-fixed-dim hover:text-primary flex items-center justify-center transition-colors focus:outline-none"
                      >
                        <span className="material-symbols-outlined">more_horiz</span>
                      </button>

                      {/* Dropdown Options Menu */}
                      {activeUserMenu === item._id && (
                        <div className="absolute right-6 top-10 w-48 bg-white border border-primary-fixed-dim rounded-lg shadow-lg py-1.5 z-20 text-left font-sans animate-fade-up">
                          <button
                            onClick={() =>
                              handleRoleChange(
                                item._id,
                                item.role === 'admin' ? 'user' : 'admin'
                              )
                            }
                            className="w-full text-left px-4 py-2 text-xs hover:bg-primary-fixed text-on-primary-fixed-variant font-semibold"
                          >
                            {item.role === 'admin' ? 'Make standard User' : 'Make Admin role'}
                          </button>
                          <button
                            onClick={() => handleQuotaReset(item._id)}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-primary-fixed text-on-primary-fixed-variant font-semibold border-t border-primary-fixed-dim/30"
                          >
                            Reset daily quotas
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 bg-primary-fixed/30 border-t border-primary-fixed-dim/40 flex items-center justify-between text-xs font-bold text-primary select-none">
          <span>
            Showing {(userPage - 1) * 20 + 1} to {Math.min(userPage * 20, usersTotal)} of{' '}
            {usersTotal} users
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setUserPage((p) => Math.max(1, p - 1))}
              disabled={userPage === 1 || loading.users}
              className="h-8 text-[11px] font-semibold"
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setUserPage((p) => p + 1)}
              disabled={userPage * 20 >= usersTotal || loading.users}
              className="h-8 text-[11px] font-semibold"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Broadcast Announcement Modal */}
      <button
        onClick={() => setShowGlobalAction(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-115 active:scale-90 transition-all z-30 group hover:shadow-primary/30"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
        <span className="absolute right-full mr-4 bg-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md border border-primary-fixed-dim">
          New Global Announcement
        </span>
      </button>

      {showGlobalAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-primary-fixed/95 border border-primary-fixed-dim w-full max-w-md p-6 space-y-4 rounded-xl shadow-[0_20px_50px_rgba(91,106,248,0.15)] animate-fade-up">
            <div className="flex items-center justify-between pb-2 border-b border-primary-fixed-dim/60 select-none">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">New Announcement</h3>
              <button
                type="button"
                onClick={() => {
                  setShowGlobalAction(false);
                  setAnnouncementText('');
                }}
                className="material-symbols-outlined text-primary hover:text-primary-dark w-8 h-8 rounded-full hover:bg-primary-fixed-dim/30 flex items-center justify-center"
              >
                close
              </button>
            </div>

            <form onSubmit={handleGlobalActionSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold tracking-wider text-primary block uppercase text-left select-none">
                  Broadcast Message
                </label>
                <textarea
                  placeholder="Enter system banner text to broadcast..."
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full min-h-[80px] p-3 border border-primary-fixed-dim bg-white/70 rounded-lg text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-primary-fixed-dim/40 select-none">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowGlobalAction(false);
                    setAnnouncementText('');
                  }}
                  className="h-9 px-4 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="h-9 px-5 text-xs shadow-md shadow-primary/10"
                >
                  Broadcast Announce
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
