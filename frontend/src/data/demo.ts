// Pre-filled demo data for ENIT HACK — two influencers.

export type InfluencerData = typeof influencerProfiles[number];

export const influencerProfiles = [
  {
    name: "Oumaima Hamrouni",
    handle: "@oumaima.hamrouni_",
    initials: "OH",
    followers: "662K followers",
    instagram: "https://www.instagram.com/oumaima.hamrouni_/",
    tiktok: "https://www.tiktok.com/@oumaima.hamrouni",
    tags: [
      { label: "Lifestyle", tone: "neutral" as const },
      { label: "Feel-good content", tone: "neutral" as const },
      { label: "Tunisia", tone: "teal" as const },
    ],
    cqs: { value: 82.4, label: "CQS score", pill: "Healthy", tone: "teal" as const },
    nps: { value: 61, prefix: "+", label: "Audience NPS", pill: "Loyal", tone: "teal" as const },
    engagement: { value: 3.8, suffix: "%", label: "Engagement rate", pill: "High", tone: "blue" as const },
    metrics: [
      { label: "Audience health", value: "Healthy", tone: "teal" as const },
      { label: "Toxicity rate", value: "2.1%", tone: "ink" as const },
      { label: "Comments analyzed", value: "24", tone: "ink" as const },
      { label: "Avg quality score", value: "7.8 / 10", tone: "ink" as const },
    ],
    languages: [
      { name: "Darija", pct: 42, opacity: 0.85 },
      { name: "French", pct: 25, opacity: 0.6 },
      { name: "Arabic", pct: 17, opacity: 0.45 },
      { name: "English", pct: 12, opacity: 0.3 },
      { name: "Emoji only", pct: 4, opacity: 0.15 },
    ],
    primaryNiche: "Lifestyle",
    secondaryNiches: ["Beauty", "Fashion", "Culture"],
    npsBreakdown: {
      promoters: 64,
      passives: 21,
      detractors: 3,
      unclassified: 12,
    },
    formats: {
      casual: { likes: 20100, comments: 278, quality: "7.2/10", count: 2 },
      reel: { likes: 42533, comments: 640, quality: "8.4/10", count: 3 },
    },
    sentimentSummary: {
      positive: 79,
      neutral: 13,
      negative: 8,
    },
  },
  {
    name: "Samira Magroun",
    handle: "@samiramagroun",
    initials: "SM",
    followers: "2.1M followers",
    instagram: "https://www.instagram.com/samiramagroun/",
    tiktok: "https://www.tiktok.com/@samiramagroun",
    tags: [
      { label: "Actress", tone: "neutral" as const },
      { label: "TV Personality", tone: "neutral" as const },
      { label: "Tunisia", tone: "teal" as const },
    ],
    cqs: { value: 76.8, label: "CQS score", pill: "Healthy", tone: "teal" as const },
    nps: { value: 54, prefix: "+", label: "Audience NPS", pill: "Loyal", tone: "teal" as const },
    engagement: { value: 4.2, suffix: "%", label: "Engagement rate", pill: "High", tone: "blue" as const },
    metrics: [
      { label: "Audience health", value: "Healthy", tone: "teal" as const },
      { label: "Toxicity rate", value: "3.4%", tone: "ink" as const },
      { label: "Comments analyzed", value: "24", tone: "ink" as const },
      { label: "Avg quality score", value: "7.3 / 10", tone: "ink" as const },
    ],
    languages: [
      { name: "Darija", pct: 38, opacity: 0.85 },
      { name: "Arabic", pct: 25, opacity: 0.6 },
      { name: "French", pct: 25, opacity: 0.55 },
      { name: "English", pct: 8, opacity: 0.25 },
      { name: "Emoji only", pct: 4, opacity: 0.15 },
    ],
    primaryNiche: "Entertainment",
    secondaryNiches: ["Fashion", "Culture", "Beauty"],
    npsBreakdown: {
      promoters: 58,
      passives: 24,
      detractors: 4,
      unclassified: 14,
    },
    formats: {
      casual: { likes: 59850, comments: 784, quality: "7.0/10", count: 2 },
      reel: { likes: 98466, comments: 1567, quality: "8.6/10", count: 3 },
    },
    sentimentSummary: {
      positive: 75,
      neutral: 13,
      negative: 12,
    },
  },
] as const;

// Default profile for backwards compat
export const influencerProfile = influencerProfiles[0];

export const productMatches = [
  {
    name: "Oumaima Hamrouni",
    initials: "OH",
    avatarBg: "primary-soft",
    category: "Lifestyle",
    match: 87,
    cqsB: 79.2,
    domain: ["Lifestyle", "Beauty", "Fashion"],
    reason:
      "Oumaima's feel-good lifestyle audience aligns perfectly with an organic skincare brand's values and aesthetic.",
    best: true,
  },
  {
    name: "Samira Magroun",
    initials: "SM",
    avatarBg: "surface-input",
    category: "Actress & TV",
    match: 74,
    cqsB: 72.1,
    domain: ["Entertainment", "Fashion", "Culture"],
    reason:
      "Samira's massive reach and aspirational celebrity persona offer strong visibility for premium beauty brands.",
    best: false,
  },
  {
    name: "Nadsoons",
    initials: "NS",
    avatarBg: "surface-input",
    category: "Comedy",
    match: 44,
    cqsB: 55.1,
    domain: ["Entertainment", "Humor", "Lifestyle"],
    reason:
      "Broad entertainment reach but niche mismatch reduces relevance for a premium skincare product.",
    best: false,
  },
];

export const recentSearches = [
  "Oumaima Hamrouni",
  "Samira Magroun",
];
