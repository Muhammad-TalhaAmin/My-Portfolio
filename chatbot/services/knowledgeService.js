import fs from "fs-extra";
import path from "path";

const knowledgeFolder = "./knowledge";

export async function loadKnowledge() {
  const files = await fs.readdir(knowledgeFolder);

  let knowledge = "";

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const content = await fs.readFile(
      path.join(knowledgeFolder, file),
      "utf8"
    );

    knowledge += `\n\n${content}`;
  }

  return knowledge;
}