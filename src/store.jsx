import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createSeed } from "./data/seed.js";
import { OPPORTUNITIES } from "./data/opportunities.js";

const DATA_KEY = "herpath:data:v1";
const PREFS_KEY = "herpath:prefs";

const StoreContext = createContext(null);

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback();
  } catch {
    return fallback();
  }
}

export const uid = (p = "id") => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function StoreProvider({ children }) {
  const [data, setData] = useState(() => load(DATA_KEY, createSeed));
  const [prefs, setPrefs] = useState(() =>
    load(PREFS_KEY, () => ({
      theme: document.documentElement.dataset.theme || "light",
      speakOnFocus: false,
      speechRate: 1,
      largeText: false,
    })),
  );
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
      setSaveError(null);
    } catch {
      setSaveError("Your phone's storage is full. Try removing some photos from ProofPocket.");
    }
  }, [data]);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.classList.toggle("large-text", !!prefs.largeText);
  }, [prefs]);

  const update = useCallback((fn) => setData((d) => fn(structuredClone(d)) ?? d), []);

  const actions = useMemo(
    () => ({
      setProfile: (profile) => update((d) => { d.profile = { ...d.profile, ...profile }; return d; }),
      addTransaction: (t) => update((d) => { d.transactions.unshift({ id: uid("t"), ...t }); return d; }),
      removeTransaction: (id) => update((d) => { d.transactions = d.transactions.filter((t) => t.id !== id); return d; }),
      setBudget: (category, amount) => update((d) => {
        if (amount > 0) d.budgets[category] = amount; else delete d.budgets[category];
        return d;
      }),
      addGoal: (g) => update((d) => { d.goals.push({ id: uid("g"), saved: 0, ...g }); return d; }),
      contributeGoal: (id, amount) => update((d) => {
        const g = d.goals.find((x) => x.id === id);
        if (g) g.saved = Math.max(0, g.saved + amount);
        return d;
      }),
      removeGoal: (id) => update((d) => { d.goals = d.goals.filter((g) => g.id !== id); return d; }),
      addJob: (job) => update((d) => { d.jobs.unshift({ id: uid("j"), photos: [], verifications: [], ...job }); return d; }),
      updateJob: (id, patch) => update((d) => {
        const j = d.jobs.find((x) => x.id === id);
        if (j) Object.assign(j, patch);
        return d;
      }),
      removeJob: (id) => update((d) => { d.jobs = d.jobs.filter((j) => j.id !== id); return d; }),
      mergeVerifications: (remote) => update((d) => {
        for (const v of remote) {
          const j = d.jobs.find((x) => x.id === v.jobId);
          if (j && !j.verifications.some((x) => x.id === v.id)) j.verifications.push(v);
        }
        return d;
      }),
      recordSimulation: (result) => update((d) => {
        d.simulation.completed.push(result);
        if (!d.simulation.best || result.score > d.simulation.best.score) d.simulation.best = result;
        return d;
      }),
      setCoachHistory: (history) => update((d) => { d.coachHistory = history.slice(-30); return d; }),
      reset: () => setData(createSeed()),
    }),
    [update],
  );

  const value = useMemo(() => ({ data, prefs, setPrefs, actions, saveError }), [data, prefs, actions, saveError]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

// ---------- Derived values ----------

export const rand = (n) =>
  "R" + Math.round(n).toLocaleString("en-ZA").replace(/,/g, " ");

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthSummary(transactions, key = monthKey()) {
  const inMonth = transactions.filter((t) => t.date.startsWith(key));
  const moneyIn = inMonth.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0);
  const moneyOut = inMonth.filter((t) => t.type === "out").reduce((s, t) => s + t.amount, 0);
  const byCategory = {};
  for (const t of inMonth.filter((t) => t.type === "out")) byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  return { moneyIn, moneyOut, left: moneyIn - moneyOut, byCategory, count: inMonth.length };
}

export function proofStats(jobs) {
  const verifiedJobs = jobs.filter((j) => j.verifications.length > 0);
  const skills = new Set(jobs.flatMap((j) => j.skills));
  const ratings = jobs.flatMap((j) => j.verifications.map((v) => v.rating));
  return {
    jobs: jobs.length,
    verifiedJobs: verifiedJobs.length,
    skills: skills.size,
    skillList: [...skills],
    earnings: jobs.reduce((s, j) => s + (Number(j.amount) || 0), 0),
    verifications: ratings.length,
    avgRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
  };
}

/** Score each opportunity against the user's skills, interests and proof. */
export function matchOpportunities(data, list = OPPORTUNITIES) {
  const stats = proofStats(data.jobs);
  const mySkills = new Set([...data.profile.skills, ...stats.skillList].map((s) => s.toLowerCase()));
  const myInterests = new Set(data.profile.interests.map((s) => s.toLowerCase()));
  const myCity = data.profile.location.split(",")[0].trim().toLowerCase();

  return list
    .map((o) => {
      const matched = o.skills.filter((s) => mySkills.has(s.toLowerCase()));
      const missing = o.skills.filter((s) => !mySkills.has(s.toLowerCase()));
      const interestHit = o.interests.some((i) => myInterests.has(i.toLowerCase()));
      const local = o.location.toLowerCase().includes(myCity) || o.location === "Online";
      const proofOk = !o.needs?.verifiedJobs || stats.verifiedJobs >= o.needs.verifiedJobs;

      let score = (matched.length / o.skills.length) * 70;
      if (interestHit) score += 15;
      if (local) score += 10;
      if (o.needs?.verifiedJobs) score += proofOk ? 5 : -15;
      score = Math.max(0, Math.min(100, Math.round(score)));

      const reasons = [];
      if (matched.length) reasons.push(`You have ${matched.length} of ${o.skills.length} skills: ${matched.join(", ")}`);
      if (o.needs?.verifiedJobs) {
        reasons.push(proofOk
          ? `Asks for ${o.needs.verifiedJobs}+ verified jobs — you have ${stats.verifiedJobs}`
          : `Asks for ${o.needs.verifiedJobs}+ verified jobs — you have ${stats.verifiedJobs} so far`);
      }
      if (local) reasons.push(o.location === "Online" ? "Online — join from anywhere" : `Near you in ${o.location}`);

      return { ...o, score, matched, missing, reasons, proofOk };
    })
    .sort((a, b) => b.score - a.score);
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
