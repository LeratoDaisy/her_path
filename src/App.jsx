import { HashRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Compass, FolderOpen, Home as HomeIcon, Map, Moon, Settings as SettingsIcon, Sun, Volume2, Wallet } from "lucide-react";
import { StoreProvider, useStore } from "./store.jsx";
import { readPage, speechSupported, stopSpeaking, useSpeakOnFocus } from "./speech.jsx";
import Home from "./pages/Home.jsx";
import HerWallet from "./pages/HerWallet.jsx";
import MoneyMap from "./pages/MoneyMap.jsx";
import ProofPocket from "./pages/ProofPocket.jsx";
import NextMove from "./pages/NextMove.jsx";
import Settings from "./pages/Settings.jsx";
import Passport from "./pages/Passport.jsx";
import Verify from "./pages/Verify.jsx";
import Logo from "./components/Logo.jsx";

const NAV = [
  { to: "/", label: "Home", icon: HomeIcon, end: true },
  { to: "/wallet", label: "HerWallet", icon: Wallet, step: "Manage" },
  { to: "/moneymap", label: "MoneyMap", icon: Map, step: "Learn" },
  { to: "/proof", label: "ProofPocket", icon: FolderOpen, step: "Prove" },
  { to: "/next-move", label: "Next Move", icon: Compass, step: "Grow", badge: "For you" },
];

function ThemeToggle() {
  const { prefs, setPrefs } = useStore();
  const dark = prefs.theme === "dark";
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => setPrefs((p) => ({ ...p, theme: dark ? "light" : "dark" }))}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function Shell({ children }) {
  const { data, saveError } = useStore();
  const { pathname } = useLocation();
  useSpeakOnFocus();
  useEffect(() => { stopSpeaking(); window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="shell">
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>Skip to content</a>
      <aside className="sidebar">
        <Logo />
        <p className="tagline">Turn what you have into what's next.</p>
        <nav aria-label="Main">
          {NAV.map(({ to, label, icon: Icon, end, badge, step }) => (
            <NavLink key={to} to={to} end={end} className="nav-link">
              <Icon size={22} aria-hidden="true" />
              <span className="nav-label">{label}</span>
              {step && <span className="nav-step">{step}</span>}
              {badge && <span className="badge">{badge}</span>}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/settings" className="profile-chip" aria-label="Profile and settings">
          <span className="avatar" aria-hidden="true">{data.profile.name.slice(0, 1).toUpperCase()}</span>
          <span>
            <strong>{data.profile.name}</strong>
            <small>{data.profile.business}</small>
          </span>
          <SettingsIcon size={18} className="muted" aria-hidden="true" />
        </NavLink>
      </aside>

      <div className="content">
        <header className="topbar">
          <div className="topbar-logo"><Logo /></div>
          <div className="topbar-actions">
            {speechSupported && (
              <button type="button" className="pill-btn" onClick={readPage} aria-label="Listen to this page">
                <Volume2 size={18} aria-hidden="true" /> <span className="hide-sm">Listen</span>
              </button>
            )}
            <ThemeToggle />
          </div>
        </header>
        {saveError && <div className="banner warn" role="alert">{saveError}</div>}
        <main id="main" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/passport/:payload" element={<Passport />} />
          <Route path="/verify/:payload" element={<Verify />} />
          <Route
            path="*"
            element={
              <Shell>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/wallet" element={<HerWallet />} />
                  <Route path="/moneymap" element={<MoneyMap />} />
                  <Route path="/proof" element={<ProofPocket />} />
                  <Route path="/next-move" element={<NextMove />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Home />} />
                </Routes>
              </Shell>
            }
          />
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
