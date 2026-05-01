import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { ExportProvider } from "@/context/ExportContext";

export default function AppLayout() {
  return (
    <ExportProvider>
      <div className="min-h-screen flex w-full bg-background text-ink">
        <Sidebar />
        <div className="flex-1 min-w-0 px-10 py-2">
          <Topbar />
          <main className="pt-2 pb-16">
            <Outlet />
          </main>
        </div>
      </div>
    </ExportProvider>
  );
}
