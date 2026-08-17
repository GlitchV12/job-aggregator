import { useState, useRef } from "react";
import { scoreResume, scoreResumeFromProfile, ResumeScore } from "../api/client";

interface Props {
  jobId: string;
  hasSavedResume?: boolean;
  savedResumeFilename?: string;
  aiLimitReached?: boolean;
}

type Mode = "choose" | "upload" | "saved";

function ScoreRing({ score }: { score: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
        <text x="60" y="60" textAnchor="middle" dominantBaseline="middle"
          className="text-2xl font-bold" fill={color} fontSize="24" fontWeight="700">
          {score}
        </text>
        <text x="60" y="78" textAnchor="middle" fill="#9ca3af" fontSize="10">
          / 100
        </text>
      </svg>
      <p className="text-sm font-semibold mt-1" style={{ color }}>
        {score >= 70 ? "Strong Match" : score >= 45 ? "Decent Match" : "Needs Work"}
      </p>
    </div>
  );
}

export default function ResumeUpload({ jobId, hasSavedResume, savedResumeFilename, aiLimitReached }: Props) {
  const [mode, setMode] = useState<Mode>(hasSavedResume ? "choose" : "upload");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeScore | null>(null);
  const [error, setError] = useState("");
  const [usedSaved, setUsedSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const runScore = async (fn: () => Promise<ResumeScore>, saved: boolean) => {
    setLoading(true);
    setError("");
    setResult(null);
    setUsedSaved(saved);
    try {
      const data = await fn();
      setResult(data);
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "Resume analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (file: File) =>
    runScore(() => scoreResume(jobId, file), false);

  const handleSavedResume = () =>
    runScore(() => scoreResumeFromProfile(jobId), true);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setResult(null);
    setError("");
    setMode(hasSavedResume ? "choose" : "upload");
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Resume Match Score
      </h4>

      {aiLimitReached ? (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-5 text-center">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h4 className="font-semibold text-amber-900 dark:text-amber-300 text-sm mb-1">Daily Limit Reached</h4>
          <p className="text-xs text-amber-700 dark:text-amber-400 mb-4 max-w-[250px] mx-auto">
            You've used all 5 of your free AI matches for today. Upgrade to Pro for unlimited resume scoring.
          </p>
          <a href="/pricing" className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-all no-underline">
            Upgrade to Pro
          </a>
        </div>
      ) : !result && (
        <>
          {/* Mode chooser — shown when user has a saved resume and hasn't picked yet */}
          {mode === "choose" && (
            <div className="grid grid-cols-2 gap-3">
              {/* Use saved resume */}
              <button
                onClick={handleSavedResume}
                disabled={loading}
                className="flex flex-col items-center gap-2 p-4 border-2 border-indigo-200 dark:border-indigo-800
                           bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-950
                           rounded-xl cursor-pointer transition-all group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white
                                group-hover:scale-110 transition-transform">
                  {loading && usedSaved ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Use saved resume</p>
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 truncate max-w-[100px] mt-0.5">
                    {savedResumeFilename ?? "From profile"}
                  </p>
                </div>
              </button>

              {/* Upload from device */}
              <button
                onClick={() => setMode("upload")}
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 dark:border-gray-700
                           hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-800
                           rounded-xl cursor-pointer transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center
                                text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Upload from device</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">PDF, DOCX, TXT</p>
                </div>
              </button>
            </div>
          )}

          {/* File upload dropzone */}
          {mode === "upload" && (
            <>
              {hasSavedResume && (
                <button
                  onClick={() => setMode("choose")}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mb-2 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to options
                </button>
              )}
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                  ${dragging ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950" : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {loading ? (
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing your resume with AI...</p>
                  </div>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Drop your resume or click to upload</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF, DOCX, or TXT</p>
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Loading state when using saved resume from choose mode */}
      {!result && loading && usedSaved && mode === "choose" && (
        <div className="flex flex-col items-center gap-2 py-4">
          <svg className="w-8 h-8 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing your saved resume with AI...</p>
        </div>
      )}

      {error && <p className="text-xs text-red-500 dark:text-red-400 mt-2">{error}</p>}

      {result && (
        <div className="space-y-4">
          {usedSaved && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Scored using your saved resume
            </p>
          )}
          <div className="flex items-start gap-6">
            <ScoreRing score={result.score} />
            <div className="flex-1 space-y-3">
              {result.matched_keywords.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Matched Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matched_keywords.map((kw) => (
                      <span key={kw} className="px-2 py-0.5 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs rounded-md border border-green-200 dark:border-green-900">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.missing_keywords.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Missing Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_keywords.map((kw) => (
                      <span key={kw} className="px-2 py-0.5 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-xs rounded-md border border-red-200 dark:border-red-900">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {result.suggestions.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">Improvement Suggestions</p>
              <ul className="space-y-1.5">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <span className="font-bold mt-0.5">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={reset}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Try with a different resume
          </button>
        </div>
      )}
    </div>
  );
}
