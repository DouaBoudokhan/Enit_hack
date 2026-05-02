import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Loader2, Volume2, Ear, Search } from "lucide-react";
import { useRealtimeAudio } from "@/hooks/useRealtimeAudio";

export function VoiceWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { state, connect, disconnect } = useRealtimeAudio();

  const handleToggle = () => {
    if (isOpen) {
      disconnect();
      setIsOpen(false);
    } else {
      setIsOpen(true);
      connect();
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 20, scale: 0.9, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-[320px] glass-card overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          >
            <div className="p-8 flex flex-col items-center justify-center min-h-[220px] relative">
              {/* Close button */}
              <button 
                onClick={handleToggle}
                className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg"
              >
                <X size={16} />
              </button>

              <div className="text-center flex flex-col items-center gap-6">
                <div className="relative flex items-center justify-center w-24 h-24">
                  {/* Status Indicator animations */}
                  <AnimatePresence>
                    {state === "listening" && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        className="absolute inset-0 bg-accent-teal/20 blur-2xl rounded-full"
                      />
                    )}
                    {state === "speaking" && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0.7, 0.3] }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                        className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"
                      />
                    )}
                    {state === "investigating" && (
                      <motion.div
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{ rotate: { repeat: Infinity, duration: 4, ease: "linear" }, scale: { repeat: Infinity, duration: 2 } }}
                        className="absolute inset-[-8px] border-2 border-dashed border-primary/30 rounded-full"
                      />
                    )}
                  </AnimatePresence>
                  
                  <div className={`relative z-10 w-16 h-16 rounded-3xl flex items-center justify-center text-black shadow-2xl transition-all duration-500 ${
                    state === "connecting" || state === "investigating" ? "bg-accent-amber" :
                    state === "speaking" ? "bg-primary" : 
                    state === "error" ? "bg-accent-coral" : "bg-accent-teal"
                  }`}>
                    {state === "connecting" ? <Loader2 size={32} className="animate-spin" /> :
                     state === "investigating" ? <Search size={32} className="animate-pulse" /> :
                     state === "speaking" ? <Volume2 size={32} /> :
                     state === "error" ? <X size={32} /> :
                     <Ear size={32} />}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[18px] font-black text-white tracking-tight">
                    {state === "connecting" ? "Synchronizing..." :
                     state === "investigating" ? "Intelligence Gathering..." :
                     state === "speaking" ? "Sarra is speaking" : 
                     state === "error" ? "System Interrupted" : "Sarra is listening"}
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${state === 'listening' ? 'bg-accent-teal animate-pulse' : 'bg-white/20'}`} />
                    <span className="text-[12px] font-bold text-text-secondary uppercase tracking-[0.1em]">
                      {state === "listening" ? "Tunisian Protocol Active" :
                       state === "investigating" ? "Querying Neural Network" :
                       state === "speaking" ? "Outputting Audio" : "Ready"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggle}
          className="w-16 h-16 bg-gradient-to-br from-primary to-accent-teal text-black rounded-3xl shadow-[0_10px_30px_hsl(var(--primary)/0.4)] flex items-center justify-center hover:shadow-[0_15px_40px_hsl(var(--primary)/0.6)] transition-all relative overflow-hidden group"
        >
          <Mic size={28} className="relative z-10 group-hover:scale-110 transition-transform" />
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </motion.button>
      )}
    </div>
  );
}
