"""Markdown knowledge-base loader for the AI portfolio assistant.

Python port of chatbot/services/knowledgeService.js. Reads the
portfolio's markdown knowledge files and caches the results so the
files are only read from disk once per process lifetime.
"""

import os
import re

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

KNOWLEDGE_DIR = os.environ.get(
    "CHATBOT_KNOWLEDGE_DIR",
    os.path.join(PROJECT_ROOT, "chatbot", "knowledge"),
)
PROJECTS_DIR = os.path.join(KNOWLEDGE_DIR, "projects")

# Caches so we only hit disk once per process lifetime.
_cached_knowledge = None  # full concatenated knowledge base (back-compat)
_cached_core_profile = None  # about + education + skills, concatenated
_cached_project_files = None  # { key: { title, content } }
_cached_project_index = None  # { key: { title, summary } }


def _read_markdown_files(directory):
    """Recursively concatenate every .md file under ``directory``.

    Deterministic order (sorted entry names) so prompt content is stable.
    """
    sections = []

    if not os.path.isdir(directory):
        return ""

    for name in sorted(os.listdir(directory)):
        full_path = os.path.join(directory, name)

        if os.path.isdir(full_path):
            sections.append(_read_markdown_files(full_path))
        elif name.endswith(".md"):
            with open(full_path, "r", encoding="utf-8") as handle:
                content = handle.read()

            relative_path = os.path.relpath(full_path, KNOWLEDGE_DIR).replace(
                "\\", "/"
            )

            sections.append(
                "\n==================================================\n"
                f"FILE: {relative_path}\n"
                "==================================================\n"
                f"\n{content}\n"
            )

    return "\n".join(sections)


def load_knowledge():
    """Full concatenated knowledge base.

    Kept for backward compatibility; the chat route prefers the targeted
    helpers below so it does not ship the entire knowledge base on every turn.
    """
    global _cached_knowledge

    if _cached_knowledge is not None:
        return _cached_knowledge

    if not os.path.isdir(KNOWLEDGE_DIR):
        raise FileNotFoundError(f"Knowledge folder not found: {KNOWLEDGE_DIR}")

    _cached_knowledge = _read_markdown_files(KNOWLEDGE_DIR)
    return _cached_knowledge


def _read_file_safe(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as handle:
            return handle.read()
    except OSError:
        return ""


def load_core_profile():
    """The compact 'always relevant' profile facts: about, education, skills.

    Small enough to include on every request without wasting tokens.
    """
    global _cached_core_profile

    if _cached_core_profile is not None:
        return _cached_core_profile

    parts = []
    for filename in ("about.md", "education.md", "skills.md"):
        content = _read_file_safe(os.path.join(KNOWLEDGE_DIR, filename))
        if content:
            parts.append(content)

    _cached_core_profile = "\n\n---\n\n".join(parts)
    return _cached_core_profile


def load_project_files():
    """Full content of every project file, keyed by filename (no extension)."""
    global _cached_project_files

    if _cached_project_files is not None:
        return _cached_project_files

    _cached_project_files = {}

    if not os.path.isdir(PROJECTS_DIR):
        return _cached_project_files

    for name in sorted(os.listdir(PROJECTS_DIR)):
        full_path = os.path.join(PROJECTS_DIR, name)
        if not name.endswith(".md") or not os.path.isfile(full_path):
            continue

        key = name[:-3]
        with open(full_path, "r", encoding="utf-8") as handle:
            content = handle.read()

        first_line = next(
            (line.strip() for line in content.splitlines() if line.strip()), key
        )
        title = re.sub(r"^#+\s*", "", first_line).strip()

        _cached_project_files[key] = {"title": title, "content": content}

    return _cached_project_files


def get_project_index():
    """A compact index (title + short summary) of every project.

    Used when the user asks about "your projects" generically rather than
    naming one.
    """
    global _cached_project_index

    if _cached_project_index is not None:
        return _cached_project_index

    files = load_project_files()
    _cached_project_index = {}

    for key, project in files.items():
        plain = re.sub(r"[#*_>`]", " ", project["content"])
        plain = re.sub(r"\s+", " ", plain).strip()

        _cached_project_index[key] = {
            "title": project["title"],
            "summary": plain[:220],
        }

    return _cached_project_index
