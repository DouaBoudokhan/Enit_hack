import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Users, TrendingUp, MessageCircle, Star, ShieldCheck, ArrowRight } from "lucide-react";

interface Report {
  id: string;
  name: string;
  content: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<Report | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/reports")
      .then((res) => res.json())
      .then((data) => {
        setReports(data.reports);
        if (data.reports.length > 0) {
          setActiveReport(data.reports[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch reports", err);
        setLoading(false);
      });
  }, []);

  const metrics = useMemo(() => {
    if (!activeReport) return null;
    
    // Improved regex to capture percentages and scores even with varying whitespace/formatting
    const sentimentMatch = activeReport.content.match(/Positif:\s*\*\*([\d.]+)%\*\*\s*\|\s*Négatif:\s*\*\*([\d.]+)%\*\*\s*\|\s*Indifférent:\s*\*\*([\d.]+)%\*\*/);
    const qualityMatch = activeReport.content.match(/Qualité Moyenne de la Conversation\s*:\s*\*\*([\d./]+)\*\*/);

    return {
      sentiment: sentimentMatch ? {
        positive: sentimentMatch[1],
        negative: sentimentMatch[2],
        neutral: sentimentMatch[3]
      } : null,
      quality: qualityMatch ? qualityMatch[1] : null
    };
  }, [activeReport]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -inset-4 bg-primary/20 blur-xl rounded-full"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full shadow-2xl"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <div className="container mx-auto py-12 px-6 max-w-7xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-16 text-center"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[120px] rounded-full -z-10" />
          <h1 className="text-5xl font-black tracking-tight lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-ink to-ink/60 mb-6">
            Audits d'Engagement
          </h1>
          <p className="text-ink-muted text-xl max-w-2xl mx-auto leading-relaxed">
            Intelligence augmentée pour décoder les dynamiques sociales et l'influence réelle.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sidebar - Influenceurs List */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 space-y-6"
          >
            <div className="flex items-center gap-2 px-2 mb-2">
              <Users size={18} className="text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-ink/50">Influenceurs</h2>
            </div>
            <div className="flex flex-col gap-3">
              {reports.map((report) => (
                <motion.button
                  key={report.id}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveReport(report)}
                  className={`group relative w-full text-left p-5 rounded-2xl transition-all duration-500 overflow-hidden ${
                    activeReport?.id === report.id
                      ? "bg-ink text-surface shadow-[0_20px_40px_rgba(0,0,0,0.1)] scale-[1.02]"
                      : "bg-surface border border-line hover:border-ink/20 text-ink"
                  }`}
                >
                  {activeReport?.id === report.id && (
                    <motion.div 
                      layoutId="active-bg"
                      className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50"
                    />
                  )}
                  <div className="relative flex items-center justify-between">
                    <span className="font-bold text-lg tracking-tight truncate">
                      @{report.name.split(' ')[0].toLowerCase()}
                    </span>
                    <ArrowRight size={16} className={`transition-transform duration-300 ${activeReport?.id === report.id ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"}`} />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {activeReport ? (
                <motion.div
                  key={activeReport.id}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-8"
                >
                  {/* Top Metrics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {metrics?.sentiment && (
                      <>
                        <motion.div variants={itemVariants} className="bg-surface border border-line p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 mb-4 text-emerald-500">
                            <TrendingUp size={20} />
                            <span className="text-xs font-bold uppercase tracking-wider">Sentiment Positif</span>
                          </div>
                          <div className="text-4xl font-black">{metrics.sentiment.positive}%</div>
                          <div className="mt-2 h-1.5 w-full bg-line rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${metrics.sentiment.positive}%` }}
                              className="h-full bg-emerald-500"
                            />
                          </div>
                        </motion.div>
                        <motion.div variants={itemVariants} className="bg-surface border border-line p-6 rounded-3xl shadow-sm">
                          <div className="flex items-center gap-3 mb-4 text-primary">
                            <Star size={20} />
                            <span className="text-xs font-bold uppercase tracking-wider">Qualité Conv.</span>
                          </div>
                          <div className="text-4xl font-black">{metrics.quality}</div>
                          <p className="text-ink-muted text-xs mt-2">Score moyen sur 10 posts</p>
                        </motion.div>
                        <motion.div variants={itemVariants} className="bg-surface border border-line p-6 rounded-3xl shadow-sm">
                          <div className="flex items-center gap-3 mb-4 text-blue-500">
                            <MessageCircle size={20} />
                            <span className="text-xs font-bold uppercase tracking-wider">Engagement</span>
                          </div>
                          <div className="text-4xl font-black">Ultra-Sain</div>
                          <p className="text-ink-muted text-xs mt-2">Fidélité communautaire forte</p>
                        </motion.div>
                      </>
                    )}
                  </div>

                  {/* Detailed Report Content */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-surface/50 backdrop-blur-md border border-line rounded-[40px] p-8 md:p-14 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                      <ShieldCheck size={400} />
                    </div>
                    
                    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h1:text-5xl prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:pb-4 prose-h2:border-b prose-h2:border-line prose-p:text-lg prose-p:leading-relaxed prose-p:text-ink-secondary prose-li:text-ink-secondary prose-strong:text-ink prose-strong:font-bold">
                      <ReactMarkdown>
                        {activeReport.content}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="h-[60vh] flex flex-col items-center justify-center text-ink-muted space-y-4">
                  <div className="w-20 h-20 bg-surface border border-line rounded-3xl flex items-center justify-center">
                    <Users size={32} />
                  </div>
                  <p className="text-lg">Sélectionnez un influenceur pour débuter l'analyse</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
