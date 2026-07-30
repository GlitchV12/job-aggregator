"""Curated synonym/alias map for common role clusters.

Broadens search recall for role names that are phrased differently across
companies (e.g. "SOC analyst" vs "Security Operations Center Analyst")
without needing a search engine or embeddings. Keys and values are matched
as lowercase substrings against the user's query.
"""

SYNONYMS: dict[str, list[str]] = {
    "soc analyst": [
        "security operations center analyst",
        "security operations analyst",
        "cybersecurity analyst",
        "security analyst",
        "siem analyst",
        "information security analyst",
    ],
    "soc": [
        "security operations center",
        "security operations",
        "siem",
    ],
    "cybersecurity": [
        "cyber security",
        "infosec",
        "information security",
        "security engineer",
    ],
    "security engineer": [
        "application security engineer",
        "appsec engineer",
        "infrastructure security engineer",
        "security software engineer",
    ],
    "cloud": [
        "cloud engineer",
        "cloud infrastructure",
        "cloud platform",
        "aws",
        "azure",
        "gcp",
        "devops",
    ],
    "devops": [
        "site reliability engineer",
        "sre",
        "platform engineer",
        "infrastructure engineer",
        "cloud engineer",
    ],
    "sre": [
        "site reliability engineer",
        "devops engineer",
        "production engineer",
    ],
    "data analyst": [
        "business intelligence analyst",
        "bi analyst",
        "reporting analyst",
        "analytics analyst",
    ],
    "data scientist": [
        "machine learning scientist",
        "applied scientist",
        "research scientist",
    ],
    "data engineer": [
        "analytics engineer",
        "big data engineer",
        "etl engineer",
    ],
    "machine learning engineer": [
        "ml engineer",
        "ai engineer",
        "applied scientist",
        "deep learning engineer",
    ],
    "frontend": [
        "front end",
        "front-end",
        "ui engineer",
        "react engineer",
    ],
    "backend": [
        "back end",
        "back-end",
        "server engineer",
        "api engineer",
    ],
    "fullstack": [
        "full stack",
        "full-stack",
    ],
    "product manager": [
        "pm",
        "product owner",
        "technical product manager",
    ],
    "product designer": [
        "ux designer",
        "ui designer",
        "ui/ux designer",
        "interaction designer",
    ],
    "qa engineer": [
        "quality assurance engineer",
        "test engineer",
        "sdet",
        "software test engineer",
    ],
    "solutions engineer": [
        "sales engineer",
        "technical account manager",
        "pre-sales engineer",
    ],
    "customer success": [
        "customer success manager",
        "account manager",
        "client success",
    ],
    "recruiter": [
        "talent acquisition",
        "technical recruiter",
        "sourcer",
    ],
}


def expand_terms(search: str) -> list[str]:
    """Return the original query plus any matching synonym expansions.

    Matching is substring-based on the lowercased query against both the
    dict keys and their values, so "soc analyst intern" still triggers the
    "soc analyst" cluster.
    """
    if not search:
        return []

    normalized = search.strip().lower()
    terms = {normalized}

    for key, expansions in SYNONYMS.items():
        if key in normalized:
            terms.update(expansions)
            continue
        for expansion in expansions:
            if expansion in normalized:
                terms.add(key)
                terms.update(expansions)
                break

    return sorted(terms)
