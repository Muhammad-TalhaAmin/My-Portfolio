import fs from "fs-extra";
import path from "path";

const knowledgeFolder = "./knowledge";
const projectsFolder = path.join(knowledgeFolder, "projects");

// Caches so we only hit disk once per process lifetime.
let cachedKnowledge = null; // full concatenated knowledge base (back-compat)
let cachedCoreProfile = null; // about + education + skills, concatenated
let cachedProjectFiles = null; // { key: { title, content } }
let cachedProjectIndex = null; // { key: { title, summary } }

async function readMarkdownFiles(directory) {
  let knowledge = "";

  const entries = await fs.readdir(directory, { withFileTypes: true });

  // Sort for deterministic loading
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      knowledge += await readMarkdownFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const relativePath = path.relative(knowledgeFolder, fullPath);
      const content = await fs.readFile(fullPath, "utf8");

      knowledge += `
==================================================
FILE: ${relativePath}
==================================================

${content}

`;
    }
  }

  return knowledge;
}

/**
 * Full concatenated knowledge base. Kept for backward compatibility with any
 * existing callers; the chat route now prefers the more targeted helpers
 * below so it doesn't have to ship the entire knowledge base on every turn.
 */
export async function loadKnowledge() {
  if (cachedKnowledge) return cachedKnowledge;

  if (!(await fs.pathExists(knowledgeFolder))) {
    throw new Error(`Knowledge folder not found: ${knowledgeFolder}`);
  }

  cachedKnowledge = await readMarkdownFiles(knowledgeFolder);
  return cachedKnowledge;
}

async function readFileSafe(filePath) {
  if (!(await fs.pathExists(filePath))) return "";
  return fs.readFile(filePath, "utf8");
}

/**
 * The compact "always relevant" profile facts: about, education, skills.
 * Small enough to include on every request without wasting tokens.
 */
export async function loadCoreProfile() {
  if (cachedCoreProfile) return cachedCoreProfile;

  const [about, education, skills] = await Promise.all([
    readFileSafe(path.join(knowledgeFolder, "about.md")),
    readFileSafe(path.join(knowledgeFolder, "education.md")),
    readFileSafe(path.join(knowledgeFolder, "skills.md")),
  ]);

  cachedCoreProfile = [about, education, skills].filter(Boolean).join("\n\n---\n\n");
  return cachedCoreProfile;
}

/**
 * Full content of every project file, keyed by filename (without extension).
 */
export async function loadProjectFiles() {
  if (cachedProjectFiles) return cachedProjectFiles;

  cachedProjectFiles = {};

  if (!(await fs.pathExists(projectsFolder))) {
    return cachedProjectFiles;
  }

  const entries = await fs.readdir(projectsFolder, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

    const key = entry.name.replace(/\.md$/, "");
    const content = await fs.readFile(path.join(projectsFolder, entry.name), "utf8");
    const firstLine = content.split(/\r?\n/).find((line) => line.trim().length > 0) || key;
    const title = firstLine.replace(/^#+\s*/, "").trim();

    cachedProjectFiles[key] = { title, content };
  }

  return cachedProjectFiles;
}

/**
 * A compact index (title + short summary) of every project, used when the
 * user asks about "your projects" generically rather than naming one.
 */
export async function getProjectIndex() {
  if (cachedProjectIndex) return cachedProjectIndex;

  const files = await loadProjectFiles();
  cachedProjectIndex = {};

  for (const [key, { title, content }] of Object.entries(files)) {
    const plain = content
      .replace(/[#*_>`]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    cachedProjectIndex[key] = { title, summary: plain.slice(0, 220) };
  }

  return cachedProjectIndex;
}
