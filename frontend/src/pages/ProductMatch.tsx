import { useEffect, useState, useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { AnimatedBar } from "@/components/Bars";
import { useExport } from "@/context/ExportContext";

type Mode = "describe" | "upload";

interface MatchResult {
  name: string;
  handle: string;
  initials: string;
  category: string;
  match: number;
  cqs: number;
  domain: string[];
  followers: number;
  engagement_rate: number;
  sentiment_positive: number;
  reason: string;
  best: boolean;
}

export default function ProductMatch() {
  const [mode, setMode] = useState<Mode>("describe");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [hasResult, setHasResult] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedDesc, setGeneratedDesc] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setPayload } = useExport();

  useEffect(() => {
    if (hasResult) {
      setPayload({
        page: "product_match",
        productDescription: generatedDesc || desc,
        matches,
      });
    }
  }, [setPayload, desc, matches, hasResult, generatedDesc]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onFind = async () => {
    setLoading(true);
    setHasResult(false);
    setError("");
    setGeneratedDesc("");

    try {
      let body: { description?: string; image_base64?: string } = {};

      if (mode === "describe") {
        if (!desc.trim()) {
          setError("Please enter a product description.");
          setLoading(false);
          return;
        }
        body.description = desc;
      } else {
        // Upload mode
        if (imageFile) {
          // Convert image to base64
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              // Remove data:image/xxx;base64, prefix
              resolve(result.split(",")[1]);
            };
            reader.readAsDataURL(imageFile);
          });
          body.image_base64 = base64;
        } else {
          setError("Please upload a product image.");
          setLoading(false);
          return;
        }
      }

      const response = await fetch("http://localhost:8000/api/product-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to find matches");
      }

      const data = await response.json();
      setMatches(data.matches || []);
      if (data.description && mode === "upload") {
        setGeneratedDesc(data.description);
      }
      setHasResult(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
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
        <div>
          {imagePreview ? (
            <div className="relative border border-line-strong rounded-[10px] bg-surface p-4">
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 bg-surface border border-line rounded-full p-1 hover:bg-surface-input transition-colors"
              >
                <X size={14} className="text-ink-muted" />
              </button>
              <div className="flex items-center gap-4">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-20 h-20 object-cover rounded-lg border border-line"
                />
                <div>
                  <div className="text-[14px] font-medium text-ink flex items-center gap-2">
                    <ImageIcon size={14} className="text-primary" />
                    {imageFile?.name}
                  </div>
                  <div className="text-[12px] text-ink-muted mt-1">
                    {imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : ""}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
              <div className="border-2 border-dashed border-line-strong rounded-[10px] bg-surface-raised py-10 flex flex-col items-center gap-2 hover:bg-surface transition-colors">
                <Upload size={24} className="text-ink-muted" strokeWidth={1.75} />
                <div className="text-[13px] text-ink-secondary">
                  Drop an image or click to browse
                </div>
                <div className="text-[11px] text-ink-muted">
                  JPG, PNG, WebP up to 5MB
                </div>
              </div>
            </label>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 text-[13px] text-coral bg-coral/10 border border-coral/20 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      {generatedDesc && (
        <div className="mt-3 bg-primary-soft/30 border border-primary/20 rounded-lg px-4 py-3">
          <div className="text-[11px] text-primary font-medium uppercase tracking-wider mb-1">AI-generated description</div>
          <div className="text-[13px] text-ink-secondary">{generatedDesc}</div>
        </div>
      )}

      <button
        type="button"
        onClick={onFind}
        disabled={loading}
        className="mt-4 w-full bg-primary hover:bg-primary-strong disabled:opacity-60 text-primary-foreground text-[14px] font-medium h-11 rounded-[10px] transition-colors duration-150 active:scale-[0.98]"
      >
        {loading ? "Analyzing…" : "Find matches →"}
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
          hasResult && matches.length > 0 && (
            <div className="grid grid-cols-3 gap-4 animate-fade-in">
              {matches.map((m, i) => (
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
  match: MatchResult;
  delay: number;
}) {
  const cqsColor =
    match.cqs >= 70 ? "text-teal" : match.cqs >= 60 ? "text-amber" : "text-coral";

  const avatarBg = match.best
    ? "hsl(var(--accent-purple-soft))"
    : "hsl(var(--surface-input))";

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
        <div className="text-[11px] text-ink-muted">CQS</div>
        <div className={`text-[18px] font-semibold mt-0.5 tracking-tight-2 ${cqsColor}`}>
          {match.cqs.toFixed(1)}
        </div>
      </div>

      <p className="mt-3 italic text-[13px] text-ink-secondary">
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
