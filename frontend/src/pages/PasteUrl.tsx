import { Card } from "@/components/Card";
import { Link2 } from "lucide-react";

export default function PasteUrl() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink tracking-tight-2">
          Paste a URL
        </h1>
        <p className="text-[14px] text-ink-secondary mt-1">
          Drop an Instagram or TikTok profile link to analyze instantly.
        </p>
      </div>

      <div className="relative bg-surface border border-line-strong/80 rounded-[10px] h-12 flex items-center px-4 transition-shadow focus-within:border-primary focus-within:shadow-[0_0_0_3px_hsl(var(--accent-purple)/0.1)]">
        <Link2 size={16} className="text-ink-muted mr-2" />
        <input
          placeholder="https://instagram.com/username"
          className="flex-1 bg-transparent outline-none text-[14px] text-ink placeholder:text-ink-muted"
        />
        <button
          type="button"
          className="bg-primary hover:bg-primary-strong text-primary-foreground text-[14px] font-medium h-8 px-4 rounded-lg transition-colors duration-150 active:scale-[0.98]"
        >
          Analyze →
        </button>
      </div>

      <Card className="mt-6 text-center py-12">
        <div className="text-[14px] text-ink-secondary">
          Paste a profile URL above to begin.
        </div>
      </Card>
    </div>
  );
}
