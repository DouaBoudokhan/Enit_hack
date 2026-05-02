import { useState, useEffect } from "react";
import { Sparkles, Heart, MessageSquare, Send, Bookmark, Link2, MoreHorizontal } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { StackedBar } from "@/components/Bars";
import { Pill } from "@/components/Pill";

interface AnalyzedPost {
  id: string;
  url: string;
  display_url: string;
  type: string;
  influencer: string;
  caption: string;
  likes: number;
  comments_count: number;
  analysis_result: string;
}

function CreativeAnalysis({ text }: { text: string }) {
  // Remove bold markers for easier regex parsing
  const cleanText = text.replace(/\*\*/g, "");
  
  const sentimentsMatch = cleanText.match(/Positif[:\s]+(\d+)%[^N]*Négatif[:\s]+(\d+)%[^I]*Indifférent[:\s]+(\d+)%/i);
  const cqsMatch = cleanText.match(/Qualité de la Conversation\s*:\s*(\d+(?:\.\d+)?)\/10/i);
  
  if (!sentimentsMatch || !cqsMatch) {
    // Fallback if parsing fails
    return (
      <div className="prose prose-sm prose-p:my-1 prose-strong:text-ink max-w-none pr-2">
        <ReactMarkdown>{(text || "No analysis available").replace(/\n/g, '\n\n').replace(/\n\n\n/g, '\n\n')}</ReactMarkdown>
      </div>
    );
  }

  const pos = parseInt(sentimentsMatch[1]);
  const neg = parseInt(sentimentsMatch[2]);
  const ind = parseInt(sentimentsMatch[3]);
  const cqs = parseFloat(cqsMatch[1]);

  let justification = "";
  let themes = "";
  
  const justMatch = cleanText.match(/Justification[^\:]*:\s*(.*?)(?:Thèmes dominants|$)/i);
  if (justMatch) justification = justMatch[1].trim();
  
  const themesMatch = cleanText.match(/Thèmes dominants[^\:]*:\s*(.*)/i);
  if (themesMatch) themes = themesMatch[1].trim();

  // If themes contains parentheses with Arabic, we can just split by commas.
  const themeTags = themes.split(',').map(t => t.trim()).filter(t => t.length > 0);

  return (
    <div className="flex flex-col gap-3.5 pr-2 mt-3 pb-1">
      {/* Sentiments */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-[11px] font-semibold">
          <span className="text-teal">Positif {pos}%</span>
          <span className="text-ink-muted">Indifférent {ind}%</span>
          <span className="text-coral">Négatif {neg}%</span>
        </div>
        <StackedBar 
          segments={[
            { pct: pos, color: "hsl(159 100% 33%)" },
            { pct: ind, color: "hsl(36 5% 60%)" },
            { pct: neg, color: "hsl(11 80% 54%)" },
          ]} 
          height={6} 
        />
      </div>

      {/* CQS */}
      <div className="flex items-center justify-between bg-white dark:bg-[#1A1A1A] border border-line rounded-[8px] px-3 py-2 shadow-sm">
        <span className="text-[12px] font-semibold text-ink-secondary">Qualité de Conversation</span>
        <div className="flex items-center gap-1.5">
          <strong className={`text-[14px] tracking-tight ${cqs >= 7 ? "text-teal" : cqs >= 5 ? "text-amber" : "text-coral"}`}>{cqs}/10</strong>
        </div>
      </div>

      {/* Justification */}
      {justification && (
        <div className="text-[12.5px] text-ink-secondary leading-relaxed bg-surface-input/60 p-3 rounded-[8px] border border-line/50">
          <strong className="text-ink text-[11px] uppercase tracking-widest block mb-1.5 opacity-80">Résumé de l'Agent</strong>
          {justification}
        </div>
      )}

      {/* Themes */}
      {themeTags.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          <strong className="text-ink text-[11px] uppercase tracking-widest opacity-80">Thèmes Abordés</strong>
          <div className="flex flex-wrap gap-1.5">
            {themeTags.map((tag, i) => (
              <Pill key={i} size="sm" tone="purple" className="!bg-primary/10 !text-primary !border !border-primary/20">
                {tag}
              </Pill>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function PreAnalyzedPosts() {
  const [posts, setPosts] = useState<AnalyzedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analyzed-posts")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-12 animate-fade-in relative z-10 px-4 pt-6">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-[28px] font-bold text-ink tracking-tight flex items-center gap-3">
          <Sparkles className="text-primary w-7 h-7" /> Bibliothèque d'Analyses
        </h1>
        <p className="text-[15px] text-ink-secondary max-w-2xl">
          Visualisez les posts d'influenceurs récemment analysés par l'équipe d'Agents IA (Tirés des dossiers locaux).
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-24">
          <div className="spinner" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24 text-ink-secondary bg-surface rounded-xl border border-line border-dashed">
          Aucun post analysé trouvé dans le dossier sm_crew/post_analysis/
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {posts.map((p, idx) => (
            <motion.div 
              variants={itemVariants}
              key={`${p.id}-${idx}`} 
              className="bg-white/90 backdrop-blur-xl border border-line-strong/40 rounded-[16px] overflow-hidden flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:bg-[#121212]/90 dark:border-white/10 hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-300"
            >
              
              {/* Instagram Style Header */}
              <div className="flex items-center justify-between p-3 border-b border-line dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-tr from-amber-400 via-coral to-purple-500 p-[2px]">
                    <div className="w-full h-full rounded-full border-[2px] border-white dark:border-[#121212] overflow-hidden bg-surface">
                      <img 
                        src={p.influencer === "oumaima.hamrouni_" ? "https://instagram.tunis/oumaima.jpg" : `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.influencer}`} 
                        alt="avatar" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${p.influencer}&backgroundColor=8857ff`;
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-semibold text-ink leading-tight">
                      {p.influencer}
                    </span>
                    <span className="text-[11px] text-ink-muted leading-tight mt-0.5">
                      {p.type} Post
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-input cursor-pointer transition-colors">
                  <MoreHorizontal size={18} className="text-ink-muted" />
                </div>
              </div>

              {/* Image Area */}
              <div className="bg-gradient-to-br from-surface to-surface-input min-h-[300px] h-[350px] flex items-center justify-center relative group">
                {p.display_url ? (
                  <img 
                    src={`http://localhost:8000/api/proxy-image?url=${encodeURIComponent(p.display_url)}`}
                    className="w-full h-full object-cover" 
                    alt="Post"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/400x500/161b22/58a6ff?text=${p.type}+Post\\n(Image+URL+Expired)`;
                    }}
                  />
                ) : (
                  <div className="text-sm text-ink-muted p-12 text-center text-ink-secondary">
                    Visuel indisponible
                  </div>
                )}
                {p.type?.toLowerCase() === "video" && (
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg> 
                    REEL
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="p-4 bg-white dark:bg-[#121212] flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3 text-ink">
                  <div className="flex items-center gap-3.5">
                    <Heart size={24} className="hover:text-coral hover:fill-coral cursor-pointer transition-colors duration-200" />
                    <MessageSquare size={24} className="hover:opacity-50 cursor-pointer transition-opacity" />
                    <Send size={24} className="hover:opacity-50 cursor-pointer transition-opacity" />
                  </div>
                  <Bookmark size={24} className="hover:opacity-50 cursor-pointer transition-opacity" />
                </div>
                
                <div className="text-[13px] font-semibold text-ink mb-1.5 flex items-center gap-4">
                  <span>{(p.likes || 0).toLocaleString()} likes</span>
                  <span className="text-ink-muted font-normal">{(p.comments_count || 0).toLocaleString()} comments</span>
                </div>
                
                <div className="text-[13.5px] text-ink leading-[1.5] mb-4 overflow-y-auto max-h-[80px]">
                  <span className="font-semibold mr-1.5">{p.influencer}</span>
                  <span className="inline text-ink-secondary">{p.caption}</span>
                </div>
                
                {/* Embedded Analysis Result */}
                <div className="p-3.5 bg-primary/5 rounded-[12px] border border-primary/10 mt-auto flex-1">
                   <div className="flex items-center gap-2 mb-2">
                     <Sparkles className="text-primary w-4 h-4" />
                     <h3 className="font-semibold text-primary text-[14px]">Analyse IA</h3>
                   </div>
                  <div className="text-[13px] text-ink-secondary leading-relaxed max-h-[280px] overflow-y-auto custom-scrollbar">
                    <CreativeAnalysis text={p.analysis_result || ""} />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-line/60 flex justify-between items-center">
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-[12px] font-medium text-primary hover:text-primary-strong transition-colors flex items-center gap-1.5">
                    <Link2 size={13} /> Voir sur Instagram
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}