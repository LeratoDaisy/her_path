import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(here, "data");
const VERIFICATIONS_FILE = path.join(DATA_DIR, "verifications.json");

const app = express();
app.use(express.json({ limit: "200kb" }));

// ---------- AI business coach ----------

const client = new Anthropic();

const COACH_SYSTEM = `You are Thandi, the HerPath business coach. HerPath helps women in South Africa — many running informal or small businesses — manage money, learn by doing, prove their work and find their next opportunity.

How you coach:
- Warm, direct and practical. Speak like a trusted mentor, not a textbook. Plain English; short paragraphs or a few bullets.
- Use South African context: Rand (R), stokvels, spaza shops, taxis, load-shedding, SASSA, mashonisas (informal lenders), SARS, CIPC.
- Ground advice in the user's own numbers when they are provided. Show the simple maths (cost per unit, margin, break-even) when it helps.
- Explain the *why* behind a good decision so she can make the next one herself.
- Be honest about risks, especially high-interest informal loans, but never shame.
- When she asks about funding, jobs or programmes, point her to HerPath's Next Move and Funding Finder sections, and remind her to confirm details with the provider.
- You are not a registered financial advisor; for tax, legal or large borrowing decisions, suggest she speak to a qualified professional or a free service such as a SEDA/SEFA branch.
- Keep replies under about 180 words unless she asks for more detail.`;

app.post("/api/coach", async (req, res) => {
  const { messages, context } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages required" });
  }

  const history = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  // The user's live numbers go in the latest user turn so the system prompt stays cacheable.
  if (context && history.length && history.at(-1).role === "user") {
    const last = history.at(-1);
    last.content = `<my_situation>\n${String(context).slice(0, 4000)}\n</my_situation>\n\n${last.content}`;
  }

  let started = false;
  try {
    const stream = client.beta.messages.stream({
      model: "claude-opus-5-5",
      max_tokens: 8000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: COACH_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: history,
    });

    stream.on("text", (delta) => {
      if (!started) {
        started = true;
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" });
      }
      res.write(delta);
    });

    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") {
      const note = "I can't help with that one, but I'm happy to talk through your business, budget or next steps.";
      if (!started) return res.status(200).type("text/plain").send(note);
      res.write(`\n\n${note}`);
    }
    if (!started) return res.status(200).type("text/plain").send("");
    res.end();
  } catch (err) {
    console.error("[coach]", err?.status ?? "", err?.message ?? err);
    if (started) return res.end("\n\n(The coach was interrupted. Please try again.)");
    const offline = err instanceof Anthropic.AuthenticationError || /credential|api key|apiKey/i.test(String(err?.message));
    res.status(503).json({ error: offline ? "offline" : "unavailable" });
  }
});

// ---------- Customer verifications for ProofPocket ----------

function readVerifications() {
  try {
    return JSON.parse(fs.readFileSync(VERIFICATIONS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeVerifications(list) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(VERIFICATIONS_FILE, JSON.stringify(list, null, 2));
}

app.get("/api/verifications", (req, res) => {
  const ids = String(req.query.jobs ?? "").split(",").filter(Boolean);
  const all = readVerifications();
  res.json(ids.length ? all.filter((v) => ids.includes(v.jobId)) : []);
});

app.post("/api/verifications", (req, res) => {
  const { jobId, name, rating, comment } = req.body ?? {};
  const stars = Number(rating);
  if (typeof jobId !== "string" || !jobId || typeof name !== "string" || !name.trim() || !(stars >= 1 && stars <= 5)) {
    return res.status(400).json({ error: "jobId, name and a 1–5 rating are required" });
  }
  const entry = {
    id: crypto.randomUUID(),
    jobId: jobId.slice(0, 64),
    name: name.trim().slice(0, 80),
    rating: Math.round(stars),
    comment: String(comment ?? "").trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  const all = readVerifications();
  all.push(entry);
  writeVerifications(all);
  res.status(201).json(entry);
});

// ---------- Static app (production build) ----------

const dist = path.join(here, "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => console.log(`HerPath API listening on http://localhost:${PORT}`));
