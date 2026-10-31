import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, Compass, FolderPlus, HelpCircle, Map, Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { greeting, matchOpportunities, monthSummary, proofStats, rand, useStore } from "../store.jsx";
import { SpeakButton } from "../speech.jsx";
import { questSummary } from "../components/Quest.jsx";

export function PlantJar() {
  return (
    <svg className="illus" viewBox="0 0 160 160" aria-hidden="true">
      <circle cx="80" cy="80" r="78" fill="var(--illus-bg)" />
      <path d="M80 62 C80 48 80 40 80 34" stroke="#3aa76d" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M80 44 C70 30 58 30 52 34 C60 44 70 46 80 44Z" fill="#7fd3a4" />
      <path d="M80 40 C88 24 102 20 108 24 C102 38 90 42 80 40Z" fill="#3aa76d" />
      <rect x="44" y="58" width="72" height="10" rx="5" fill="#b9a5ef" />
      <path d="M48 68 h64 v52 a14 14 0 0 1 -14 14 h-36 a14 14 0 0 1 -14 -14Z" fill="#efe8ff" stroke="#b9a5ef" strokeWidth="5" />
      <ellipse cx="80" cy="120" rx="22" ry="6" fill="#f4a989" />
      <ellipse cx="80" cy="111" rx="22" ry="6" fill="#f8bf9f" />
      <ellipse cx="80" cy="102" rx="22" ry="6" fill="#fbd3b8" />
    </svg>
  );
}

function PathArt() {
  return (
    <svg className="illus path-art" viewBox="0 0 160 160" aria-hidden="true">
      <circle cx="80" cy="80" r="78" fill="rgba(255,255,255,.45)" />
      <path d="M36 128 C70 118 110 112 102 84 C94 60 56 70 62 46 C66 32 90 28 112 30" stroke="#8a4b2d" strokeWidth="4" strokeDasharray="9 8" fill="none" strokeLinecap="round" />
      <circle cx="34" cy="128" r="9" fill="var(--primary)" />
      <path d="M128 12 l6 13 14 1.5 -10.5 9.5 3 14 -12.5 -7 -12.5 7 3 -14 -10.5 -9.5 14 -1.5Z" fill="var(--primary)" />
    </svg>
  );
}

const fmtDate = new Intl.DateTimeFormat("en-ZA", { weekday: "long", day: "numeric", month: "long" });

export default function Home() {
  const { data } = useStore();
  const navigate = useNavigate();
  const m = monthSummary(data.transactions);
  const stats = proofStats(data.jobs);
  const top = matchOpportunities(data)[0];
  const spentPct = m.moneyIn ? Math.round((m.moneyOut / m.moneyIn) * 100) : 0;
  const goal = data.goals[0];
  const quest = questSummary(data);

  const summaryText = `You have ${rand(m.left)} left this month. Money in ${rand(m.moneyIn)}, money out ${rand(m.moneyOut)}. You have spent ${spentPct}% of what came in.`;

  const quick = [
    { label: "Add money in", icon: Plus, tone: "mint", onClick: () => navigate("/wallet", { state: { add: "in" } }) },
    { label: "Add money out", icon: TrendingDown, tone: "rose", onClick: () => navigate("/wallet", { state: { add: "out" } }) },
    { label: "Log a job", icon: FolderPlus, tone: "lilac", onClick: () => navigate("/proof", { state: { add: true } }) },
    { label: "Ask the coach", icon: HelpCircle, tone: "peach", onClick: () => navigate("/moneymap", { state: { tab: "coach" } }) },
  ];

  const journey = [
    { step: "Manage", to: "/wallet", icon: Wallet, title: "HerWallet", stat: `${Object.keys(data.budgets).length} budgets set`, done: Object.keys(data.budgets).length > 0 },
    { step: "Learn", to: "/moneymap", icon: Map, title: "MoneyMap", stat: quest.xp ? `${quest.title} · ${quest.stars}/${quest.maxStars} stars` : "Play Money Quest", done: quest.stars > 0 || !!data.simulation.best },
    { step: "Prove", to: "/proof", icon: BadgeCheck, title: "ProofPocket", stat: `${stats.verifiedJobs} verified jobs`, done: stats.verifiedJobs > 0 },
    { step: "Grow", to: "/next-move", icon: Compass, title: "Next Move", stat: top ? `${top.score}% top match` : "See opportunities", done: top?.score >= 70 },
  ];

  return (
    <div className="page">
      <p className="eyebrow">{fmtDate.format(new Date())}</p>
      <h1 className="hero-title">{greeting()}, {data.profile.name}</h1>

      <div className="hero-grid">
        <section className="card card-lilac money-card" aria-labelledby="left-label">
          <PlantJar />
          <div className="card-head">
            <p className="eyebrow primary" id="left-label">Left this month</p>
            <SpeakButton text={summaryText} label="Read money summary" />
          </div>
          <p className={`big-number ${m.left < 0 ? "negative" : ""}`}>{rand(m.left)}</p>
          <div className="mini-stats">
            <div className="mini-stat">
              <span className="mini-label in"><TrendingUp size={16} aria-hidden="true" /> Money in</span>
              <strong>{rand(m.moneyIn)}</strong>
            </div>
            <div className="mini-stat">
              <span className="mini-label out"><TrendingDown size={16} aria-hidden="true" /> Money out</span>
              <strong>{rand(m.moneyOut)}</strong>
            </div>
          </div>
          <p className="small">You have spent {spentPct}% of what came in</p>
          <div className="progress" role="progressbar" aria-valuenow={Math.min(spentPct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Share of income spent">
            <span style={{ width: `${Math.min(spentPct, 100)}%` }} className={spentPct > 95 ? "danger" : ""} />
          </div>
          <Link to="/wallet" className="text-link">Open HerWallet <ArrowRight size={18} aria-hidden="true" /></Link>
        </section>

        {top && (
          <section className="card card-peach next-card" aria-labelledby="next-title">
            <PathArt />
            <p className="eyebrow with-icon"><span className="circle-icon"><Compass size={18} aria-hidden="true" /></span> Your next move</p>
            <span className="chip">Opportunity match · {top.score}%</span>
            <h2 id="next-title" className="display">{top.title}</h2>
            <p className="lead-muted">
              {stats.verifiedJobs > 0
                ? `Your sales are steady and you have ${stats.verifiedJobs} verified jobs in ProofPocket. `
                : "Log and verify your jobs in ProofPocket to strengthen this match. "}
              {top.pitch}
            </p>
            <Link to="/next-move" className="btn btn-primary">See your next move <ArrowRight size={18} aria-hidden="true" /></Link>
          </section>
        )}
      </div>

      <div className="quick-grid">
        {quick.map(({ label, icon: Icon, tone, onClick }) => (
          <button key={label} type="button" className="card quick-card" onClick={onClick}>
            <span className={`round-icon ${tone}`} aria-hidden="true"><Icon size={22} /></span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <section aria-labelledby="journey-title" className="section">
        <h2 id="journey-title" className="section-title">Your HerPath journey</h2>
        <p className="muted">From skills → financial confidence → opportunity → income.</p>
        <ol className="journey">
          {journey.map(({ step, to, icon: Icon, title, stat, done }, i) => (
            <li key={step}>
              <Link to={to} className={`card journey-step ${done ? "done" : ""}`}>
                <span className="journey-num" aria-hidden="true">{i + 1}</span>
                <span className="eyebrow">{step}</span>
                <span className="journey-title"><Icon size={18} aria-hidden="true" /> {title}</span>
                <span className="muted small">{stat}</span>
                {done && <span className="sr-only">(done)</span>}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {goal && (
        <section className="card goal-strip" aria-label={`Goal: ${goal.name}`}>
          <div>
            <p className="eyebrow">Saving towards</p>
            <strong>{goal.name}</strong>
          </div>
          <div className="goal-strip-bar">
            <div className="progress mint" role="progressbar" aria-valuenow={Math.round((goal.saved / goal.target) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${goal.name} progress`}>
              <span style={{ width: `${Math.min(100, (goal.saved / goal.target) * 100)}%` }} />
            </div>
            <span className="small muted">{rand(goal.saved)} of {rand(goal.target)}</span>
          </div>
          <Link to="/wallet" state={{ tab: "goals" }} className="text-link">Add to goal <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      )}
    </div>
  );
}
