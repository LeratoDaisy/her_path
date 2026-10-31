import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowLeftRight, ArrowRight, Award, BadgeCheck, Calculator, Check, ClipboardCheck, Compass, Crown, Flame,
  Footprints, Gamepad2, HandCoins, Lock, MessageCircle, PenLine, PieChart, RotateCcw, Sparkles, Star, Tag, Trophy, Camera, Wallet,
} from "lucide-react";
import { useStore } from "../store.jsx";
import { GAME_LEVELS, LEVELS, ZONES, XP, isUnlocked, questProgress, rankFor, starsFor } from "../data/quest.js";
import { SpeakButton } from "../speech.jsx";
import { BudgetGame, ChoiceGame, PriceGame, SortGame } from "./QuestGames.jsx";

const ICONS = { ArrowLeftRight, BadgeCheck, Calculator, Camera, ClipboardCheck, Compass, Crown, Flame, Footprints, Gamepad2, HandCoins, MessageCircle, PenLine, PieChart, Star, Tag, Trophy, Wallet };

const Icon = ({ name, ...p }) => {
  const C = ICONS[name] || Sparkles;
  return <C {...p} />;
};

/** A plant that grows with your rank (0–4). */
export function QuestPlant({ stage, size = 120 }) {
  const stem = 22 + stage * 9;
  const top = 92 - stem;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="quest-plant" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="var(--illus-bg)" />
      <path d={`M60 92 V${top}`} stroke="#3aa76d" strokeWidth="4" strokeLinecap="round" />
      {stage >= 0 && <path d={`M60 ${top + 10} C50 ${top} 42 ${top + 2} 38 ${top + 6} C46 ${top + 14} 54 ${top + 14} 60 ${top + 10}Z`} fill="#7fd3a4" />}
      {stage >= 1 && <path d={`M60 ${top + 6} C68 ${top - 6} 80 ${top - 6} 84 ${top - 2} C78 ${top + 8} 68 ${top + 10} 60 ${top + 6}Z`} fill="#3aa76d" />}
      {stage >= 2 && <path d={`M60 ${top + 22} C70 ${top + 14} 80 ${top + 16} 84 ${top + 20} C76 ${top + 28} 66 ${top + 28} 60 ${top + 22}Z`} fill="#7fd3a4" />}
      {stage >= 3 && (
        <g transform={`translate(60 ${top - 2})`}>
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-8" rx="5" ry="8" fill="#f4a989" transform={`rotate(${a})`} />)}
          <circle r="5" fill={stage >= 4 ? "#5b3fc4" : "#f8bf9f"} />
        </g>
      )}
      {stage >= 4 && <path d="M92 26 l3 6 7 .8 -5 4.6 1.4 7 -6.4 -3.6 -6.4 3.6 1.4 -7 -5 -4.6 7 -.8Z" fill="var(--primary)" />}
      <path d="M40 90 h40 l-5 20 a6 6 0 0 1 -6 4 h-18 a6 6 0 0 1 -6 -4Z" fill="#b9a5ef" />
      <rect x="36" y="86" width="48" height="8" rx="4" fill="#9c86e6" />
    </svg>
  );
}

export default function Quest() {
  const { data } = useStore();
  const [playing, setPlaying] = useState(null);
  const progress = questProgress(data);

  if (playing) {
    return <LevelPlayer key={playing.id + (playing.run || 0)} level={playing} onExit={() => setPlaying(null)} onPlay={(l) => setPlaying({ ...l, run: Date.now() })} />;
  }
  return <QuestMap progress={progress} onPlay={(l) => { setPlaying(l); window.scrollTo({ top: 0 }); }} />;
}

// ---------- Map ----------

function QuestMap({ progress, onPlay }) {
  const { rank, xp, stars, maxStars, badges, game, realDone, nextUp } = progress;
  const [openReal, setOpenReal] = useState(null);
  const pct = rank.next ? ((xp - rank.floor) / (rank.next - rank.floor)) * 100 : 100;
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="quest">
      <section className="card card-lilac quest-hero" aria-labelledby="quest-title">
        <QuestPlant stage={rank.index} />
        <div className="quest-hero-main">
          <p className="eyebrow primary">Money Quest</p>
          <h2 id="quest-title" className="display sm">Level {rank.index + 1} · {rank.title}</h2>
          <div className="xp-bar" role="progressbar" aria-valuemin={rank.floor} aria-valuemax={rank.next ?? xp} aria-valuenow={xp} aria-label="XP towards next rank">
            <span style={{ width: `${pct}%` }} />
          </div>
          <p className="small muted">{rank.next ? `${xp} XP · ${rank.next - xp} XP to ${rank.nextTitle}` : `${xp} XP · Top rank reached!`}</p>
          <div className="quest-stats">
            <span><Star size={16} aria-hidden="true" /> {stars}/{maxStars} stars</span>
            <span><Award size={16} aria-hidden="true" /> {earned}/{badges.length} badges</span>
            <span><Flame size={16} aria-hidden="true" /> Best streak {game.bestCombo || 0}</span>
          </div>
          {nextUp && (
            <button type="button" className="btn btn-primary" onClick={() => (nextUp.kind === "real" ? setOpenReal(nextUp.id) : onPlay(nextUp))}>
              {Object.keys(game.levels).length ? "Continue" : "Start"}: {nextUp.title} <ArrowRight size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      <p className="muted small quest-promise">Short games, no timers, no pressure. Replay any level to beat your best score.</p>

      <div className="zones">
        {ZONES.map((z) => {
          const levels = LEVELS.filter((l) => l.zone === z.id);
          const doneCount = levels.filter((l) => progress.done(l.id)).length;
          return (
            <section key={z.id} className={`zone zone-${z.tone}`} aria-labelledby={`zone-${z.id}`}>
              <header className="zone-head">
                <div>
                  <h3 id={`zone-${z.id}`} className="zone-title">{z.label}</h3>
                  <p className="muted small">{z.blurb}</p>
                </div>
                <span className="zone-count">{doneCount}/{levels.length}</span>
              </header>
              <ol className="path">
                {levels.map((l, i) => {
                  const unlocked = isUnlocked(l, game, realDone);
                  const done = progress.done(l.id);
                  const s = game.levels[l.id]?.stars || 0;
                  const isNext = nextUp?.id === l.id;
                  const real = l.kind === "real";
                  return (
                    <li key={l.id} className={`path-step ${i % 2 ? "alt" : ""}`}>
                      <button
                        type="button"
                        className={`node ${real ? "real" : ""} ${done ? "done" : ""} ${isNext ? "next" : ""}`}
                        disabled={!unlocked}
                        onClick={() => (real ? setOpenReal(openReal === l.id ? null : l.id) : onPlay(l))}
                        aria-expanded={real ? openReal === l.id : undefined}
                        aria-label={`${l.title}. ${real ? "Real-life challenge" : `${s} of 3 stars`}${done ? ", done" : ""}${!unlocked ? ", locked" : ""}`}
                      >
                        <span className="node-icon" aria-hidden="true">
                          {!unlocked ? <Lock size={22} /> : done && real ? <Check size={24} /> : <Icon name={l.icon} size={24} />}
                        </span>
                      </button>
                      <span className="node-label">
                        <strong>{l.title}</strong>
                        {real ? <small className="real-tag">Real life</small> : (
                          <span className="node-stars" aria-hidden="true">
                            {[1, 2, 3].map((n) => <Star key={n} size={14} className={n <= s ? "on" : ""} />)}
                          </span>
                        )}
                        {!unlocked && <small className="muted">Finish the one before</small>}
                      </span>
                      {real && openReal === l.id && (
                        <div className="real-panel card">
                          <p><strong>{l.challenge}</strong></p>
                          <p className="muted small">{l.why}</p>
                          {done ? (
                            <p className="good-text"><Check size={16} aria-hidden="true" /> Done! +{XP.real} XP</p>
                          ) : (
                            <Link to={l.action.to} state={l.action.state} className="btn btn-primary sm">{l.action.label} <ArrowRight size={16} aria-hidden="true" /></Link>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <section className="section" aria-labelledby="badges-title">
        <h3 id="badges-title" className="section-title">Badges</h3>
        <ul className="badges">
          {badges.map((b) => (
            <li key={b.id} className={`badge-tile ${b.earned ? "earned" : ""}`}>
              <span className="badge-icon" aria-hidden="true"><Icon name={b.icon} size={22} /></span>
              <strong>{b.title}</strong>
              <small className="muted">{b.desc}</small>
              <span className="sr-only">{b.earned ? "Earned" : "Not earned yet"}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---------- Level player ----------

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function LevelPlayer({ level, onExit, onPlay }) {
  const { data, actions } = useStore();
  const rounds = useMemo(() => (level.kind === "sort" ? shuffle(level.items) : level.rounds), [level]);
  const before = useRef(questProgress(data));
  const [phase, setPhase] = useState("intro");
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState({ correct: 0, xp: 0, combo: 0, bestCombo: 0 });
  const [result, setResult] = useState(null);

  const onResult = ({ correct, why }) => {
    const combo = correct ? score.combo + 1 : 0;
    const gained = correct ? XP.correct + (combo >= 3 ? XP.comboBonus : 0) : 0;
    setFeedback({ correct, why, gained, combo });
    setScore({ correct: score.correct + (correct ? 1 : 0), xp: score.xp + gained, combo, bestCombo: Math.max(score.bestCombo, combo) });
  };

  const next = () => {
    setFeedback(null);
    if (idx + 1 < rounds.length) { setIdx(idx + 1); return; }
    const stars = starsFor(score.correct, rounds.length);
    const xp = score.xp + stars * XP.star;
    const prevBest = data.game.levels[level.id];
    actions.recordLevel(level.id, { stars, xp, bestCombo: score.bestCombo });
    setResult({ stars, xp, newBest: !prevBest || stars > prevBest.stars || xp > prevBest.xp, prevStars: prevBest?.stars || 0 });
    setPhase("done");
  };

  const nextLevel = GAME_LEVELS[GAME_LEVELS.findIndex((l) => l.id === level.id) + 1];

  if (phase === "intro") {
    return (
      <section className="card level-intro" aria-labelledby="level-title">
        <button type="button" className="link-btn" onClick={onExit}><ArrowLeft size={16} aria-hidden="true" /> Quest map</button>
        <span className="level-icon" aria-hidden="true"><Icon name={level.icon} size={34} /></span>
        <p className="eyebrow primary">{ZONES.find((z) => z.id === level.zone).label} · {rounds.length} {level.kind === "sort" ? "cards" : "rounds"}</p>
        <h2 id="level-title" className="display sm">{level.title}</h2>
        <p className="lead">{level.intro}</p>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={() => setPhase("play")} autoFocus>Let's go <ArrowRight size={18} aria-hidden="true" /></button>
          <SpeakButton text={`${level.title}. ${level.intro}`} label="Read the intro" />
        </div>
      </section>
    );
  }

  if (phase === "done") {
    return <LevelResults level={level} result={result} total={rounds.length} correct={score.correct} before={before.current} onReplay={() => onPlay(level)} nextTitle={nextLevel?.title} onNext={nextLevel ? () => onPlay(nextLevel) : null} onExit={onExit} />;
  }

  const round = rounds[idx];
  const answered = !!feedback;

  return (
    <section className="card level-play" aria-labelledby="play-title">
      <header className="play-head">
        <button type="button" className="icon-btn ghost" onClick={onExit} aria-label="Back to quest map"><ArrowLeft size={18} /></button>
        <div className="play-progress" role="progressbar" aria-valuemin={0} aria-valuemax={rounds.length} aria-valuenow={idx + (answered ? 1 : 0)} aria-label="Level progress">
          <span style={{ width: `${((idx + (answered ? 1 : 0)) / rounds.length) * 100}%` }} />
        </div>
        <span className={`combo ${score.combo >= 2 ? "hot" : ""}`} aria-live="polite">
          <Flame size={16} aria-hidden="true" /> {score.combo}
          <span className="sr-only"> in a row</span>
        </span>
        <span className="xp-chip">{score.xp} XP</span>
      </header>
      <h2 id="play-title" className="sr-only">{level.title}, {idx + 1} of {rounds.length}</h2>

      {level.kind === "choice" && <ChoiceGame key={idx} round={round} answered={answered} onResult={onResult} />}
      {level.kind === "sort" && <SortGame key={idx} item={round} buckets={level.buckets} remaining={rounds.length - idx - 1} answered={answered} onResult={onResult} />}
      {level.kind === "price" && <PriceGame key={idx} round={round} answered={answered} onResult={onResult} />}
      {level.kind === "budget" && <BudgetGame key={idx} round={round} answered={answered} onResult={onResult} />}

      {feedback && (
        <div className={`quest-feedback ${feedback.correct ? "good" : "bad"}`} role="status">
          <div className="qf-head">
            <strong>{feedback.correct ? (feedback.combo >= 3 ? `${feedback.combo} in a row!` : ["Nice!", "Spot on!", "Yes!", "Great thinking!"][idx % 4]) : "Not quite — here's why"}</strong>
            {feedback.gained > 0 && <span className="xp-pop">+{feedback.gained} XP</span>}
          </div>
          <p>{feedback.why}</p>
          <div className="row">
            <button type="button" className="btn btn-primary" onClick={next} autoFocus>
              {idx + 1 < rounds.length ? "Next" : "See results"} <ArrowRight size={18} aria-hidden="true" />
            </button>
            <SpeakButton text={feedback.why} label="Read the explanation" />
          </div>
        </div>
      )}
    </section>
  );
}

// ---------- Results ----------

function LevelResults({ level, result, total, correct, before, nextTitle, onReplay, onNext, onExit }) {
  const { data } = useStore();
  const after = questProgress(data);
  const newBadges = after.badges.filter((b) => b.earned && !before.badges.find((x) => x.id === b.id)?.earned);
  const rankUp = after.rank.index > before.rank.index;
  const msg = result.stars === 3 ? "Brilliant!" : result.stars === 2 ? "Good work!" : "Level complete!";

  return (
    <section className="card level-results" aria-labelledby="res-title">
      {result.stars === 3 && <div className="confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ "--i": i }} />)}</div>}
      <div className="result-stars" role="img" aria-label={`${result.stars} out of 3 stars`}>
        {[1, 2, 3].map((n) => <Star key={n} size={48} className={n <= result.stars ? "on" : ""} style={{ "--d": `${n * 0.15}s` }} />)}
      </div>
      <h2 id="res-title" className="display sm center-text">{msg}</h2>
      <p className="center-text muted">{correct} of {total} right · {result.xp} XP{result.newBest && result.prevStars ? " · New best!" : ""}</p>

      {(rankUp || newBadges.length > 0) && (
        <div className="unlocks">
          {rankUp && (
            <div className="unlock">
              <QuestPlant stage={after.rank.index} size={64} />
              <span><strong>You grew! Level {after.rank.index + 1} · {after.rank.title}</strong><small className="muted">{after.xp} XP</small></span>
            </div>
          )}
          {newBadges.map((b) => (
            <div key={b.id} className="unlock">
              <span className="badge-icon big" aria-hidden="true"><Icon name={b.icon} size={26} /></span>
              <span><strong>New badge: {b.title}</strong><small className="muted">{b.desc}</small></span>
            </div>
          ))}
        </div>
      )}

      <div className="takeaway">
        <p className="eyebrow">Remember this</p>
        <p className="lead">{level.takeaway}</p>
        <Link to={level.realLink.to} state={level.realLink.state} className="text-link">{level.realLink.label} <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>

      <div className="row center-row">
        {onNext && <button type="button" className="btn btn-primary" onClick={onNext} autoFocus>Next: {nextTitle} <ArrowRight size={18} aria-hidden="true" /></button>}
        {result.stars < 3 && <button type="button" className="btn btn-soft" onClick={onReplay}><RotateCcw size={18} aria-hidden="true" /> Try for 3 stars</button>}
        <button type="button" className="btn btn-soft" onClick={onExit}>Quest map</button>
      </div>
    </section>
  );
}

export function questSummary(data) {
  const p = questProgress(data);
  return { title: rankFor(p.xp).title, stars: p.stars, maxStars: p.maxStars, xp: p.xp };
}
