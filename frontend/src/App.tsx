import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Plus,
  RefreshCw,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
} from "lucide-react";
import { JobTable } from "./components/JobTable";
import { StatsCard } from "./components/StatsCard";
import { AddJobModal } from "./components/AddJobModal";
import {
  getJobs,
  getAuthStatus,
  getLoginUrl,
  logout,
  syncEmails,
  createJob,
  updateJob,
  deleteJob,
  type JobApplication,
  type JobStatus,
} from "./services/api";

function App() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Check URL for auth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "success") {
      window.history.replaceState({}, "", "/");
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    }
  }, [queryClient]);

  // Queries
  const { data: authData } = useQuery({
    queryKey: ["auth"],
    queryFn: () => getAuthStatus().then((r) => r.data),
  });

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => getJobs().then((r) => r.data),
  });

  // Mutations
  const loginMutation = useMutation({
    mutationFn: getLoginUrl,
    onSuccess: (response) => {
      window.location.href = response.data.auth_url;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncEmails,
    onSuccess: (response) => {
      setSyncMessage(response.data.message);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setTimeout(() => setSyncMessage(null), 5000);
    },
    onError: (error: any) => {
      setSyncMessage(error.response?.data?.detail || "Sync failed");
      setTimeout(() => setSyncMessage(null), 5000);
    },
  });

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<JobApplication> }) =>
      updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setIsModalOpen(false);
      setEditingJob(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  // Stats calculation
  const jobs = jobsData?.items || [];
  const stats = {
    total: jobs.length,
    active: jobs.filter(
      (j) => !["rejected", "withdrawn"].includes(j.status)
    ).length,
    interviewing: jobs.filter((j) => j.status === "interviewing").length,
    offers: jobs.filter((j) => j.status === "offer").length,
    rejected: jobs.filter((j) => j.status === "rejected").length,
  };

  const handleEdit = (job: JobApplication) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this application?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusChange = (id: number, status: JobStatus) => {
    updateMutation.mutate({ id, data: { status } });
  };

  const handleSave = (data: Partial<JobApplication>) => {
    if (editingJob) {
      updateMutation.mutate({ id: editingJob.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
              Job Tracker
            </h1>
            <p className="text-zinc-500 mt-1">
              Track your job applications in one place
            </p>
          </div>

          <div className="flex items-center gap-3">
            {authData?.authenticated ? (
              <>
                <span className="text-sm text-zinc-500">
                  {authData.email}
                </span>
                <button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      syncMutation.isPending ? "animate-spin" : ""
                    }`}
                  />
                  Sync Gmail
                </button>
                <button
                  onClick={() => logoutMutation.mutate()}
                  className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => loginMutation.mutate()}
                disabled={loginMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Mail className="w-4 h-4" />
                Connect Gmail
              </button>
            )}

            <button
              onClick={() => {
                setEditingJob(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Job
            </button>
          </div>
        </header>

        {/* Sync message */}
        {syncMessage && (
          <div className="mb-6 px-4 py-3 bg-teal-900/50 border border-teal-800 rounded-lg text-teal-200 text-sm">
            {syncMessage}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Applications"
            value={stats.total}
            icon={<Briefcase className="w-5 h-5 text-zinc-100" />}
            color="bg-zinc-700"
          />
          <StatsCard
            title="Active"
            value={stats.active}
            icon={<Clock className="w-5 h-5 text-blue-300" />}
            color="bg-blue-600"
          />
          <StatsCard
            title="Interviewing"
            value={stats.interviewing}
            icon={<CheckCircle className="w-5 h-5 text-emerald-300" />}
            color="bg-emerald-600"
          />
          <StatsCard
            title="Rejected"
            value={stats.rejected}
            icon={<XCircle className="w-5 h-5 text-red-300" />}
            color="bg-red-600"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
          </div>
        ) : (
          <JobTable
            jobs={jobs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {/* Modal */}
      <AddJobModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingJob(null);
        }}
        onSave={handleSave}
        editingJob={editingJob}
      />
    </div>
  );
}

export default App;
