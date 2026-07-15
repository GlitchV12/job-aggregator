import { KeywordItem } from "../api/client";

interface Props {
  keywords: KeywordItem[];
}

const CATEGORY_STYLES: Record<string, string> = {
  technical_skill: "bg-blue-100 text-blue-800 border border-blue-200",
  tool: "bg-purple-100 text-purple-800 border border-purple-200",
  soft_skill: "bg-green-100 text-green-800 border border-green-200",
  certification: "bg-orange-100 text-orange-800 border border-orange-200",
  domain_knowledge: "bg-pink-100 text-pink-800 border border-pink-200",
};

const CATEGORY_LABELS: Record<string, string> = {
  technical_skill: "Technical",
  tool: "Tool",
  soft_skill: "Soft Skill",
  certification: "Cert",
  domain_knowledge: "Domain",
};

export default function ATSKeywords({ keywords }: Props) {
  const sorted = [...keywords].sort((a, b) => b.weight - a.weight);

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        ATS Keywords
        <span className="ml-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium">
          {keywords.length}
        </span>
      </h4>
      <div className="flex flex-wrap gap-2">
        {sorted.map((kw) => (
          <span
            key={kw.keyword}
            title={`${CATEGORY_LABELS[kw.category] ?? kw.category} · Weight: ${Math.round(kw.weight * 100)}%`}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium cursor-default
                        transition-transform hover:scale-105 ${CATEGORY_STYLES[kw.category] ?? "bg-gray-100 text-gray-700 border border-gray-200"}`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block opacity-60"
              style={{ backgroundColor: "currentColor" }}
            />
            {kw.keyword}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-sm ${CATEGORY_STYLES[key]?.split(" ")[0]}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
