import { useEffect, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { useStore } from "./store.jsx";

export const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;

let rate = 1;
export function setSpeechRate(r) { rate = r; }

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === "en-ZA") || voices.find((v) => v.lang.startsWith("en-GB")) || voices.find((v) => v.lang.startsWith("en"));
}

// Rands read better as "R 1 800" than "R1 800" with most voices.
const forSpeech = (text) => text.replace(/R(\d)/g, "R $1").replace(/\s+/g, " ").trim();

export function speak(text, { onEnd } = {}) {
  if (!speechSupported || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(forSpeech(text));
  u.rate = rate;
  const voice = pickVoice();
  if (voice) u.voice = voice;
  if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (speechSupported) window.speechSynthesis.cancel();
}

/** Speaker button that reads `text` (or the result of `getText()`) aloud. */
export function SpeakButton({ text, getText, label = "Read aloud", className = "" }) {
  const [playing, setPlaying] = useState(false);
  if (!speechSupported) return null;
  const toggle = () => {
    if (playing) { stopSpeaking(); setPlaying(false); return; }
    setPlaying(true);
    speak(getText ? getText() : text, { onEnd: () => setPlaying(false) });
  };
  return (
    <button type="button" className={`icon-btn ${className}`} onClick={toggle} aria-label={playing ? "Stop reading" : label} title={playing ? "Stop reading" : label} aria-pressed={playing}>
      {playing ? <Square size={16} /> : <Volume2 size={18} />}
    </button>
  );
}

/** When enabled, announce whatever receives keyboard focus. */
export function useSpeakOnFocus() {
  const { prefs } = useStore();
  useEffect(() => { setSpeechRate(prefs.speechRate); }, [prefs.speechRate]);
  useEffect(() => {
    if (!prefs.speakOnFocus || !speechSupported) return;
    const onFocus = (e) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      let text = el.getAttribute("aria-label") || "";
      if (!text && el.id) text = document.querySelector(`label[for="${el.id}"]`)?.innerText || "";
      if (!text) text = el.closest("label")?.innerText || el.innerText || el.getAttribute("placeholder") || "";
      const role = el.tagName === "A" ? "link" : el.tagName === "BUTTON" ? "button" : el.matches("input, select, textarea") ? "field" : "";
      if (text) speak(`${text.slice(0, 160)}${role ? `, ${role}` : ""}`);
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [prefs.speakOnFocus]);
}

/** Read the main page content aloud. */
export function readPage() {
  const main = document.querySelector("main");
  if (!main) return;
  const clone = main.cloneNode(true);
  clone.querySelectorAll("[aria-hidden='true'], svg, .no-read").forEach((n) => n.remove());
  speak(clone.innerText);
}

const Recognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const voiceInputSupported = !!Recognition;

/** One-shot dictation. Calls onText with the transcript. */
export function listenOnce(onText, onDone) {
  if (!Recognition) return null;
  const r = new Recognition();
  r.lang = "en-ZA";
  r.interimResults = false;
  r.onresult = (e) => onText(e.results[0][0].transcript);
  r.onend = onDone;
  r.onerror = onDone;
  r.start();
  return r;
}
