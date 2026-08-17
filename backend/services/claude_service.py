"""
AI service using Google Gemini (free tier) for ATS keyword extraction,
resume template generation, and resume-vs-JD match scoring.
"""
import asyncio
import json
import os
import re

from google import genai
from google.genai import types

_client = None

MODEL_NAME = "gemini-flash-latest"

SYSTEM_PROMPT = (
    "You are an expert career coach and ATS (Applicant Tracking System) specialist. "
    "You help job seekers understand job descriptions, identify important keywords, and improve their resumes. "
    "Always respond with valid JSON when asked to return structured data."
)

# Retry config — max 3 retries, exponential backoff
_MAX_RETRIES = 3
_RETRY_DELAYS = [2, 4, 8]  # seconds


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
    return _client


def _clean_json(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\n?", "", text)
    text = re.sub(r"\n?```$", "", text)
    return text


def _is_retryable(exc: Exception) -> bool:
    """True if the error is a transient 503/429 that warrants a retry."""
    msg = str(exc).upper()
    return "503" in msg or "UNAVAILABLE" in msg or "429" in msg or "RESOURCE_EXHAUSTED" in msg


async def _call_with_retry(coro_fn):
    """
    Execute an async zero-arg coroutine function with exponential backoff.
    Total attempts = _MAX_RETRIES + 1.  Only retries on 503/429 errors.
    """
    last_exc: Exception = RuntimeError("No attempts made")
    for attempt in range(_MAX_RETRIES + 1):
        try:
            return await coro_fn()
        except Exception as exc:
            if _is_retryable(exc) and attempt < _MAX_RETRIES:
                delay = _RETRY_DELAYS[attempt]
                print(
                    f"[AI] Attempt {attempt + 1}/{_MAX_RETRIES + 1} failed "
                    f"({type(exc).__name__}). Retrying in {delay}s..."
                )
                last_exc = exc
                await asyncio.sleep(delay)
            else:
                raise exc
    raise last_exc


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

    async def _do():
        resp = await get_client().aio.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.3,
                response_mime_type="application/json",
            ),
        )
        return json.loads(_clean_json(resp.text))

    return await _call_with_retry(_do)


async def translate_to_english(text: str) -> str:
    """Translate job posting text to English, preserving any HTML tags."""
    prompt = f"""Translate the following job posting content to English. If it contains HTML tags,
preserve the tags and structure exactly and translate only the visible text inside them.
Respond with only the translated content, no commentary, no markdown code fences.

Content:
{text[:12000]}"""

    async def _do():
        resp = await get_client().aio.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.2),
        )
        return _clean_json(resp.text)

    return await _call_with_retry(_do)


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

    async def _do():
        resp = await get_client().aio.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.3,
                response_mime_type="application/json",
            ),
        )
        return json.loads(_clean_json(resp.text))

    return await _call_with_retry(_do)
