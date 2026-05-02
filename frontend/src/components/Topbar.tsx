import { useExport } from "@/context/ExportContext";
import { useTheme } from "@/context/ThemeContext";
import { motion } from "framer-motion";
import { FileText, Sun, Moon } from "lucide-react";

export function Topbar() {
  const { download, isDownloading } = useExport();
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-16 flex items-center justify-end gap-4 sticky top-0 z-50 mb-8 px-8 border-b border-line"
      style={{ background: "var(--topbar-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <motion.button
          type="button"
          onClick={toggleTheme}
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-full flex items-center justify-center border border-line hover:border-primary/40 transition-all duration-300 bg-surface/60 backdrop-blur-md"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun size={17} className="text-amber" />
          ) : (
            <Moon size={17} className="text-primary" />
          )}
        </motion.button>

        {/* Export Button */}
        <button
          type="button"
          onClick={download}
          disabled={isDownloading}
          className="relative overflow-hidden group text-[13px] font-bold text-white bg-gradient-to-r from-primary to-coral shadow-[0_4px_20px_hsl(var(--accent-purple)/0.35)] hover:shadow-[0_6px_25px_hsl(var(--accent-purple)/0.5)] rounded-full px-6 py-2 transition-all duration-300 active:scale-95 disabled:opacity-50"
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

        {/* User Avatar */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          aria-label="User"
          className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal shadow-lg text-white text-[14px] font-black flex items-center justify-center cursor-pointer ring-2 ring-line hover:ring-primary/40 transition-all"
        >
          DB
        </motion.div>
      </div>
    </motion.header>
  );
}
