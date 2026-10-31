import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Briefcase, CalendarClock, CheckCircle2, Circle, Compass, ExternalLink, FileText, HandCoins, MapPin, MessageCircle, Printer, Search, Sparkles } from "lucide-react";
import { matchOpportunities, monthSummary, proofStats, rand, useStore } from "../store.jsx";
import { OPPORTUNITY_TYPES, OPPORTUNITIES } from "../data/opportunities.js";
import { FUNDING, FUNDING_KINDS, FUNDING_STAGES } from "../data/funding.js";
import { SpeakButton } from "../speech.jsx";
import Tabs from "../components/Tabs.jsx";

export default function NextMove() {
  const [tab, setTab] = useState("matches");
  return (
    <div className="page">
      <p className="eyebrow">Grow</p>
      <h1 className="page-title">Your Next Move</h1>
      <p className="lead-muted">Not another job board. These next steps are picked for you, based on your skills, interests and the proof you've built.</p>
      <Tabs
        tabs={[
          { id: "matches", label: "For you", icon: Compass },
          { id: "cv", label: "CV builder", icon: FileText },
          { id: "funding", label: "Funding finder", icon: HandCoins },
        ]}
        value={tab}
        onChange={setTab}
        label="Next Move sections"
      />
      {tab === "matches" && <Matches />}
      {tab === "cv" && <CvBuilder />}
      {tab === "funding" && <FundingFinder />}
    </div>
  );
}

// ---------- Matches ----------

function Matches() {
  const { data } = useStore();
  const [type, setType] = useState("All");
  const [skill, setSkill] = useState("");
  const all = useMemo(() => matchOpportunities(data), [data]);
  const mySkills = [...new Set([...data.profile.skills, ...proofStats(data.jobs).skillList])];
  const list = all.filter((o) => (type === "All" || o.type === type) && (!skill || o.skills.includes(skill)));

  return (
    <>
      <div className="filters" role="group" aria-label="Filter opportunities">
        <div className="chip-row">
          {["All", ...OPPORTUNITY_TYPES].map((t) => (
            <button key={t} type="button" className={`chip-btn ${type === t ? "on" : ""}`} aria-pressed={type === t} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
        <label className="inline-label">Uses my skill
          <select value={skill} onChange={(e) => setSkill(e.target.value)}>
            <option value="">Any skill</option>
            {mySkills.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <p className="muted small" aria-live="polite">{list.length} opportunities · sample listings for this demo</p>
      <ul className="opp-list">
        {list.map((o) => <OpportunityCard key={o.id} o={o} />)}
      </ul>
    </>
  );
}

function OpportunityCard({ o }) {
  const navigate = useNavigate();
  const { actions } = useStore();
  const tone = o.score >= 75 ? "strong" : o.score >= 50 ? "medium" : "weak";
  const deadline = new Date(Date.now() + o.deadline * 864e5).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  const summary = `${o.title}, ${o.type} with ${o.org}. ${o.score}% match. ${o.reasons.join(". ")}. ${o.detail}`;

  return (
    <li className="card opp">
      <div className="opp-top">
        <span className={`match ${tone}`} aria-label={`${o.score}% match`}>{o.score}%<small>match</small></span>
        <div className="opp-main">
          <span className="chip">{o.type}</span>
          <h2 className="opp-title">{o.title}</h2>
          <p className="muted small"><Briefcase size={14} aria-hidden="true" /> {o.org} · <MapPin size={14} aria-hidden="true" /> {o.location} · <CalendarClock size={14} aria-hidden="true" /> Closes {deadline}</p>
        </div>
        <SpeakButton text={summary} label={`Read ${o.title}`} />
      </div>
      <p>{o.detail}</p>
      <ul className="reasons">
        {o.reasons.map((r) => <li key={r}><CheckCircle2 size={16} aria-hidden="true" /> {r}</li>)}
        {o.missing.length > 0 && <li className="gap"><Circle size={16} aria-hidden="true" /> Skills to build: {o.missing.join(", ")}</li>}
      </ul>
      <div className="row">
        <button className="btn btn-primary sm" onClick={() => { actions.setQuestFlag("plannedMove"); navigate("/moneymap", { state: { ask: `I'm interested in "${o.title}" (${o.type}, ${o.org}). ${o.detail} How should I prepare and apply, and is it a good fit for my situation?` } }); }}>
          <MessageCircle size={16} aria-hidden="true" /> Plan this with the coach
        </button>
        {!o.proofOk && <button className="btn btn-soft sm" onClick={() => navigate("/proof", { state: { add: true } })}><BadgeCheck size={16} aria-hidden="true" /> Add proof</button>}
      </div>
    </li>
  );
}

// ---------- CV builder ----------

function CvBuilder() {
  const { data, actions } = useStore();
  const p = data.profile;
  const stats = proofStats(data.jobs);
  const allSkills = [...new Set([...p.skills, ...stats.skillList])];
  const [skills, setSkills] = useState(allSkills);
  const [jobIds, setJobIds] = useState(data.jobs.map((j) => j.id));
  const [summary, setSummary] = useState(
    () => `${p.about} ${stats.verifiedJobs} customer-verified jobs with ${stats.verifications} reviews${stats.avgRating ? ` (average ${stats.avgRating.toFixed(1)}/5)` : ""}. Strong in ${allSkills.slice(0, 3).join(", ").toLowerCase()}.`,
  );

  const jobs = data.jobs.filter((j) => jobIds.includes(j.id));
  const toggle = (list, setList, v) => setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  // Match opportunities against only the skills chosen for this CV.
  const cvMatches = useMemo(
    () => matchOpportunities({ ...data, profile: { ...p, skills }, jobs: data.jobs.map((j) => ({ ...j, skills: j.skills.filter((s) => skills.includes(s)) })) }, OPPORTUNITIES)
      .filter((o) => o.matched.length > 0)
      .slice(0, 4),
    [data, p, skills],
  );

  return (
    <div className="cv-layout">
      <section className="card cv-editor no-print" aria-labelledby="cv-edit-title">
        <h2 id="cv-edit-title" className="card-title">Build your CV</h2>
        <p className="muted small">Filled in from your profile and ProofPocket. Changes to your details are saved to your profile.</p>
        <div className="form">
          <label>Full name<input value={p.name} onChange={(e) => actions.setProfile({ name: e.target.value })} /></label>
          <div className="grid-2">
            <label>Phone<input type="tel" value={p.phone} onChange={(e) => actions.setProfile({ phone: e.target.value })} /></label>
            <label>Email<input type="email" value={p.email} onChange={(e) => actions.setProfile({ email: e.target.value })} /></label>
          </div>
          <label>Location<input value={p.location} onChange={(e) => actions.setProfile({ location: e.target.value })} /></label>
          <label>Profile summary<textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} /></label>
          <label>Education<input value={p.education} onChange={(e) => actions.setProfile({ education: e.target.value })} /></label>
          <fieldset>
            <legend>Skills to show</legend>
            <div className="chip-row">
              {allSkills.map((s) => <button key={s} type="button" className={`chip-btn ${skills.includes(s) ? "on" : ""}`} aria-pressed={skills.includes(s)} onClick={() => toggle(skills, setSkills, s)}>{s}</button>)}
            </div>
          </fieldset>
          <fieldset>
            <legend>Experience to include</legend>
            {data.jobs.map((j) => (
              <label key={j.id} className="check">
                <input type="checkbox" checked={jobIds.includes(j.id)} onChange={() => toggle(jobIds, setJobIds, j.id)} /> {j.title}
                {j.verifications.length > 0 && <BadgeCheck size={14} className="good-icon" aria-label="verified" />}
              </label>
            ))}
          </fieldset>
        </div>

        <div className="cv-matches">
          <h3 className="card-title"><Sparkles size={16} aria-hidden="true" /> Jobs that match this CV</h3>
          <ul>
            {cvMatches.map((o) => (
              <li key={o.id}>
                <span className="match-mini">{o.score}%</span>
                <span><strong>{o.title}</strong><br /><small className="muted">{o.type} · matches {o.matched.join(", ")}</small></span>
              </li>
            ))}
            {!cvMatches.length && <li className="muted">Select some skills to see matching opportunities.</li>}
          </ul>
        </div>
      </section>

      <section className="cv-preview-wrap" aria-label="CV preview">
        <div className="row no-print">
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={18} aria-hidden="true" /> Print or save as PDF</button>
        </div>
        <article className="cv-preview">
          <header>
            <h2>{p.name}</h2>
            <p>{[p.location, p.phone, p.email].filter(Boolean).join(" · ")}</p>
          </header>
          <h3>Profile</h3>
          <p>{summary}</p>
          <h3>Skills</h3>
          <p>{skills.join(" · ")}</p>
          <h3>Experience</h3>
          <p className="cv-sub">{p.business} — self-employed</p>
          {jobs.map((j) => (
            <div key={j.id} className="cv-job">
              <p><strong>{j.title}</strong> — {j.client} <span className="cv-date">{new Date(j.date).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}</span></p>
              {j.description && <p>{j.description}</p>}
              {j.verifications[0] && <p className="cv-quote">"{j.verifications[0].comment}" — {j.verifications[0].name} ({j.verifications[0].rating}/5, verified on HerPath)</p>}
            </div>
          ))}
          <h3>Education</h3>
          <p>{p.education || "—"}</p>
          <p className="cv-foot">{stats.verifiedJobs} verified jobs · {rand(stats.earnings)} recorded earnings · Verified work passport available on request</p>
        </article>
      </section>
    </div>
  );
}

// ---------- Funding finder ----------

function FundingFinder() {
  const { data } = useStore();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [stage, setStage] = useState("");
  const [women, setWomen] = useState(false);

  const stats = proofStats(data.jobs);
  const m = monthSummary(data.transactions);
  const readiness = [
    { label: "Money records (HerWallet)", ok: data.transactions.length >= 5, hint: "Track at least a month of money in and out" },
    { label: "Proof of trading (ProofPocket)", ok: stats.verifiedJobs >= 2, hint: "Get 2+ jobs verified by customers" },
    { label: "Business is making a profit", ok: m.left > 0, hint: "Funders look for money left over each month" },
    { label: "Savings goal in progress", ok: data.goals.some((g) => g.saved > 0), hint: "Shows you can manage cash" },
  ];

  const list = FUNDING.filter((f) => {
    const text = `${f.name} ${f.summary} ${f.kind} ${f.sectors.join(" ")}`.toLowerCase();
    return (!q || text.includes(q.toLowerCase())) && (!kind || f.kind === kind) && (!stage || f.stages.includes(stage)) && (!women || f.womenFocused);
  });

  return (
    <div className="two-col wide-left">
      <div>
        <div className="filters card">
          <label className="search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Search funding</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search e.g. grant, loan, women, Gauteng" />
          </label>
          <div className="grid-3">
            <label>Type
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="">Any type</option>
                {FUNDING_KINDS.map((k) => <option key={k}>{k}</option>)}
              </select>
            </label>
            <label>My business stage
              <select value={stage} onChange={(e) => setStage(e.target.value)}>
                <option value="">Any stage</option>
                {FUNDING_STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="check"><input type="checkbox" checked={women} onChange={(e) => setWomen(e.target.checked)} /> Women-focused only</label>
          </div>
        </div>
        <p className="muted small" aria-live="polite">{list.length} results · Always confirm criteria on the provider's website before applying.</p>
        <ul className="opp-list">
          {list.map((f) => (
            <li key={f.id} className="card opp">
              <div className="opp-top">
                <div className="opp-main">
                  <div className="chip-row">
                    <span className="chip">{f.kind}</span>
                    {f.womenFocused && <span className="chip peach">Women-focused</span>}
                    {f.youth && <span className="chip">Youth 18–35</span>}
                    {f.province && <span className="chip">{f.province}</span>}
                  </div>
                  <h2 className="opp-title">{f.name}</h2>
                </div>
                <SpeakButton text={`${f.name}. ${f.kind}. ${f.summary} You'll usually need: ${f.needs.join(", ")}.`} label={`Read ${f.name}`} />
              </div>
              <p>{f.summary}</p>
              <p className="small"><strong>Usually needs:</strong> {f.needs.join(" · ")}</p>
              <p className="small muted">Stages: {f.stages.join(", ")}</p>
              <a className="text-link" href={f.url} target="_blank" rel="noreferrer">Visit website <ExternalLink size={16} aria-hidden="true" /></a>
            </li>
          ))}
          {!list.length && <li className="muted">No matches. Try clearing a filter.</li>}
        </ul>
      </div>

      <aside className="card readiness" aria-labelledby="ready-title">
        <h2 id="ready-title" className="card-title">Are you funding-ready?</h2>
        <p className="muted small">Funders want proof. HerPath helps you build it.</p>
        <ul className="checklist">
          {readiness.map((r) => (
            <li key={r.label} className={r.ok ? "ok" : ""}>
              {r.ok ? <CheckCircle2 size={18} className="good-icon" aria-hidden="true" /> : <Circle size={18} aria-hidden="true" />}
              <span><strong>{r.label}</strong><span className="sr-only">{r.ok ? " — done" : " — to do"}</span><br /><small className="muted">{r.hint}</small></span>
            </li>
          ))}
        </ul>
        <p className="small">{readiness.filter((r) => r.ok).length} of {readiness.length} ready</p>
      </aside>
    </div>
  );
}
