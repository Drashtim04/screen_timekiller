import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { Brain } from "lucide-react";
import cssText from "data-text:../style.css";
import { AIWarning } from "../types/ai";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
};

export const getStyle = () => {
  const style = document.createElement("style");
  style.textContent = cssText;
  return style;
};

/**
 * Content Script UI: AI Warning Overlay
 * Injects a non-intrusive floating popup into the active webpage when the AI Engine detects high distraction.
 */
export default function AIWarningOverlay() {
  const [warning, setWarning] = useState<AIWarning | null>(null);

  useEffect(() => {
    const listener = (message: any) => {
      if (message.type === "SHOW_AI_WARNING") {
        setWarning(message.payload);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  if (!warning) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999999] w-[350px] bg-[#0A0A0B] border border-white/10 rounded-2xl p-5 shadow-2xl text-white font-sans animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-[13px] mb-1 text-white">AI Focus Coach</h3>
          <p className="text-[13px] text-white/60 leading-relaxed mb-4">
            {warning.message}
          </p>
          
          <div className="flex gap-2">
            {warning.suggestDeepWork && (
              <button 
                onClick={() => {
                  chrome.runtime.sendMessage({ type: "START_DEEP_WORK" });
                  setWarning(null);
                }}
                className="bg-white hover:bg-white/90 text-black text-[12px] font-semibold px-3 py-1.5 rounded-[6px] transition-colors shadow-sm"
              >
                Start Deep Work
              </button>
            )}
            <button 
              onClick={() => setWarning(null)}
              className="bg-white/5 hover:bg-white/10 text-white/70 text-[12px] font-medium px-3 py-1.5 rounded-[6px] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
