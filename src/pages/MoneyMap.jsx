import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowRight, CheckCircle2, Coins, Gamepad2, HeartHandshake, MessageCircle, RotateCcw, Sparkles, Star, TriangleAlert } from "lucide-react";
import { useStore } from "../store.jsx";
import { finalReport, fmtR, initialState, pickEvent, runSales, SCENARIO, STEPS } from "../data/simulation.js";
import { SpeakButton } from "../speech.jsx";
import Tabs from "../components/Tabs.jsx";
import Coach from "../components/Coach.jsx";

export default function MoneyMap() {
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || (location.state?.ask ? "coach" : "sim"));
  const [coachPrompt, setCoachPrompt] = useState(location.state?.ask || null);

  const askCoach = (msg) => { setCoachPrompt(msg); setTab("coach"); };

  return (
    <div className="page">
      <p className="eyebrow">Learn</p>
      <h1 className="page-title">MoneyMap</h1>
      <p className="lead-muted">Learn by doing. Run a business with real-world choices, see what happens, and ask your coach why.</p>
      <Tabs
        tabs={[{ id: "sim", label: "Business simulation", icon: Gamepad2 }, { id: "coach", label: "AI business coach", icon: MessageCircle }]}
        value={tab}
        onChange={setTab}
        label="MoneyMap sections"
      />
      {tab === "sim" ? <Simulation onAskCoach={askCoach} /> : <Coach initialMessage={coachPrompt} onInitialSent={() => setCoachPrompt(null)} />}
    </div>
  );
}

const VERDICT = {
  good: { label: "Smart move", icon: CheckCircle2, cls: "good" },
  ok: { label: "Works, with trade-offs", icon: Sparkles, cls: "ok" },
  risky: { label: "Risky", icon: TriangleAlert, cls: "risky" },
};

function Simulation({ onAskCoach }) {
  const { actions } = useStore();
  const [phase, setPhase] = useState("intro");
  const [s, setS] = useState(() => ({ ...initialState(), event: pickEvent() }));
  const [feedback, setFeedback] = useState(null);
  const [report, setReport] = useState(null);

  const step = STEPS[s.stepIndex];

  const start = () => {
    setS({ ...initialState(), event: pickEvent() });
    setFeedback(null);
    setReport(null);
    setPhase("play");
  };

  const choose = (opt) => {
    const next = opt.apply(s);
    const lesson = opt.lesson(next);
    next.decisions = [...s.decisions, { step: step.id, title: step.title, choice: opt.id, label: opt.label, verdict: opt.verdict, lesson }];
    setS(next);
    setFeedback({ verdict: opt.verdict, lesson, label: opt.label });
  };

  const advance = () => {
    setFeedback(null);
    let next = { ...s, stepIndex: s.stepIndex + 1 };
    if (next.stepIndex >= STEPS.length) {
      const r = finalReport(next);
      setReport(r);
      actions.recordSimulation({ ...r, decisions: next.decisions, at: new Date().toISOString() });
      setPhase("done");
      return;
    }
    if (STEPS[next.stepIndex].auto) next = runSales(next);
    setS(next);
  };

  if (phase === "intro") {
    return (
      <section className="card sim-intro card-lilac" aria-labelledby="sim-title">
        <div className="card-head">
          <p className="eyebrow primary">Scenario</p>
          <SpeakButton text={`${SCENARIO.title}. ${SCENARIO.intro}`} label="Read scenario" />
        </div>
        <h2 id="sim-title" className="display">{SCENARIO.title}</h2>
        <p className="lead">{SCENARIO.intro}</p>
        <ul className="pill-list">
          <li>Buy ingredients</li><li>Calculate costs</li><li>Set prices</li><li>Handle discounts</li><li>Deal with surprises</li><li>Save, reinvest or borrow</li>
        </ul>
        <button className="btn btn-primary" onClick={start}>Start the simulation <ArrowRight size={18} aria-hidden="true" /></button>
      </section>
    );
  }

  if (phase === "done" && report) {
    return <SimReport report={report} decisions={s.decisions} onRestart={start} onAskCoach={onAskCoach} />;
  }

  const prompt =
    step.id === "event" ? s.event.prompt
      : step.id === "profit" ? `After ingredients, packaging, sales and surprises you have ${fmtR(s.cash)} cash${s.debt ? ` and owe ${fmtR(s.debt)}` : ""}. Your profit this month is ${fmtR(s.cash - SCENARIO.startCash - s.debt)}.`
      : step.prompt;
  const title = step.id === "event" ? s.event.title : step.title;
  const options = step.options ? step.options(s) : [];

  return (
    <div className="sim-grid">
      <section className="card sim-step" aria-labelledby="step-title" aria-live="polite">
        <div className="card-head">
          <p className="eyebrow">Step {s.stepIndex + 1} of {STEPS.length}</p>
          <SpeakButton getText={() => [title, prompt, step.info?.(s), ...options.map((o, i) => `Option ${i + 1}: ${o.label}. ${o.detail}.`)].filter(Boolean).join(" ")} label="Read this step" />
        </div>
        <div className="steps-dots" aria-hidden="true">
          {STEPS.map((x, i) => <span key={x.id} className={i < s.stepIndex ? "done" : i === s.stepIndex ? "now" : ""} />)}
        </div>
        <h2 id="step-title" className="display sm">{title}</h2>
        <p className="lead">{prompt}</p>
        {step.info && <p className="calc">{step.info(s)}</p>}

        {step.auto ? (
          <div className="sales-result">
            <p><strong>{s.baseUnits}</strong> jars sold at {fmtR(s.price)}{s.extraSold ? <> plus <strong>{s.extraSold}</strong> to the stokvel at {fmtR(s.price * s.extraPriceFactor)}</> : null}.</p>
            <p className="big-ish">Sales: {fmtR(s.revenue)}</p>
            <p className="muted">{SCENARIO.batch - s.unitsSold > 0 ? `${SCENARIO.batch - s.unitsSold} jars left over to sell next month.` : "You sold out!"}</p>
            <button className="btn btn-primary" onClick={advance}>Continue <ArrowRight size={18} aria-hidden="true" /></button>
          </div>
        ) : feedback ? (
          <Feedback feedback={feedback} onNext={advance} last={s.stepIndex === STEPS.length - 1} />
        ) : (
          <div className="options" role="group" aria-label="Your choices">
            {options.map((o) => (
              <button key={o.id} type="button" className="option" onClick={() => choose(o)} disabled={o.disabled}>
                <strong>{o.label}</strong>
                <span className="muted">{o.detail}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <aside className="card sim-dash" aria-label="Your business right now">
        <h2 className="card-title">Your business</h2>
        <dl className="dash">
          <div><dt><Coins size={16} aria-hidden="true" /> Cash</dt><dd className={s.cash < 0 ? "negative" : ""}>{fmtR(s.cash)}</dd></div>
          <div><dt><Star size={16} aria-hidden="true" /> Product quality</dt><dd aria-label={`${s.quality} out of 4`}>{"★".repeat(Math.max(0, s.quality))}{"☆".repeat(Math.max(0, 4 - s.quality))}</dd></div>
          <div><dt><HeartHandshake size={16} aria-hidden="true" /> Reputation</dt><dd>{s.reputation > 0 ? `+${s.reputation}` : s.reputation}</dd></div>
          {s.unitCost > 0 && <div><dt>Cost per jar</dt><dd>{fmtR(s.unitCost)}</dd></div>}
          {s.price > 0 && <div><dt>Your price</dt><dd>{fmtR(s.price)}</dd></div>}
          {s.debt > 0 && <div><dt>Owed</dt><dd className="negative">{fmtR(s.debt)}</dd></div>}
        </dl>
      </aside>
    </div>
  );
}

function Feedback({ feedback, onNext, last }) {
  const v = VERDICT[feedback.verdict];
  return (
    <div className={`feedback ${v.cls}`} role="status">
      <p className="feedback-head"><v.icon size={20} aria-hidden="true" /> {v.label}</p>
      <p>{feedback.lesson}</p>
      <div className="row">
        <button className="btn btn-primary" onClick={onNext} autoFocus>{last ? "See my results" : "Next"} <ArrowRight size={18} aria-hidden="true" /></button>
        <SpeakButton text={`${v.label}. ${feedback.lesson}`} label="Read feedback" />
      </div>
    </div>
  );
}

function SimReport({ report, decisions, onRestart, onAskCoach }) {
  const grade = report.score >= 75 ? "Business-ready thinking!" : report.score >= 50 ? "Solid start — a few things to tighten." : "Tough month — and that's how we learn.";
  const coachMsg = `I just finished the MoneyMap skincare simulation. I scored ${report.score}/100 with a profit of ${fmtR(report.profit)}${report.debt ? ` and ${fmtR(report.debt)} still owed` : ""}. My riskiest choices were: ${decisions.filter((d) => d.verdict === "risky").map((d) => d.label).join("; ") || "none"}. What should I do differently in real life?`;

  return (
    <section className="card sim-report" aria-labelledby="report-title">
      <div className="report-top">
        <div className="score-ring" style={{ "--pct": report.score }} role="img" aria-label={`Score ${report.score} out of 100`}>
          <span>{report.score}</span>
        </div>
        <div>
          <p className="eyebrow">Your results</p>
          <h2 id="report-title" className="display sm">{grade}</h2>
          <SpeakButton text={`Score ${report.score} out of 100. ${grade} Profit ${fmtR(report.profit)}. ${decisions.map((d) => d.lesson).join(" ")}`} label="Read results" />
        </div>
      </div>

      <div className="stat-row">
        <div className="stat"><span className="muted">Sales</span><strong>{fmtR(report.revenue)}</strong></div>
        <div className="stat"><span className="muted">Stock costs</span><strong>{fmtR(report.costs)}</strong></div>
        <div className="stat"><span className="muted">Profit</span><strong className={report.profit < 0 ? "negative" : ""}>{fmtR(report.profit)}</strong></div>
        <div className="stat"><span className="muted">Jars sold</span><strong>{report.unitsSold}/{SCENARIO.batch}</strong></div>
        {report.debt > 0 && <div className="stat"><span className="muted">Still owed</span><strong className="negative">{fmtR(report.debt)}</strong></div>}
        {report.saved > 0 && <div className="stat"><span className="muted">Saved</span><strong>{fmtR(report.saved)}</strong></div>}
      </div>

      <h3 className="card-title">What you learned</h3>
      <ol className="lessons">
        {decisions.map((d) => {
          const v = VERDICT[d.verdict];
          return (
            <li key={d.step} className={v.cls}>
              <span className="lesson-head"><v.icon size={16} aria-hidden="true" /> <strong>{d.title}:</strong> {d.label}</span>
              <span>{d.lesson}</span>
            </li>
          );
        })}
      </ol>

      <div className="row">
        <button className="btn btn-primary" onClick={() => onAskCoach(coachMsg)}><MessageCircle size={18} aria-hidden="true" /> Ask the coach about my results</button>
        <button className="btn btn-soft" onClick={onRestart}><RotateCcw size={18} aria-hidden="true" /> Play again</button>
      </div>
    </section>
  );
}
