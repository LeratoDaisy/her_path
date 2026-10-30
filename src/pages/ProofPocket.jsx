import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { BadgeCheck, Camera, Clock, Plus, QrCode, Star, Trash2, Wrench, X } from "lucide-react";
import { proofStats, rand, useStore } from "../store.jsx";
import { ALL_SKILLS } from "../data/opportunities.js";
import { appUrl, passportPayload, resizeImage, verifyPayload } from "../share.js";
import ShareDialog from "../components/ShareDialog.jsx";

export default function ProofPocket() {
  const { data, actions } = useStore();
  const location = useLocation();
  const [adding, setAdding] = useState(!!location.state?.add);
  const [share, setShare] = useState(null);
  const stats = proofStats(data.jobs);
  const jobIds = data.jobs.map((j) => j.id).join(",");

  // Pull in verifications customers left via their verify link.
  useEffect(() => {
    if (!jobIds) return;
    fetch(`/api/verifications?jobs=${encodeURIComponent(jobIds)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => list.length && actions.mergeVerifications(list))
      .catch(() => {});
  }, [jobIds, actions]);

  const openPassport = () =>
    setShare({
      title: "Share your work passport",
      description: "Clients, employers and partners can scan this QR code or open the link to see your verified work.",
      url: appUrl(`/passport/${passportPayload(data)}`),
      message: `Here's my HerPath work passport — ${stats.verifiedJobs} verified jobs.`,
    });

  const openVerify = (job) =>
    setShare({
      title: "Ask your customer to verify",
      description: `Send this to ${job.client || "your customer"}. They can confirm the job and leave a short review — no app or account needed.`,
      url: appUrl(`/verify/${verifyPayload(job, data.profile.name)}`),
      message: `Hi! Please confirm the "${job.title}" job I did for you on HerPath:`,
    });

  return (
    <div className="page">
      <p className="eyebrow">Prove</p>
      <h1 className="page-title">ProofPocket</h1>
      <p className="lead-muted">Your digital work passport. Record the work you do, get customers to confirm it, and share portable proof of your skills.</p>

      <div className="stat-row proof-stats">
        <div className="card stat"><BadgeCheck className="stat-icon mint" aria-hidden="true" /><strong>{stats.verifiedJobs}</strong><span className="muted">verified jobs</span></div>
        <div className="card stat"><Wrench className="stat-icon lilac" aria-hidden="true" /><strong>{stats.skills}</strong><span className="muted">skills demonstrated</span></div>
        <div className="card stat"><span className="stat-icon peach rand-icon" aria-hidden="true">R</span><strong>{rand(stats.earnings)}</strong><span className="muted">recorded earnings</span></div>
        <div className="card stat"><Star className="stat-icon rose" aria-hidden="true" /><strong>{stats.verifications}</strong><span className="muted">customer verifications</span></div>
      </div>

      <div className="row">
        <button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={18} aria-hidden="true" /> Log a job</button>
        <button className="btn btn-soft" onClick={openPassport}><QrCode size={18} aria-hidden="true" /> Share my passport</button>
      </div>

      {adding && <JobForm onClose={() => setAdding(false)} />}

      <ul className="job-list">
        {data.jobs.map((job) => <JobCard key={job.id} job={job} onVerify={() => openVerify(job)} />)}
        {!data.jobs.length && <li className="muted">No jobs yet. Log your first one — every job counts.</li>}
      </ul>

      <ShareDialog open={!!share} onClose={() => setShare(null)} {...(share || {})} />
    </div>
  );
}

function JobCard({ job, onVerify }) {
  const { actions } = useStore();
  const fileRef = useRef(null);
  const verified = job.verifications.length > 0;

  const addPhotos = async (files) => {
    const imgs = await Promise.all([...files].slice(0, 4).map((f) => resizeImage(f)));
    actions.updateJob(job.id, { photos: [...job.photos, ...imgs].slice(-6) });
  };

  return (
    <li className="card job">
      <div className="job-head">
        <div>
          <h2 className="job-title">{job.title}</h2>
          <p className="muted small">{job.client} · {new Date(job.date).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })} · {rand(job.amount)}</p>
        </div>
        {verified
          ? <span className="status good"><BadgeCheck size={16} aria-hidden="true" /> Verified</span>
          : <span className="status pending"><Clock size={16} aria-hidden="true" /> Not verified yet</span>}
      </div>
      {job.description && <p>{job.description}</p>}
      <ul className="chip-row" aria-label="Skills used">
        {job.skills.map((s) => <li key={s} className="chip">{s}</li>)}
      </ul>

      {job.photos.length > 0 && (
        <div className="photos">
          {job.photos.map((p, i) => (
            <div key={i} className="photo">
              <img src={p} alt={`Photo ${i + 1} of ${job.title}`} />
              <button className="icon-btn tiny" onClick={() => actions.updateJob(job.id, { photos: job.photos.filter((_, n) => n !== i) })} aria-label={`Remove photo ${i + 1}`}><X size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {job.verifications.map((v) => (
        <blockquote key={v.id} className="review">
          <span className="stars" aria-label={`${v.rating} out of 5 stars`}>{"★".repeat(v.rating)}{"☆".repeat(5 - v.rating)}</span>
          {v.comment && <p>"{v.comment}"</p>}
          <footer>— {v.name}</footer>
        </blockquote>
      ))}

      <div className="row">
        <button className="btn btn-soft sm" onClick={onVerify}><BadgeCheck size={16} aria-hidden="true" /> {verified ? "Get another review" : "Ask customer to verify"}</button>
        <button className="btn btn-soft sm" onClick={() => fileRef.current?.click()}><Camera size={16} aria-hidden="true" /> Add photos</button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
        <button className="icon-btn ghost push-right" onClick={() => { if (confirm(`Delete "${job.title}"?`)) actions.removeJob(job.id); }} aria-label={`Delete job ${job.title}`}><Trash2 size={16} /></button>
      </div>
    </li>
  );
}

function JobForm({ onClose }) {
  const { data, actions } = useStore();
  const [form, setForm] = useState({ title: "", client: "", date: new Date().toISOString().slice(0, 10), amount: "", description: "", skills: [] });
  const [custom, setCustom] = useState("");
  const [photos, setPhotos] = useState([]);
  const [alsoWallet, setAlsoWallet] = useState(true);
  const skillOptions = [...new Set([...data.profile.skills, ...ALL_SKILLS])];

  const toggle = (s) => setForm((f) => ({ ...f, skills: f.skills.includes(s) ? f.skills.filter((x) => x !== s) : [...f.skills, s] }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const amount = Number(form.amount) || 0;
    actions.addJob({ ...form, title: form.title.trim(), client: form.client.trim() || "Customer", amount, photos });
    if (alsoWallet && amount > 0) actions.addTransaction({ type: "in", amount, category: "Side job", note: form.title.trim(), date: form.date });
    onClose();
  };

  return (
    <section className="card form-card" aria-labelledby="job-form-title">
      <div className="card-head">
        <h2 id="job-form-title" className="card-title">Log a job</h2>
        <button className="icon-btn ghost" onClick={onClose} aria-label="Close form"><X size={18} /></button>
      </div>
      <form className="form grid-2" onSubmit={submit}>
        <label>What did you do?
          <input autoFocus required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Catered a wedding for 80 guests" />
        </label>
        <label>Who was it for?
          <input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Customer or company name" />
        </label>
        <label>Date
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </label>
        <label>Payment received (R)
          <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </label>
        <label className="span-2">Describe the work <span className="muted">(optional)</span>
          <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <fieldset className="span-2">
          <legend>Skills you used</legend>
          <div className="chip-row">
            {skillOptions.map((s) => (
              <button type="button" key={s} className={`chip-btn ${form.skills.includes(s) ? "on" : ""}`} aria-pressed={form.skills.includes(s)} onClick={() => toggle(s)}>{s}</button>
            ))}
          </div>
          <div className="row-form">
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add another skill" aria-label="Add another skill" />
            <button type="button" className="btn btn-soft sm" onClick={() => { const s = custom.trim(); if (s && !form.skills.includes(s)) setForm((f) => ({ ...f, skills: [...f.skills, s] })); setCustom(""); }}>Add</button>
          </div>
        </fieldset>
        <label className="span-2">Photos of your work <span className="muted">(optional)</span>
          <input type="file" accept="image/*" multiple onChange={async (e) => setPhotos(await Promise.all([...e.target.files].slice(0, 4).map((f) => resizeImage(f))))} />
        </label>
        {photos.length > 0 && <div className="photos span-2">{photos.map((p, i) => <div key={i} className="photo"><img src={p} alt={`New photo ${i + 1}`} /></div>)}</div>}
        <label className="check span-2">
          <input type="checkbox" checked={alsoWallet} onChange={(e) => setAlsoWallet(e.target.checked)} /> Also add the payment to HerWallet as money in
        </label>
        <div className="row span-2">
          <button className="btn btn-primary" type="submit"><Plus size={18} aria-hidden="true" /> Save job</button>
          <button className="btn btn-soft" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
