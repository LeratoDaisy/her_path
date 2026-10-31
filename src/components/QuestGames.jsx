import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Users, X } from "lucide-react";
import { SpeakButton } from "../speech.jsx";

const R = (n) => "R" + (Math.round(n * 100) / 100).toLocaleString("en-ZA", { maximumFractionDigits: 2 }).replace(/,/g, " ");

// Each game renders ONE round and calls onResult({ correct, why }) once.

// ---------- Choice ----------

export function ChoiceGame({ round, answered, onResult }) {
  const [picked, setPicked] = useState(null);
  const pick = (i) => {
    if (answered) return;
    setPicked(i);
    const o = round.options[i];
    const right = round.options.find((x) => x.correct);
    onResult({ correct: !!o.correct, why: o.correct ? o.why : `${o.why} ${right ? `The best answer: ${right.text}.` : ""}` });
  };
  return (
    <div className="game">
      <div className="game-prompt">
        <p className="lead">{round.prompt}</p>
        <SpeakButton text={`${round.prompt} ${round.options.map((o, i) => `Option ${i + 1}: ${o.text}.`).join(" ")}`} label="Read the question" />
      </div>
      <div className="choice-list" role="group" aria-label="Answers">
        {round.options.map((o, i) => {
          const state = !answered ? "" : o.correct ? "is-right" : picked === i ? "is-wrong" : "dim";
          return (
            <button key={i} type="button" className={`choice ${state}`} onClick={() => pick(i)} disabled={answered && picked !== i && !o.correct} aria-pressed={picked === i}>
              <span className="choice-key" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
              <span>{o.text}</span>
              {answered && o.correct && <Check size={18} className="choice-mark" aria-label="correct" />}
              {answered && picked === i && !o.correct && <X size={18} className="choice-mark" aria-label="your answer" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Sort (swipe a card left or right) ----------

export function SortGame({ item, buckets, answered, remaining, onResult }) {
  const [dx, setDx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const start = useRef(null);

  const choose = (b) => {
    if (answered || chosen !== null) return;
    setChosen(b);
    setDx(0);
    onResult({ correct: b === item.bucket, why: `${b === item.bucket ? "" : `It's ${buckets[item.bucket]}. `}${item.why}` });
  };

  const onDown = (e) => { if (answered) return; start.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); };
  const onMove = (e) => { if (start.current !== null) setDx(e.clientX - start.current); };
  const onUp = () => {
    if (start.current === null) return;
    start.current = null;
    if (dx < -70) choose(0);
    else if (dx > 70) choose(1);
    else setDx(0);
  };
  const onKey = (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); choose(0); }
    if (e.key === "ArrowRight") { e.preventDefault(); choose(1); }
  };

  const lean = dx < -30 ? 0 : dx > 30 ? 1 : null;
  const result = chosen === null ? "" : chosen === item.bucket ? "is-right" : "is-wrong";

  return (
    <div className="game">
      <p className="muted small center-text">Swipe the card, use the arrow keys, or tap a pocket.</p>
      <div className="sort-stage">
        <button type="button" className={`bucket left ${lean === 0 ? "hot" : ""} ${chosen === 0 ? result : ""}`} onClick={() => choose(0)} disabled={answered}>
          <ArrowLeft size={18} aria-hidden="true" /> {buckets[0]}
        </button>
        <div className="card-stack">
          {remaining > 1 && <div className="stack-shadow two" aria-hidden="true" />}
          {remaining > 0 && <div className="stack-shadow one" aria-hidden="true" />}
          <div
            key={item.text}
            className={`sort-card ${result} ${chosen === 0 ? "gone-left" : chosen === 1 ? "gone-right" : ""}`}
            style={chosen === null ? { transform: `translateX(${dx}px) rotate(${dx / 18}deg)` } : undefined}
            tabIndex={0}
            role="group"
            aria-label={`${item.text}. Press left arrow for ${buckets[0]} or right arrow for ${buckets[1]}.`}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onKeyDown={onKey}
          >
            <p>{item.text}</p>
            {chosen !== null && <span className="sort-verdict">{result === "is-right" ? <Check size={20} /> : <X size={20} />} {buckets[item.bucket]}</span>}
          </div>
        </div>
        <button type="button" className={`bucket right ${lean === 1 ? "hot" : ""} ${chosen === 1 ? result : ""}`} onClick={() => choose(1)} disabled={answered}>
          {buckets[1]} <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ---------- Price it right ----------

function demandModel(r) {
  const pMin = r.low * 0.8;
  const pMax = r.high * 1.35;
  const step = r.high <= 20 ? 0.5 : r.high <= 200 ? 5 : 10;
  const units = (p) => Math.floor(r.customers * Math.max(0, Math.min(1, (pMax - p) / (pMax - pMin))));
  const profit = (p) => units(p) * (p - r.cost);
  const min = Math.max(step, Math.floor((r.cost * 0.6) / step) * step);
  const max = Math.ceil((r.high * 1.5) / step) * step;
  let best = min;
  for (let p = min; p <= max; p += step) if (profit(p) > profit(best)) best = p;
  return { step, min, max, units, profit, best };
}

export function PriceGame({ round, answered, onResult }) {
  const m = useMemo(() => demandModel(round), [round]);
  const [price, setPrice] = useState(() => Math.round(round.cost / m.step) * m.step);
  const units = m.units(price);
  const perItem = price - round.cost;
  const share = units / round.customers;

  const lock = () => {
    const got = m.profit(price);
    const top = m.profit(m.best);
    const pct = top > 0 ? Math.max(0, Math.round((got / top) * 100)) : 0;
    const correct = pct >= 85;
    const why =
      `At ${R(price)}: ${units} customers × ${R(perItem)} profit = ${R(got)}. ` +
      `The sweet spot is about ${R(m.best)} (${m.units(m.best)} × ${R(m.best - round.cost)} = ${R(top)}). You made ${pct}% of the best profit. ` +
      (price < m.best ? "Lower prices bring more customers, but each sale earns too little." : price > m.best ? "Higher prices earn more per sale, but too many customers walk away." : "Spot on!");
    onResult({ correct, why });
  };

  return (
    <div className="game">
      <div className="price-head">
        <div>
          <p className="eyebrow">Your product</p>
          <h3 className="display sm">{round.product}</h3>
          <p className="muted">Costs you {R(round.cost)} {round.unit} · Others charge {R(round.low)}–{R(round.high)}</p>
        </div>
        <SpeakButton text={`${round.product}. It costs you ${R(round.cost)} ${round.unit}. Others charge between ${R(round.low)} and ${R(round.high)}. Set a price that earns the most total profit.`} label="Read the product" />
      </div>

      <label className="price-slider">
        <span className="sr-only">Your price</span>
        <span className="price-tag" aria-hidden="true">{R(price)}</span>
        <input
          type="range"
          min={m.min}
          max={m.max}
          step={m.step}
          value={price}
          disabled={answered}
          onChange={(e) => setPrice(Number(e.target.value))}
          aria-valuetext={`${R(price)}. ${units} of ${round.customers} customers would buy. Profit per item ${R(perItem)}.`}
        />
        <span className="range-ends muted small" aria-hidden="true"><span>{R(m.min)}</span><span>{R(m.max)}</span></span>
      </label>

      <div className="price-meters">
        <div className="meter">
          <span className="meter-label"><Users size={16} aria-hidden="true" /> Customers who'd buy</span>
          <strong>{units} <small className="muted">of {round.customers}</small></strong>
          <span className="meter-bar"><span style={{ width: `${share * 100}%` }} /></span>
        </div>
        <div className="meter">
          <span className="meter-label">Profit per item</span>
          <strong className={perItem <= 0 ? "negative" : ""}>{R(perItem)}</strong>
          <span className="meter-bar profit"><span style={{ width: `${Math.max(0, Math.min(1, perItem / (m.max - round.cost))) * 100}%` }} /></span>
        </div>
        <div className="meter total">
          <span className="meter-label">Total profit</span>
          <strong>{answered ? R(m.profit(price)) : "?"}</strong>
          <small className="muted">{answered ? "" : "customers × profit per item"}</small>
        </div>
      </div>

      {!answered && <button type="button" className="btn btn-primary" onClick={lock}>Lock in {R(price)}</button>}
    </div>
  );
}

// ---------- Budget builder ----------

export function BudgetGame({ round, answered, onResult }) {
  const [amounts, setAmounts] = useState(() => round.categories.map((c) => c.start));
  const [checks, setChecks] = useState(0);
  const [problems, setProblems] = useState([]);
  const total = amounts.reduce((a, b) => a + b, 0);
  const left = round.income - total;

  const bump = (i, by) => {
    setProblems([]);
    setAmounts((a) => a.map((v, n) => (n === i ? Math.max(0, v + by) : v)));
  };

  const check = () => {
    const issues = [];
    if (left > 0) issues.push(`You still have ${R(left)} without a job. Give every rand a job.`);
    if (left < 0) issues.push(`You've planned ${R(-left)} more than came in.`);
    round.categories.forEach((c, i) => {
      if (c.fixed != null && amounts[i] !== c.fixed) issues.push(`${c.name} is fixed at ${R(c.fixed)} — the landlord won't take less.`);
      else if (c.min != null && amounts[i] < c.min) issues.push(`${c.name} needs at least ${R(c.min)}.`);
    });
    const firstTry = checks === 0;
    setChecks((n) => n + 1);
    if (issues.length) { setProblems(issues); return; }
    setProblems([]);
    onResult({
      correct: firstTry,
      why: (firstTry ? "Balanced on the first try! " : "Balanced! ") +
        (round.income < 3000
          ? "In a slow month, stock and rent come first. Savings can pause, but cutting stock means even less income next month."
          : "Stock and rent are covered, you're saving at least 10%, and there's a little room for treats — that's a budget you can stick to."),
    });
  };

  return (
    <div className="game">
      <div className="budget-head">
        <div>
          <p className="eyebrow">{round.note}</p>
          <p className={`left-to-assign ${left === 0 ? "zero" : left < 0 ? "over" : ""}`} aria-live="polite">
            {left === 0 ? "Every rand has a job!" : left > 0 ? `${R(left)} left to plan` : `${R(-left)} over budget`}
          </p>
        </div>
        <SpeakButton text={`${round.note} Plan where every rand goes. ${round.categories.map((c) => `${c.name}${c.fixed != null ? `, fixed at ${R(c.fixed)}` : c.min ? `, at least ${R(c.min)}` : ""}.`).join(" ")}`} label="Read the budget task" />
      </div>
      <div className="budget-bar" aria-hidden="true">
        {amounts.map((v, i) => <span key={i} className={`seg s${i}`} style={{ width: `${Math.min(100, (v / Math.max(round.income, total)) * 100)}%` }} />)}
      </div>
      <ul className="budget-rows">
        {round.categories.map((c, i) => (
          <li key={c.name}>
            <span className={`seg-dot s${i}`} aria-hidden="true" />
            <span className="budget-name">
              {c.name}
              <small className="muted">{c.fixed != null ? `fixed ${R(c.fixed)}` : c.min ? `at least ${R(c.min)}` : "your choice"}</small>
            </span>
            <span className="stepper">
              <button type="button" className="icon-btn" onClick={() => bump(i, -100)} disabled={answered || amounts[i] === 0} aria-label={`Less for ${c.name}`}><Minus size={16} /></button>
              <strong aria-live="polite">{R(amounts[i])}</strong>
              <button type="button" className="icon-btn" onClick={() => bump(i, 100)} disabled={answered} aria-label={`More for ${c.name}`}><Plus size={16} /></button>
            </span>
          </li>
        ))}
      </ul>
      {problems.length > 0 && (
        <ul className="budget-problems" role="alert">
          {problems.map((p) => <li key={p}><X size={16} aria-hidden="true" /> {p}</li>)}
        </ul>
      )}
      {!answered && <button type="button" className="btn btn-primary" onClick={check}>Check my budget</button>}
    </div>
  );
}
