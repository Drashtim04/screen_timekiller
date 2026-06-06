import { useEffect, useRef, useState } from 'react';
import { X, Download, Share2, Brain } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';
import { mockMetrics } from '../data/mockAnalytics';

interface ShareStatsModalProps {
  onClose: () => void;
}

export default function ShareStatsModal({ onClose }: ShareStatsModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      download(dataUrl, `deepwork-stats-${Date.now()}.png`);
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0A0A0B] border border-white/[0.12] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-400" />
            Share Your Focus Stats
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 flex flex-col items-center bg-[#050505]">
          {/* The Shareable Card */}
          <div 
            ref={cardRef} 
            className="w-full aspect-[4/5] bg-gradient-to-br from-[#0F172A] to-[#0A0A0B] rounded-2xl border border-white/[0.1] p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl"
          >
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-bold tracking-tight">DeepWork AI</h3>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Focus Operating System</p>
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-center py-8">
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                {mockMetrics.totalFocusHours}h
              </h1>
              <p className="text-sm font-semibold text-blue-400">Deep Work Completed This Week</p>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-4">
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.05] p-4 text-center">
                <p className="text-2xl font-bold text-white">{mockMetrics.dailyFocusScore}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Focus Score</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.05] p-4 text-center">
                <p className="text-2xl font-bold text-white">{mockMetrics.currentStreak} Days</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Current Streak</p>
              </div>
            </div>
            
            <div className="relative z-10 text-center mt-6 pt-4 border-t border-white/[0.08]">
              <p className="text-[10px] text-slate-500">deepwork.ai</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#0A0A0B] flex gap-3">
          <button 
            onClick={handleDownload}
            disabled={generating}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Image
          </button>
        </div>
      </div>
    </div>
  );
}
