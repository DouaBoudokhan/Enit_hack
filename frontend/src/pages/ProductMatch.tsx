import { useEffect, useState, useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { AnimatedBar } from "@/components/Bars";
import { useExport } from "@/context/ExportContext";
import { motion } from "framer-motion";

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
        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">
          Influencer Matchmaker
        </h1>
        <p className="text-[15px] text-text-secondary max-w-lg leading-relaxed">
          Upload your product or describe your campaign, and Sarra will find the perfect cultural match.
        </p>
      </motion.div>

      <div className="max-w-2xl">
        {/* Glass Tabs */}
        <div className="inline-flex items-center gap-1 bg-white/5 p-1 rounded-2xl mb-8 border border-white/5">
          {(["describe", "upload"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`text-[13px] font-black px-6 py-2.5 rounded-xl transition-all duration-300 uppercase tracking-widest ${
                mode === m
                  ? "bg-primary text-black shadow-lg"
                  : "text-text-muted hover:text-white hover:bg-white/5"
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
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent-teal rounded-3xl blur opacity-10 group-focus-within:opacity-25 transition duration-500"></div>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
                placeholder="Describe your product, target audience, and brand values..."
                className="relative w-full glass-card p-6 text-[16px] text-white placeholder:text-text-muted outline-none resize-none min-h-[160px] font-medium leading-relaxed"
              />
            </div>
          ) : (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent-teal rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
              {imagePreview ? (
                <div className="relative glass-card p-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-24 h-24 object-cover rounded-2xl border border-white/10 shadow-2xl"
                    />
                    <div>
                      <div className="text-[15px] font-black text-white flex items-center gap-2">
                        <ImageIcon size={18} className="text-primary" />
                        {imageFile?.name}
                      </div>
                      <div className="text-[12px] font-bold text-text-muted mt-1 uppercase tracking-widest">
                        {imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : ""}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={clearImage}
                    className="p-3 bg-white/5 hover:bg-accent-coral/20 rounded-xl transition-all group"
                  >
                    <X size={20} className="text-text-muted group-hover:text-accent-coral" />
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
                  <div className="glass-card py-16 flex flex-col items-center gap-4 hover:bg-white/[0.08] transition-all border-dashed border-2 border-white/10 hover:border-primary/40">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                      <Upload size={32} />
                    </div>
                    <div className="text-center">
                      <div className="text-[15px] font-black text-white mb-1">
                        Drop product visual here
                      </div>
                      <div className="text-[12px] font-bold text-text-muted uppercase tracking-widest">
                        JPG, PNG, WebP up to 5MB
                      </div>
                    </div>
                  </div>
                </label>
              )}
            </div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-accent-coral/10 border border-accent-coral/20 rounded-xl text-[14px] text-accent-coral font-bold flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent-coral animate-pulse" />
              {error}
            </motion.div>
          )}

          {generatedDesc && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-primary/10 border border-primary/20 rounded-2xl">
              <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Sarra's Visual Perception</div>
              <div className="text-[14px] text-text-secondary leading-relaxed font-medium italic">"{generatedDesc}"</div>
            </motion.div>
          )}

          <button
            type="button"
            onClick={onFind}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-accent-teal hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] text-black font-black text-[15px] h-14 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest"
          >
            {loading ? "GATHERING INTELLIGENCE..." : "Find Best Matches"}
          </button>
        </motion.div>
      </div>

      <div className="mt-16">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-12 h-12 border-2 border-white/5 border-t-primary rounded-full animate-spin mb-6" />
            <p className="text-white font-bold tracking-widest text-[13px] animate-pulse">RANKING INFLUENCERS...</p>
          </div>
        ) : (
          hasResult && matches.length > 0 && (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {matches.map((m, i) => (
                <motion.div variants={itemVariants} key={m.name}>
                  <MatchCard match={m} delay={i * 80} />
                </motion.div>
              ))}
            </motion.div>
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
  return (
    <div className={`glass-card p-8 group relative h-full flex flex-col ${match.best ? "ring-2 ring-primary border-transparent" : ""}`}>
      {match.best && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black font-black text-[10px] px-4 py-1 rounded-full shadow-xl uppercase tracking-widest">
          Recommended
        </div>
      )}

      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center font-black text-2xl text-primary border border-white/5">
          {match.initials}
        </div>
        <div className="min-w-0">
          <div className="text-[18px] font-black text-white tracking-tight truncate mb-1">
            {match.name}
          </div>
          <Pill className="bg-white/10 text-text-secondary border-none text-[10px] font-black uppercase tracking-widest">
            {match.category}
          </Pill>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between font-black text-[11px] uppercase tracking-widest">
            <span className="text-text-muted">Strategic Fit</span>
            <span className="text-primary">{match.match}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${match.match}%` }}
              transition={{ duration: 1.5, delay: delay / 1000 }}
              className="h-full bg-gradient-to-r from-primary to-accent-teal"
            />
          </div>
        </div>

        <div className="flex justify-between items-end border-t border-white/5 pt-6">
           <div>
             <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">CQS SCORE</p>
             <p className={`text-2xl font-black ${match.cqs >= 70 ? "text-accent-teal" : "text-accent-amber"}`}>
               {match.cqs.toFixed(1)}
             </p>
           </div>
           <div className="text-right">
             <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">ENGAGEMENT</p>
             <p className="text-xl font-black text-white">{match.engagement_rate}%</p>
           </div>
        </div>

        <p className="text-[14px] font-medium text-text-secondary leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1">
          "{match.reason}"
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/5">
        {match.domain.map((d) => (
          <Pill key={d} className="bg-white/5 text-white/50 border-none text-[10px] font-bold">#{d}</Pill>
        ))}
      </div>
    </div>
  );
}
