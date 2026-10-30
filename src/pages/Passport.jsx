import { useParams } from "react-router-dom";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import Logo from "../components/Logo.jsx";
import { decodePayload } from "../share.js";
import { rand } from "../store.jsx";

/** Public, read-only work passport rendered entirely from the link. */
export default function Passport() {
  const { payload } = useParams();
  const p = decodePayload(payload);

  if (!p) return <PublicFrame><p>This passport link is broken or incomplete. Ask the owner to share it again.</p></PublicFrame>;

  const verified = p.j.filter((j) => j.v.length);
  const reviews = p.j.flatMap((j) => j.v);
  const skills = new Set([...p.s, ...p.j.flatMap((j) => j.s)]);
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.r, 0) / reviews.length).toFixed(1) : null;

  return (
    <PublicFrame>
      <header className="passport-head card card-lilac">
        <span className="avatar xl" aria-hidden="true">{p.n.slice(0, 1)}</span>
        <div>
          <p className="eyebrow primary">HerPath work passport</p>
          <h1 className="hero-title sm">{p.n}</h1>
          <p className="lead">{p.b}</p>
          <p className="muted"><MapPin size={14} aria-hidden="true" /> {p.l}</p>
        </div>
      </header>
      {p.a && <p className="lead">{p.a}</p>}

      <div className="stat-row">
        <div className="card stat"><strong>{verified.length}</strong><span className="muted">verified jobs</span></div>
        <div className="card stat"><strong>{skills.size}</strong><span className="muted">skills</span></div>
        <div className="card stat"><strong>{rand(p.j.reduce((s, j) => s + (j.a || 0), 0))}</strong><span className="muted">recorded earnings</span></div>
        <div className="card stat"><strong>{reviews.length}</strong><span className="muted">customer verifications{avg ? ` · ${avg}★` : ""}</span></div>
      </div>

      <section className="section">
        <h2 className="section-title">Skills</h2>
        <ul className="chip-row">{[...skills].map((s) => <li className="chip" key={s}>{s}</li>)}</ul>
      </section>

      <section className="section">
        <h2 className="section-title">Work history</h2>
        <ul className="job-list">
          {p.j.map((j, i) => (
            <li key={i} className="card job">
              <div className="job-head">
                <div>
                  <h3 className="job-title">{j.t}</h3>
                  <p className="muted small">{new Date(j.d).toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}</p>
                </div>
                {j.v.length > 0 && <span className="status good"><BadgeCheck size={16} aria-hidden="true" /> Customer verified</span>}
              </div>
              <ul className="chip-row">{j.s.map((s) => <li className="chip" key={s}>{s}</li>)}</ul>
              {j.v.map((v, k) => (
                <blockquote key={k} className="review">
                  <span className="stars" aria-label={`${v.r} out of 5 stars`}><Star size={14} aria-hidden="true" /> {v.r}/5</span>
                  {v.c && <p>"{v.c}"</p>}
                  <footer>— {v.n}</footer>
                </blockquote>
              ))}
            </li>
          ))}
        </ul>
      </section>
    </PublicFrame>
  );
}

export function PublicFrame({ children }) {
  return (
    <div className="public">
      <div className="public-bar"><a href="#/" aria-label="HerPath home"><Logo /></a></div>
      <main id="main" className="page public-main">{children}</main>
      <footer className="public-foot muted small">Built with HerPath · Turn what you have into what's next.</footer>
    </div>
  );
}
