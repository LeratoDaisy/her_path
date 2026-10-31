// MoneyMap business simulation: "Glow Body Butter".
// Pure functions over a plain state object so the UI just renders steps.

const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const R = (n) => "R" + Math.round(n).toLocaleString("en-ZA").replace(/,/g, " ");

export const SCENARIO = {
  id: "skincare",
  title: "Glow Body Butter",
  intro:
    "You want to start a skincare business selling whipped shea body butter. You have R1 500 saved for your first batch of 30 jars. Every choice changes your cash, your product and your reputation. Let's see how your first month goes.",
  startCash: 1500,
  batch: 30,
};

export function initialState() {
  return {
    cash: SCENARIO.startCash,
    quality: 0,
    reputation: 0,
    ingredients: 0,
    packaging: 0,
    unitCost: 0,
    price: 0,
    extraUnits: 0,
    extraPriceFactor: 1,
    unitsSold: 0,
    revenue: 0,
    debt: 0,
    saved: 0,
    stepIndex: 0,
    decisions: [], // { step, choice, verdict, lesson }
    event: null,
  };
}

const EVENTS = [
  {
    id: "mixer",
    title: "Your hand mixer breaks",
    prompt: "Mid-way through whipping your second batch, your hand mixer dies. A new one costs R350, and you have orders to fill this week.",
    cost: 350,
  },
  {
    id: "stall",
    title: "The market raises its fees",
    prompt: "The weekend market organiser says stall fees go up by R300 from this month, payable now, or you lose your spot.",
    cost: 300,
  },
];

export function pickEvent() {
  return EVENTS[Math.floor(Math.random() * EVENTS.length)];
}

/** Each step: { id, title, prompt, info?(state), options(state) -> [{ id, label, detail, verdict, apply(state)->state, lesson(state) }] } */
export const STEPS = [
  {
    id: "ingredients",
    title: "Buy your ingredients",
    prompt: "Shea butter is the main cost. Where will you buy it?",
    options: () => [
      {
        id: "premium",
        label: "Premium organic shea & cocoa butter + essential oils",
        detail: "R720 · top quality",
        verdict: "ok",
        apply: (s) => ({ ...s, cash: s.cash - 720, ingredients: 720, quality: s.quality + 3 }),
        lesson: () => "Great quality, but it uses almost half your cash. That only works if your price reflects it — premium ingredients need a premium price.",
      },
      {
        id: "wholesale",
        label: "Unrefined shea from a wholesaler, bought in bulk",
        detail: "R480 · good quality",
        verdict: "good",
        apply: (s) => ({ ...s, cash: s.cash - 480, ingredients: 480, quality: s.quality + 2 }),
        lesson: () => "Buying in bulk from a wholesaler gives you good quality at a lower cost per jar — the sweet spot for a first batch.",
      },
      {
        id: "cheap",
        label: "Cheapest butter blend at the local market",
        detail: "R260 · unknown quality",
        verdict: "risky",
        apply: (s) => ({ ...s, cash: s.cash - 260, ingredients: 260, quality: s.quality + 0, reputation: s.reputation - 1 }),
        lesson: () => "Saving on ingredients is tempting, but in skincare a single rash or bad smell spreads fast on WhatsApp. Cheap inputs can cost you repeat customers.",
      },
    ],
  },
  {
    id: "packaging",
    title: "Choose packaging",
    prompt: "Customers see the jar before they try the product. What will you pack it in?",
    options: () => [
      {
        id: "glass",
        label: "Amber glass jars with printed labels",
        detail: "R390 for 30",
        verdict: "ok",
        apply: (s) => ({ ...s, cash: s.cash - 390, packaging: 390, quality: s.quality + 1 }),
        lesson: () => "Glass looks luxurious, but it adds R13 to every jar and breaks in transit. Make sure customers will pay for it.",
      },
      {
        id: "tubs-printed",
        label: "Plastic tubs with printed stickers",
        detail: "R210 for 30",
        verdict: "good",
        apply: (s) => ({ ...s, cash: s.cash - 210, packaging: 210, quality: s.quality + 1 }),
        lesson: () => "Printed stickers make a cheap tub look professional. Branding doesn't have to be expensive.",
      },
      {
        id: "tubs-plain",
        label: "Plain tubs with hand-written labels",
        detail: "R150 for 30",
        verdict: "ok",
        apply: (s) => ({ ...s, cash: s.cash - 150, packaging: 150 }),
        lesson: () => "Cheapest option. Fine for friends and family, but harder to sell to strangers or shops.",
      },
    ],
  },
  {
    id: "price",
    title: "Set your price",
    prompt: "First, work out what one jar costs you to make.",
    info: (s) => {
      const unit = (s.ingredients + s.packaging) / SCENARIO.batch;
      return `Cost per jar = (ingredients ${R(s.ingredients)} + packaging ${R(s.packaging)}) ÷ ${SCENARIO.batch} jars = ${R(unit)}. Similar body butters sell for R60–R120 locally.`;
    },
    options: (s) => {
      const unit = (s.ingredients + s.packaging) / SCENARIO.batch;
      const low = round5(unit * 1.2);
      const mid = round5(unit * 2.5);
      const high = round5(unit * 4);
      const withUnit = (p) => (st) => ({ ...st, unitCost: unit, price: p });
      return [
        {
          id: "low",
          label: `${R(low)} — just above cost, to sell fast`,
          detail: `Profit about ${R(low - unit)} per jar`,
          verdict: "risky",
          apply: withUnit(low),
          lesson: () => `At ${R(low)} you make only ${R(low - unit)} a jar. One broken jar or a taxi fare wipes that out, and it's hard to raise prices later.`,
        },
        {
          id: "mid",
          label: `${R(mid)} — about 2.5× your cost`,
          detail: `Profit about ${R(mid - unit)} per jar`,
          verdict: "good",
          apply: withUnit(mid),
          lesson: () => `Pricing at 2–3× your cost leaves room for transport, packaging breakage, discounts and your own time — which also has value.`,
        },
        {
          id: "high",
          label: `${R(high)} — premium price`,
          detail: `Profit about ${R(high - unit)} per jar`,
          verdict: s.quality >= 4 ? "good" : "risky",
          apply: withUnit(high),
          lesson: (st) =>
            st.quality >= 4
              ? "Your premium ingredients and packaging back up a premium price. Customers can see what they're paying for."
              : "A premium price only works when the product looks and feels premium. Expect fewer sales at this price.",
        },
      ];
    },
  },
  {
    id: "discount",
    title: "A customer asks for a discount",
    prompt: "Your aunt's stokvel (6 women) wants to buy together, but asks for 40% off each jar.",
    options: (s) => {
      const disc = s.price * 0.6;
      const bundle = s.price * 0.9;
      return [
        {
          id: "give",
          label: "Give them 40% off",
          detail: `They pay ${R(disc)} a jar`,
          verdict: disc < s.unitCost * 1.3 ? "risky" : "ok",
          apply: (st) => ({ ...st, extraUnits: 6, extraPriceFactor: 0.6, reputation: st.reputation + 1 }),
          lesson: (st) => `40% off ${R(st.price)} is ${R(disc)}, and each jar costs you ${R(st.unitCost)}. You keep only ${R(disc - st.unitCost)} a jar. Deep discounts feel kind but can mean working for free.`,
        },
        {
          id: "bundle",
          label: "Offer 10% off when they buy 6 or more",
          detail: `They pay ${R(bundle)} a jar`,
          verdict: "good",
          apply: (st) => ({ ...st, extraUnits: 6, extraPriceFactor: 0.9, reputation: st.reputation + 1 }),
          lesson: () => "A small bulk discount rewards a big order without giving away your profit. You can say: \"I can't do 40%, but for six jars I'll do 10% off.\"",
        },
        {
          id: "no",
          label: "Politely say no — the price is the price",
          detail: "Some may still buy",
          verdict: "ok",
          apply: (st) => ({ ...st, extraUnits: 2, extraPriceFactor: 1 }),
          lesson: () => "Holding your price protects your margin, but you lose a group sale. Offering something small (a free sample, a bulk deal) often wins both ways.",
        },
      ];
    },
  },
  {
    id: "sales",
    title: "Market day!",
    prompt: "You take your jars to the weekend market and share your catalogue on WhatsApp.",
    auto: true,
  },
  {
    id: "event",
    title: "Something unexpected",
    prompt: "",
    options: (s) => {
      const cost = s.event.cost;
      return [
        {
          id: "cash",
          label: `Pay ${R(cost)} from your sales money`,
          detail: s.cash >= cost ? `You'll have ${R(s.cash - cost)} left` : "You don't have enough cash",
          verdict: s.cash >= cost ? "good" : "risky",
          disabled: s.cash < cost,
          apply: (st) => ({ ...st, cash: st.cash - cost }),
          lesson: () => "Paying from your own money hurts today, but it keeps you debt-free. This is exactly why an emergency fund matters.",
        },
        {
          id: "stokvel",
          label: "Ask your stokvel for an advance (10% interest)",
          detail: `Repay ${R(cost * 1.1)} next month`,
          verdict: "ok",
          apply: (st) => ({ ...st, debt: st.debt + cost * 1.1 }),
          lesson: () => `A stokvel advance is a reasonable short-term option: ${R(cost * 0.1)} interest for a month. Make sure next month's sales can cover it.`,
        },
        {
          id: "mashonisa",
          label: "Borrow from a mashonisa (50% interest a month)",
          detail: `Repay ${R(cost * 1.5)} next month`,
          verdict: "risky",
          apply: (st) => ({ ...st, debt: st.debt + cost * 1.5 }),
          lesson: () => `Borrowing ${R(cost)} at 50% a month means paying back ${R(cost * 1.5)}. If you miss a month it grows to ${R(cost * 2.25)}. Informal lenders can trap small businesses in debt.`,
        },
      ];
    },
  },
  {
    id: "profit",
    title: "Month-end: what will you do with your profit?",
    prompt: "",
    options: (s) => {
      const profit = s.cash - SCENARIO.startCash - s.debt;
      const pos = Math.max(0, profit);
      return [
        {
          id: "split",
          label: "Save 30%, reinvest 70% in the next batch",
          detail: `Save ${R(pos * 0.3)}`,
          verdict: "good",
          apply: (st) => ({ ...st, saved: pos * 0.3 }),
          lesson: () => "Splitting profit builds a safety net and grows the business at the same time. Next time something breaks, you won't need to borrow.",
        },
        {
          id: "reinvest",
          label: "Reinvest everything into a double batch",
          detail: "Grow faster, no savings",
          verdict: "ok",
          apply: (st) => ({ ...st, saved: 0 }),
          lesson: () => "Growing fast is exciting, but with no savings one bad month can put you back to zero. Keep at least a small cushion.",
        },
        {
          id: "spend",
          label: "Use it for household expenses",
          detail: "Mix business and personal money",
          verdict: "risky",
          apply: (st) => ({ ...st, saved: 0 }),
          lesson: () => "When business money pays household bills, you can't see if the business is really making money — and there's nothing left for stock. Pay yourself a fixed amount instead.",
        },
      ];
    },
  },
];

/** Resolve market sales once price, quality and reputation are known. */
export function runSales(s) {
  const perceivedValue = 55 + s.quality * 15 + s.reputation * 5;
  const ratio = clamp(1.25 - (0.75 * s.price) / perceivedValue, 0.1, 1);
  const base = Math.round(SCENARIO.batch * ratio);
  const extra = Math.min(s.extraUnits, SCENARIO.batch - base);
  const revenue = base * s.price + extra * s.price * s.extraPriceFactor;
  return { ...s, unitsSold: base + extra, baseUnits: base, extraSold: extra, revenue, cash: s.cash + revenue };
}

export function finalReport(s) {
  const spent = s.ingredients + s.packaging;
  // Cash already reflects stock, sales and any repair paid in cash; debt is what's still owed.
  const profit = s.cash - SCENARIO.startCash - s.debt;
  const good = s.decisions.filter((d) => d.verdict === "good").length;
  const risky = s.decisions.filter((d) => d.verdict === "risky").length;
  const score = clamp(Math.round(40 + profit / 25 + s.reputation * 4 - s.debt / 25 + good * 6 - risky * 6), 0, 100);
  return {
    score,
    profit,
    revenue: s.revenue,
    costs: spent,
    unitsSold: s.unitsSold,
    debt: s.debt,
    saved: s.saved,
    good,
    risky,
    leftoverJars: SCENARIO.batch - s.unitsSold,
  };
}

export const fmtR = R;
