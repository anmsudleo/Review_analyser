export type ReviewCategory =
  | "booking_issues"
  | "payment_problems"
  | "app_crashes"
  | "ui_ux_issues"
  | "login_auth"
  | "search_filters"
  | "communication"
  | "property_info"
  | "general_positive"
  | "other";

export type ReviewSentiment = "positive" | "negative" | "neutral";

const categoryKeywords: { category: ReviewCategory; keywords: string[] }[] = [
  {
    category: "booking_issues",
    keywords: ["booking", "reservation", "can't book", "cant book", "failed booking", "book"],
  },
  {
    category: "payment_problems",
    keywords: ["payment", "charged", "refund", "money", "transaction", "pay"],
  },
  {
    category: "app_crashes",
    keywords: ["crash", "freeze", "stuck", "not loading", "blank screen", "bug", "error"],
  },
  {
    category: "ui_ux_issues",
    keywords: ["confusing", "hard to find", "button", "design", "navigation", "ui", "ux"],
  },
  {
    category: "login_auth",
    keywords: ["login", "password", "otp", "can't sign in", "cant sign in", "verification", "sign up"],
  },
  {
    category: "search_filters",
    keywords: ["search", "filter", "results", "can't find", "cant find", "find"],
  },
  {
    category: "communication",
    keywords: ["chat", "response", "support", "no reply", "contact", "help"],
  },
  {
    category: "property_info",
    keywords: ["photos", "description", "inaccurate", "misleading", "listing"],
  },
  {
    category: "general_positive",
    keywords: ["love", "great", "amazing", "helpful", "easy", "good", "best", "awesome"],
  },
];

export function categorizeReview(text: string): ReviewCategory {
  const lower = text.toLowerCase();

  for (const { category, keywords } of categoryKeywords) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return category;
    }
  }

  return "other";
}

export function sentimentFromRating(rating: number): ReviewSentiment {
  if (rating <= 2) return "negative";
  if (rating === 3) return "neutral";
  return "positive";
}

