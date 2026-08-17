import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchJobs, fetchJobsCount, fetchLocations, fetchCompanies, scrapeUrl, Job } from "../api/client";
import SearchBar from "../components/SearchBar";
import JobCard from "../components/JobCard";
import Navbar from "../components/Navbar";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const PAGE_SIZE = 20;

const QUICK_FILTERS = [
  "Anthropic", "OpenAI", "Stripe", "Vercel", "Linear",
  "Databricks", "Figma", "Notion", "Supabase", "Replit",
];

const DATE_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Past week" },
  { value: "month", label: "Past month" },
];

function getDateFrom(filter: string): string | undefined {
  if (!filter) return undefined;
  const now = new Date();
  if (filter === "today") { now.setHours(0, 0, 0, 0); return now.toISOString(); }
  if (filter === "week") { now.setDate(now.getDate() - 7); return now.toISOString(); }
  if (filter === "month") { now.setMonth(now.getMonth() - 1); return now.toISOString(); }
  return undefined;
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        ← Prev
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-gray-400 dark:text-gray-500">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`w-9 h-9 text-sm rounded-lg border transition-all
              ${page === p
                ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400"}`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Next →
      </button>
    </div>
  );
}

function LocationPicker({
  value,
  onChange,
  locations,
}: {
  value: string;
  onChange: (loc: string) => void;
  locations: string[];
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // Sync input when value cleared externally
  useEffect(() => { if (!value) setInput(""); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = locations.filter((l) =>
    l.toLowerCase().includes(input.toLowerCase())
  ).slice(0, 8);

  const apply = (loc: string) => {
    setInput(loc);
    onChange(loc);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative flex items-center">
        <svg className="absolute left-2.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <input
          type="text"
          placeholder="Location..."
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { apply(input.trim()); }
            if (e.key === "Escape") setOpen(false);
          }}
          className="pl-8 pr-7 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
                     focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 w-44"
        />
        {input && (
          <button
            onClick={() => { setInput(""); onChange(""); setOpen(false); }}
            className="absolute right-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && (filtered.length > 0 || input.trim()) && (
        <div className="absolute top-full mt-1 left-0 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-30 py-1 max-h-64 overflow-y-auto">
          {input.trim() && !filtered.some((l) => l.toLowerCase() === input.trim().toLowerCase()) && (
            <button
              onClick={() => apply(input.trim())}
              className="w-full text-left px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search "{input.trim()}"
            </button>
          )}
          {filtered.map((loc) => (
            <button
              key={loc}
              onClick={() => apply(loc)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2
                ${value === loc ? "text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200"}`}
            >
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {loc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [workMode, setWorkMode] = useState(""); // "" | "remote" | "hybrid" | "onsite"
  const [page, setPage] = useState(1);
  const [scrapedJobs, setScrapedJobs] = useState<Job[]>([]);
  const [scrapeError, setScrapeError] = useState("");
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);

  const filterParams = { search, company, location: locationFilter || undefined, date_from: getDateFrom(dateFilter), work_mode: workMode || undefined };

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs", search, company, locationFilter, dateFilter, workMode, page],
    queryFn: () => fetchJobs({ ...filterParams, skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }),
  });

  const { data: totalCount = 0 } = useQuery({
    queryKey: ["jobsCount", search, company, locationFilter, dateFilter, workMode],
    queryFn: () => fetchJobsCount(filterParams),
    enabled: scrapedJobs.length === 0,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: fetchLocations,
    staleTime: 5 * 60 * 1000,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const resetPage = () => setPage(1);

  const handleScrapeUrl = async (url: string) => {
    setIsScrapingUrl(true);
    setScrapeError("");
    setScrapedJobs([]);
    try {
      const result = await scrapeUrl(url);
      setScrapedJobs(result);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail ?? "Failed to scrape URL";
      setScrapeError(msg);
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleSearch = (q: string) => {
    setScrapedJobs([]);
    setScrapeError("");
    setSearch(q);
    setCompany("");
    resetPage();
  };

  const clearAllFilters = () => {
    setSearch("");
    setCompany("");
    setLocationFilter("");
    setDateFilter("");
    setWorkMode("");
    setScrapedJobs([]);
    setScrapeError("");
    resetPage();
  };

  const displayJobs = scrapedJobs.length > 0 ? scrapedJobs : jobs;
  const activeFilterCount = [locationFilter, dateFilter, workMode].filter(Boolean).length;
  const isFiltered = search || company || scrapedJobs.length > 0 || activeFilterCount > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-gradient-to-b from-indigo-50 via-purple-50/50 to-gray-50
                       dark:from-gray-900 dark:via-indigo-950/20 dark:to-gray-950 py-12 px-4">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
          <div className="blob absolute -top-24 -left-16 w-96 h-96 rounded-full bg-indigo-300/50 dark:bg-indigo-600/15 blur-3xl" />
          <div className="blob blob-delay-1 absolute -top-16 right-[-8%] w-[26rem] h-[26rem] rounded-full bg-pink-300/40 dark:bg-fuchsia-600/15 blur-3xl" />
          <div className="blob blob-delay-2 absolute bottom-[-30%] left-[35%] w-96 h-96 rounded-full bg-purple-300/40 dark:bg-purple-600/15 blur-3xl" />
        </div>

        {/* Fade into page background */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-950" />

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="relative max-w-6xl mx-auto space-y-5"
        >
          <motion.div variants={fadeUp} className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Jobs, <span className="text-gradient">straight from the source</span>.
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400 text-base">
              No middlemen. Scraped directly from company career pages. Paste any URL to scrape on demand.
              {companies.length > 0 && ` Tracking ${companies.length} companies.`}
            </p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <SearchBar onSearch={handleSearch} onScrapeUrl={handleScrapeUrl} isScrapingUrl={isScrapingUrl} />
          </motion.div>

          {/* Quick company filters */}
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2">
            {QUICK_FILTERS.map((name) => (
              <motion.button
                key={name}
                onClick={() => { setCompany(company === name ? "" : name); resetPage(); }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors
                  ${company === name
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-sm"
                    : "bg-white/70 dark:bg-gray-800/70 backdrop-blur text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400"}`}
              >
                {name}
              </motion.button>
            ))}
          </motion.div>

          {/* Filter row */}
          <motion.div variants={fadeUp} className="flex flex-col md:flex-row gap-3 mt-4 items-center justify-center">
              <div className="w-full md:w-auto relative">
                <select
                  value={company}
                  onChange={(e) => { setCompany(e.target.value); setPage(1); }}
                  className="w-full md:w-auto appearance-none pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                             rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-200 shadow-sm"
                >
                  <option value="">All companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <div className="absolute left-3.5 top-3 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>

              <div className="w-full md:w-auto z-20 hidden md:block border-l border-gray-200 dark:border-gray-700 h-6 mx-2" />

              <div className="w-full md:w-auto">
                <LocationPicker
                  value={locationFilter}
                  onChange={(v) => { setLocationFilter(v); setPage(1); }}
                  locations={locations}
                />
              </div>

              <div className="w-full md:w-auto relative">
                <select
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                  className="w-full md:w-auto appearance-none pl-10 pr-10 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                             rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-700 dark:text-gray-200"
                >
                  {DATE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="absolute left-3 top-2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div className="w-full md:w-auto z-20 hidden md:block border-l border-gray-200 dark:border-gray-700 h-6 mx-2" />
              
              {/* Work Mode Toggles */}
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                {[
                  { value: "remote", label: "Remote", icon: "🌍" },
                  { value: "hybrid", label: "Hybrid", icon: "🏢" },
                  { value: "onsite", label: "On-site", icon: "🏙" }
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => { setWorkMode(workMode === mode.value ? "" : mode.value); setPage(1); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-all whitespace-nowrap
                      ${workMode === mode.value 
                        ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium" 
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"}`}
                  >
                    <span>{mode.icon}</span>
                    {mode.label}
                  </button>
                ))}
              </div>

            {isFiltered && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur hover:border-gray-300 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear all
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Status bar */}
        <div className="flex items-center justify-between mb-6">
          {scrapeError ? (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {scrapeError}
            </div>
          ) : (
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
              {scrapedJobs.length > 0
                ? `${scrapedJobs.length} jobs scraped from URL`
                : isFiltered
                ? `${totalCount} results`
                : `${totalCount} live jobs`}
            </h2>
          )}
          {!scrapedJobs.length && totalCount > 0 && (
            <span className="text-sm text-gray-400 dark:text-gray-500">
              Page {page} of {totalPages}
            </span>
          )}
        </div>

        {/* Loading */}
        {isLoading && !scrapedJobs.length && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && displayJobs.length === 0 && !scrapeError && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">No jobs found</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Try a different search, adjust the filters, or paste a company careers URL above.
            </p>
          </div>
        )}

        {/* Job grid */}
        {displayJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!scrapedJobs.length && (
          <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        )}
      </main>

      <footer className="text-center py-8 text-xs text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-800 mt-8">
        JobAggregator scrapes jobs directly from company career pages. Data is refreshed every 6 hours.
      </footer>
    </div>
  );
}
