import React, { useEffect, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { sendToBackground } from "@plasmohq/messaging";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Shield,
  Trophy,
  FileText,
  Play,
  Square,
  Zap,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Award,
  Clock,
  Sparkles
} from "lucide-react";

import { DEFAULT_LOCAL_STATE, DEFAULT_SESSION_STATE, LocalState, SessionState, WhitelistEntry } from "../schemas/storage";
import { parsePdfStudyPlan, ParseResult } from "../services/pdfParser";
import { ProblemGoal } from "../schemas/problem";
import "../style.css";

export default function Popup() {
  const [session] = useStorage<SessionState>("session", DEFAULT_SESSION_STATE);
  const [local] = useStorage<LocalState>("local", DEFAULT_LOCAL_STATE);

  const [activeTab, setActiveTab] = useState<"dashboard" | "goals" | "whitelist" | "stats">("dashboard");
  const [domainInput, setDomainInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [timerText, setTimerText] = useState("");

  // Countdown timer effect
  useEffect(() => {
    const updateTimer = () => {
      if (session.sessionActive && session.freedomExpiresAt > Date.now()) {
        const diff = session.freedomExpiresAt - Date.now();
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimerText(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
      } else {
        setTimerText("");
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session.freedomExpiresAt, session.sessionActive]);

  // Handlers
  const handleToggleSession = async () => {
    if (session.sessionActive) {
      await sendToBackground({ name: "END_SESSION" });
    } else {
      await sendToBackground({ name: "START_SESSION" });
    }
  };

  const handleSkipProblem = async () => {
    if (confirm("Skip problem? Costs 5 XP penalty.")) {
      await sendToBackground({ name: "SKIP_PROBLEM" });
    }
  };

  const handleAddDomain = async (domainToAdd?: string) => {
    const targetDomain = (domainToAdd || domainInput).trim();
    if (!targetDomain) return;

    const list = [...(local.whitelist || [])];
    if (!list.some((e) => e.domain === targetDomain)) {
      list.push({
        id: Date.now().toString(),
        domain: targetDomain,
        addedAt: Date.now(),
        label: targetDomain
      });
      await sendToBackground({ name: "UPDATE_WHITELIST", body: { whitelist: list } });
      setDomainInput("");
    }
  };

  const handleRemoveDomain = async (id: string) => {
    const list = (local.whitelist || []).filter((e) => e.id !== id);
    await sendToBackground({ name: "UPDATE_WHITELIST", body: { whitelist: list } });
  };

  const handleBatchPreset = async (domains: string[]) => {
    const list = [...(local.whitelist || [])];
    let changed = false;
    for (const d of domains) {
      if (!list.some((e) => e.domain === d)) {
        list.push({ id: Date.now().toString() + Math.random(), domain: d, addedAt: Date.now(), label: d });
        changed = true;
      }
    }
    if (changed) {
      await sendToBackground({ name: "UPDATE_WHITELIST", body: { whitelist: list } });
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setParseStatus("Reading PDF file...");

    try {
      const buffer = await file.arrayBuffer();
      const result = await parsePdfStudyPlan(buffer, (msg) => setParseStatus(msg));
      setParseResult(result);
      setParseStatus(`Extracted ${result.totalDetected} problem goals.`);
    } catch (err: any) {
      setParseStatus(`Error: ${err.message || "Failed to parse PDF"}`);
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmGoals = async () => {
    if (!parseResult) return;
    await sendToBackground({
      name: "SET_GOAL_MODE",
      body: {
        goals: parseResult.goals,
        meta: { filename: "Study Plan PDF", parsedAt: Date.now(), topicPreferences: parseResult.topicPreferences }
      }
    });
    setParseResult(null);
    setParseStatus("");
    setActiveTab("dashboard");
  };

  const handleResetGoals = async () => {
    if (confirm("Reset to random mode?")) {
      await sendToBackground({ name: "CLEAR_GOAL_MODE" });
    }
  };

  const handleUseFreeze = async () => {
    if (confirm("Use 1 Freeze Token to protect your streak today?")) {
      await sendToBackground({ name: "USE_FREEZE" });
    }
  };

  // XP level calculation
  const xp = local.xp || { total: 0, level: 1, levelName: "Beginner", levelThresholds: [0, 100, 300, 700, 1500] };
  const prevThresh = xp.levelThresholds[xp.level - 1] || 0;
  const nextThresh = xp.levelThresholds[xp.level] || prevThresh + 500;
  const xpPct = Math.min(100, Math.max(0, ((xp.total - prevThresh) / (nextThresh - prevThresh)) * 100));

  return (
    <div className="w-[380px] min-h-[520px] bg-dark-bg text-slate-100 flex flex-col font-sans select-none border border-dark-border">
      {/* Top Header */}
      <header className="p-4 bg-dark-card border-b border-dark-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
            MC
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 tracking-wide">MAD CODER PRO</h1>
            <p className="text-[10px] text-slate-400 font-mono">v2.0.0 • Manifest V3</p>
          </div>
        </div>

        {/* Streak Flame Badge */}
        <motion.div
          animate={{ scale: local.streak.current > 0 ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs"
        >
          <Flame className="w-4 h-4 fill-amber-400 text-amber-500 animate-pulse" />
          <span>{local.streak.current || 0}d</span>
        </motion.div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex border-b border-dark-border bg-dark-bg">
        {[
          { id: "dashboard", label: "Dashboard", icon: Play },
          { id: "goals", label: "Goals", icon: FileText },
          { id: "whitelist", label: "Whitelist", icon: Shield },
          { id: "stats", label: "Stats", icon: Trophy }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold border-b-2 transition-colors ${
                isActive
                  ? "border-brand-500 text-brand-400 bg-brand-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab Contents */}
      <main className="flex-1 p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Session Toggle Button */}
              <button
                onClick={handleToggleSession}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  session.sessionActive
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25"
                    : "bg-brand-500 hover:bg-brand-400 text-white shadow-brand-500/25"
                }`}
              >
                {session.sessionActive ? (
                  <>
                    <Square className="w-4 h-4 fill-white" /> End Coding Session
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" /> Start Coding Session
                  </>
                )}
              </button>

              {/* Freedom Window Countdown Banner */}
              {timerText && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin text-emerald-400" />
                    <span className="text-xs font-medium">Freedom Window Active</span>
                  </div>
                  <span className="font-mono font-bold text-base">{timerText}</span>
                </div>
              )}

              {/* Current Problem Card */}
              {session.sessionActive && (
                <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Assigned Goal
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        session.currentProblemDifficulty === "Easy"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : session.currentProblemDifficulty === "Hard"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {session.currentProblemDifficulty || "Medium"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 line-clamp-1">
                    {session.currentProblemTitle || "Assigning problem..."}
                  </h3>

                  {session.currentProblemSlug && (
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`https://leetcode.com/problems/${session.currentProblemSlug}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/40 text-brand-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Go Solve It
                      </a>
                      <button
                        onClick={handleSkipProblem}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-dark-border transition-colors"
                      >
                        Skip (-5 XP)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Stats Summary Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-dark-card border border-dark-border">
                  <p className="text-[10px] font-medium text-slate-400">Solved Today</p>
                  <p className="text-xl font-bold text-slate-100 mt-0.5">
                    {local.history?.[new Date().toISOString().split("T")[0]]?.solved || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-dark-card border border-dark-border">
                  <p className="text-[10px] font-medium text-slate-400">Blocked Attempts</p>
                  <p className="text-xl font-bold text-rose-400 mt-0.5">
                    {session.blockCountThisSession || 0}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: GOALS (PDF PARSER) */}
          {activeTab === "goals" && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* PDF Upload Box */}
              <div className="p-4 rounded-xl bg-dark-card border border-dashed border-dark-border text-center space-y-2">
                <FileText className="w-8 h-8 text-brand-400 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Upload Study Plan PDF</p>
                  <p className="text-[10px] text-slate-400">Parses problem titles & links automatically</p>
                </div>

                <label className="inline-block mt-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-white font-semibold text-xs cursor-pointer shadow-md transition-colors">
                  Choose PDF File
                  <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
                </label>
              </div>

              {/* Parsing Progress */}
              {parsing && (
                <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center gap-2 text-brand-300 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
                  <span>{parseStatus}</span>
                </div>
              )}

              {/* Parse Results Preview */}
              {parseResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">Found {parseResult.totalDetected} Goals</span>
                    <button
                      onClick={handleConfirmGoals}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors"
                    >
                      Confirm Goals
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {parseResult.goals.map((g, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-dark-card border border-dark-border flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-slate-200 truncate max-w-[200px]">{g.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            g.difficulty === "Easy"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : g.difficulty === "Hard"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {g.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Goal Mode Summary */}
              {local.useGoalMode && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-amber-400">PDF Goal Mode Active</p>
                    <p className="text-[10px] text-amber-300/80">
                      Progress: {local.goalIndex || 0} / {local.pdfGoals.length}
                    </p>
                  </div>
                  <button
                    onClick={handleResetGoals}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold transition-colors"
                  >
                    Reset
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: WHITELIST */}
          {activeTab === "whitelist" && (
            <motion.div
              key="whitelist"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Add Domain Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. stackoverflow.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
                  className="flex-1 px-3 py-2 rounded-xl bg-dark-card border border-dark-border text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                />
                <button
                  onClick={() => handleAddDomain()}
                  className="px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs flex items-center gap-1 shadow transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {/* Preset Bundles */}
              <div className="flex gap-2 text-[10px]">
                <button
                  onClick={() => handleBatchPreset(["developer.mozilla.org", "docs.python.org", "cppreference.com"])}
                  className="px-2.5 py-1.5 rounded-lg bg-dark-card border border-dark-border text-slate-300 hover:text-white transition-colors"
                >
                  + Dev Docs Preset
                </button>
                <button
                  onClick={() => handleBatchPreset(["google.com", "duckduckgo.com", "bing.com"])}
                  className="px-2.5 py-1.5 rounded-lg bg-dark-card border border-dark-border text-slate-300 hover:text-white transition-colors"
                >
                  + Search Engines
                </button>
              </div>

              {/* Domain List */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {(local.whitelist || []).map((w) => (
                  <div
                    key={w.id}
                    className="p-2.5 rounded-xl bg-dark-card border border-dark-border flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-slate-200">{w.domain}</span>
                    <button
                      onClick={() => handleRemoveDomain(w.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: STATS & XP */}
          {activeTab === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Level & XP Progress Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-dark-card to-brand-900/20 border border-dark-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-100">Level {xp.level} — {xp.levelName}</h3>
                      <p className="text-[10px] text-slate-400">{xp.total} Total XP</p>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-brand-400" />
                </div>

                {/* Animated XP Fill Bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-brand-500 to-accent-purple rounded-full"
                  />
                </div>
              </div>

              {/* Freeze Tokens & Overrides */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-dark-card border border-dark-border space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-medium">Freeze Tokens</p>
                  <p className="text-lg font-bold text-cyan-400">🧊 {local.streak?.freezeTokens || 0}</p>
                  <button
                    onClick={handleUseFreeze}
                    disabled={!local.streak?.freezeTokens}
                    className="w-full py-1 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-300 disabled:opacity-40 transition-opacity"
                  >
                    Use Token
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-dark-card border border-dark-border space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-medium">Overrides Used</p>
                  <p className="text-lg font-bold text-rose-400">{local.overrides?.usedThisWeek || 0} / 3</p>
                  <p className="text-[9px] text-slate-500">Resets weekly</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
