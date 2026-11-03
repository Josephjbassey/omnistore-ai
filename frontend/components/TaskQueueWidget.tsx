"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Webhook,
  ArrowRight,
  Terminal,
} from "lucide-react";
import {
  BackgroundJob,
  listBackgroundJobs,
  submitBackgroundJob,
} from "@/lib/api";

export const TaskQueueWidget: React.FC = () => {
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobType, setJobType] = useState<
    "segmentation" | "multimodal_reasoning" | "full_pipeline"
  >("full_pipeline");
  const [prompt, setPrompt] = useState(
    "Perform end-to-end SAM 3.1 segmentation and Muse Spark structured audit"
  );
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<BackgroundJob | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await listBackgroundJobs(20);
      setJobs(data);
    } catch (err) {
      console.error("Failed to list jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const samplePayload = {
        prompt,
        image_base64:
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      };
      await submitBackgroundJob(jobType, samplePayload, webhookUrl || undefined);
      await fetchJobs();
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center space-x-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case "processing":
        return (
          <span className="flex items-center space-x-1.5 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-0.5 rounded-full">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Processing</span>
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center space-x-1.5 text-[11px] font-mono text-red-400 bg-red-950/60 border border-red-800/60 px-2.5 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1.5 text-[11px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            <span>Queued</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] rounded-2xl border border-white/[0.08] p-5 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-xs text-slate-100 uppercase tracking-wider font-mono">
              Async Background Inference Queue &amp; Webhooks
            </h2>
            <p className="text-[10px] text-slate-400">
              Long-running batch market scans, webhook dispatchers, and job recovery
            </p>
          </div>
        </div>
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="p-1.5 rounded-xl bg-[#121622] border border-white/10 hover:bg-[#182030] text-slate-300 transition-colors shadow-sm"
          title="Refresh Queue"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4 flex-1 overflow-hidden">
        {/* Left 2 Cols: Job List */}
        <div className="lg:col-span-2 flex flex-col overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Active &amp; Historic Pipeline Jobs ({jobs.length})
          </span>

          {jobs.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl text-slate-500 text-xs p-6 text-center">
              <Terminal className="w-6 h-6 mb-2 opacity-30 text-slate-400" />
              <span>No jobs in queue. Submit a task using the dispatcher on the right.</span>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.job_id}
                onClick={() => setSelectedJob(job)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedJob?.job_id === job.job_id
                    ? "bg-[#161f2e] border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30"
                    : "bg-[#111520] border-white/[0.06] hover:border-white/20 hover:bg-[#151a26]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {job.job_id}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-[#182030] text-slate-300 border border-white/5">
                      {job.job_type.replace("_", " ")}
                    </span>
                  </div>
                  {getStatusBadge(job.status)}
                </div>

                {/* Progress bar */}
                <div className="mt-2.5 w-full bg-[#07090e] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      job.status === "completed"
                        ? "bg-emerald-500"
                        : job.status === "failed"
                        ? "bg-red-500"
                        : "bg-cyan-400"
                    }`}
                    style={{ width: `${Math.round(job.progress * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-400">
                  <span>Progress: {Math.round(job.progress * 100)}%</span>
                  <span>{new Date(job.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Col: Submit New Job + Details */}
        <div className="flex flex-col space-y-4">
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-[#111520] border border-white/[0.08] rounded-xl space-y-3 shadow-sm"
          >
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider font-mono block">
              Enqueue Inference Task
            </span>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Pipeline Type
              </label>
              <select
                value={jobType}
                onChange={(e: any) => setJobType(e.target.value)}
                className="w-full bg-[#07090e] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              >
                <option value="full_pipeline">Full Pipeline (SAM 3.1 + Muse Spark)</option>
                <option value="segmentation">SAM 3.1 Visual Segmentation</option>
                <option value="multimodal_reasoning">Muse Spark Reasoning</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Instruction / Prompt
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-[#07090e] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Webhook Callback URL
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://api.omnistore.ai/webhooks"
                className="w-full bg-[#07090e] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-command-purple w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Dispatching..." : "Enqueue Job"}</span>
            </button>
          </form>

          {/* Selected Job Result Inspector */}
          {selectedJob && (
            <div className="p-3.5 bg-[#07090e] border border-white/10 rounded-xl flex-1 overflow-y-auto">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono block mb-2">
                Payload &amp; Result ({selectedJob.job_id})
              </span>
              <pre className="text-[10px] font-mono text-cyan-400 overflow-x-auto leading-relaxed">
                {JSON.stringify(selectedJob.result || selectedJob, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
