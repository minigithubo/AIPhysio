import "dotenv/config";
import express from "express";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { v4 as uuid } from "uuid";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express();
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

app.post("/api/chat", async (req, res) => {
  // accept txt/pdf OR plain JSON in body
  // check if file is pdf
  console.log("File is a message");
  const prompt = req.file
    ? await readFile(req.file.path, "utf8")
    : JSON.stringify(req.body, null, 2);

  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const reply = chat.choices[0].message.content;
  console.log("response", reply);
  res.json({ reply });
});

/* ---------- 1. body-condition upload ---------- */
app.post("/condition", upload.single("file"), async (req, res) => {
  // accept txt/pdf OR plain JSON in body
  // check if file is pdf
  if (req.file && req.file.mimetype !== "application/pdf") {
    // return error response asking for pdf file
    // log error
    console.log("File is not a PDF");
    return res.status(400).json({ error: "Please upload a PDF file." });
  }
  console.log("File is a PDF");
  const text = req.file
    ? await readFile(req.file.path, "utf8")
    : JSON.stringify(req.body, null, 2);

  // store session state in memory (demo only!)
  req.session = { condition: text };
  res.json({ ok: true });
});

/* ---------- 2. generate exercise plan ---------- */
app.post("/plan", async (req, res) => {
  const { condition } = req.session ?? {};

  const prompt =
    `Act as a licensed physical therapist. Given the client condition:\n\n` +
    condition +
    `\n\nGenerate a short, safe exercise instruction. First of the routine.`;

  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  console.log(chat);

  const plan = chat.choices[0].message.content;
  console.log("plan", plan);
  res.json({ plan });
});

/* ---------- 3. video critique ---------- */
app.post("/critique", upload.single("video"), async (req, res) => {
  const tmpDir = "frames-" + uuid();
  const pattern = join(tmpDir, "frame-%03d.jpg");

  // extract 1 frame / sec (–r 1) for ≤15-s clip
  await new Promise((ok, err) =>
    ffmpeg(req.file.path)
      .outputOptions("-r 1")
      .save(pattern)
      .on("end", ok)
      .on("error", err)
  );

  // gather first 5 frames
  const frames = Array.from({ length: 5 }, (_, i) =>
    join(tmpDir, `frame-${String(i + 1).padStart(3, "0")}.jpg`)
  );

  const visionMsgs = [
    {
      role: "system",
      content:
        "You are a certified physical therapist. Provide concise, actionable feedback only.",
    },
    {
      role: "user",
      content: [
        { type: "text", text: "Critique my form for the prescribed exercise." },
        ...frames.map(async (f) => ({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${Buffer.from(
              await readFile(f)
            ).toString("base64")}`,
          },
        })),
      ],
    },
  ];

  const vision = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: visionMsgs,
  });

  res.json({ critique: vision.choices[0].message.content });

  // cleanup
  await rm(tmpDir, { recursive: true, force: true });
  await rm(req.file.path, { force: true });
});

/* ---------- server ---------- */
app.listen(3000, () => console.log("http://localhost:3000"));
