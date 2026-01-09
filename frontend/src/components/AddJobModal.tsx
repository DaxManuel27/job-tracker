import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { JobApplication, JobStatus } from "../services/api";

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: Partial<JobApplication>) => void;
  editingJob?: JobApplication | null;
}

export function AddJobModal({
  isOpen,
  onClose,
  onSave,
  editingJob,
}: AddJobModalProps) {
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    status: "applied" as JobStatus,
    location: "",
    salary_range: "",
    job_url: "",
    source: "",
    notes: "",
    applied_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (editingJob) {
      setFormData({
        company: editingJob.company,
        position: editingJob.position,
        status: editingJob.status,
        location: editingJob.location || "",
        salary_range: editingJob.salary_range || "",
        job_url: editingJob.job_url || "",
        source: editingJob.source || "",
        notes: editingJob.notes || "",
        applied_date: editingJob.applied_date
          ? editingJob.applied_date.split("T")[0]
          : "",
      });
    } else {
      setFormData({
        company: "",
        position: "",
        status: "applied",
        location: "",
        salary_range: "",
        job_url: "",
        source: "",
        notes: "",
        applied_date: new Date().toISOString().split("T")[0],
      });
    }
  }, [editingJob, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      applied_date: formData.applied_date
        ? new Date(formData.applied_date).toISOString()
        : null,
      location: formData.location || null,
      salary_range: formData.salary_range || null,
      job_url: formData.job_url || null,
      source: formData.source || null,
      notes: formData.notes || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-zinc-100">
            {editingJob ? "Edit Application" : "Add Application"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Company *
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Position *
              </label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as JobStatus,
                  })
                }
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Applied Date
              </label>
              <input
                type="date"
                value={formData.applied_date}
                onChange={(e) =>
                  setFormData({ ...formData, applied_date: e.target.value })
                }
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Remote, NYC, etc."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Source
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                placeholder="LinkedIn, Indeed, etc."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Job URL
            </label>
            <input
              type="url"
              value={formData.job_url}
              onChange={(e) =>
                setFormData({ ...formData, job_url: e.target.value })
              }
              placeholder="https://..."
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
            >
              {editingJob ? "Save Changes" : "Add Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


