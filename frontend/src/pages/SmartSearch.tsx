import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { InfluencerProfile } from "@/components/InfluencerProfile";
import { ProfileSkeleton } from "@/components/ProfileSkeleton";
import { useExport } from "@/context/ExportContext";
import { influencerProfiles, recentSearches } from "@/data/demo";

export default function SmartSearch() {
  const [query, setQuery] = useState("Oumaima Hamrouni");
  const [showProductDesc, setShowProductDesc] = useState(false);
  const [productDesc, setProductDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeProfile, setActiveProfile] = useState(influencerProfiles[0]);
  const [hasResult, setHasResult] = useState(true);
  const { setPayload } = useExport();
  const resultRef = useRef<HTMLDivElement>(null);

  // Pre-populate export payload with the demo profile.
  useEffect(() => {
    setPayload({
      page: "smart_search",
      query: "Oumaima Hamrouni",
      result: activeProfile,
    });
  }, [setPayload, activeProfile]);

  const findProfile = (name: string) => {
    const q = name.toLowerCase().trim();
    return influencerProfiles.find(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.handle.toLowerCase().includes(q) ||
        q.includes(p.name.toLowerCase().split(" ")[0])
    );
  };

  const onAnalyze = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setHasResult(false);
    setTimeout(() => {
      const found = findProfile(query);
      const profile = found ?? influencerProfiles[0];
      setActiveProfile(profile);
      setLoading(false);
      setHasResult(true);
      setPayload({
        page: "smart_search",
        query,
        productDescription: productDesc || null,
        result: profile,
      });
    }, 1100);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink tracking-tight-2">
          Influencer search
        </h1>
        <p className="text-[14px] text-ink-secondary mt-1">
          Analyze any Tunisian influencer by name — sentiment, NPS & community quality
        </p>
      </div>

      <form onSubmit={onAnalyze}>
        <div className="relative bg-surface border border-line-strong/80 rounded-[10px] h-12 flex items-center px-4 transition-shadow focus-within:border-primary focus-within:shadow-[0_0_0_3px_hsl(var(--accent-purple)/0.1)]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, e.g. Oumaima Hamrouni"
            className="flex-1 bg-transparent outline-none text-[14px] text-ink placeholder:text-ink-muted"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-primary-strong text-primary-foreground text-[14px] font-medium h-8 px-4 rounded-lg transition-colors duration-150 active:scale-[0.98]"
          >
            Analyze →
          </button>
        </div>

        {/* Quick pick buttons */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[12px] text-ink-muted">Quick:</span>
          {recentSearches.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setQuery(name);
                setLoading(true);
                setHasResult(false);
                setTimeout(() => {
                  const found = findProfile(name);
                  const profile = found ?? influencerProfiles[0];
                  setActiveProfile(profile);
                  setLoading(false);
                  setHasResult(true);
                  setPayload({
                    page: "smart_search",
                    query: name,
                    result: profile,
                  });
                }, 800);
              }}
              className="text-[12px] text-primary hover:text-primary-strong bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-md transition-colors"
            >
              {name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowProductDesc((v) => !v)}
          className="mt-3 flex items-center gap-1 text-[13px] text-ink-secondary hover:text-ink transition-colors"
        >
          {showProductDesc ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
          Add product description (optional)
        </button>

        {showProductDesc && (
          <div className="animate-slide-down overflow-hidden">
            <textarea
              rows={3}
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              placeholder="Describe your product or brand to get a brand-fit score…"
              className="mt-2 w-full bg-surface border border-line-strong/80 rounded-[10px] p-4 text-[14px] text-ink placeholder:text-ink-muted outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--accent-purple)/0.1)] resize-none"
            />
          </div>
        )}
      </form>

      <div ref={resultRef} className="mt-8">
        {loading && (
          <div>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="spinner" />
              <span className="text-[14px] text-ink-secondary">
                Analyzing influencer…
              </span>
            </div>
            <ProfileSkeleton />
          </div>
        )}
        {!loading && hasResult && <InfluencerProfile profile={activeProfile} />}
      </div>
    </div>
  );
}
