import { useState } from "react";
import { Job } from "../api/client";
import JobModal from "./JobModal";

interface Props {
  job: Job;
}

const PLATFORM_COLORS: Record<string, string> = {
  greenhouse: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  lever: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  ashby: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  playwright: "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

function CompanyLogo({ name, logo }: { name: string; logo?: string }) {
  const [err, setErr] = useState(false);
  if (logo && !err) {
    return (
      <img src={logo} alt={name} onError={() => setErr(true)}
        className="w-10 h-10 rounded-xl object-contain bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-1" />
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                    flex items-center justify-center text-white font-bold text-sm">
      {name.charAt(0)}
    </div>
  );
}

export default function JobCard({ job }: Props) {
  const [showModal, setShowModal] = useState(false);

  const platform = job.company_url.includes("greenhouse") ? "greenhouse"
    : job.company_url.includes("lever") ? "lever"
    : job.company_url.includes("ashby") ? "ashby"
    : "playwright";

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            <CompanyLogo name={job.company_name} logo={job.company_logo ?? undefined} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-tight truncate">
                  {job.title}
                </h3>
                {job.job_id && (
                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded font-mono shrink-0">
                    #{job.job_id.slice(0, 8)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{job.company_name}</span>
                {job.location && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {job.location}
                    </span>
                  </>
                )}
                {job.department && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{job.department}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {job.work_mode && (
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium flex items-center gap-1
                  ${job.work_mode === 'remote' ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' :
                    job.work_mode === 'hybrid' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}>
                  {job.work_mode === 'remote' ? '🌍' : job.work_mode === 'hybrid' ? '🏢' : '🏙'}
                  <span className="capitalize">{job.work_mode}</span>
                </span>
              )}
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${PLATFORM_COLORS[platform]}`}>
                {platform}
              </span>
            </div>
          </div>

          {/* Short description */}
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
            {job.short_description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-gray-800">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(job.scraped_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                         bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View & Apply
            </button>
          </div>
        </div>
      </div>

      {showModal && <JobModal job={job} onClose={() => setShowModal(false)} />}
    </>
  );
}
