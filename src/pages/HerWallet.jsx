import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AlertTriangle, ChevronLeft, ChevronRight, Lightbulb, PiggyBank, Plus, Target, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { monthKey, monthSummary, rand, useStore } from "../store.jsx";
import { CATEGORIES_IN, CATEGORIES_OUT } from "../data/seed.js";
import { SpeakButton } from "../speech.jsx";
import Tabs from "../components/Tabs.jsx";

const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
};
const shiftMonth = (key, by) => {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + by, 1));
};

export default function HerWallet() {
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.add ? "transactions" : location.state?.tab || "overview");
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "transactions", label: "Money in & out" },
    { id: "budgets", label: "Budgets" },
    { id: "goals", label: "Goals" },
  ];

  return (
    <div className="page">
      <p className="eyebrow">Manage</p>
      <h1 className="page-title">HerWallet</h1>
      <p className="lead-muted">See where your money goes, plan for it, and save towards what matters.</p>
      <Tabs tabs={tabs} value={tab} onChange={setTab} label="HerWallet sections" />
      {tab === "overview" && <Overview />}
      {tab === "transactions" && <Transactions initialType={location.state?.add} />}
      {tab === "budgets" && <Budgets />}
      {tab === "goals" && <Goals />}
    </div>
  );
}

// ---------- Overview ----------

function Overview() {
  const { data } = useStore();
  const [month, setMonth] = useState(monthKey());
  const m = monthSummary(data.transactions, month);
  const prev = monthSummary(data.transactions, shiftMonth(month, -1));
  const insights = buildInsights(m, prev, data.budgets);

  return (
    <>
      <div className="month-nav" role="group" aria-label="Choose month">
        <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month"><ChevronLeft size={18} /></button>
        <strong aria-live="polite">{monthLabel(month)}</strong>
        <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month" disabled={month >= monthKey()}><ChevronRight size={18} /></button>
      </div>

      <div className="stat-row">
        <div className="card stat"><span className="mini-label in"><TrendingUp size={16} aria-hidden="true" /> Money in</span><strong>{rand(m.moneyIn)}</strong></div>
        <div className="card stat"><span className="mini-label out"><TrendingDown size={16} aria-hidden="true" /> Money out</span><strong>{rand(m.moneyOut)}</strong></div>
        <div className="card stat"><span className="mini-label"><PiggyBank size={16} aria-hidden="true" /> Left over</span><strong className={m.left < 0 ? "negative" : ""}>{rand(m.left)}</strong></div>
      </div>

      <div className="two-col">
        <section className="card" aria-labelledby="spend-title">
          <div className="card-head">
            <h2 id="spend-title" className="card-title">Where your money went</h2>
          </div>
          <SpendChart byCategory={m.byCategory} budgets={data.budgets} />
        </section>

        <section className="card" aria-labelledby="insight-title">
          <div className="card-head">
            <h2 id="insight-title" className="card-title"><Lightbulb size={18} aria-hidden="true" /> What this means</h2>
            <SpeakButton text={insights.map((i) => i.text).join(" ")} label="Read insights" />
          </div>
          {insights.length === 0 && <p className="muted">Add some money in and out to see insights.</p>}
          <ul className="insights">
            {insights.map((i, n) => (
              <li key={n} className={i.tone}>
                {i.tone === "warn" ? <AlertTriangle size={18} aria-hidden="true" /> : <Lightbulb size={18} aria-hidden="true" />}
                <span>{i.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function buildInsights(m, prev, budgets) {
  const out = [];
  if (!m.count) return out;
  const cats = Object.entries(m.byCategory).sort((a, b) => b[1] - a[1]);
  if (cats.length) {
    const [cat, amt] = cats[0];
    out.push({ tone: "info", text: `Your biggest cost is ${cat}: ${rand(amt)}, or ${Math.round((amt / m.moneyOut) * 100)}% of what you spent.` });
  }
  for (const [cat, amt] of cats) {
    if (budgets[cat] && amt > budgets[cat]) out.push({ tone: "warn", text: `${cat} is ${rand(amt - budgets[cat])} over your ${rand(budgets[cat])} budget.` });
  }
  if (m.left > 0) {
    const save = Math.round((m.left * 0.3) / 10) * 10;
    out.push({ tone: "info", text: `You have ${rand(m.left)} left. Putting aside 30% (${rand(save)}) builds your emergency fund without squeezing your stock money.` });
  } else if (m.moneyIn) {
    out.push({ tone: "warn", text: `You spent ${rand(-m.left)} more than came in. Check which costs can wait until next month.` });
  }
  if (prev.moneyIn && m.moneyIn) {
    const diff = m.moneyIn - prev.moneyIn;
    out.push({ tone: "info", text: diff >= 0 ? `Money in is up ${rand(diff)} on last month. Nice work.` : `Money in is down ${rand(-diff)} on last month.` });
  }
  return out;
}

/** Horizontal bars: spend per category, with a tick for the budget. */
function SpendChart({ byCategory, budgets }) {
  const [hover, setHover] = useState(null);
  const [asTable, setAsTable] = useState(false);
  const rows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((s, [, v]) => s + v, 0);
  const max = Math.max(1, ...rows.map(([c, v]) => Math.max(v, budgets[c] || 0)));

  if (!rows.length) return <p className="muted">No spending recorded this month.</p>;

  return (
    <div className="chart">
      <div className="chart-tools">
        <div className="legend" aria-hidden={asTable}>
          <span><i className="swatch bar" /> Spent</span>
          <span><i className="swatch tick" /> Budget</span>
        </div>
        <button type="button" className="link-btn" onClick={() => setAsTable((v) => !v)}>{asTable ? "Show chart" : "Show as table"}</button>
      </div>

      {asTable ? (
        <table className="table">
          <thead><tr><th scope="col">Category</th><th scope="col">Spent</th><th scope="col">Budget</th><th scope="col">Share</th></tr></thead>
          <tbody>
            {rows.map(([cat, v]) => (
              <tr key={cat}><td>{cat}</td><td>{rand(v)}</td><td>{budgets[cat] ? rand(budgets[cat]) : "—"}</td><td>{Math.round((v / total) * 100)}%</td></tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="hbars" aria-label="Spending by category">
          {rows.map(([cat, v]) => {
            const over = budgets[cat] && v > budgets[cat];
            return (
              <li
                key={cat}
                className="hbar-row"
                tabIndex={0}
                onMouseEnter={() => setHover(cat)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(cat)}
                onBlur={() => setHover(null)}
                aria-label={`${cat}: ${rand(v)}${budgets[cat] ? ` of ${rand(budgets[cat])} budget` : ""}, ${Math.round((v / total) * 100)}% of spending`}
              >
                <span className="hbar-label">{cat}</span>
                <span className="hbar-track">
                  <span className={`hbar ${hover && hover !== cat ? "dim" : ""}`} style={{ width: `${(v / max) * 100}%` }} />
                  {budgets[cat] && <span className="hbar-tick" style={{ left: `${(budgets[cat] / max) * 100}%` }} />}
                  {hover === cat && (
                    <span className="tooltip" role="presentation">
                      <strong>{cat}</strong>
                      <span>{rand(v)} · {Math.round((v / total) * 100)}% of spending</span>
                      {budgets[cat] && <span>{over ? `${rand(v - budgets[cat])} over budget` : `${rand(budgets[cat] - v)} left in budget`}</span>}
                    </span>
                  )}
                </span>
                <span className="hbar-value">{rand(v)}{over && <AlertTriangle size={14} className="warn-icon" aria-hidden="true" />}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------- Transactions ----------

function Transactions({ initialType }) {
  const { data, actions } = useStore();
  const [type, setType] = useState(initialType || "out");
  const [form, setForm] = useState({ amount: "", category: "", note: "", date: new Date().toISOString().slice(0, 10) });
  const [filter, setFilter] = useState("all");
  const amountRef = useRef(null);
  const cats = type === "in" ? CATEGORIES_IN : CATEGORIES_OUT;

  useEffect(() => { if (initialType) amountRef.current?.focus(); }, [initialType]);

  const submit = (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!(amount > 0)) return;
    actions.addTransaction({ type, amount, category: form.category || cats[0], note: form.note.trim(), date: form.date });
    setForm((f) => ({ ...f, amount: "", note: "" }));
    amountRef.current?.focus();
  };

  const list = useMemo(
    () => [...data.transactions].filter((t) => filter === "all" || t.type === filter).sort((a, b) => b.date.localeCompare(a.date)),
    [data.transactions, filter],
  );

  return (
    <div className="two-col wide-left">
      <section className="card" aria-labelledby="tx-list-title">
        <div className="card-head">
          <h2 id="tx-list-title" className="card-title">Recent money</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter transactions">
            <option value="all">All</option>
            <option value="in">Money in</option>
            <option value="out">Money out</option>
          </select>
        </div>
        <ul className="tx-list">
          {list.map((t) => (
            <li key={t.id} className="tx">
              <span className={`round-icon sm ${t.type === "in" ? "mint" : "rose"}`} aria-hidden="true">
                {t.type === "in" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </span>
              <span className="tx-main">
                <strong>{t.note || t.category}</strong>
                <small className="muted">{t.category} · {new Date(t.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</small>
              </span>
              <span className={`tx-amt ${t.type}`}>{t.type === "in" ? "+" : "−"}{rand(t.amount)}</span>
              <button className="icon-btn ghost" onClick={() => actions.removeTransaction(t.id)} aria-label={`Delete ${t.note || t.category}`}><Trash2 size={16} /></button>
            </li>
          ))}
          {!list.length && <li className="muted">Nothing here yet.</li>}
        </ul>
      </section>

      <section className="card" aria-labelledby="tx-add-title">
        <h2 id="tx-add-title" className="card-title">Add money {type === "in" ? "in" : "out"}</h2>
        <div className="segmented" role="radiogroup" aria-label="Type">
          <button type="button" role="radio" aria-checked={type === "in"} className={type === "in" ? "on" : ""} onClick={() => { setType("in"); setForm((f) => ({ ...f, category: "" })); }}>Money in</button>
          <button type="button" role="radio" aria-checked={type === "out"} className={type === "out" ? "on" : ""} onClick={() => { setType("out"); setForm((f) => ({ ...f, category: "" })); }}>Money out</button>
        </div>
        <form onSubmit={submit} className="form">
          <label>Amount (R)
            <input ref={amountRef} type="number" inputMode="decimal" min="1" step="any" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </label>
          <label>Category
            <select value={form.category || cats[0]} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {cats.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>What was it for? <span className="muted">(optional)</span>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder={type === "in" ? "e.g. Saturday market sales" : "e.g. Flour and oil"} />
          </label>
          <label>Date
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <button className="btn btn-primary" type="submit"><Plus size={18} aria-hidden="true" /> Save</button>
        </form>
      </section>
    </div>
  );
}

// ---------- Budgets ----------

function Budgets() {
  const { data, actions } = useStore();
  const m = monthSummary(data.transactions);
  const [newCat, setNewCat] = useState("");
  const unbudgeted = CATEGORIES_OUT.filter((c) => !(c in data.budgets));
  const totalBudget = Object.values(data.budgets).reduce((a, b) => a + b, 0);

  return (
    <section className="card" aria-labelledby="budget-title">
      <div className="card-head">
        <h2 id="budget-title" className="card-title">Monthly budgets</h2>
        <span className="muted">Planned {rand(totalBudget)} · Money in so far {rand(m.moneyIn)}</span>
      </div>
      <ul className="budget-list">
        {Object.entries(data.budgets).map(([cat, limit]) => {
          const spent = m.byCategory[cat] || 0;
          const pct = Math.round((spent / limit) * 100);
          return (
            <li key={cat} className="budget">
              <div className="budget-top">
                <strong>{cat}</strong>
                <span className={pct > 100 ? "negative" : "muted"}>
                  {rand(spent)} of{" "}
                  <input
                    className="inline-input"
                    type="number"
                    min="0"
                    aria-label={`${cat} budget`}
                    defaultValue={limit}
                    onBlur={(e) => actions.setBudget(cat, Number(e.target.value))}
                  />
                </span>
              </div>
              <div className="progress" role="progressbar" aria-valuenow={Math.min(pct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${cat} budget used`}>
                <span className={pct > 100 ? "danger" : pct > 85 ? "warning" : ""} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <small className="muted">
                {pct > 100 ? <><AlertTriangle size={13} aria-hidden="true" /> Over by {rand(spent - limit)}</> : `${rand(limit - spent)} left`}
              </small>
            </li>
          );
        })}
      </ul>
      {unbudgeted.length > 0 && (
        <form className="row-form" onSubmit={(e) => { e.preventDefault(); if (newCat) { actions.setBudget(newCat, 300); setNewCat(""); } }}>
          <select value={newCat} onChange={(e) => setNewCat(e.target.value)} aria-label="Category to budget">
            <option value="">Add a budget for…</option>
            {unbudgeted.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button className="btn btn-soft" type="submit" disabled={!newCat}><Plus size={16} aria-hidden="true" /> Add</button>
        </form>
      )}
      <p className="small muted">Tip: set a budget to 0 to remove it.</p>
    </section>
  );
}

// ---------- Goals ----------

function Goals() {
  const { data, actions } = useStore();
  const [form, setForm] = useState({ name: "", target: "", kind: "business", weekly: "" });

  return (
    <div className="two-col wide-left">
      <div className="goal-grid">
        {data.goals.map((g) => <GoalCard key={g.id} goal={g} />)}
        {!data.goals.length && <p className="muted">No goals yet. Add your first one.</p>}
      </div>
      <section className="card" aria-labelledby="goal-add-title">
        <h2 id="goal-add-title" className="card-title"><Target size={18} aria-hidden="true" /> New goal</h2>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim() || !(Number(form.target) > 0)) return;
            actions.addGoal({ name: form.name.trim(), target: Number(form.target), kind: form.kind });
            setForm({ name: "", target: "", kind: "business" });
          }}
        >
          <label>What are you saving for?
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Industrial blender" />
          </label>
          <label>Target amount (R)
            <input required type="number" min="1" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
          </label>
          <label>Type
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              <option value="business">Business goal</option>
              <option value="savings">Personal savings</option>
            </select>
          </label>
          <button className="btn btn-primary" type="submit"><Plus size={18} aria-hidden="true" /> Add goal</button>
        </form>
      </section>
    </div>
  );
}

function GoalCard({ goal }) {
  const { actions } = useStore();
  const [amt, setAmt] = useState("");
  const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100));
  const remaining = Math.max(0, goal.target - goal.saved);
  const weeks = remaining ? Math.ceil(remaining / 150) : 0;

  return (
    <article className="card goal-card" aria-label={`${goal.name}, ${pct}% saved`}>
      <div className="card-head">
        <span className="chip">{goal.kind === "business" ? "Business" : "Savings"}</span>
        <button className="icon-btn ghost" onClick={() => actions.removeGoal(goal.id)} aria-label={`Delete goal ${goal.name}`}><Trash2 size={16} /></button>
      </div>
      <h3 className="goal-name">{goal.name}</h3>
      <p><strong className="big-ish">{rand(goal.saved)}</strong> <span className="muted">of {rand(goal.target)}</span></p>
      <div className="progress mint" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${goal.name} progress`}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="small muted">{remaining ? `At R150 a week you'll get there in about ${weeks} weeks.` : "Goal reached! 🎉"}</p>
      <form className="row-form" onSubmit={(e) => { e.preventDefault(); const n = Number(amt); if (n) { actions.contributeGoal(goal.id, n); setAmt(""); } }}>
        <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Amount" aria-label={`Amount to add to ${goal.name}`} />
        <button className="btn btn-soft" type="submit">Add</button>
      </form>
    </article>
  );
}
