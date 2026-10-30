import { useEffect, useRef, useState } from "react";
import { Mic, Send, Sparkles, Trash2 } from "lucide-react";
import { monthSummary, proofStats, rand, useStore } from "../store.jsx";
import { listenOnce, SpeakButton, voiceInputSupported } from "../speech.jsx";

const SUGGESTIONS = [
  "How do I price my products properly?",
  "A customer wants a big discount. What do I say?",
  "Should I borrow money to buy more stock?",
  "How much of my profit should I save?",
  "What do I need before applying for funding?",
];

const OFFLINE_TIPS = [
  { match: /price|pricing|charge|cost/i, text: "A simple rule: add up what one item costs you (ingredients + packaging + transport share), then charge 2–3× that. The extra covers breakages, discounts and your own time. Check what similar products sell for nearby so you're not far above or below." },
  { match: /discount|cheaper|bargain/i, text: "Before giving a discount, work out your cost per item. 40% off can mean selling at a loss. Offer something smaller instead, like 10% off for 6 or more, or a free sample with a big order." },
  { match: /borrow|loan|mashonisa|debt|credit/i, text: "Only borrow for something that will make you more money, and make sure next month's sales can cover the repayment. Avoid informal lenders charging 30–50% a month. Stokvel advances or development finance (like sefa) are usually much cheaper." },
  { match: /sav(e|ing)|profit|emergency/i, text: "Try splitting profit: around 30% into savings and 70% back into the business. Keep business and personal money in separate places, and pay yourself a fixed amount each month." },
  { match: /fund|grant|apply|investor/i, text: "Funders usually want: your ID, proof the business is trading (your HerWallet records and ProofPocket jobs help), a simple cash-flow plan and sometimes CIPC registration. Have a look at the Funding Finder in Next Move." },
];

export function buildContext(data) {
  const m = monthSummary(data.transactions);
  const stats = proofStats(data.jobs);
  const top = Object.entries(m.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, v]) => `${c} ${rand(v)}`).join(", ");
  const lines = [
    `Name: ${data.profile.name}. Business: ${data.profile.business} in ${data.profile.location}.`,
    `This month: money in ${rand(m.moneyIn)}, money out ${rand(m.moneyOut)}, left ${rand(m.left)}. Biggest costs: ${top || "none yet"}.`,
    `Goals: ${data.goals.map((g) => `${g.name} (${rand(g.saved)} of ${rand(g.target)})`).join("; ") || "none"}.`,
    `ProofPocket: ${stats.jobs} jobs, ${stats.verifiedJobs} verified, ${rand(stats.earnings)} recorded earnings. Skills: ${data.profile.skills.join(", ")}.`,
  ];
  const last = data.simulation.completed.at(-1);
  if (last) {
    lines.push(`Latest MoneyMap simulation (skincare business): score ${last.score}/100, profit ${rand(last.profit)}, debt ${rand(last.debt)}. Decisions: ${last.decisions.map((d) => `${d.step}: ${d.label} (${d.verdict})`).join("; ")}.`);
  }
  return lines.join("\n");
}

export default function Coach({ initialMessage, onInitialSent }) {
  const { data, actions } = useStore();
  const [messages, setMessages] = useState(data.coachHistory);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const logRef = useRef(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initialMessage && !sentInitial.current) {
      sentInitial.current = true;
      send(initialMessage);
      onInitialSent?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  async function send(text) {
    const content = text.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user", content }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    let reply = "";
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context: buildContext(data) }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: reply }]);
      }
      if (!reply.trim()) throw new Error("empty");
    } catch {
      const tip = OFFLINE_TIPS.find((t) => t.match.test(content));
      reply =
        (tip ? tip.text : "Tell me a bit about what you're selling, what it costs you and what you charge, and I'll help you work through it.") +
        "\n\n(I'm in offline mode right now, so this is a quick built-in tip. Ask whoever runs your HerPath server to add an ANTHROPIC_API_KEY to switch on the full AI coach.)";
      setMessages([...next, { role: "assistant", content: reply }]);
    } finally {
      setBusy(false);
      actions.setCoachHistory([...next, { role: "assistant", content: reply }]);
    }
  }

  const dictate = () => {
    setListening(true);
    listenOnce((t) => setInput((v) => (v ? `${v} ${t}` : t)), () => setListening(false));
  };

  return (
    <section className="card coach" aria-labelledby="coach-title">
      <div className="card-head">
        <h2 id="coach-title" className="card-title"><Sparkles size={18} aria-hidden="true" /> Thandi, your business coach</h2>
        {messages.length > 0 && (
          <button className="link-btn" onClick={() => { setMessages([]); actions.setCoachHistory([]); }}>
            <Trash2 size={14} aria-hidden="true" /> New chat
          </button>
        )}
      </div>

      <div className="coach-log" ref={logRef} role="log" aria-live="polite" aria-busy={busy}>
        {messages.length === 0 && (
          <div className="coach-empty">
            <p>Hi {data.profile.name}! I'm Thandi. Ask me anything about pricing, saving, borrowing, or growing {data.profile.business}. I can see your HerWallet numbers, so my advice fits your situation.</p>
            <div className="chip-row">
              {SUGGESTIONS.map((s) => <button key={s} type="button" className="chip-btn" onClick={() => send(s)}>{s}</button>)}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <span className="sr-only">{m.role === "user" ? "You said:" : "Thandi said:"}</span>
            <div className="bubble-text">{m.content || <span className="typing" aria-label="Thandi is typing"><i /><i /><i /></span>}</div>
            {m.role === "assistant" && m.content && !busy && <SpeakButton text={m.content} label="Read this reply aloud" className="bubble-speak" />}
          </div>
        ))}
      </div>

      <form className="coach-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <label htmlFor="coach-q" className="sr-only">Ask Thandi a question</label>
        <textarea
          id="coach-q"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Ask about pricing, saving, borrowing…"
        />
        {voiceInputSupported && (
          <button type="button" className={`icon-btn ${listening ? "recording" : ""}`} onClick={dictate} aria-label={listening ? "Listening…" : "Speak your question"} disabled={listening}>
            <Mic size={18} />
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()} aria-label="Send"><Send size={18} aria-hidden="true" /></button>
      </form>
    </section>
  );
}
