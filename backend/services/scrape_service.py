"""
Orchestrates which scraper to use based on URL pattern or known ATS platform.
"""
import re
from typing import Optional
from urllib.parse import urlparse

from scrapers import greenhouse, lever, ashby, playwright_scraper


PLATFORM_PATTERNS = {
    "greenhouse": [
        r"greenhouse\.io",
        r"boards\.greenhouse\.io",
    ],
    "lever": [
        r"jobs\.lever\.co",
        r"lever\.co/",
    ],
    "ashby": [
        r"jobs\.ashbyhq\.com",
        r"ashbyhq\.com",
    ],
}


def detect_platform(url: str) -> tuple[str, Optional[str]]:
    """Returns (platform, slug) — slug is None for playwright fallback."""
    for platform, patterns in PLATFORM_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, url, re.IGNORECASE):
                slug = _extract_slug(url, platform)
                return platform, slug
    return "playwright", None


def _extract_slug(url: str, platform: str) -> str:
    path = urlparse(url).path.strip("/")
    parts = path.split("/")
    if platform == "greenhouse":
        # boards.greenhouse.io/{slug} or greenhouse.io/boards/{slug}
        return parts[0] if parts else ""
    elif platform == "lever":
        # jobs.lever.co/{slug}
        return parts[0] if parts else ""
    elif platform == "ashby":
        # jobs.ashbyhq.com/{slug}
        return parts[0] if parts else ""
    return parts[0] if parts else ""


async def scrape_url(url: str) -> list[dict]:
    platform, slug = detect_platform(url)

    if platform == "greenhouse" and slug:
        return await greenhouse.scrape(slug)
    elif platform == "lever" and slug:
        return await lever.scrape(slug)
    elif platform == "ashby" and slug:
        return await ashby.scrape(slug)
    else:
        return await playwright_scraper.scrape(url)


async def scrape_company(company: dict) -> list[dict]:
    """Scrape a company from the curated list using its known platform."""
    platform = company.get("ats_platform", "playwright")
    slug = company.get("ats_slug")
    url = company.get("careers_url", "")

    if platform == "greenhouse" and slug:
        return await greenhouse.scrape(slug)
    elif platform == "lever" and slug:
        return await lever.scrape(slug)
    elif platform == "ashby" and slug:
        return await ashby.scrape(slug)
    else:
        return await playwright_scraper.scrape(url)
