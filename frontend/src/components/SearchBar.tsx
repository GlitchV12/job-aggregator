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
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      {/* Hidden SVG filter: distorts whatever sits behind the glass, like real refraction through glass */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="liquid-glass-distortion" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.015" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="3" result="blurredNoise" />
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="22" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* Solid moving shapes behind the glass bar — proves the backdrop-blur is really refracting content, not just faking translucency.
          Kept within a small vertical band centered on the bar so they never drift into surrounding page text. */}
      <div className="pointer-events-none absolute -inset-x-8 inset-y-0 overflow-visible">
        <div className="glass-orbit-1 absolute top-[30%] left-[8%] w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-rose-500" />
        <div className="glass-orbit-2 absolute top-[55%] left-[38%] w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-orange-400" />
        <div className="glass-orbit-3 absolute top-[35%] left-[62%] w-16 h-16 rounded-full bg-gradient-to-br from-teal-300 to-emerald-400" />
        <div className="glass-orbit-1 absolute top-[50%] left-[88%] w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500" style={{ animationDelay: "-3s" }} />
        {/* Edge-spill glows: sit right at the glass border so light appears to leak out from underneath */}
        <div className="edge-spill absolute bottom-2 left-16 w-12 h-6 bg-pink-400/80 dark:bg-pink-400/60 rounded-full blur-lg" />
        <div className="edge-spill absolute top-2 right-24 w-12 h-6 bg-violet-400/80 dark:bg-violet-400/60 rounded-full blur-lg" style={{ animationDelay: "-1.5s" }} />
      </div>

      <div
        className="liquid-glass-refract relative z-10 flex items-center overflow-hidden rounded-2xl
                   bg-white/25 dark:bg-white/[0.04]
                   border border-white/60 dark:border-white/10
                   shadow-[0_8px_32px_-8px_rgba(79,70,229,0.3)]
                   hover:shadow-[0_8px_40px_-6px_rgba(79,70,229,0.4)]
                   focus-within:ring-4 focus-within:ring-indigo-200/60 dark:focus-within:ring-indigo-500/20
                   focus-within:border-indigo-300/70 dark:focus-within:border-indigo-500/40
                   transition-all duration-300"
      >
        {/* Specular highlight — glass catching light, like a curved reflection */}
        <div className="pointer-events-none absolute -top-6 left-8 w-36 h-16 bg-white/60 dark:bg-white/20 rounded-full blur-2xl -rotate-6" />

        {/* Liquid-glass sheen sweep */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4">
          <div className="glass-shine h-full w-full bg-gradient-to-r from-transparent via-white/50 dark:via-white/15 to-transparent" />
        </div>
        {/* Top glass highlight */}
        <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/30 to-transparent" />

        <span className="absolute left-4 z-10 text-gray-500 dark:text-gray-400">
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
          className="relative z-10 w-full pl-12 pr-32 py-4 text-base bg-transparent text-gray-900 dark:text-gray-100
                     focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={isScrapingUrl}
          className="absolute right-2 z-10 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
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
