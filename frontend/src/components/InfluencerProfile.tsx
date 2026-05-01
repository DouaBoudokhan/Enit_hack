import { Card, CardHeader } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { AnimatedBar, StackedBar } from "@/components/Bars";
import { CountNumber } from "@/components/CountNumber";
import { ArrowUp, Users, ExternalLink } from "lucide-react";
import { influencerProfiles } from "@/data/demo";

type ProfileData = (typeof influencerProfiles)[number];

const tones = {
  teal: "text-teal",
  blue: "text-blue",
  ink: "text-ink",
  amber: "text-amber",
  coral: "text-coral",
} as const;

export function InfluencerProfile({ profile }: { profile?: ProfileData }) {
  const p = profile ?? influencerProfiles[0];
  const total =
    p.npsBreakdown.promoters +
    p.npsBreakdown.passives +
    p.npsBreakdown.detractors +
    p.npsBreakdown.unclassified;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* HERO */}
      <Card>
        <div className="flex items-stretch gap-8">
          {/* Left: identity */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center shrink-0"
              style={{ background: "hsl(36 35% 86%)" }}
            >
              <span className="text-[22px] font-semibold text-primary-ink">
                {p.initials}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-[20px] font-semibold text-ink tracking-tight-2">
                {p.name}
              </div>
              <div className="text-[13px] text-ink-muted">{p.handle}</div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {p.tags.map((t) => (
                  <Pill key={t.label} tone={t.tone} size="sm">
                    {t.label}
                  </Pill>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-[13px] text-ink-secondary mt-2.5">
                <Users size={13} className="text-ink-muted" />
                {p.followers}
              </div>
              {/* Social links */}
              <div className="flex items-center gap-3 mt-2">
                <a href={p.instagram} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1 text-[12px] text-primary hover:text-primary-strong transition-colors">
                  <ExternalLink size={11} /> Instagram
                </a>
                <a href={p.tiktok} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1 text-[12px] text-primary hover:text-primary-strong transition-colors">
                  <ExternalLink size={11} /> TikTok
                </a>
              </div>
            </div>
          </div>

          {/* Right: 3 metrics */}
          <div className="flex items-center divide-x divide-line">
            <MetricBlock
              value={
                <CountNumber
                  value={p.cqs.value}
                  decimals={1}
                  className="text-[32px] metric-num text-teal"
                />
              }
              label={p.cqs.label}
              pillTone="teal"
              pillLabel={p.cqs.pill}
            />
            <MetricBlock
              value={
                <CountNumber
                  value={p.nps.value}
                  prefix={p.nps.prefix}
                  className="text-[32px] metric-num text-teal"
                />
              }
              label={p.nps.label}
              pillTone="teal"
              pillLabel={p.nps.pill}
            />
            <MetricBlock
              value={
                <CountNumber
                  value={p.engagement.value}
                  decimals={1}
                  suffix={p.engagement.suffix}
                  className="text-[32px] metric-num text-blue"
                />
              }
              label={p.engagement.label}
              pillTone="blue"
              pillLabel={p.engagement.pill}
            />
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {p.metrics.map((m) => (
            <div
              key={m.label}
              className="bg-background rounded-[10px] p-4"
            >
              <div className="text-[12px] text-ink-muted">{m.label}</div>
              <div
                className={`text-[18px] font-semibold mt-1 tracking-tight-2 ${tones[m.tone]}`}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* SENTIMENT ANALYSIS */}
      <Card noPadding>
        <CardHeader
          title="Sentiment analysis"
          subtitle="Overall community sentiment from comment classification"
        />
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-background rounded-[10px] p-4 border-t-[3px]" style={{ borderTopColor: "hsl(var(--accent-teal))" }}>
              <div className="text-[28px] metric-num text-teal">
                <CountNumber value={p.sentimentSummary.positive} suffix="%" />
              </div>
              <div className="text-[12px] text-ink-secondary mt-1">Positive</div>
              <div className="text-[11px] text-ink-muted">Genuine engagement</div>
            </div>
            <div className="bg-background rounded-[10px] p-4 border-t-[3px]" style={{ borderTopColor: "hsl(var(--accent-amber))" }}>
              <div className="text-[28px] metric-num text-amber">
                <CountNumber value={p.sentimentSummary.neutral} suffix="%" />
              </div>
              <div className="text-[12px] text-ink-secondary mt-1">Neutral</div>
              <div className="text-[11px] text-ink-muted">Questions & observations</div>
            </div>
            <div className="bg-background rounded-[10px] p-4 border-t-[3px]" style={{ borderTopColor: "hsl(var(--accent-coral))" }}>
              <div className="text-[28px] metric-num text-coral">
                <CountNumber value={p.sentimentSummary.negative} suffix="%" />
              </div>
              <div className="text-[12px] text-ink-secondary mt-1">Negative</div>
              <div className="text-[11px] text-ink-muted">Criticism & spam</div>
            </div>
          </div>
          <StackedBar
            segments={[
              { pct: p.sentimentSummary.positive, color: "hsl(var(--accent-teal))" },
              { pct: p.sentimentSummary.neutral, color: "hsl(var(--accent-amber))" },
              { pct: p.sentimentSummary.negative, color: "hsl(var(--accent-coral))" },
            ]}
          />
          <div className="mt-3 text-[12px] text-ink-muted">
            Community quality:{" "}
            <span className="font-semibold text-teal">
              {p.sentimentSummary.positive >= 70 ? "Positive & engaged" : p.sentimentSummary.positive >= 50 ? "Mixed signals" : "Needs attention"}
            </span>
          </div>
        </div>
      </Card>

      {/* LANGUAGES */}
      <Card noPadding>
        <CardHeader title="Audience languages" />
        <div className="p-5 flex flex-col gap-3">
          {p.languages.map((l, i) => (
            <div key={l.name} className="flex items-center gap-4">
              <div className="w-20 shrink-0 text-[13px] text-ink-secondary">
                {l.name}
              </div>
              <div className="flex-1">
                <AnimatedBar
                  pct={l.pct}
                  color="hsl(var(--accent-purple))"
                  opacity={l.opacity}
                  delay={i * 80}
                />
              </div>
              <div className="w-12 text-right text-[13px] text-ink-secondary tabular-nums">
                {l.pct}%
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* DOMAIN */}
      <Card noPadding>
        <CardHeader title="Content domain" />
        <div className="p-5 grid grid-cols-2 gap-8">
          <div>
            <Pill tone="purple" className="!text-[14px] !px-5 !py-2.5">
              {p.primaryNiche}
            </Pill>
            <div className="text-[11px] text-ink-muted mt-2">Primary niche</div>
          </div>
          <div>
            <div className="flex flex-wrap gap-1.5">
              {p.secondaryNiches.map((n) => (
                <Pill key={n} size="sm">{n}</Pill>
              ))}
            </div>
            <div className="text-[11px] text-ink-muted mt-2">Secondary niches</div>
          </div>
        </div>
      </Card>

      {/* NPS BREAKDOWN */}
      <Card noPadding>
        <CardHeader
          title="Audience NPS breakdown"
          subtitle="Based on comment sentiment classification across 5 posts"
        />
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3">
            <NpsColumn
              accent="hsl(var(--accent-teal))"
              value={p.npsBreakdown.promoters}
              valueClass="text-teal"
              label="Promoters"
              sub="Score 9–10 / Positive"
            />
            <NpsColumn
              accent="hsl(var(--accent-amber))"
              value={p.npsBreakdown.passives}
              valueClass="text-amber"
              label="Passives"
              sub="Score 7–8 / Neutral"
            />
            <NpsColumn
              accent="hsl(var(--accent-coral))"
              value={p.npsBreakdown.detractors}
              valueClass="text-coral"
              label="Detractors"
              sub="Score 1–6 / Negative"
            />
          </div>

          <div className="mt-5">
            <StackedBar
              segments={[
                { pct: p.npsBreakdown.promoters, color: "hsl(var(--accent-teal))" },
                { pct: p.npsBreakdown.passives, color: "hsl(var(--accent-amber))" },
                { pct: p.npsBreakdown.detractors, color: "hsl(var(--accent-coral))" },
                { pct: p.npsBreakdown.unclassified, color: "hsl(var(--border-default))" },
              ]}
            />
          </div>

          <div className="mt-3 text-[12px] text-ink-muted">
            NPS = %Promoters − %Detractors = {p.npsBreakdown.promoters}% −{" "}
            {p.npsBreakdown.detractors}% ={" "}
            <span className="font-semibold text-teal">
              +{p.npsBreakdown.promoters - p.npsBreakdown.detractors}
            </span>
          </div>
          <span className="sr-only">{total}%</span>
        </div>
      </Card>

      {/* FORMAT BENCHMARK */}
      <Card noPadding>
        <CardHeader
          title="Post format performance"
          subtitle="Casual posts vs Reels — avg across last 5 posts"
        />
        <div className="p-5 grid grid-cols-2 gap-3">
          <FormatCard
            badge="IMAGE"
            badgeTone="neutral"
            title="Casual posts (image)"
            stats={[
              ["Avg likes", p.formats.casual.likes.toLocaleString()],
              ["Avg comments", p.formats.casual.comments.toString()],
              ["Avg quality", p.formats.casual.quality],
              ["Posts count", p.formats.casual.count.toString()],
            ]}
          />
          <FormatCard
            badge="REEL"
            badgeTone="purple"
            title="Reels"
            best
            stats={[
              ["Avg likes", p.formats.reel.likes.toLocaleString()],
              ["Avg comments", p.formats.reel.comments.toString()],
              ["Avg quality", p.formats.reel.quality],
              ["Posts count", p.formats.reel.count.toString()],
            ]}
          />
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-start gap-2 text-[13px] text-ink-secondary">
            <ArrowUp size={14} className="text-teal mt-0.5 shrink-0" />
            <span>
              Reels generate <span className="font-semibold text-ink">{Math.round(((p.formats.reel.likes - p.formats.casual.likes) / p.formats.casual.likes) * 100)}%</span>{" "}
              more likes and <span className="font-semibold text-ink">{Math.round(((p.formats.reel.comments - p.formats.casual.comments) / p.formats.casual.comments) * 100)}%</span>{" "}
              more comments than casual posts for this creator.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MetricBlock({
  value,
  label,
  pillTone,
  pillLabel,
}: {
  value: React.ReactNode;
  label: string;
  pillTone: "teal" | "blue";
  pillLabel: string;
}) {
  return (
    <div className="px-7 first:pl-0 last:pr-0 flex flex-col items-start gap-1.5 min-w-[140px]">
      <div className="leading-none">{value}</div>
      <div className="text-[11px] text-ink-muted">{label}</div>
      <Pill tone={pillTone} size="sm">{pillLabel}</Pill>
    </div>
  );
}

function NpsColumn({
  accent,
  value,
  valueClass,
  label,
  sub,
}: {
  accent: string;
  value: number;
  valueClass: string;
  label: string;
  sub: string;
}) {
  return (
    <div
      className="bg-background rounded-[10px] p-4 border-t-[3px]"
      style={{ borderTopColor: accent }}
    >
      <div className={`text-[28px] metric-num ${valueClass}`}>
        <CountNumber value={value} suffix="%" />
      </div>
      <div className="text-[12px] text-ink-secondary mt-1">{label}</div>
      <div className="text-[11px] text-ink-muted">{sub}</div>
    </div>
  );
}

function FormatCard({
  badge,
  badgeTone,
  title,
  stats,
  best = false,
}: {
  badge: string;
  badgeTone: "neutral" | "purple";
  title: string;
  stats: [string, string][];
  best?: boolean;
}) {
  return (
    <div className="bg-background rounded-[10px] p-4 relative">
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-[10px] uppercase tracking-widest rounded-md px-2 py-[3px] font-medium ${
            badgeTone === "purple"
              ? "bg-primary-soft text-primary-ink"
              : "bg-surface-input text-ink-secondary"
          }`}
        >
          {badge}
        </span>
        {best && <Pill tone="teal" size="sm">Best format</Pill>}
      </div>
      <div className="text-[13px] font-medium text-ink mb-3">{title}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {stats.map(([label, val]) => (
          <div key={label}>
            <div className="text-[11px] text-ink-muted">{label}</div>
            <div className="text-[16px] font-semibold text-ink mt-0.5 tracking-tight-2">
              {val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
