import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Job, fetchJob, analyzeJD, createApplication } from "../api/client";
import ATSKeywords from "./ATSKeywords";
import ResumeUpload from "./ResumeUpload";
import { useAuth } from "../context/AuthContext";

const PLATFORM_COLORS: Record<string, string> = {
  greenhouse: "bg-green-50 text-green-700",
  lever: "bg-blue-50 text-blue-700",
  ashby: "bg-purple-50 text-purple-700",
  playwright: "bg-gray-50 text-gray-600",
};

function CompanyLogo({ name, logo }: { name: string; logo?: string }) {
  const [err, setErr] = useState(false);
  if (logo && !err) {
    return (
      <img src={logo} alt={name} onError={() => setErr(true)}
        className="w-12 h-12 rounded-xl object-contain bg-white border border-gray-100 p-1 shrink-0" />
    );
  }
  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                    flex items-center justify-center text-white font-bold text-base shrink-0">
      {name.charAt(0)}
    </div>
  );
}

function decodeEntities(text: string): string {
  const ta = document.createElement("textarea");
  ta.innerHTML = text;
  return ta.value;
}

function DescriptionBlock({ text }: { text: string }) {
  const decoded = decodeEntities(text);
  const isHtml = /<[a-z][\s\S]*>/i.test(decoded);

  if (isHtml) {
    return (
      <div
        className="prose prose-sm dark:prose-invert prose-indigo max-w-none
                   prose-headings:text-gray-800 dark:prose-headings:text-gray-200 prose-headings:font-semibold
                   prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-p:leading-relaxed
                   prose-li:text-gray-600 dark:prose-li:text-gray-400 prose-strong:text-gray-800 dark:prose-strong:text-gray-200
                   prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: decoded }}
      />
    );
  }
  const paragraphs = decoded.split(/\n{2,}/).filter(Boolean);
  if (paragraphs.length > 1) {
    return (
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {p.replace(/\n/g, " ")}
          </p>
        ))}
      </div>
    );
  }
  return (
    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{decoded}</p>
  );
}

interface Props {
  job: Job;
  onClose: () => void;
}

export default function JobModal({ job, onClose }: Props) {
  const { user } = useAuth();
  const [showTemplate, setShowTemplate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [markedApplied, setMarkedApplied] = useState(false);
  const [markingApplied, setMarkingApplied] = useState(false);
  const [translate, setTranslate] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const { data: detail } = useQuery({
    queryKey: ["job", job.id],
    queryFn: () => fetchJob(job.id),
  });

  const { data: analysis, isPending: loadingAnalysis, mutate: runAnalysis } = useMutation({
    mutationFn: () => analyzeJD(job.id),
  });

  const platform = job.company_url.includes("greenhouse") ? "greenhouse"
    : job.company_url.includes("lever") ? "lever"
    : job.company_url.includes("ashby") ? "ashby"
    : "playwright";

  const applyUrl = job.apply_url || job.company_url;
  const translatedApplyUrl = `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(applyUrl)}`;

  const copyTemplate = () => {
    if (analysis?.resume_template) {
      navigator.clipboard.writeText(analysis.resume_template);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const markAsApplied = async () => {
    setMarkingApplied(true);
    try {
      await createApplication({
        job_id: job.id,
        job_title: job.title,
        company_name: job.company_name,
        apply_url: applyUrl,
        status: "applied",
      });
      setMarkedApplied(true);
    } finally {
      setMarkingApplied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Sticky header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-start gap-3 shrink-0">
          <CompanyLogo name={job.company_name} logo={job.company_logo ?? undefined} />
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight">{job.title}</h2>
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
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${PLATFORM_COLORS[platform]}`}>
                {platform}
              </span>
              {job.job_id && (
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded font-mono">
                  #{job.job_id.slice(0, 8)}
                </span>
              )}
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                Added {new Date(job.scraped_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Description */}
          {(detail?.description || job.short_description) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Job Description</h4>
              <DescriptionBlock text={detail?.description || job.short_description} />
            </div>
          )}

          {/* AI Analysis */}
          <div className="bg-indigo-50 dark:bg-gray-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.745A4 4 0 0112 20.5a4 4 0 01-3.79-2.745l-.347-.745z" />
                </svg>
                AI-Powered Insights
              </h4>
              {!analysis && (
                <button
                  onClick={() => { if (!analysis) runAnalysis(); }}
                  disabled={loadingAnalysis}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
                             text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all"
                >
                  {loadingAnalysis ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Analyze with AI
                    </>
                  )}
                </button>
              )}
            </div>

            {analysis && (
              <div className="space-y-4">
                <ATSKeywords keywords={analysis.keywords} />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setShowTemplate(!showTemplate)}
                      className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      <svg className={`w-4 h-4 transition-transform ${showTemplate ? "rotate-90" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Tailored Resume Template
                    </button>
                    {showTemplate && (
                      <button onClick={copyTemplate}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    )}
                  </div>
                  {showTemplate && (
                    <pre className="bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-700 rounded-xl p-4 text-xs text-gray-700 dark:text-gray-300
                                    whitespace-pre-wrap font-mono overflow-x-auto max-h-64 overflow-y-auto">
                      {analysis.resume_template}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Resume Upload */}
          <ResumeUpload jobId={job.id} />
        </div>

        {/* Sticky footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 shrink-0 space-y-2 bg-white dark:bg-gray-900">
          <div className="flex gap-2">
            <button
              onClick={() => window.open(applyUrl, "_blank", "noopener,noreferrer")}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3
                         bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl
                         transition-all shadow-sm text-sm cursor-pointer"
            >
              Apply on Company Site
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
            <button
              onClick={() => {
                window.open(translatedApplyUrl, "_blank", "noopener,noreferrer");
                setTranslate(true);
              }}
              title="Open the posting translated to English in a new tab"
              className={`shrink-0 flex items-center justify-center gap-1.5 px-3 py-3
                         border font-semibold rounded-xl transition-all text-sm cursor-pointer
                         ${translate
                           ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                           : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400"}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9l4.5-4.5m0 0l4.5 4.5m-4.5-4.5V21" />
              </svg>
              EN
            </button>
            {user && (
              <button
                onClick={markAsApplied}
                disabled={markingApplied || markedApplied}
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-3
                           border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl
                           hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400
                           disabled:opacity-60 disabled:cursor-default transition-all text-sm cursor-pointer"
              >
                {markedApplied ? "Added to tracker" : markingApplied ? "Adding..." : "Mark as applied"}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center truncate px-2">
            {applyUrl}
            {translate && <span className="ml-1 text-indigo-500 dark:text-indigo-400">(opened translated to English in a new tab)</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
