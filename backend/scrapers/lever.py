import html as html_lib
import httpx
import re
from datetime import datetime
from models import detect_work_mode


def _short_desc(text: str) -> str:
    clean = re.sub(r"<[^>]+>", " ", html_lib.unescape(text))
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean[:300] + ("..." if len(clean) > 300 else "")


async def scrape(slug: str) -> list[dict]:
    url = f"https://api.lever.co/v0/postings/{slug}?mode=json"
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()

    jobs = []
    for item in data:
        job_id = item.get("id", "")
        description_parts = []
        for block in item.get("descriptionBody", {}).get("descriptionBody", []):
            description_parts.append(block.get("text", ""))
        full_desc = " ".join(description_parts) or item.get("description", "")

        jobs.append({
            "id": f"{slug}_{job_id}",
            "company_name": slug.replace("-", " ").title(),
            "company_url": f"https://jobs.lever.co/{slug}",
            "company_logo": None,
            "title": item.get("text", ""),
            "job_id": job_id,
            "location": item.get("categories", {}).get("location", ""),
            "department": item.get("categories", {}).get("department"),
            "description": item.get("descriptionPlain", full_desc),
            "short_description": _short_desc(item.get("descriptionPlain", full_desc)),
            "apply_url": item.get("applyUrl", item.get("hostedUrl", "")),
            "work_mode": detect_work_mode(item.get("text", ""), item.get("descriptionPlain", full_desc)),
            "scraped_at": datetime.utcnow(),
            "is_active": True,
        })
    return jobs
