import React, { useEffect, useState } from "react";
import { sendToBackground } from "@plasmohq/messaging";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Flame, ShieldAlert, Lightbulb, ChevronRight, Lock, ExternalLink, RefreshCw } from "lucide-react";

import { useStorage } from "@plasmohq/storage/hook";
import { DEFAULT_LOCAL_STATE, LocalState } from "../schemas/storage";
import "../style.css";

export default function BlockPage() {
  const [local] = useStorage<LocalState>("local", DEFAULT_LOCAL_STATE);

  const [blockedUrl, setBlockedUrl] = useState("example.com");
  const [problemSlug, setProblemSlug] = useState("two-sum");
  const [problemTitle, setProblemTitle] = useState("Two Sum");
  const [difficulty, setDifficulty] = useState("Medium");
  const [preview, setPreview] = useState("Given an array of integers nums and an integer target...");
  const [showHint, setShowHint] = useState(false);
  const [overriding, setOverriding] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const blocked = params.get("blocked");
    const slug = params.get("problem");
    const title = params.get("title");
    const diff = params.get("difficulty");
    const prev = params.get("preview");

    if (blocked) {
      try {
        setBlockedUrl(new URL(blocked).hostname);
      } catch (e) {
        setBlockedUrl(blocked);
      }
    }
    if (slug) setProblemSlug(slug);
    if (title) setProblemTitle(title);
    if (diff) setDifficulty(diff);
    if (prev) setPreview(prev);
  }, []);

  const handleUseOverride = async () => {
    if (confirm("Use 1 of your 3 weekly emergency overrides for 10 minutes of freedom?")) {
      setOverriding(true);
      try {
        const res = await sendToBackground<{}, { success: boolean; remaining: number }>({
          name: "USE_OVERRIDE"
        });

        if (res && res.success) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          setTimeout(() => {
            window.location.href = paramsBlockedUrl();
          }, 1000);
        } else {
          alert("No override tokens remaining this week!");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setOverriding(false);
      }
    }
  };

  const paramsBlockedUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("blocked") || "https://google.com";
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex flex-col items-center justify-between p-6 select-none font-sans">
      {/* Zone 1: Top Status Bar */}
      <header className="w-full max-w-2xl flex items-center justify-between p-4 rounded-2xl bg-dark-card border border-dark-border shadow-xl">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm"
          >
            <Flame className="w-5 h-5 fill-amber-400 text-amber-500" />
            <span>{local.streak?.current || 0} Day Streak</span>
          </motion.div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span>Solved Today: {local.history?.[new Date().toISOString().split("T")[0]]?.solved || 0}</span>
        </div>
      </header>

      {/* Zone 2: Problem Card (Center Focus) */}
      <main className="w-full max-w-xl my-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-3xl bg-dark-card border border-dark-border shadow-2xl space-y-6 relative overflow-hidden"
        >
          {/* Header Badge */}
          <div className="flex items-center justify-between">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                difficulty === "Easy"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : difficulty === "Hard"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
            >
              {difficulty}
            </span>
            <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
              <Lock className="w-3.5 h-3.5 text-rose-400" /> Site Blocked
            </div>
          </div>

          {/* Problem Title */}
          <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-snug">
            {problemTitle}
          </h1>

          {/* Blurred Problem Preview (Zeigarnik Effect) */}
          <div className="relative p-4 rounded-xl bg-dark-bg border border-dark-border overflow-hidden group">
            <p className="text-sm text-slate-300 leading-relaxed font-mono">
              {preview.length > 220 ? preview.substring(0, 220) + "..." : preview}
            </p>
            {/* Blur Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-bg/80 to-dark-bg flex items-end justify-center pb-3">
              <span className="text-xs font-bold text-brand-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Start solving to reveal full task <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Actions & Hints */}
          <div className="space-y-4 pt-2">
            <a
              href={`https://leetcode.com/problems/${problemSlug}/`}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-brand-500/25 transition-all hover:scale-[1.01]"
            >
              Go Solve It on LeetCode <ExternalLink className="w-5 h-5" />
            </a>

            {/* Hint Toggle */}
            <div className="text-center">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs text-slate-400 hover:text-brand-300 font-semibold inline-flex items-center gap-1 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                {showHint ? "Hide hint" : "Need algorithmic hint?"}
              </button>
              <AnimatePresence>
                {showHint && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 text-xs text-amber-300/90 italic bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl font-mono"
                  >
                    💡 Focus on algorithm efficiency. Consider Hash Maps, Sliding Windows, or Two-Pointer techniques.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Zone 3: Bottom Bar & Emergency Override */}
      <footer className="w-full max-w-2xl flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-dark-card border border-dark-border text-xs gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>You attempted to visit: <strong className="text-slate-200">{blockedUrl}</strong></span>
        </div>

        {/* Override Button */}
        <button
          onClick={handleUseOverride}
          disabled={overriding || (local.overrides?.usedThisWeek || 0) >= 3}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold border border-dark-border transition-all flex items-center gap-1.5"
        >
          {overriding && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          Emergency Override ({3 - (local.overrides?.usedThisWeek || 0)} left)
        </button>
      </footer>
    </div>
  );
}
