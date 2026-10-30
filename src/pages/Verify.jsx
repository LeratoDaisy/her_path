import { useState } from "react";
import { useParams } from "react-router-dom";
import { BadgeCheck, Send } from "lucide-react";
import { decodePayload } from "../share.js";
import { PublicFrame } from "./Passport.jsx";

/** Public page a customer opens to confirm a job and leave a review. */
export default function Verify() {
  const { payload } = useParams();
  const job = decodePayload(payload);
  const [form, setForm] = useState({ name: "", rating: 0, comment: "", confirm: false });
  const [status, setStatus] = useState("idle");

  if (!job) return <PublicFrame><p>This verification link is broken. Please ask for a new one.</p></PublicFrame>;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.confirm || !form.rating || !form.name.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, name: form.name, rating: form.rating, comment: form.comment }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <PublicFrame>
        <section className="card center">
          <BadgeCheck size={48} className="good-icon" aria-hidden="true" />
          <h1 className="page-title">Thank you!</h1>
          <p className="lead">Your confirmation has been added to {job.w}'s work passport. It helps her prove her experience to new clients and employers.</p>
        </section>
      </PublicFrame>
    );
  }

  return (
    <PublicFrame>
      <section className="card verify-card" aria-labelledby="verify-title">
        <p className="eyebrow primary">Confirm completed work</p>
        <h1 id="verify-title" className="page-title">Did {job.w} do this job for you?</h1>
        <p className="lead"><strong>{job.t}</strong><br /><span className="muted">{new Date(job.d).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</span></p>
        <form className="form" onSubmit={submit}>
          <label>Your name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
          </label>
          <fieldset>
            <legend>How would you rate the work?</legend>
            <div className="rating" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} role="radio" aria-checked={form.rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} className={n <= form.rating ? "on" : ""} onClick={() => setForm({ ...form, rating: n })}>★</button>
              ))}
            </div>
          </fieldset>
          <label>Anything you'd like to say? <span className="muted">(optional)</span>
            <textarea rows={3} maxLength={500} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          </label>
          <label className="check">
            <input type="checkbox" checked={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.checked })} required /> I confirm this work was completed for me.
          </label>
          {status === "error" && <p className="negative" role="alert">Something went wrong. Please try again.</p>}
          <button className="btn btn-primary" type="submit" disabled={status === "sending" || !form.rating}><Send size={18} aria-hidden="true" /> Confirm job</button>
        </form>
      </section>
    </PublicFrame>
  );
}
