import { useState, useEffect } from "react";
import { Sparkles, Heart, MessageSquare, Send, Bookmark, Link2, MoreHorizontal } from "lucide-react";

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {posts.map((p, idx) => (
            <div key={`${p.id}-${idx}`} className="bg-white border border-line-strong/40 rounded-[16px] overflow-hidden flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:bg-[#121212] dark:border-white/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              
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
                  <div className="text-[13px] text-ink-secondary leading-relaxed max-h-[150px] overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: p.analysis_result?.replace(/\*\*(.*?)\*\*/g, '<strong class="text-ink">$1</strong>').replace(/\n/g, '<br/>') || "No analysis available" }} />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-line/60 flex justify-between items-center">
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-[12px] font-medium text-primary hover:text-primary-strong transition-colors flex items-center gap-1.5">
                    <Link2 size={13} /> Voir sur Instagram
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}