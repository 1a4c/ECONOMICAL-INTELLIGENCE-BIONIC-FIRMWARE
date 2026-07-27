import React, { useState } from 'react';
import { AIMessage, CV2Telemetry, MuscleRingTelemetry } from '../types';
import { Sparkles, X, Send, Bot, User, Copy, Check, RefreshCw } from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: CV2Telemetry;
  ring: MuscleRingTelemetry;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  telemetry,
  ring,
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I am your AI Biomechanical & Legged Systems Diagnostic Assistant. I continuously inspect your real-time CV2 Vision telemetry, event heat maps, and muscle-verified Bluetooth ring signals.

Ask me anything or select a diagnostic shortcut below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/analyze-telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telemetryData: {
            cv2: telemetry,
            ringTelemetry: ring,
          },
          userQuestion: query,
        }),
      });

      const data = await response.json();

      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.analysis || 'Analysis complete.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error fetching AI analysis:', err);
      const errorMsg: AIMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Failed to contact server API. Please check server status.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const presetQueries = [
    'Diagnose Freezing of Gait (FOG) risk & iRAT speed ratio',
    'Optimize Concave Efficiency & Power Consumption',
    'Evaluate Stance Leakage on Slanted Terrain',
    'Suggest Hover Strength & Amplified Attitude Tuning',
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100">AI Telemetry Diagnostics</h3>
              <p className="text-[11px] text-slate-400 font-mono">Gemini 2.5 Flash Biomechanical Intelligence</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Diagnostic Shortcut Chips */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex flex-col gap-1.5">
          <span className="text-[10px] font-mono uppercase text-slate-400">Quick Diagnostics:</span>
          <div className="flex flex-wrap gap-1.5">
            {presetQueries.map((pq, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(pq)}
                disabled={isLoading}
                className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500/50 transition-all text-left"
              >
                {pq}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 font-sans text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col gap-1 max-w-[88%] ${
                m.sender === 'user' ? 'self-end' : 'self-start'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                {m.sender === 'ai' ? (
                  <>
                    <Bot className="w-3 h-3 text-indigo-400" />
                    <span className="text-indigo-400 font-bold">AI Diagnostics</span>
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Engineer</span>
                  </>
                )}
                <span>• {m.timestamp}</span>
              </div>

              <div
                className={`p-3 rounded-xl border leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white border-indigo-500 rounded-br-none shadow-md'
                    : 'bg-slate-950 text-slate-200 border-slate-800 rounded-bl-none shadow-inner'
                }`}
              >
                {m.text}
              </div>

              {m.sender === 'ai' && (
                <button
                  onClick={() => copyToClipboard(m.text, m.id)}
                  className="self-start text-[10px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1 mt-0.5"
                >
                  {copiedId === m.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy Response
                    </>
                  )}
                </button>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="self-start flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono text-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Analyzing telemetry parameters...</span>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask about gait, FOG, hover strength..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs outline-none focus:border-indigo-500 font-sans placeholder:text-slate-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputText.trim()}
            className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
