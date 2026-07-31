import { useState } from "react";

interface Props {
  onSearch: (query: string) => void;
  onScrapeUrl: (url: string) => void;
  isScrapingUrl: boolean;
}

export default function SearchBar({ onSearch, onScrapeUrl, isScrapingUrl }: Props) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"search" | "url">("search");

  const isUrl = (val: string) =>
    val.startsWith("http://") || val.startsWith("https://");

  const handleInput = (val: string) => {
    setInput(val);
    if (isUrl(val)) setMode("url");
    else setMode("search");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (mode === "url") onScrapeUrl(input.trim());
    else onSearch(input.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <span className="absolute left-4 text-gray-400 dark:text-gray-500">
          {mode === "url" ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Search jobs or paste a careers page URL..."
          className="w-full pl-12 pr-32 py-4 text-base bg-white/90 dark:bg-gray-900/90 backdrop-blur text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm
                     hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-500/20 focus:border-indigo-300 dark:focus:border-indigo-600
                     placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
        />
        <button
          type="submit"
          disabled={isScrapingUrl}
          className="absolute right-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
                     text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
        >
          {isScrapingUrl ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scraping...
            </>
          ) : mode === "url" ? (
            "Scrape Jobs"
          ) : (
            "Search"
          )}
        </button>
      </div>
      {mode === "url" && (
        <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 text-center">
          Detected a URL — will scrape jobs directly from this careers page
        </p>
      )}
    </form>
  );
}
