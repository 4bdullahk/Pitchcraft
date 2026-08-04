// functions/index.js
//
// Optional: deploy the /api/generate endpoint as a Firebase Cloud Function
// instead of running server/server.js on your own host. Most people should
// just use server/server.js (simpler, deploy to Render/Railway/Fly.io) —
// this file is here in case you specifically want everything on Firebase.
//
// Setup:
//   firebase functions:config:set gemini.key="YOUR_KEY"   (functions v1 config)
//   or, for functions v2, set GEMINI_API_KEY as a secret/env var.
//   firebase deploy --only functions

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import express from "express";
import cors from "cors";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const SYSTEM_PROMPT = `You are PitchCraft, an AI startup assistant. Given a single word,
idea, or prompt from the user, generate a compelling startup concept with:
- Startup Name
- Tagline
- Elevator Pitch
- Problem/Solution Summary
- Target Audience
- Landing Page Copy`;

app.post("/api/generate", upload.single("file"), async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const userMessage = (req.body.message || "").toString().trim().slice(0, 4000);
    if (!userMessage) {
      return res.status(400).json({ error: "Please include a message to generate a pitch from." });
    }

    const parts = [{ text: `${SYSTEM_PROMPT}\n\nUser said: "${userMessage}"` }];

    if (req.file && req.file.mimetype !== "application/pdf") {
      parts.push({
        inlineData: { mimeType: req.file.mimetype, data: req.file.buffer.toString("base64") },
      });
    }

    const result = await model.generateContent(parts);
    const reply = result.response.text();

    return res.json({ reply });
  } catch (err) {
    console.error("Gemini API error:", err);
    return res.status(500).json({ error: "AI generation failed. Please try again." });
  }
});

export const api = onRequest({ secrets: [GEMINI_API_KEY] }, app);
