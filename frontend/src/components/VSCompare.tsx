import { motion, AnimatePresence } from "framer-motion";
import { X, Instagram, Zap, Users, MessageCircle, TrendingUp, Crown, ChevronDown } from "lucide-react";
import { useState } from "react";

interface CompareInfluencer {
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

interface VSCompareProps {
  influencers: CompareInfluencer[];
  onClose: () => void;
  productName?: string;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

type StatKey = "match" | "cqs" | "followers" | "engagement" | "sentiment";

function getStatValue(inf: CompareInfluencer, key: StatKey): number {
  switch (key) {
    case "match": return inf.match || 0;
    case "cqs": return inf.cqs || 0;
    case "followers": return inf.instagram_followers || inf.followers || 0;
    case "engagement": return inf.engagement_rate || 0;
    case "sentiment": return inf.sentiment_positive || 0;
  }
}

function StatBar({ label, icon, left, right, unit, isHigherBetter = true }: {
  label: string;
  icon: React.ReactNode;
  left: number;
  right: number;
  unit?: string;
  isHigherBetter?: boolean;
}) {
  const total = left + right || 1;
  const leftPct = (left / total) * 100;
  const rightPct = (right / total) * 100;
  const leftWins = isHigherBetter ? left > right : left < right;
  const rightWins = isHigherBetter ? right > left : right < left;
  const tie = left === right;

  const formatVal = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
    if (unit === "%") return `${v}%`;
    return v.toFixed(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-ink-muted">{icon}</span>
        <span className="text-[10px] font-black text-ink-muted uppercase tracking-[0.2em]">{label}</span>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Left value */}
        <div className={`text-right min-w-[60px] text-[18px] font-black tabular-nums transition-colors ${
          leftWins ? "text-primary" : tie ? "text-ink" : "text-ink-muted"
        }`}>
          {formatVal(left)}{unit && !unit.includes("%") ? unit : ""}
        </div>

        {/* Bar */}
        <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-surface-input gap-[2px]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${leftPct}%` }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className={`h-full rounded-l-full ${leftWins ? "bg-gradient-to-r from-primary to-primary/70" : "bg-ink-muted/30"}`}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${rightPct}%` }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className={`h-full rounded-r-full ${rightWins ? "bg-gradient-to-l from-teal to-teal/70" : "bg-ink-muted/30"}`}
          />
        </div>

        {/* Right value */}
        <div className={`min-w-[60px] text-[18px] font-black tabular-nums transition-colors ${
          rightWins ? "text-teal" : tie ? "text-ink" : "text-ink-muted"
        }`}>
          {formatVal(right)}{unit && !unit.includes("%") ? unit : ""}
        </div>
      </div>
    </motion.div>
  );
}

export default function VSCompare({ influencers, onClose, productName }: VSCompareProps) {
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(influencers.length > 1 ? 1 : 0);
  const [showLeftPicker, setShowLeftPicker] = useState(false);
  const [showRightPicker, setShowRightPicker] = useState(false);

  const left = influencers[leftIdx];
  const right = influencers[rightIdx];

  if (!left || !right) return null;

  // Calculate who wins more categories
  const stats: { key: StatKey; label: string; icon: React.ReactNode; unit?: string }[] = [
    { key: "match", label: "Strategic Fit", icon: <Zap size={14} />, unit: "%" },
    { key: "cqs", label: "CQS Score", icon: <Crown size={14} /> },
    { key: "followers", label: "Followers", icon: <Users size={14} /> },
    { key: "engagement", label: "Engagement", icon: <TrendingUp size={14} />, unit: "%" },
    { key: "sentiment", label: "Positive Sentiment", icon: <MessageCircle size={14} />, unit: "%" },
  ];

  const leftWins = stats.filter(s => getStatValue(left, s.key) > getStatValue(right, s.key)).length;
  const rightWins = stats.filter(s => getStatValue(right, s.key) > getStatValue(left, s.key)).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-line bg-background"
          style={{ boxShadow: "0 40px 100px -20px rgba(0,0,0,0.6), 0 0 60px -10px hsla(263,90%,65%,0.15)" }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 p-2 bg-surface-input hover:bg-surface-raised rounded-xl transition-colors"
          >
            <X size={18} className="text-ink-muted" />
          </button>

          {/* Header */}
          <div className="text-center pt-10 pb-8 px-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">
                Head to Head
              </div>
              <h2 className="text-2xl font-black text-ink tracking-tight">
                Influencer Showdown
              </h2>
              {productName && (
                <p className="text-[13px] text-ink-muted mt-2 font-medium">
                  Best fit for <span className="text-primary font-bold">{productName}</span>
                </p>
              )}
            </motion.div>
          </div>

          {/* VS Header - Two fighters */}
          <div className="flex items-center justify-center gap-4 px-8 pb-8">
            {/* Left Fighter */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex-1 text-center"
            >
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-black text-3xl text-primary border-2 border-primary/30 mx-auto shadow-[0_0_30px_hsla(263,90%,65%,0.2)]">
                  {left.initials}
                </div>
                {left.best && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <Crown size={14} className="text-white" />
                  </div>
                )}
              </div>
              
              {/* Dropdown picker */}
              <div className="relative mt-4">
                <button
                  onClick={() => { setShowLeftPicker(!showLeftPicker); setShowRightPicker(false); }}
                  className="inline-flex items-center gap-1 text-[18px] font-black text-ink hover:text-primary transition-colors"
                >
                  {left.name}
                  <ChevronDown size={16} className="text-ink-muted" />
                </button>
                {showLeftPicker && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-surface border border-line rounded-xl p-2 min-w-[200px] z-20 shadow-xl">
                    {influencers.map((inf, i) => (
                      <button
                        key={inf.name}
                        onClick={() => { setLeftIdx(i); setShowLeftPicker(false); }}
                        className={`w-full text-left px-4 py-2 rounded-lg text-[13px] font-bold transition-colors ${
                          i === leftIdx ? "bg-primary/10 text-primary" : "text-ink hover:bg-surface-input"
                        }`}
                      >
                        {inf.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-[11px] font-bold text-ink-muted uppercase tracking-widest mt-1">{left.category}</div>
              <div className="flex items-center justify-center gap-2 mt-2">
                {left.has_audit && (
                  <span className="text-[9px] font-black bg-teal/10 text-teal px-2 py-0.5 rounded-full uppercase tracking-widest">Audited</span>
                )}
                <span className="text-[12px] font-bold text-ink-secondary">
                  {formatCount(left.instagram_followers || left.followers || 0)} followers
                </span>
              </div>
            </motion.div>

            {/* VS Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 500 }}
              className="shrink-0"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-coral via-primary to-teal flex items-center justify-center shadow-[0_0_40px_hsla(354,85%,65%,0.3)]">
                  <span className="text-white font-black text-2xl tracking-tight" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>VS</span>
                </div>
                {/* Pulse ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-coral/20 to-teal/20 animate-ping" style={{ animationDuration: "2s" }} />
              </div>
            </motion.div>

            {/* Right Fighter */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex-1 text-center"
            >
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal/30 to-teal/10 flex items-center justify-center font-black text-3xl text-teal border-2 border-teal/30 mx-auto shadow-[0_0_30px_hsla(162,100%,48%,0.2)]">
                  {right.initials}
                </div>
                {right.best && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-teal rounded-full flex items-center justify-center shadow-lg">
                    <Crown size={14} className="text-white" />
                  </div>
                )}
              </div>
              
              {/* Dropdown picker */}
              <div className="relative mt-4">
                <button
                  onClick={() => { setShowRightPicker(!showRightPicker); setShowLeftPicker(false); }}
                  className="inline-flex items-center gap-1 text-[18px] font-black text-ink hover:text-teal transition-colors"
                >
                  {right.name}
                  <ChevronDown size={16} className="text-ink-muted" />
                </button>
                {showRightPicker && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-surface border border-line rounded-xl p-2 min-w-[200px] z-20 shadow-xl">
                    {influencers.map((inf, i) => (
                      <button
                        key={inf.name}
                        onClick={() => { setRightIdx(i); setShowRightPicker(false); }}
                        className={`w-full text-left px-4 py-2 rounded-lg text-[13px] font-bold transition-colors ${
                          i === rightIdx ? "bg-teal/10 text-teal" : "text-ink hover:bg-surface-input"
                        }`}
                      >
                        {inf.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-[11px] font-bold text-ink-muted uppercase tracking-widest mt-1">{right.category}</div>
              <div className="flex items-center justify-center gap-2 mt-2">
                {right.has_audit && (
                  <span className="text-[9px] font-black bg-teal/10 text-teal px-2 py-0.5 rounded-full uppercase tracking-widest">Audited</span>
                )}
                <span className="text-[12px] font-bold text-ink-secondary">
                  {formatCount(right.instagram_followers || right.followers || 0)} followers
                </span>
              </div>
            </motion.div>
          </div>

          {/* Stat Comparison Bars */}
          <div className="px-12 pb-6 space-y-6">
            <div className="h-px bg-gradient-to-r from-transparent via-line to-transparent" />
            
            {stats.map((s, i) => (
              <StatBar
                key={s.key}
                label={s.label}
                icon={s.icon}
                left={getStatValue(left, s.key)}
                right={getStatValue(right, s.key)}
                unit={s.unit}
              />
            ))}
          </div>

          {/* Verdict */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mx-8 mb-6 p-6 bg-gradient-to-r from-primary/5 via-surface to-teal/5 rounded-2xl border border-line"
          >
            <div className="text-center">
              <div className="text-[10px] font-black text-ink-muted uppercase tracking-[0.2em] mb-3">Verdict</div>
              <div className="flex items-center justify-center gap-6">
                <div className={`text-center ${leftWins > rightWins ? "opacity-100" : "opacity-40"}`}>
                  <div className="text-3xl font-black text-primary">{leftWins}</div>
                  <div className="text-[10px] font-black text-ink-muted uppercase tracking-widest">wins</div>
                </div>
                <div className="text-[14px] font-black text-ink-muted">—</div>
                <div className={`text-center ${rightWins > leftWins ? "opacity-100" : "opacity-40"}`}>
                  <div className="text-3xl font-black text-teal">{rightWins}</div>
                  <div className="text-[10px] font-black text-ink-muted uppercase tracking-widest">wins</div>
                </div>
              </div>
              {leftWins !== rightWins && (
                <div className="mt-4 text-[14px] font-bold text-ink-secondary">
                  <span className={leftWins > rightWins ? "text-primary" : "text-teal"}>
                    {leftWins > rightWins ? left.name : right.name}
                  </span>
                  {" "}leads this matchup{productName ? ` for ${productName}` : ""}
                </div>
              )}
            </div>
          </motion.div>

          {/* Reasons side by side */}
          <div className="grid grid-cols-2 gap-4 px-8 pb-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="p-5 bg-primary/5 border border-primary/10 rounded-2xl"
            >
              <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Why {left.name.split(" ")[0]}</div>
              <p className="text-[13px] text-ink-secondary leading-relaxed font-medium italic">"{left.reason}"</p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {left.domain.map(d => (
                  <span key={d} className="text-[10px] font-bold bg-surface-input text-ink-muted px-2 py-0.5 rounded-md">#{d}</span>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="p-5 bg-teal/5 border border-teal/10 rounded-2xl"
            >
              <div className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-3">Why {right.name.split(" ")[0]}</div>
              <p className="text-[13px] text-ink-secondary leading-relaxed font-medium italic">"{right.reason}"</p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {right.domain.map(d => (
                  <span key={d} className="text-[10px] font-bold bg-surface-input text-ink-muted px-2 py-0.5 rounded-md">#{d}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
