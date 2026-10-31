// Demo data for Naledi. Dates are generated relative to "now" so the dashboard
// always shows a populated current month.

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function thisMonth(day) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), Math.min(day, now.getDate()));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const CATEGORIES_IN = ["Sales", "Catering job", "Side job", "Grant / support", "Other income"];
export const CATEGORIES_OUT = ["Ingredients", "Packaging", "Transport", "Stall fees", "Gas & electricity", "Airtime & data", "Rent", "Household", "Other"];

export function createSeed() {
  return {
    profile: {
      name: "Naledi",
      business: "Naledi's Kitchen",
      location: "Soweto, Gauteng",
      phone: "",
      email: "",
      about: "Home cook and caterer serving family events, church functions and weekend markets in Soweto.",
      skills: ["Cooking", "Catering", "Food safety", "Customer service", "Cash handling", "Event planning"],
      interests: ["Food", "Entrepreneurship", "Events"],
      education: "Matric (NSC), 2014",
    },
    transactions: [
      { id: "t1", type: "in", amount: 1800, category: "Catering job", note: "Mokoena family lunch (40 guests)", date: thisMonth(3) },
      { id: "t2", type: "in", amount: 1250, category: "Sales", note: "Saturday market — vetkoek & chicken", date: thisMonth(5) },
      { id: "t3", type: "in", amount: 950, category: "Catering job", note: "Church youth day platters", date: thisMonth(12) },
      { id: "t4", type: "in", amount: 680, category: "Sales", note: "Weekday lunch orders", date: thisMonth(18) },
      { id: "t5", type: "out", amount: 1240, category: "Ingredients", note: "Makro bulk buy", date: thisMonth(2) },
      { id: "t6", type: "out", amount: 350, category: "Stall fees", note: "Market stall (2 Saturdays)", date: thisMonth(4) },
      { id: "t7", type: "out", amount: 420, category: "Transport", note: "Taxi fares & delivery lift", date: thisMonth(8) },
      { id: "t8", type: "out", amount: 199, category: "Airtime & data", note: "WhatsApp orders bundle", date: thisMonth(1) },
      { id: "t9", type: "out", amount: 900, category: "Rent", note: "Rent contribution", date: thisMonth(1) },
      { id: "t10", type: "out", amount: 320, category: "Gas & electricity", note: "Gas refill 9kg", date: thisMonth(10) },
      { id: "t11", type: "out", amount: 420, category: "Packaging", note: "Foil trays & lids", date: thisMonth(11) },
    ],
    budgets: {
      Ingredients: 1400,
      Packaging: 350,
      Transport: 500,
      "Stall fees": 400,
      "Gas & electricity": 350,
      "Airtime & data": 200,
      Rent: 900,
    },
    goals: [
      { id: "g1", name: "Two-plate gas stove", target: 2500, saved: 900, kind: "business" },
      { id: "g2", name: "Emergency fund", target: 3000, saved: 1200, kind: "savings" },
    ],
    jobs: [
      {
        id: "j-mokoena",
        title: "Family lunch catering — 40 guests",
        client: "Mokoena family",
        date: daysAgo(27),
        amount: 1800,
        skills: ["Catering", "Cooking", "Event planning"],
        description: "Planned the menu, cooked and served lunch for a 40-guest family celebration.",
        photos: [],
        verifications: [{ id: "v1", name: "Thabo Mokoena", rating: 5, comment: "Food was hot, on time and everyone asked who the caterer was!", createdAt: daysAgo(26) }],
      },
      {
        id: "j-church",
        title: "Youth day platters — St John's",
        client: "St John's Church",
        date: daysAgo(18),
        amount: 950,
        skills: ["Catering", "Food safety"],
        description: "Prepared 60 platters for a church youth day, including vegetarian options.",
        photos: [],
        verifications: [{ id: "v2", name: "Mrs Dlamini", rating: 5, comment: "Very professional and clean. We will book again.", createdAt: daysAgo(17) }],
      },
      {
        id: "j-office",
        title: "Office year-end snacks",
        client: "Kasi Print Studio",
        date: daysAgo(48),
        amount: 1400,
        skills: ["Catering", "Customer service", "Cash handling"],
        description: "Finger food for a 25-person office party, invoiced and paid by EFT.",
        photos: [],
        verifications: [{ id: "v3", name: "Sipho Nkosi", rating: 4, comment: "Great food, delivery was 15 minutes late.", createdAt: daysAgo(46) }],
      },
      {
        id: "j-market",
        title: "Saturday market stall",
        client: "Walk-in customers",
        date: daysAgo(6),
        amount: 1250,
        skills: ["Cooking", "Customer service", "Cash handling"],
        description: "Sold 120 vetkoek and 40 chicken plates at the Saturday market.",
        photos: [],
        verifications: [],
      },
    ],
    simulation: { completed: [], best: null },
    coachHistory: [],
    game: { levels: {}, flags: {}, bestCombo: 0 },
  };
}
