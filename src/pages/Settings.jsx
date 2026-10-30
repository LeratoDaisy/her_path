import { Accessibility, Moon, RotateCcw, Sun, User, Volume2 } from "lucide-react";
import { useStore } from "../store.jsx";
import { ALL_INTERESTS, ALL_SKILLS } from "../data/opportunities.js";
import { speak, speechSupported } from "../speech.jsx";

export default function Settings() {
  const { data, actions, prefs, setPrefs } = useStore();
  const p = data.profile;
  const toggleIn = (key, v) => actions.setProfile({ [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v] });

  return (
    <div className="page">
      <h1 className="page-title">Profile & settings</h1>

      <section className="card" aria-labelledby="prof-title">
        <h2 id="prof-title" className="card-title"><User size={18} aria-hidden="true" /> About you</h2>
        <div className="form grid-2">
          <label>Your name<input value={p.name} onChange={(e) => actions.setProfile({ name: e.target.value })} /></label>
          <label>Business name<input value={p.business} onChange={(e) => actions.setProfile({ business: e.target.value })} /></label>
          <label>Location<input value={p.location} onChange={(e) => actions.setProfile({ location: e.target.value })} placeholder="Town, Province" /></label>
          <label>Education<input value={p.education} onChange={(e) => actions.setProfile({ education: e.target.value })} /></label>
          <label className="span-2">About you<textarea rows={2} value={p.about} onChange={(e) => actions.setProfile({ about: e.target.value })} /></label>
          <fieldset className="span-2">
            <legend>Your skills</legend>
            <div className="chip-row">
              {[...new Set([...ALL_SKILLS, ...p.skills])].map((s) => (
                <button key={s} type="button" className={`chip-btn ${p.skills.includes(s) ? "on" : ""}`} aria-pressed={p.skills.includes(s)} onClick={() => toggleIn("skills", s)}>{s}</button>
              ))}
            </div>
          </fieldset>
          <fieldset className="span-2">
            <legend>Interests</legend>
            <div className="chip-row">
              {ALL_INTERESTS.map((s) => (
                <button key={s} type="button" className={`chip-btn ${p.interests.includes(s) ? "on" : ""}`} aria-pressed={p.interests.includes(s)} onClick={() => toggleIn("interests", s)}>{s}</button>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className="card" aria-labelledby="look-title">
        <h2 id="look-title" className="card-title">Appearance</h2>
        <div className="segmented" role="radiogroup" aria-label="Theme">
          <button type="button" role="radio" aria-checked={prefs.theme === "light"} className={prefs.theme === "light" ? "on" : ""} onClick={() => setPrefs({ ...prefs, theme: "light" })}><Sun size={16} aria-hidden="true" /> Light</button>
          <button type="button" role="radio" aria-checked={prefs.theme === "dark"} className={prefs.theme === "dark" ? "on" : ""} onClick={() => setPrefs({ ...prefs, theme: "dark" })}><Moon size={16} aria-hidden="true" /> Dark</button>
        </div>
        <label className="check"><input type="checkbox" checked={prefs.largeText} onChange={(e) => setPrefs({ ...prefs, largeText: e.target.checked })} /> Larger text</label>
      </section>

      <section className="card" aria-labelledby="a11y-title">
        <h2 id="a11y-title" className="card-title"><Accessibility size={18} aria-hidden="true" /> Audio & accessibility</h2>
        {speechSupported ? (
          <div className="form">
            <label className="check">
              <input type="checkbox" checked={prefs.speakOnFocus} onChange={(e) => setPrefs({ ...prefs, speakOnFocus: e.target.checked })} />
              Read out buttons and fields as I move through them (Tab key)
            </label>
            <label>Reading speed: {prefs.speechRate.toFixed(1)}×
              <input type="range" min="0.6" max="1.6" step="0.1" value={prefs.speechRate} onChange={(e) => setPrefs({ ...prefs, speechRate: Number(e.target.value) })} />
            </label>
            <button type="button" className="btn btn-soft" onClick={() => speak(`Hi ${p.name}. This is how HerPath sounds. You can press Listen at the top of any page to hear it read aloud.`)}>
              <Volume2 size={18} aria-hidden="true" /> Test the voice
            </button>
            <p className="small muted">Look for the speaker icon on cards to hear just that part. In the coach, use the microphone to speak your question.</p>
          </div>
        ) : (
          <p className="muted">Your browser doesn't support read-aloud. Try Chrome, Edge or Safari.</p>
        )}
      </section>

      <section className="card" aria-labelledby="data-title">
        <h2 id="data-title" className="card-title">Your data</h2>
        <p className="muted small">HerPath keeps your money and work records on this device.</p>
        <button type="button" className="btn btn-soft" onClick={() => { if (confirm("Reset everything back to the demo data?")) actions.reset(); }}>
          <RotateCcw size={18} aria-hidden="true" /> Reset demo data
        </button>
      </section>
    </div>
  );
}
