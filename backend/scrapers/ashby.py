import httpx
import re
from datetime import datetime


def _short_desc(text: str) -> str:
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean[:300] + ("..." if len(clean) > 300 else "")


async def scrape(slug: str) -> list[dict]:
    url = f"https://jobs.ashbyhq.com/api/non-graphql/job_board/view?organizationHostedJobsPageName={slug}"
    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()

    jobs = []
    for item in data.get("jobPostings", []):
        job_id = item.get("id", "")
        description = item.get("descriptionHtml", "") or item.get("description", "")
        jobs.append({
            "id": f"{slug}_{job_id}",
            "company_name": data.get("organization", {}).get("name", slug.title()),
            "company_url": f"https://jobs.ashbyhq.com/{slug}",
            "company_logo": data.get("organization", {}).get("logoUrl"),
            "title": item.get("title", ""),
            "job_id": job_id,
            "location": item.get("locationName", ""),
            "department": item.get("departmentName"),
            "description": description,
            "short_description": _short_desc(description),
            "apply_url": f"https://jobs.ashbyhq.com/{slug}/{job_id}",
            "scraped_at": datetime.utcnow(),
            "is_active": True,
        })
    return jobs
