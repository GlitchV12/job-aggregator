import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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

const FLOATING_COMPANIES = [
  { label: "Anthropic", className: "top-6 -left-6 sm:-left-10" },
  { label: "Stripe", className: "top-1/3 -right-6 sm:-right-12" },
  { label: "Vercel", className: "bottom-10 -left-4 sm:-left-14" },
  { label: "Linear", className: "bottom-0 right-4 sm:right-0" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "We scrape, hourly",
    description: "Career pages from hundreds of companies are crawled directly, every 6 hours, so listings stay current.",
  },
  {
    step: "02",
    title: "You search, precisely",
    description: "Full-text search with synonym expansion finds the role even when the title doesn't match your query exactly.",
  },
  {
    step: "03",
    title: "You apply, with confidence",
    description: "Match your resume against the description before you apply, then track status in one dashboard.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-x-hidden">
      <Navbar />

      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="blob absolute top-[-10%] left-[-10%] w-[420px] h-[420px] rounded-full bg-indigo-300/30 dark:bg-indigo-600/20 blur-3xl" />
        <div className="blob blob-delay-1 absolute top-[10%] right-[-15%] w-[480px] h-[480px] rounded-full bg-fuchsia-300/25 dark:bg-fuchsia-600/15 blur-3xl" />
        <div className="blob blob-delay-2 absolute bottom-[-15%] left-[20%] w-[400px] h-[400px] rounded-full bg-purple-300/25 dark:bg-purple-600/15 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 sm:pt-24 pb-20 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="text-center lg:text-left"
        >
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Refreshed straight from career pages every 6 hours
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-4xl sm:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-[1.1]"
          >
            Find the job,
            <br />
            not just <span className="text-gradient">a job.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto lg:mx-0"
          >
            One place to search real openings scraped straight from company career pages,
            match your resume against them, and track every application.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex items-center justify-center lg:justify-start gap-3">
            <Link
              to="/jobs"
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              Browse jobs
            </Link>
            <Link
              to="/signup"
              className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 backdrop-blur text-gray-700 dark:text-gray-200 font-medium hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:-translate-y-0.5 transition-all duration-200"
            >
              Create free account
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero visual: floating mock search card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="relative float-slow">
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-2xl shadow-indigo-500/10 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <div className="ml-3 flex-1 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center px-3 text-[11px] text-gray-400">
                  jobaggregator.app/jobs?q=security+engineer
                </div>
              </div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-3 border-b last:border-b-0 border-gray-100 dark:border-gray-800"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="h-2.5 w-3/5 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-2 w-2/5 rounded bg-gray-100 dark:bg-gray-800 mt-2" />
                  </div>
                  <div className="w-14 h-6 rounded-full bg-indigo-50 dark:bg-indigo-500/10 shrink-0" />
                </div>
              ))}
            </div>

            {FLOATING_COMPANIES.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.15 }}
                className={`absolute ${c.className} px-3 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-lg text-xs font-medium text-gray-600 dark:text-gray-300`}
              >
                {c.label}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Feature grid */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="text-center mb-12"
        >
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Everything you need, nothing you don't
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-3 text-gray-500 dark:text-gray-400">
            Built for people who are tired of stale job boards.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 transition-shadow hover:shadow-xl hover:shadow-indigo-500/5"
            >
              <div className="w-10 h-10 bg-indigo-50 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors duration-200">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {f.icon}
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{f.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="grid sm:grid-cols-3 gap-8"
        >
          {HOW_IT_WORKS.map((s) => (
            <motion.div key={s.step} variants={fadeUp} className="relative">
              <span className="text-5xl font-bold text-gray-100 dark:text-gray-800">{s.step}</span>
              <h3 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">{s.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{s.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA banner */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-fuchsia-600 px-8 py-14 text-center"
        >
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="blob absolute -top-10 -left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
            <div className="blob blob-delay-1 absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          </div>
          <h2 className="relative text-2xl sm:text-3xl font-bold text-white">
            Stop refreshing five different job boards.
          </h2>
          <p className="relative mt-3 text-indigo-100 max-w-lg mx-auto">
            Search every listing in one place, and let it come to you.
          </p>
          <div className="relative mt-8 flex items-center justify-center gap-3">
            <Link
              to="/jobs"
              className="px-6 py-3 rounded-xl bg-white text-indigo-700 font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
            >
              Browse jobs
            </Link>
            <Link
              to="/signup"
              className="px-6 py-3 rounded-xl border border-white/40 text-white font-medium hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200"
            >
              Create free account
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="text-center py-8 text-xs text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-800">
        JobAggregator scrapes jobs directly from company career pages. Data is refreshed every 6 hours.
      </footer>
    </div>
  );
}
