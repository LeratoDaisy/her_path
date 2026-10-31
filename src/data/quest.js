// Money Quest: short, replayable mini-games grouped into the four HerPath
// zones. Every answer carries a "why" so the game teaches, not just scores.

export const ZONES = [
  { id: "learn", label: "Learn", blurb: "Costs, prices and profit", tone: "lilac" },
  { id: "manage", label: "Manage", blurb: "Budgets, saving and borrowing", tone: "mint" },
  { id: "prove", label: "Prove", blurb: "Turn your work into proof", tone: "peach" },
  { id: "move", label: "Move", blurb: "Pick your next opportunity", tone: "rose" },
];

/**
 * Level kinds:
 *  - choice:   rounds of { prompt, options: [{ text, correct?, why }] }
 *  - sort:     { buckets: [left, right], items: [{ text, bucket: 0|1, why }] }
 *  - price:    rounds of { product, unit, cost, low, high, customers }
 *  - budget:   rounds of { income, note, categories: [{ name, min?, fixed?, start }] , savingsMin? }
 *  - real:     a real-life challenge checked against the user's actual data
 */
export const LEVELS = [
  // ---------- LEARN ----------
  {
    id: "cost-per-unit",
    zone: "learn",
    kind: "choice",
    title: "Cost per item",
    icon: "Calculator",
    intro: "Before you can price anything, you need to know what ONE item costs you to make.",
    takeaway: "Add up everything that goes into a batch, then divide by how many items it makes. That's your cost per item — your price must be well above it.",
    realLink: { to: "/wallet", label: "Check your real costs in HerWallet" },
    rounds: [
      {
        prompt: "You buy flour (R300), oil (R120) and paper bags (R80), and make 100 vetkoek. What does one vetkoek cost you?",
        options: [
          { text: "R3", why: "That's only flour and oil. Packaging is a cost too!" },
          { text: "R5", correct: true, why: "R300 + R120 + R80 = R500. R500 ÷ 100 = R5 per vetkoek." },
          { text: "R8", why: "That's closer to a selling price. Cost is what YOU pay: R500 ÷ 100 = R5." },
        ],
      },
      {
        prompt: "A tub of hair food costs R180 and does 12 clients. Each client also gets R10 of beads. What's your product cost per client?",
        options: [
          { text: "R25", correct: true, why: "R180 ÷ 12 = R15 of hair food, plus R10 of beads = R25 per client." },
          { text: "R15", why: "Don't forget the beads — every client uses R10 of them. R15 + R10 = R25." },
          { text: "R190", why: "That's the cost of everything together, not per client. Divide the tub by 12 first." },
        ],
      },
      {
        prompt: "You spend R60 on taxi fare to buy stock for 30 jars of body butter. How should you treat the taxi fare?",
        options: [
          { text: "Ignore it — it's just transport", why: "Hidden costs like transport eat your profit quietly. R60 ÷ 30 = R2 per jar." },
          { text: "Add R2 to the cost of each jar", correct: true, why: "R60 ÷ 30 jars = R2 per jar. Transport to buy stock is part of what each jar costs." },
          { text: "Pay it from household money", why: "Mixing money hides your true costs. It's a business cost: R2 per jar." },
        ],
      },
      {
        prompt: "Your cost per cupcake is R6. Which price makes sense to START from?",
        options: [
          { text: "R6 — sell at cost to get customers", why: "At R6 you earn R0. You'd be working for free!" },
          { text: "R7 — a little above cost", why: "R1 profit disappears with one broken cupcake or a taxi trip." },
          { text: "R12–R18 — about 2–3× cost", correct: true, why: "Pricing at 2–3× cost covers surprises, discounts and your own time — then compare with what others charge." },
        ],
      },
    ],
  },
  {
    id: "price-it-right",
    zone: "learn",
    kind: "price",
    title: "Price it right",
    icon: "Tag",
    intro: "Slide to set your price. Too low and you work for free. Too high and customers walk away. Find the sweet spot!",
    takeaway: "Total profit = profit per item × how many people buy. The cheapest price is rarely the best one.",
    realLink: { to: "/moneymap", state: { tab: "sim" }, label: "Test your pricing in the business simulation" },
    rounds: [
      { product: "Vetkoek", unit: "each", cost: 5, low: 8, high: 14, customers: 120 },
      { product: "Knotless braids", unit: "per client", cost: 150, low: 350, high: 650, customers: 14 },
      { product: "Body butter", unit: "per jar", cost: 25, low: 60, high: 130, customers: 40 },
    ],
  },
  {
    id: "real-sim",
    zone: "learn",
    kind: "real",
    title: "Run a business month",
    icon: "Gamepad2",
    challenge: "Finish the Glow Body Butter business simulation.",
    why: "Practise every decision in one go: costs, pricing, discounts, surprises and profit.",
    action: { to: "/moneymap", state: { tab: "sim" }, label: "Play the simulation" },
    check: (data) => !!data.simulation?.best,
  },

  // ---------- MANAGE ----------
  {
    id: "business-or-personal",
    zone: "manage",
    kind: "sort",
    title: "Business or personal?",
    icon: "ArrowLeftRight",
    intro: "Swipe or tap each expense into the right pocket. Keeping them apart shows if your business really makes money.",
    takeaway: "Pay business costs from business money, and pay yourself a fixed amount for home. Then you can see your real profit.",
    realLink: { to: "/wallet", state: { add: "out" }, label: "Record a business expense" },
    buckets: ["Business", "Personal"],
    items: [
      { text: "Flour and oil for your stall", bucket: 0, why: "Stock is a business cost." },
      { text: "School shoes for your daughter", bucket: 1, why: "Family needs come from your personal money." },
      { text: "Data bundle for WhatsApp orders", bucket: 0, why: "If it's used to take orders, it's a business cost." },
      { text: "Groceries for supper at home", bucket: 1, why: "Household food is personal, even if you cook for a living." },
      { text: "Market stall fee", bucket: 0, why: "You pay it to trade — it's a business cost." },
      { text: "The R1 000 you pay yourself each month", bucket: 1, why: "Once you've paid yourself, that money is personal. That's how you separate the two." },
      { text: "Gas refill for your cooking business", bucket: 0, why: "Gas used for cooking stock is a business cost." },
      { text: "A new phone cover", bucket: 1, why: "Nice to have, but personal." },
    ],
  },
  {
    id: "build-a-budget",
    zone: "manage",
    kind: "budget",
    title: "Build a budget",
    icon: "PieChart",
    intro: "Give every rand a job. Use + and − to plan the month, then check your plan.",
    takeaway: "Protect stock and rent first — they keep you trading. Save something in good months so slow months don't push you into debt.",
    realLink: { to: "/wallet", state: { tab: "budgets" }, label: "Set your real budgets" },
    rounds: [
      {
        income: 4000,
        note: "A good month: R4 000 came in.",
        savingsMin: 400,
        categories: [
          { name: "Stock for next month", min: 1500, start: 1000 },
          { name: "Rent", fixed: 900, start: 900 },
          { name: "Transport", min: 300, start: 300 },
          { name: "Food at home", min: 600, start: 600 },
          { name: "Savings", min: 400, start: 0 },
          { name: "Treats & fun", start: 0 },
        ],
      },
      {
        income: 2500,
        note: "A slow month: only R2 500 came in.",
        categories: [
          { name: "Stock for next month", min: 1000, start: 500 },
          { name: "Rent", fixed: 900, start: 900 },
          { name: "Transport", min: 200, start: 300 },
          { name: "Food at home", min: 400, start: 500 },
          { name: "Savings", start: 300 },
          { name: "Treats & fun", start: 0 },
        ],
      },
    ],
  },
  {
    id: "borrow-smart",
    zone: "manage",
    kind: "sort",
    title: "Smart or risky borrowing?",
    icon: "HandCoins",
    intro: "Not all borrowing is bad. Sort each choice into smart or risky.",
    takeaway: "Borrow only for something that earns more than it costs, at an interest rate you can repay from next month's sales.",
    realLink: { to: "/moneymap", state: { tab: "coach", ask: "I'm thinking about borrowing money for my business. How do I work out if it's a good idea?" }, label: "Ask the coach about a loan" },
    buckets: ["Smart", "Risky"],
    items: [
      { text: "Stokvel advance at 10% for a fryer that doubles your output", bucket: 0, why: "Low interest, and the fryer earns more than it costs." },
      { text: "Mashonisa loan at 50% a month for a birthday party", bucket: 1, why: "Very expensive money for something that earns nothing back." },
      { text: "A new loan to pay off an old loan", bucket: 1, why: "This is a debt spiral. Talk to the lender or a debt counsellor instead." },
      { text: "Saving R200 a week for 3 months to buy a gazebo", bucket: 0, why: "No interest at all — saving first is the cheapest 'loan'." },
      { text: "Store credit at 25% interest for a TV in a slow month", bucket: 1, why: "High interest on something that doesn't earn money, when cash is tight." },
      { text: "A small sefa-backed loan to buy stock for a confirmed catering order", bucket: 0, why: "The order is confirmed, so you know how you'll repay it." },
    ],
  },
  {
    id: "real-wallet",
    zone: "manage",
    kind: "real",
    title: "Manage real money",
    icon: "Wallet",
    challenge: "Record 5 money moves this month and set budgets for 3 categories in HerWallet.",
    why: "Tracking real money is the habit that makes every other money decision easier.",
    action: { to: "/wallet", label: "Open HerWallet" },
    check: (data) => {
      const now = new Date();
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      return data.transactions.filter((t) => t.date.startsWith(key)).length >= 5 && Object.keys(data.budgets).length >= 3;
    },
  },

  // ---------- PROVE ----------
  {
    id: "what-counts",
    zone: "prove",
    kind: "sort",
    title: "What counts as proof?",
    icon: "Camera",
    intro: "Clients and funders trust evidence, not promises. Sort each one: strong proof or weak proof?",
    takeaway: "Strong proof is specific and checkable: dates, photos, payments and real customer names.",
    realLink: { to: "/proof", state: { add: true }, label: "Log a job with proof" },
    buckets: ["Strong proof", "Weak proof"],
    items: [
      { text: "A dated photo of the wedding cake you made", bucket: 0, why: "Specific, visual and dated — anyone can see your work." },
      { text: "\"Trust me, I've done loads of these\"", bucket: 1, why: "A promise isn't proof. Show the jobs instead." },
      { text: "An EFT payment from a client for a job", bucket: 0, why: "A payment record shows someone actually paid you for the work." },
      { text: "A review from a named customer", bucket: 0, why: "A real person vouching for you is powerful proof." },
      { text: "A blurry photo with no date or description", bucket: 1, why: "Hard to tell what it shows or when. Add details!" },
      { text: "A CV line saying \"good with people\"", bucket: 1, why: "Everyone says this. Show an example of it instead." },
      { text: "A reference letter from a past employer", bucket: 0, why: "A checkable reference from someone you worked for." },
    ],
  },
  {
    id: "write-like-a-pro",
    zone: "prove",
    kind: "choice",
    title: "Write it like a pro",
    icon: "PenLine",
    intro: "Same job, two ways of describing it. Pick the record that would impress a new client.",
    takeaway: "Strong job records say WHAT you did, for HOW MANY, the RESULT, and get confirmed by the customer.",
    realLink: { to: "/proof", label: "Polish your ProofPocket jobs" },
    rounds: [
      {
        prompt: "Which job record is stronger?",
        options: [
          { text: "\"Did catering.\"", why: "Too vague. A client can't tell how big or how good the job was." },
          { text: "\"Catered lunch for 40 guests: planned the menu, cooked and served on time. Paid R1 800.\"", correct: true, why: "Size, tasks, result and payment — a client can picture the job." },
        ],
      },
      {
        prompt: "Which job record is stronger?",
        options: [
          { text: "\"Braided 6 clients for a matric dance, all done by 2pm. 5-star reviews from 4.\"", correct: true, why: "Numbers, a deadline met and reviews — that's proof of skill AND reliability." },
          { text: "\"I am very good at braiding.\"", why: "A claim, not evidence. Show what you did." },
        ],
      },
      {
        prompt: "Which skills list is more useful for matching you to jobs?",
        options: [
          { text: "\"Hard worker, friendly, reliable\"", why: "Nice qualities, but employers search for skills like 'Food safety' or 'Cash handling'." },
          { text: "\"Food safety, Cash handling, Event planning, Customer service\"", correct: true, why: "Specific skills match real opportunities in Next Move and on job sites." },
        ],
      },
      {
        prompt: "A customer loved your work. What's the best next step?",
        options: [
          { text: "Ask them to verify the job and leave a short review", correct: true, why: "Verified reviews turn a happy customer into proof you can share." },
          { text: "Nothing — they'll tell their friends", why: "Word of mouth is great, but it doesn't travel to new clients or funders. Get it in writing." },
        ],
      },
    ],
  },
  {
    id: "real-proof",
    zone: "prove",
    kind: "real",
    title: "Get verified",
    icon: "BadgeCheck",
    challenge: "Get at least one job verified by a customer in ProofPocket.",
    why: "One verified job is worth more than ten unverified claims.",
    action: { to: "/proof", label: "Open ProofPocket" },
    check: (data) => data.jobs.some((j) => j.verifications.length > 0),
  },

  // ---------- MOVE ----------
  {
    id: "spot-the-move",
    zone: "move",
    kind: "choice",
    title: "Spot the next move",
    icon: "Compass",
    intro: "Read each woman's story and pick the next step that fits her best.",
    takeaway: "The right next move builds on what you already have: your skills, your proof and your goals.",
    realLink: { to: "/next-move", label: "See your own matches" },
    rounds: [
      {
        prompt: "Lindiwe has braided hair from home for 5 years. She wants a recognised qualification so salons will hire her.",
        options: [
          { text: "A hairdressing learnership", correct: true, why: "A learnership turns her experience into a qualification, often with a stipend." },
          { text: "A R50 000 business loan", why: "She doesn't need money right now — she needs a qualification." },
          { text: "An office admin internship", why: "That doesn't build on her braiding skills or her goal." },
        ],
      },
      {
        prompt: "Thandeka sells 200 vetkoek a week and has 6 months of records. Her small pot limits how many she can make.",
        options: [
          { text: "Stop selling until she can afford a fryer", why: "Pausing kills her income and customers. Her records can help her get finance." },
          { text: "Apply for equipment finance or save towards a fryer", correct: true, why: "Proven sales + records = a strong case for finance that grows output." },
          { text: "Borrow from a mashonisa today", why: "With her records she can access much cheaper finance." },
        ],
      },
      {
        prompt: "Zanele is 22, finished matric, loves organising and has no work experience yet.",
        options: [
          { text: "An internship", correct: true, why: "Internships are designed to give first-time work experience." },
          { text: "Start a catering business", why: "Possible later — but she hasn't said she cooks. Build experience first." },
          { text: "A women's business fund", why: "Funds are for existing businesses. She doesn't have one yet." },
        ],
      },
      {
        prompt: "Naledi has 3 customer-verified catering jobs and wants bigger, regular orders.",
        options: [
          { text: "Become a supplier for corporate lunch platters", correct: true, why: "Her verified jobs are exactly the proof corporate buyers ask for." },
          { text: "Hide her reviews until she's 'more professional'", why: "Her reviews ARE her professionalism. Share them!" },
          { text: "Only take orders from family", why: "Family orders are a great start, but they won't grow into regular income." },
        ],
      },
    ],
  },
  {
    id: "funding-ready",
    zone: "move",
    kind: "sort",
    title: "Funding-ready?",
    icon: "ClipboardCheck",
    intro: "Funders look for signs you'll use money well. Sort each one: ready, or not yet?",
    takeaway: "Funders want records, proof, a clear plan, and to see you understand your numbers.",
    realLink: { to: "/next-move", label: "Check the Funding Finder" },
    buckets: ["Ready", "Not yet"],
    items: [
      { text: "Has 3 months of money in & out records", bucket: 0, why: "Records show the business is real and how money moves." },
      { text: "Pays household bills from the business till", bucket: 1, why: "Mixed money makes it impossible to see if the business is profitable." },
      { text: "Has reviews from real customers", bucket: 0, why: "Proof that people pay for what you do." },
      { text: "Doesn't know her cost per item", bucket: 1, why: "Funders will ask. Without it, you can't show the loan will pay back." },
      { text: "Knows exactly what the money will buy and earn", bucket: 0, why: "A clear plan shows the money will grow the business." },
      { text: "Wants funding to repay a loan shark", bucket: 1, why: "Funders invest in growth, not old debt. Get debt advice first." },
    ],
  },
  {
    id: "real-move",
    zone: "move",
    kind: "real",
    title: "Plan your next move",
    icon: "MessageCircle",
    challenge: "Pick an opportunity in Next Move and tap \"Plan this with the coach\".",
    why: "A plan turns an opportunity into action steps you can start this week.",
    action: { to: "/next-move", label: "Open Next Move" },
    check: (data) => !!data.game?.flags?.plannedMove,
  },
];

export const GAME_LEVELS = LEVELS.filter((l) => l.kind !== "real");

export const RANKS = [
  { xp: 0, title: "Seedling" },
  { xp: 120, title: "Sprout" },
  { xp: 300, title: "Budding" },
  { xp: 520, title: "Blooming" },
  { xp: 800, title: "Thriving" },
];

export const XP = { correct: 10, comboBonus: 5, star: 15, real: 60 };

export function rankFor(xp) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  const cur = RANKS[i];
  const next = RANKS[i + 1];
  return { index: i, title: cur.title, xp, floor: cur.xp, next: next?.xp ?? null, nextTitle: next?.title ?? null };
}

export function starsFor(correct, total) {
  const r = total ? correct / total : 0;
  return r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1;
}

/** Everything about quest progress, derived from saved data. */
export function questProgress(data) {
  const game = data.game ?? { levels: {}, flags: {}, bestCombo: 0 };
  const realDone = LEVELS.filter((l) => l.kind === "real" && l.check(data)).map((l) => l.id);
  const levelXp = Object.values(game.levels).reduce((s, l) => s + (l.xp || 0), 0);
  const xp = levelXp + realDone.length * XP.real;
  const stars = GAME_LEVELS.reduce((s, l) => s + (game.levels[l.id]?.stars || 0), 0);
  const done = (id) => realDone.includes(id) || !!game.levels[id];

  const zoneDone = (zone) => GAME_LEVELS.filter((l) => l.zone === zone).every((l) => game.levels[l.id]);
  const badges = BADGES.map((b) => ({ ...b, earned: b.test({ game, realDone, stars, zoneDone }) }));
  const nextUp = LEVELS.find((l) => !done(l.id) && isUnlocked(l, game, realDone));

  return { game, xp, rank: rankFor(xp), stars, maxStars: GAME_LEVELS.length * 3, realDone, done, badges, nextUp };
}

/**
 * Within a zone, a game opens once the one before it is played. Zones are all
 * open, and real-life challenges always are — they track what you do in the app.
 */
export function isUnlocked(level, game, realDone) {
  if (level.kind === "real") return true;
  const zoneLevels = LEVELS.filter((l) => l.zone === level.zone);
  const i = zoneLevels.findIndex((l) => l.id === level.id);
  if (i === 0) return true;
  const prev = zoneLevels[i - 1];
  return !!game.levels[prev.id] || realDone.includes(prev.id);
}

export const BADGES = [
  { id: "first", title: "First step", desc: "Finish your first level", icon: "Footprints", test: ({ game }) => Object.keys(game.levels).length > 0 },
  { id: "learn", title: "Profit thinker", desc: "Finish every Learn game", icon: "Calculator", test: ({ zoneDone }) => zoneDone("learn") },
  { id: "manage", title: "Money manager", desc: "Finish every Manage game", icon: "PieChart", test: ({ zoneDone }) => zoneDone("manage") },
  { id: "prove", title: "Proof builder", desc: "Finish every Prove game", icon: "BadgeCheck", test: ({ zoneDone }) => zoneDone("prove") },
  { id: "move", title: "Next mover", desc: "Finish every Move game", icon: "Compass", test: ({ zoneDone }) => zoneDone("move") },
  { id: "combo", title: "On a roll", desc: "Get 5 right in a row", icon: "Flame", test: ({ game }) => game.bestCombo >= 5 },
  { id: "perfect", title: "Nailed it", desc: "Get 3 stars on any level", icon: "Star", test: ({ game }) => Object.values(game.levels).some((l) => l.stars === 3) },
  { id: "real", title: "Real-life hero", desc: "Complete all 4 real-life challenges", icon: "Trophy", test: ({ realDone }) => realDone.length === 4 },
  { id: "master", title: "Money master", desc: "3 stars on every game", icon: "Crown", test: ({ stars }) => stars === GAME_LEVELS.length * 3 },
];
