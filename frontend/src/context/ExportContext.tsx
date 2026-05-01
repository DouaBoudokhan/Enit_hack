import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

type ExportPayload = Record<string, unknown> | null;

interface ExportCtx {
  setPayload: (data: ExportPayload, label?: string) => void;
  download: () => void;
  isDownloading: boolean;
  hasData: boolean;
}

const Ctx = createContext<ExportCtx | null>(null);

export function ExportProvider({ children }: { children: ReactNode }) {
  const [payload, setPayloadState] = useState<ExportPayload>(null);
  const [isDownloading, setDownloading] = useState(false);

  const setPayload = useCallback((data: ExportPayload) => {
    setPayloadState(data);
  }, []);

  const download = useCallback(() => {
    if (!payload) {
      toast({ title: "Nothing to export yet", description: "Run an analysis first." });
      return;
    }
    setDownloading(true);
    setTimeout(() => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "enit_hack_results.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloading(false);
    }, 600);
  }, [payload]);

  return (
    <Ctx.Provider value={{ setPayload, download, isDownloading, hasData: !!payload }}>
      {children}
    </Ctx.Provider>
  );
}

export function useExport() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useExport must be used within ExportProvider");
  return v;
}
