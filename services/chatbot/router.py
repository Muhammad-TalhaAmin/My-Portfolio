"""Context router that selects knowledge relevant to the current message.

Python port of chatbot/services/knowledgeRouter.js. Avoids shipping the
entire knowledge base into every request; only loads what is relevant
plus a small, always-included core profile.
"""

import re

from services.chatbot import knowledge

# Generic words that signal the user is asking about projects without
# necessarily naming one.
PROJECT_HINT_WORDS = [
    "project",
    "projects",
    "built",
    "build",
    "repo",
    "repository",
    "github",
    "portfolio piece",
]

# Phrases that signal a follow-up question referring back to whatever
# project was already being discussed ("explain this project").
FOLLOWUP_HINT_WORDS = [
    "this project",
    "that project",
    "this one",
    "the project",
    " it ",
    " its ",
]


def _normalize(text):
    return f" {text.lower()} "


def _build_alias_map(project_files):
    """Map searchable aliases to project keys.

    Aliases are derived from the filename and significant words in the
    project title so "gym booker", "gym-booker", or "gym" all resolve to
    the same project without hand-maintaining a keyword list.
    """
    alias_map = {}

    for key, project in project_files.items():
        candidates = {key.replace("-", " ")}

        for word in re.sub(r"[^a-z0-9\s]", " ", project["title"].lower()).split():
            if len(word) > 3:
                candidates.add(word)

        for alias in candidates:
            if alias and len(alias) >= 4:
                alias_map[alias] = key

    return alias_map


def detect_project_keys(message, project_files):
    if not message:
        return []

    text = _normalize(message)
    alias_map = _build_alias_map(project_files)
    matched = set()

    for alias, key in alias_map.items():
        if alias in text:
            matched.add(key)

    return list(matched)


def _mentions_projects_generically(message):
    text = _normalize(message)
    return any(word in text for word in PROJECT_HINT_WORDS)


def _is_followup_reference(message):
    text = _normalize(message)
    return any(phrase in text for phrase in FOLLOWUP_HINT_WORDS)


def build_context(message, history=None):
    """Select only the knowledge relevant to the current message.

    Always includes a compact core profile; adds a named project's full
    file, resolves follow-up references through history, and includes a
    compact project index for generic project questions.
    """
    if history is None:
        history = []

    core = knowledge.load_core_profile()
    project_files = knowledge.load_project_files()
    project_index = knowledge.get_project_index()

    matched_keys = detect_project_keys(message, project_files)

    # "Explain this project" style follow-ups: look back through recent
    # history for the most recently named project.
    if not matched_keys and _is_followup_reference(message) and history:
        for prior in reversed(history):
            if prior and isinstance(prior.get("content"), str):
                prior_matches = detect_project_keys(prior["content"], project_files)
                if prior_matches:
                    matched_keys = prior_matches
                    break

    sections = [f"## Core Profile (education, skills, background)\n\n{core}"]

    if matched_keys:
        for key in matched_keys:
            project = project_files.get(key)
            if project:
                sections.append(f"## Project: {project['title']}\n\n{project['content']}")
    elif _mentions_projects_generically(message):
        index_text = "\n".join(
            f"- {project['title']}: {project['summary']}"
            for project in project_index.values()
        )
        sections.append(
            f"## Project Index (name one of these to get full details)\n\n{index_text}"
        )

    return "\n\n---\n\n".join(sections)