import html as html_lib
import httpx
import re
from datetime import datetime
from models import detect_work_mode


def _short_desc(html_text: str) -> str:
    clean = re.sub(r"<[^>]+>", " ", html_lib.unescape(html_text))
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean[:300] + ("..." if len(clean) > 300 else "")


async def scrape(slug: str) -> list[dict]:
    url = f"https://boards.greenhouse.io/v1/boards/{slug}/jobs?content=true"
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()

    jobs = []
    for item in data.get("jobs", []):
        job_id = str(item.get("id", ""))
        location = item.get("location", {}).get("name", "")
        description = html_lib.unescape(item.get("content", "") or "")
        jobs.append({
            "id": f"{slug}_{job_id}",
            "company_name": data.get("meta", {}).get("name", slug.title()),
            "company_url": f"https://boards.greenhouse.io/{slug}",
            "company_logo": None,
            "title": item.get("title", ""),
            "job_id": job_id,
            "location": location,
            "department": (item.get("departments") or [{}])[0].get("name"),
            "description": description,
            "short_description": _short_desc(description),
            "apply_url": item.get("absolute_url", ""),
            "work_mode": detect_work_mode(item.get("title", ""), description),
            "scraped_at": datetime.utcnow(),
            "is_active": True,
        })
    return jobs
