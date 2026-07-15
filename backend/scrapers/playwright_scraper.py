"""
Fallback scraper for custom career pages using Playwright.
Handles homepages (auto-navigates to careers section) and JS-heavy SPAs.
"""
import re
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse, urljoin


def _short_desc(text: str) -> str:
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean[:300] + ("..." if len(clean) > 300 else "")


def _slug_from_url(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc.replace("www.", "").split(".")[0]


def _is_careers_url(url: str) -> bool:
    keywords = ["career", "job", "work-with", "join", "talent", "hiring", "recruit", "vacancies", "openings"]
    url_lower = url.lower()
    return any(k in url_lower for k in keywords)


async def _find_careers_url(page, base_url: str) -> Optional[str]:
    """Find a careers/jobs link on the current page and return its href."""
    career_texts = [
        "careers", "jobs", "work with us", "join us", "we're hiring",
        "open positions", "job openings", "opportunities", "work here",
    ]
    links = await page.query_selector_all("a[href]")
    for link in links:
        try:
            text = (await link.inner_text()).strip().lower()
            href = await link.get_attribute("href") or ""
            combined = (text + " " + href).lower()
            if any(kw in combined for kw in ["career", "job", "hiring", "opening", "position"]):
                if href.startswith("http"):
                    return href
                elif href.startswith("/"):
                    parsed = urlparse(base_url)
                    return f"{parsed.scheme}://{parsed.netloc}{href}"
        except Exception:
            continue
    return None


async def _scroll_to_load(page) -> None:
    """Scroll down incrementally to trigger lazy-loaded job listings."""
    for _ in range(5):
        await page.evaluate("window.scrollBy(0, window.innerHeight)")
        await page.wait_for_timeout(600)


JOB_SELECTORS = [
    # Data attributes (most reliable)
    "[data-job-id]",
    "[data-automation-id*='job']",
    "[data-testid*='job']",
    "[data-cy*='job']",
    # Common class patterns
    ".job-listing",
    ".job-card",
    ".job-item",
    ".job-result",
    ".careers-job",
    ".career-item",
    ".opening-item",
    ".position-item",
    # Generic list structures with job-related classes
    "li[class*='job']",
    "li[class*='career']",
    "li[class*='position']",
    "div[class*='job-item']",
    "div[class*='job-card']",
    "div[class*='career-card']",
    "tr[class*='job']",
    # Accenture / Workday-style
    "[class*='JobList'] li",
    "[class*='job-list'] > *",
    "[class*='JobCard']",
    "[class*='wd-find-jobs'] li",
    # Broad fallback: articles with a link inside
    "article:has(a[href])",
]


async def scrape(url: str) -> list[dict]:
    from playwright.async_api import async_playwright

    slug = _slug_from_url(url)
    jobs = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 800},
        )
        page = await context.new_page()

        # Step 1 — navigate to the given URL
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(2000)
        except Exception:
            await browser.close()
            return []

        # Step 2 — if this is a homepage, find and follow the careers link
        if not _is_careers_url(url):
            careers_url = await _find_careers_url(page, url)
            if careers_url and careers_url != url:
                try:
                    await page.goto(careers_url, wait_until="domcontentloaded", timeout=30000)
                    await page.wait_for_timeout(2500)
                    url = careers_url  # update for href resolution
                except Exception:
                    pass  # stay on original page

        # Step 3 — scroll to trigger lazy-loaded listings
        await _scroll_to_load(page)

        # Step 4 — try known job selectors
        found_elements = []
        for selector in JOB_SELECTORS:
            try:
                elements = await page.query_selector_all(selector)
                if len(elements) >= 2:
                    found_elements = elements
                    break
            except Exception:
                continue

        # Step 5 — heuristic fallback: find all <a> tags whose text looks like a job title
        if not found_elements:
            found_elements = await _heuristic_job_links(page)

        # Step 6 — extract data from found elements
        for i, el in enumerate(found_elements[:100]):
            try:
                title = await _extract_title(el)
                if not title or len(title) < 3 or len(title) > 150:
                    continue

                location = await _extract_text(el, [
                    "[class*='location']", "[class*='loc']",
                    "[data-location]", "[class*='city']", "[class*='country']",
                ])

                href = await _extract_href(el, url)
                description = await _extract_text(el, [
                    "[class*='desc']", "[class*='summary']", "[class*='snippet']", "p",
                ])

                jobs.append({
                    "id": f"{slug}_pw_{i}",
                    "company_name": slug.replace("-", " ").title(),
                    "company_url": url,
                    "company_logo": None,
                    "title": title,
                    "job_id": None,
                    "location": location,
                    "department": None,
                    "description": description or title,
                    "short_description": _short_desc(description or title),
                    "apply_url": href or url,
                    "scraped_at": datetime.utcnow(),
                    "is_active": True,
                })
            except Exception:
                continue

        await browser.close()

    return jobs


async def _extract_title(el) -> str:
    for selector in ["h1", "h2", "h3", "h4", "[class*='title']", "[class*='name']", "a"]:
        try:
            el2 = await el.query_selector(selector)
            if el2:
                text = (await el2.inner_text()).strip()
                if text:
                    return text
        except Exception:
            continue
    try:
        return (await el.inner_text()).strip().split("\n")[0]
    except Exception:
        return ""


async def _extract_text(el, selectors: list[str]) -> str:
    for selector in selectors:
        try:
            el2 = await el.query_selector(selector)
            if el2:
                text = (await el2.inner_text()).strip()
                if text:
                    return text
        except Exception:
            continue
    return ""


async def _extract_href(el, base_url: str) -> str:
    try:
        link = await el.query_selector("a[href]")
        if not link:
            is_anchor = await el.evaluate("el => el.tagName.toLowerCase() === 'a'")
            if is_anchor:
                link = el
        if link:
            href = await link.get_attribute("href") or ""
            if href.startswith("http"):
                return href
            if href.startswith("/"):
                parsed = urlparse(base_url)
                return f"{parsed.scheme}://{parsed.netloc}{href}"
            if href and not href.startswith("#") and not href.startswith("javascript"):
                return urljoin(base_url, href)
    except Exception:
        pass
    return ""


async def _heuristic_job_links(page) -> list:
    """
    Last-resort: collect all <a> elements whose visible text looks like a job title
    (sentence case, 3–10 words, no nav-like keywords).
    """
    NAV_KEYWORDS = {"home", "about", "contact", "login", "sign", "menu", "search",
                    "privacy", "terms", "cookie", "blog", "news", "press", "faq"}
    links = await page.query_selector_all("a[href]")
    candidates = []
    for link in links:
        try:
            text = (await link.inner_text()).strip()
            words = text.split()
            if 2 <= len(words) <= 12 and text[0].isupper():
                lower_words = {w.lower() for w in words}
                if not lower_words & NAV_KEYWORDS:
                    candidates.append(link)
        except Exception:
            continue
    return candidates[:80]
