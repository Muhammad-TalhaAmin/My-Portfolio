import { loadCoreProfile, loadProjectFiles, getProjectIndex } from "./knowledgeService.js";

// Generic words that signal the user is asking about projects without
// necessarily naming one.
const PROJECT_HINT_WORDS = [
  "project",
  "projects",
  "built",
  "build",
  "repo",
  "repository",
  "github",
  "portfolio piece",
];

// Phrases that signal a follow-up question referring back to whatever
// project was already being discussed ("explain this project", "how does it work").
const FOLLOWUP_HINT_WORDS = ["this project", "that project", "this one", "the project", " it ", " its "];

function normalize(str) {
  return ` ${str.toLowerCase()} `;
}

/**
 * Builds a map of searchable aliases -> project key, derived from the
 * filename and the significant words in the project's title. This lets
 * "gym booker", "gym-booker", or "gym" all resolve to the same project
 * without hand-maintaining a keyword list per project.
 */
function buildAliasMap(projectFiles) {
  const aliasMap = {};

  for (const [key, { title }] of Object.entries(projectFiles)) {
    const candidates = new Set([key.replace(/-/g, " ")]);

    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .forEach((word) => candidates.add(word));

    for (const alias of candidates) {
      if (alias && alias.length >= 4) {
        aliasMap[alias] = key;
      }
    }
  }

  return aliasMap;
}

export function detectProjectKeys(message, projectFiles) {
  if (!message) return [];

  const text = normalize(message);
  const aliasMap = buildAliasMap(projectFiles);
  const matched = new Set();

  for (const [alias, key] of Object.entries(aliasMap)) {
    if (text.includes(alias)) {
      matched.add(key);
    }
  }

  return [...matched];
}

function mentionsProjectsGenerically(message) {
  const text = normalize(message);
  return PROJECT_HINT_WORDS.some((word) => text.includes(word));
}

function isFollowupReference(message) {
  const text = normalize(message);
  return FOLLOWUP_HINT_WORDS.some((phrase) => text.includes(phrase));
}

/**
 * Selects only the knowledge that's actually relevant to the current
 * message (plus a small, always-included core profile) instead of dumping
 * the entire knowledge base into every request. This keeps prompts small,
 * responses fast, and avoids repeating irrelevant project details.
 */
export async function buildContext(message, history = []) {
  const [core, projectFiles, projectIndex] = await Promise.all([
    loadCoreProfile(),
    loadProjectFiles(),
    getProjectIndex(),
  ]);

  let matchedKeys = detectProjectKeys(message, projectFiles);

  // "Explain this project" style follow-ups: look back through recent
  // history for the most recently named project.
  if (matchedKeys.length === 0 && isFollowupReference(message) && history.length) {
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const priorMessage = history[i];
      if (priorMessage && typeof priorMessage.content === "string") {
        const priorMatches = detectProjectKeys(priorMessage.content, projectFiles);
        if (priorMatches.length) {
          matchedKeys = priorMatches;
          break;
        }
      }
    }
  }

  const sections = [`## Core Profile (education, skills, background)\n\n${core}`];

  if (matchedKeys.length) {
    for (const key of matchedKeys) {
      const project = projectFiles[key];
      if (project) {
        sections.push(`## Project: ${project.title}\n\n${project.content}`);
      }
    }
  } else if (mentionsProjectsGenerically(message)) {
    const indexText = Object.values(projectIndex)
      .map((project) => `- ${project.title}: ${project.summary}`)
      .join("\n");

    sections.push(
      `## Project Index (name one of these to get full details)\n\n${indexText}`
    );
  }

  return sections.join("\n\n---\n\n");
}
