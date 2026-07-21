import fs from "fs-extra";
import path from "path";

const knowledgeFolder = "./knowledge";

let cachedKnowledge = null;

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

export async function loadKnowledge() {
  if (cachedKnowledge) return cachedKnowledge;

  if (!(await fs.pathExists(knowledgeFolder))) {
    throw new Error(`Knowledge folder not found: ${knowledgeFolder}`);
  }

  cachedKnowledge = await readMarkdownFiles(knowledgeFolder);
  return cachedKnowledge;
}