import { useExport } from "@/context/ExportContext";

export function Topbar() {
  const { download, isDownloading } = useExport();

  return (
    <header className="h-12 flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={download}
        className="text-[12px] text-ink-secondary border border-line-strong/70 rounded-lg px-3.5 py-1.5 bg-surface hover:bg-surface-input transition-colors duration-150 active:scale-[0.98]"
      >
        {isDownloading ? "Downloading…" : "Export JSON"}
      </button>
      <div
        aria-label="User"
        className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-[12px] font-semibold flex items-center justify-center"
      >
        U
      </div>
    </header>
  );
}
