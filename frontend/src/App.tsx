import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import AppLayout from "./layouts/AppLayout";
import PreAnalyzedPosts from "./pages/PreAnalyzedPosts";
import AnalyzePost from "./pages/AnalyzePost";
import PasteUrl from "./pages/PasteUrl";
import ProductMatch from "./pages/ProductMatch";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Reports />} />
              <Route path="/analyzed-posts" element={<PreAnalyzedPosts />} />
              <Route path="/analyze-post" element={<AnalyzePost />} />
              <Route path="/paste-url" element={<PasteUrl />} />
              <Route path="/product-match" element={<ProductMatch />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
