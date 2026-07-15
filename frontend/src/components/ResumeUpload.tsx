import { useState, useRef } from "react";
import { scoreResume, ResumeScore } from "../api/client";

interface Props {
  jobId: string;
}

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

export default function ResumeUpload({ jobId }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeScore | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await scoreResume(jobId, file);
      setResult(data);
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "Resume analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Resume Match Score
      </h4>

      {!result && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
            ${dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"}`}
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
              <p className="text-sm text-gray-500">Analyzing your resume with AI...</p>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600 font-medium">Drop your resume or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX, or TXT</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      {result && (
        <div className="space-y-4">
          <div className="flex items-start gap-6">
            <ScoreRing score={result.score} />
            <div className="flex-1 space-y-3">
              {result.matched_keywords.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 mb-1">Matched Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matched_keywords.map((kw) => (
                      <span key={kw} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-md border border-green-200">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.missing_keywords.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-1">Missing Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_keywords.map((kw) => (
                      <span key={kw} className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-md border border-red-200">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {result.suggestions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-800 mb-2">Improvement Suggestions</p>
              <ul className="space-y-1.5">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                    <span className="font-bold mt-0.5">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setResult(null)}
            className="text-xs text-indigo-600 hover:underline"
          >
            Upload a different resume
          </button>
        </div>
      )}
    </div>
  );
}
