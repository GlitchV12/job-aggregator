"""
AI service using OpenAI GPT-4o-mini for ATS keyword extraction,
resume template generation, and resume-vs-JD match scoring.
"""
import json
import os
import re

from openai import AsyncOpenAI

_client = None

SYSTEM_PROMPT = (
    "You are an expert career coach and ATS (Applicant Tracking System) specialist. "
    "You help job seekers understand job descriptions, identify important keywords, and improve their resumes. "
    "Always respond with valid JSON when asked to return structured data."
)


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


def _clean_json(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\n?", "", text)
    text = re.sub(r"\n?```$", "", text)
    return text


async def analyze_jd(job_title: str, job_description: str) -> dict:
    """Extract ATS keywords and generate a tailored resume template for a JD."""
    prompt = f"""Analyze this job description and return a JSON object with exactly this structure:
{{
  "keywords": [
    {{"keyword": "Python", "weight": 0.95, "category": "technical_skill"}},
    ...
  ],
  "resume_template": "# Resume Template\\n\\n## Summary\\n[2-3 sentences...]\\n\\n## Skills\\n..."
}}

Return exactly 15-20 keywords. Categories: technical_skill, soft_skill, tool, certification, domain_knowledge.
Weight is 0.0-1.0 (how critical for ATS).

Job Title: {job_title}

Job Description:
{job_description[:8000]}

Respond ONLY with the JSON object, no other text."""

    resp = await get_client().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return json.loads(resp.choices[0].message.content)


async def score_resume(job_title: str, job_description: str, resume_text: str) -> dict:
    """Score a resume against a JD and return match analysis."""
    prompt = f"""Compare this resume against the job description and return a JSON object:
{{
  "score": 72,
  "matched_keywords": ["Python", "REST APIs"],
  "missing_keywords": ["Kubernetes", "AWS"],
  "suggestions": [
    "Add quantified achievements to your experience bullets",
    "Include your AWS certification in the skills section",
    "Highlight experience with distributed systems"
  ]
}}

Score is 0-100. Provide exactly 3 suggestions that are specific and actionable.

Job Title: {job_title}

Job Description:
{job_description[:4000]}

Resume:
{resume_text[:4000]}

Respond ONLY with the JSON object, no other text."""

    resp = await get_client().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return json.loads(resp.choices[0].message.content)
