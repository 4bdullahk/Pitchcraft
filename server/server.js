import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ALLOWED_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

if (!GEMINI_API_KEY) {
  console.error(
    "\n❌ Missing GEMINI_API_KEY. Create server/.env from server/.env.example and set your key.\n" +
      "   Get a key at https://aistudio.google.com/apikey\n"
  );
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const app = express();
app.disable("x-powered-by");

app.use(
  cors({
    origin: ALLOWED_ORIGIN,
  })
);
app.use(express.json({ limit: "1mb" }));

// --- very small in-memory rate limiter (per IP) ---------------------------
// Good enough to stop naive abuse of your Gemini quota / bill in production.
// For real scale, swap this for a proper store (Redis) behind a load balancer.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 15;
const requestLog = new Map();

function rateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const timestamps = (requestLog.get(key) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ error: "Too many requests. Please slow down." });
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);
  next();
}

// --- file upload handling --------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB, matches the client-side check
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type. Please attach a PNG, JPEG, WEBP, or PDF."));
    }
    cb(null, true);
  },
});

const SYSTEM_PROMPT = `You are PitchCraft, an AI startup assistant. If someone is casually chatting
you have to respond them casuallly but if you identify yourself given a single word,
idea, or prompt from the user, generate a compelling startup concept. When appropriate,
structure your response with:
- Startup Name
- Tagline
- Elevator Pitch
- Problem / Solution Summary
- Target Audience
- Landing Page Copy

Keep it punchy, investor-ready, and in Markdown.`;

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/api/generate", rateLimit, upload.single("file"), async (req, res) => {
  try {
    const userMessage = (req.body.message || "").toString().trim().slice(0, 4000);

    if (!userMessage) {
      return res.status(400).json({ error: "Please include a message to generate a pitch from." });
    }

    // "gemini-flash-latest" always points at Google's current stable Flash
    // model, so this keeps working automatically as Google deprecates old
    // versions (which is exactly what broke this before — new API keys lose
    // access to older pinned models like gemini-2.5-flash with little notice).
    // If you'd rather pin an exact version for predictability, swap this for
    // a specific stable id like "gemini-3.5-flash".
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const parts = [{ text: `${SYSTEM_PROMPT}\n\nUser said: "${userMessage}"` }];

    if (req.file) {
      if (req.file.mimetype === "application/pdf") {
        // Extract text from the PDF and feed it in as additional context
        // rather than sending raw PDF bytes (which the model can't read).
        const { default: pdfParse } = await import("pdf-parse");
        try {
          const parsed = await pdfParse(req.file.buffer);
          const text = (parsed.text || "").slice(0, 8000);
          parts.push({ text: `\n\nAttached PDF content:\n${text}` });
        } catch (pdfErr) {
          console.error("PDF parse error:", pdfErr);
          parts.push({ text: "\n\n(The attached PDF could not be read.)" });
        }
      } else {
        // Images can be sent inline to Gemini directly.
        parts.push({
          inlineData: {
            mimeType: req.file.mimetype,
            data: req.file.buffer.toString("base64"),
          },
        });
      }
    }

    const result = await model.generateContent(parts);
    const reply = result.response.text();

    return res.json({ reply });
  } catch (err) {
    console.error("Gemini API error:", err);
    return res.status(500).json({ error: "AI generation failed. Please try again." });
  }
});

// Multer errors (bad file type, too large) land here instead of crashing the process.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ error: err.message || "Upload failed." });
  }
  next();
});

app.listen(PORT, () => console.log(`✅ PitchCraft server running on http://localhost:${PORT}`));