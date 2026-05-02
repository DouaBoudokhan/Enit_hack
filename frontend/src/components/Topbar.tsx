import { useExport } from "@/context/ExportContext";
import { motion } from "framer-motion";

export function Topbar() {
  const { download, isDownloading } = useExport();

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-16 flex items-center justify-between gap-4 sticky top-0 z-50 bg-background/40 backdrop-blur-xl border-b border-white/5 mb-8 px-8"
    >
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain logo-glow" />
      </div>
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={download}
          disabled={isDownloading}
          className="relative overflow-hidden group text-[13px] font-bold text-white bg-gradient-to-r from-primary to-accent-coral shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_25px_hsl(var(--primary)/0.5)] rounded-full px-6 py-2 transition-all duration-300 active:scale-95 disabled:opacity-50"
        >
          <span className="relative z-10 flex items-center gap-2">
            {isDownloading ? (
               <>
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 Processing...
               </>
            ) : (
              <>
                <FileText size={14} />
                Export Audit
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
        </button>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          aria-label="User"
          className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-teal shadow-lg text-black text-[14px] font-black flex items-center justify-center cursor-pointer ring-2 ring-white/10 hover:ring-primary/40 transition-all"
        >
          DB
        </motion.div>
      </div>
    </motion.header>
  );
}

