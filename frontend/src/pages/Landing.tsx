import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const FEATURES = [
  {
    title: "Jobs, straight from the source",
    description: "Scraped directly from company career pages across Greenhouse, Lever, Ashby, and more. No stale listings, no middlemen.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    ),
  },
  {
    title: "Search that actually finds the role",
    description: "Full-text search with synonym expansion, so \"SOC analyst\" also surfaces cybersecurity, security operations, and SIEM roles.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    ),
  },
  {
    title: "Resume matching",
    description: "Upload your resume and score it against any job description, with matched and missing keywords called out.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
  {
    title: "Application tracker",
    description: "Mark jobs as applied straight from the listing and track status, from applied through offer, in one place.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Find the job, not just a job.
        </h1>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          One place to search real openings scraped straight from company career pages,
          match your resume against them, and track every application.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/jobs"
            className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Browse jobs
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
          >
            Create free account
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6"
            >
              <div className="w-10 h-10 bg-indigo-50 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {f.icon}
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{f.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 text-xs text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-800">
        JobAggregator scrapes jobs directly from company career pages. Data is refreshed every 6 hours.
      </footer>
    </div>
  );
}
