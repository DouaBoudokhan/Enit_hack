import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { AnimatedBar } from "@/components/Bars";
import { useExport } from "@/context/ExportContext";
import { productMatches } from "@/data/demo";

type Mode = "describe" | "upload";

export default function ProductMatch() {
  const [mode, setMode] = useState<Mode>("describe");
  const [desc, setDesc] = useState(
    "A premium organic skincare line targeting women 25–40."
  );
  const [loading, setLoading] = useState(false);
  const [hasResult, setHasResult] = useState(true);
  const { setPayload } = useExport();

  useEffect(() => {
    setPayload({
      page: "product_match",
      productDescription: desc,
      matches: productMatches,
    });
  }, [setPayload, desc]);

  const onFind = () => {
    setLoading(true);
    setHasResult(false);
    setTimeout(() => {
      setLoading(false);
      setHasResult(true);
    }, 1100);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink tracking-tight-2">
          Find your influencer
        </h1>
        <p className="text-[14px] text-ink-secondary mt-1">
          Describe your product and we'll rank the best matches.
        </p>
      </div>

      {/* Pill tabs */}
      <div className="inline-flex items-center gap-1 bg-surface-input p-1 rounded-full mb-4">
        {(["describe", "upload"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`text-[13px] font-medium px-4 py-1.5 rounded-full transition-all duration-150 ${
              mode === m
                ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-line-strong/70"
                : "text-ink-muted hover:text-ink-secondary"
            }`}
          >
            {m === "describe" ? "Describe product" : "Upload image"}
          </button>
        ))}
      </div>

      {mode === "describe" ? (
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={4}
          placeholder="e.g. A premium organic skincare line targeting women 25–40…"
          className="w-full h-[80px] bg-surface border border-line-strong/80 rounded-[10px] p-4 text-[14px] text-ink placeholder:text-ink-muted outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--accent-purple)/0.1)] resize-none"
        />
      ) : (
        <label className="block cursor-pointer">
          <input type="file" accept="image/png,image/jpeg" className="hidden" />
          <div className="border-2 border-dashed border-line-strong rounded-[10px] bg-surface-raised py-10 flex flex-col items-center gap-2 hover:bg-surface transition-colors">
            <Upload size={24} className="text-ink-muted" strokeWidth={1.75} />
            <div className="text-[13px] text-ink-secondary">
              Drop an image or click to browse
            </div>
            <div className="text-[11px] text-ink-muted">
              JPG, PNG up to 5MB
            </div>
          </div>
        </label>
      )}

      <button
        type="button"
        onClick={onFind}
        className="mt-4 w-full bg-primary hover:bg-primary-strong text-primary-foreground text-[14px] font-medium h-11 rounded-[10px] transition-colors duration-150 active:scale-[0.98]"
      >
        Find matches →
      </button>

      <div className="mt-8">
        {loading ? (
          <>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="spinner" />
              <span className="text-[14px] text-ink-secondary">
                Finding best matches…
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-surface rounded-[10px] shadow-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="skeleton !rounded-full w-12 h-12" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="skeleton h-4 w-28" />
                      <div className="skeleton h-3 w-16 rounded-full" />
                    </div>
                  </div>
                  <div className="skeleton h-2 w-full mb-3" />
                  <div className="skeleton h-12 w-full" />
                </div>
              ))}
            </div>
          </>
        ) : (
          hasResult && (
            <div className="grid grid-cols-3 gap-4 animate-fade-in">
              {productMatches.map((m, i) => (
                <MatchCard key={m.name} match={m} delay={i * 80} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  delay,
}: {
  match: (typeof productMatches)[number];
  delay: number;
}) {
  const cqsColor =
    match.cqsB >= 70 ? "text-teal" : match.cqsB >= 60 ? "text-amber" : "text-coral";

  const avatarBg =
    match.avatarBg === "primary-soft" ? "hsl(var(--accent-purple-soft))" : "hsl(var(--surface-input))";

  return (
    <Card
      className={`relative ${
        match.best ? "!border-[1.5px] !border-primary" : ""
      }`}
    >
      {match.best && (
        <div className="absolute top-3 right-3">
          <Pill tone="purple" size="sm">Best match</Pill>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: avatarBg }}
        >
          <span className="text-[14px] font-semibold text-primary-ink">
            {match.initials}
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-ink tracking-tight-2 truncate">
            {match.name}
          </div>
          <Pill size="sm" className="mt-1">{match.category}</Pill>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] text-ink-muted">Brand fit</span>
          <span className="text-[13px] font-semibold text-primary-ink">
            {match.match}%
          </span>
        </div>
        <AnimatedBar
          pct={match.match}
          color="hsl(var(--accent-purple))"
          height={6}
          delay={delay}
        />
      </div>

      <div className="mt-4">
        <div className="text-[11px] text-ink-muted">CQS_B</div>
        <div className={`text-[18px] font-semibold mt-0.5 tracking-tight-2 ${cqsColor}`}>
          {match.cqsB.toFixed(1)}
        </div>
      </div>

      <p className="mt-3 italic text-[13px] text-ink-secondary line-clamp-2">
        {match.reason}
      </p>

      <div className="flex flex-wrap gap-1.5 mt-4">
        {match.domain.map((d) => (
          <Pill key={d} size="sm">{d}</Pill>
        ))}
      </div>
    </Card>
  );
}
