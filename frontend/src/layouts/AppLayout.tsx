import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { ExportProvider } from "@/context/ExportContext";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { VoiceWidget } from "@/components/VoiceWidget";

export default function AppLayout() {
  const location = useLocation();

  return (
    <ExportProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground relative overflow-hidden font-sans">
        {/* Animated Background Mesh */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] animate-pulse" style={{ animationDuration: '15s' }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal/5 blur-[140px] animate-pulse" style={{ animationDuration: '18s', animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] rounded-full bg-coral/2 blur-[160px] animate-pulse" style={{ animationDuration: '20s', animationDelay: '1s' }} />
        </div>

        <Sidebar />
        <div className="flex-1 min-w-0 px-12 py-2 relative z-10 flex flex-col h-screen">
          <Topbar />
          <main className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-20">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <div className="animate-in">
                  <Outlet />
                </div>
              </PageTransition>
            </AnimatePresence>
          </main>
        </div>
        <VoiceWidget />
      </div>
    </ExportProvider>
  );
}
