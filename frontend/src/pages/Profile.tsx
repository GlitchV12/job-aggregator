import { useState, FormEvent, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import {
  updateProfile,
  uploadResume,
  fetchApplications,
  updateApplication,
  deleteApplication,
  Application,
} from "../api/client";

const STATUS_OPTIONS = ["saved", "applied", "interviewing", "offer", "rejected"];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    saved: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    applied: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
    interviewing: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    offer: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300",
    rejected: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${colors[status] ?? colors.saved}`}>
      {status}
    </span>
  );
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saveMessage, setSaveMessage] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  const handleSaveDetails = async (e: FormEvent) => {
    e.preventDefault();
    setSaveMessage("");
    await updateProfile({ name, phone });
    await refreshUser();
    setSaveMessage("Saved");
    setTimeout(() => setSaveMessage(""), 2000);
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeError("");
    setUploading(true);
    try {
      await uploadResume(file);
      await refreshUser();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Upload failed";
      setResumeError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleStatusChange = async (app: Application, status: string) => {
    await updateApplication(app.id, { status });
    queryClient.invalidateQueries({ queryKey: ["applications"] });
  };

  const handleDelete = async (app: Application) => {
    await deleteApplication(app.id);
    queryClient.invalidateQueries({ queryKey: ["applications"] });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>

        {/* Details */}
        <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Your details</h2>
          <form onSubmit={handleSaveDetails} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Save
              </button>
              {saveMessage && <span className="text-sm text-green-600 dark:text-green-400">{saveMessage}</span>}
            </div>
          </form>
        </section>

        {/* Resume */}
        <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Resume</h2>
          {user.resume_filename ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Current file: <span className="font-medium">{user.resume_filename}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">No resume uploaded yet.</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleResumeChange}
            className="hidden"
            id="resume-upload"
          />
          <label
            htmlFor="resume-upload"
            className="inline-block px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-all"
          >
            {uploading ? "Uploading..." : user.resume_filename ? "Replace resume" : "Upload resume"}
          </label>
          {resumeError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{resumeError}</p>}
        </section>

        {/* Application tracker */}
        <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Applications</h2>
          {applications.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No applications tracked yet. Mark a job as applied from the job board to see it here.
            </p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between gap-3 border border-gray-100 dark:border-gray-800 rounded-xl p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{app.job_title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{app.company_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app, e.target.value)}
                      className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2 py-1 focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <StatusBadge status={app.status} />
                    <button
                      onClick={() => handleDelete(app)}
                      aria-label="Remove"
                      className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
