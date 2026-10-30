# HerPath

**Turn what you have into what's next.**

HerPath is one economic-empowerment journey for women: from skills → financial confidence → opportunity → income.

| Step | Section | What it does |
|---|---|---|
| Manage | **HerWallet** | Track money in/out, monthly budgets, savings & business goals, spending chart and plain-language insights |
| Learn | **MoneyMap** | "Glow Body Butter" business simulation (buy ingredients, calculate cost per unit, price, handle discounts, surprise expenses, save/reinvest/borrow) + **Thandi**, an AI business coach powered by Claude |
| Prove | **ProofPocket** | Digital work passport: log jobs, payments, photos and skills; customers verify via a link/QR; share your passport by QR, link or WhatsApp |
| Grow | **Next Move** | Opportunities ranked by your skills, interests, location and verified proof; CV builder (auto-filled, printable) with matching jobs; Funding Finder with a funding-readiness checklist |

Also: light/dark mode, read-aloud on every page and card, speak-on-focus mode for screen-free navigation, voice input for the coach, larger-text option, keyboard-accessible tabs, mobile bottom navigation.

## Run it

```bash
npm install
cp .env.example .env      # add ANTHROPIC_API_KEY to enable the AI coach
npm run dev               # web on http://localhost:5173, API on :3001
```

Production: `npm run build && npm start` → http://localhost:3001

Without an API key everything works; the coach answers with built-in tips.

## Notes

- User data (wallet, jobs, profile) is stored in the browser's localStorage. Customer verifications are stored by the server in `data/verifications.json` so a customer on another phone can verify a job.
- Passport and verify links contain the data in the URL, so they work on any device that can reach the server — deploy it publicly for links shared over WhatsApp to work.
- Opportunities and funding listings are sample data for the demo; funding descriptions are general summaries, so confirm details on each provider's website.
