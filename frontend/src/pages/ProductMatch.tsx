import { useEffect, useState, useRef } from "react";
import { Upload, X, ImageIcon, Instagram, CheckCircle2, TrendingUp, Users, AlertCircle, Swords } from "lucide-react";
import { Pill } from "@/components/Pill";
import { useExport } from "@/context/ExportContext";
import { motion, AnimatePresence } from "framer-motion";
import VSCompare from "@/components/VSCompare";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 15, filter: "blur(4px)" },
  show: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 350, damping: 25 } }
};

type Mode = "describe" | "upload";

interface MatchResult {
  name: string;
  handle: string;
  tiktok_handle?: string | null;
  initials: string;
  category: string;
  match?: number;
  cqs?: number;
  domain: string[];
  followers?: number;
  instagram_followers?: number;
  tiktok_followers?: number;
  engagement_rate?: number;
  sentiment_positive?: number;
  reason: string;
  best?: boolean;
  has_audit: boolean;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
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
  const [showVS, setShowVS] = useState(false);
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
        if (imageFile) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
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
    <div className="max-w-6xl mx-auto pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-black text-ink tracking-tighter mb-2">
          Influencer Matchmaker
        </h1>
        <p className="text-[15px] text-ink-secondary max-w-lg leading-relaxed">
          Describe your product or upload an image, and Sarra will find the best Tunisian influencers for you.
        </p>
      </motion.div>

      <div className="max-w-2xl">
        {/* Glass Tabs */}
        <div className="inline-flex items-center gap-1 bg-surface-input p-1 rounded-2xl mb-8 border border-line">
          {(["describe", "upload"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`text-[13px] font-black px-6 py-2.5 rounded-xl transition-all duration-300 uppercase tracking-widest ${
                mode === m
                  ? "bg-primary text-white shadow-lg"
                  : "text-ink-muted hover:text-ink hover:bg-surface-raised"
              }`}
            >
              {m === "describe" ? "Description" : "Visual Upload"}
            </button>
          ))}
        </div>

        <motion.div
          key={mode}
          initial={{ opacity: 0, x: mode === "describe" ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {mode === "describe" ? (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-teal rounded-3xl blur opacity-10 group-focus-within:opacity-25 transition duration-500"></div>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
                placeholder="Describe your product, target audience, and brand values..."
                className="relative w-full glass-card p-6 text-[16px] text-ink placeholder:text-ink-muted outline-none resize-none min-h-[160px] font-medium leading-relaxed"
              />
            </div>
          ) : (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-teal rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
              {imagePreview ? (
                <div className="relative glass-card p-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-24 h-24 object-cover rounded-2xl border border-line shadow-2xl"
                    />
                    <div>
                      <div className="text-[15px] font-black text-ink flex items-center gap-2">
                        <ImageIcon size={18} className="text-primary" />
                        {imageFile?.name}
                      </div>
                      <div className="text-[12px] font-bold text-ink-muted mt-1 uppercase tracking-widest">
                        {imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : ""}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={clearImage}
                    className="p-3 bg-surface-input hover:bg-coral/20 rounded-xl transition-all group"
                  >
                    <X size={20} className="text-ink-muted group-hover:text-coral" />
                  </button>
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
                  <div className="glass-card py-16 flex flex-col items-center gap-4 hover:bg-surface-raised transition-all border-dashed border-2 border-line hover:border-primary/40">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                      <Upload size={32} />
                    </div>
                    <div className="text-center">
                      <div className="text-[15px] font-black text-ink mb-1">
                        Drop product visual here
                      </div>
                      <div className="text-[12px] font-bold text-ink-muted uppercase tracking-widest">
                        JPG, PNG, WebP up to 5MB
                      </div>
                    </div>
                  </div>
                </label>
              )}
            </div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-coral/10 border border-coral/20 rounded-xl text-[14px] text-coral font-bold flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-coral animate-pulse" />
              {error}
            </motion.div>
          )}

          {generatedDesc && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-primary/10 border border-primary/20 rounded-2xl">
              <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Sarra's Visual Perception</div>
              <div className="text-[14px] text-ink-secondary leading-relaxed font-medium italic">"{generatedDesc}"</div>
            </motion.div>
          )}

          <button
            type="button"
            onClick={onFind}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-teal hover:shadow-[0_0_30px_hsl(var(--accent-purple)/0.3)] text-white font-black text-[15px] h-14 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest"
          >
            {loading ? "SEARCHING..." : "Find Best Matches"}
          </button>
        </motion.div>
      </div>

      <div className="mt-16">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-12 h-12 border-2 border-line border-t-primary rounded-full animate-spin mb-6" />
            <p className="text-ink font-bold tracking-widest text-[13px] animate-pulse">RANKING INFLUENCERS...</p>
          </div>
        ) : (
          hasResult && matches.length > 0 && (
            <>
              {/* VS Compare Button */}
              {matches.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-10 flex justify-center"
                >
                  <button
                    onClick={() => setShowVS(true)}
                    className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-primary via-coral to-teal text-white font-black text-[14px] px-8 py-4 rounded-2xl transition-all hover:shadow-[0_0_40px_hsla(263,90%,65%,0.3)] active:scale-[0.97] uppercase tracking-widest"
                  >
                    <Swords size={20} className="group-hover:rotate-12 transition-transform" />
                    Compare Influencers
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-coral/20 to-teal/20 animate-pulse" style={{ animationDuration: "3s" }} />
                  </button>
                </motion.div>
              )}

              {/* Section Dividers */}
              {matches.some(m => m.has_audit) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-teal" />
                  <span className="text-[12px] font-black text-ink-muted uppercase tracking-widest">Audited Influencers</span>
                  <div className="flex-1 h-px bg-line" />
                </motion.div>
              )}
              
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {matches.filter(m => m.has_audit).map((m, i) => (
                  <motion.div variants={itemVariants} key={m.name}>
                    <AuditedCard match={m} delay={i * 80} />
                  </motion.div>
                ))}
              </motion.div>

              {matches.some(m => !m.has_audit) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12 mb-6 flex items-center gap-3">
                  <TrendingUp size={18} className="text-primary" />
                  <span className="text-[12px] font-black text-ink-muted uppercase tracking-widest">AI-Discovered</span>
                  <div className="flex-1 h-px bg-line" />
                </motion.div>
              )}

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {matches.filter(m => !m.has_audit).map((m, i) => (
                  <motion.div variants={itemVariants} key={m.name}>
                    <DiscoveredCard match={m} delay={i * 80} />
                  </motion.div>
                ))}
              </motion.div>
            </>
          )
        )}
      </div>

      {/* VS Compare Modal */}
      {showVS && matches.length >= 2 && (
        <VSCompare
          influencers={matches}
          onClose={() => setShowVS(false)}
          productName={generatedDesc || desc}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   AUDITED INFLUENCER CARD — Full stats (Samira & Oumaima)
   ══════════════════════════════════════════════════════════ */
function AuditedCard({ match, delay }: { match: MatchResult; delay: number }) {
  return (
    <div className={`glass-card p-8 group relative h-full flex flex-col ${match.best ? "ring-2 ring-primary border-transparent" : ""}`}>
      {match.best && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white font-black text-[10px] px-4 py-1 rounded-full shadow-xl uppercase tracking-widest">
          Recommended
        </div>
      )}

      {/* Badge "Audited" */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-1.5 bg-teal/10 text-teal px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
          <CheckCircle2 size={12} />
          Audited
        </div>
      </div>

      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center font-black text-2xl text-primary border border-line">
          {match.initials}
        </div>
        <div className="min-w-0">
          <div className="text-[18px] font-black text-ink tracking-tight truncate mb-1">
            {match.name}
          </div>
          <Pill className="bg-surface-input text-ink-secondary border-none text-[10px] font-black uppercase tracking-widest">
            {match.category}
          </Pill>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        {/* Match bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-black text-[11px] uppercase tracking-widest">
            <span className="text-ink-muted">Strategic Fit</span>
            <span className="text-primary">{match.match}%</span>
          </div>
          <div className="h-2 w-full bg-surface-input rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${match.match}%` }}
              transition={{ duration: 1.5, delay: delay / 1000 }}
              className="h-full bg-gradient-to-r from-primary to-teal"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between items-end border-t border-line pt-6">
           <div>
             <p className="text-[10px] font-black text-ink-muted uppercase tracking-widest mb-1">CQS Score</p>
             <p className={`text-2xl font-black ${(match.cqs || 0) >= 70 ? "text-teal" : "text-amber"}`}>
               {(match.cqs || 0).toFixed(1)}
             </p>
           </div>
           <div className="text-center">
             <p className="text-[10px] font-black text-ink-muted uppercase tracking-widest mb-1">Followers</p>
             <p className="text-xl font-black text-ink">{formatCount(match.instagram_followers || match.followers || 0)}</p>
           </div>
           <div className="text-right">
             <p className="text-[10px] font-black text-ink-muted uppercase tracking-widest mb-1">Engagement</p>
             <p className="text-xl font-black text-ink">{match.engagement_rate}%</p>
           </div>
        </div>

        <p className="text-[14px] font-medium text-ink-secondary leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1">
          "{match.reason}"
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-line">
        {match.domain.map((d) => (
          <Pill key={d} className="bg-surface-input text-ink-secondary border-none text-[10px] font-bold">#{d}</Pill>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DISCOVERED INFLUENCER CARD — AI-found, no audit data
   ══════════════════════════════════════════════════════════ */
function DiscoveredCard({ match, delay }: { match: MatchResult; delay: number }) {
  return (
    <div className="glass-card p-8 group relative h-full flex flex-col">
      {/* Badge "Discovered" */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
          <TrendingUp size={12} />
          Discovered
        </div>
      </div>

      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-teal/10 flex items-center justify-center font-black text-2xl text-primary border border-line">
          {match.initials}
        </div>
        <div className="min-w-0">
          <div className="text-[18px] font-black text-ink tracking-tight truncate mb-1">
            {match.name}
          </div>
          <Pill className="bg-surface-input text-ink-secondary border-none text-[10px] font-black uppercase tracking-widest">
            {match.category}
          </Pill>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        {/* Follower Stats (Instagram + TikTok) */}
        <div className="grid grid-cols-2 gap-4">
          {/* Instagram */}
          <div className="bg-surface-input rounded-2xl p-4 border border-line">
            <div className="flex items-center gap-2 mb-2">
              <Instagram size={14} className="text-coral" />
              <span className="text-[10px] font-black text-ink-muted uppercase tracking-widest">Instagram</span>
            </div>
            <p className="text-xl font-black text-ink">
              {match.instagram_followers ? formatCount(match.instagram_followers) : "—"}
            </p>
            <p className="text-[10px] text-ink-muted font-bold">followers</p>
          </div>

          {/* TikTok */}
          <div className="bg-surface-input rounded-2xl p-4 border border-line">
            <div className="flex items-center gap-2 mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-ink-secondary"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.28 0 .56.04.82.11v-3.5a6.37 6.37 0 0 0-.82-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.51a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.94z"/></svg>
              <span className="text-[10px] font-black text-ink-muted uppercase tracking-widest">TikTok</span>
            </div>
            <p className="text-xl font-black text-ink">
              {match.tiktok_followers ? formatCount(match.tiktok_followers) : "—"}
            </p>
            <p className="text-[10px] text-ink-muted font-bold">followers</p>
          </div>
        </div>

        {/* Handles */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[13px] font-bold text-ink-secondary">
            <Instagram size={14} className="text-coral" />
            <span>{match.handle}</span>
          </div>
          {match.tiktok_handle && (
            <div className="flex items-center gap-2 text-[13px] font-bold text-ink-secondary">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-ink-secondary"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.28 0 .56.04.82.11v-3.5a6.37 6.37 0 0 0-.82-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.51a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.94z"/></svg>
              <span>{match.tiktok_handle}</span>
            </div>
          )}
        </div>

        {/* AI Reason */}
        <p className="text-[14px] font-medium text-ink-secondary leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1">
          "{match.reason}"
        </p>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-amber/5 border border-amber/10 rounded-xl p-4">
          <AlertCircle size={16} className="text-amber shrink-0 mt-0.5" />
          <p className="text-[12px] text-ink-secondary leading-relaxed font-medium">
            We don't have community data on this influencer yet, but their profile looks highly relevant for your product.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-line">
        {match.domain.map((d) => (
          <Pill key={d} className="bg-surface-input text-ink-secondary border-none text-[10px] font-bold">#{d}</Pill>
        ))}
      </div>
    </div>
  );
}
