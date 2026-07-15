import express from "express";
import { askAI } from "../services/aiService.js";
import { loadKnowledge } from "../services/knowledgeService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    const knowledge = await loadKnowledge();

    const systemPrompt = `
You are Muhammad Talha's professional AI portfolio assistant.

Answer ONLY using the information below.

If the answer is not available, say:

"I don't have that information yet."

Knowledge:

${knowledge}
`;

    const reply = await askAI(systemPrompt, message);

    res.json({
      reply,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

export default router;