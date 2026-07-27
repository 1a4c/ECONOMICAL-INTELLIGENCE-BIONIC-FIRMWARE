import React from 'react';
import { LocomotionType } from '../types';
import { PRESET_SCENARIOS } from '../data/mockTelemetry';
import { Activity, Bluetooth, Cpu, Bot, User, Sparkles, RefreshCw, FileSpreadsheet, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  locomotionType: LocomotionType;
  setLocomotionType: (type: LocomotionType) => void;
  activePresetId: string;
  onApplyPreset: (presetId: string) => void;
  onToggleAIDrawer: () => void;
  onResetTelemetry: () => void;
  onExportReport: () => void;
  ringConnected: boolean;
  fps: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  locomotionType,
  setLocomotionType,
  activePresetId,
  onApplyPreset,
  onToggleAIDrawer,
  onResetTelemetry,
  onExportReport,
  ringConnected,
  fps,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-3 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Title & Status Badges */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600/30 rounded-lg border border-indigo-500/40 text-indigo-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-semibold text-base md:text-lg text-slate-100 tracking-tight leading-none flex items-center gap-2">
                Legged CV2 Telemetry Suite
                <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  v2.6
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Event Heat Map • FOG Detection • Intermittent Locomotion
              </p>
            </div>
          </div>

          <button
            onClick={onToggleAIDrawer}
            className="md:hidden p-2 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
            title="Open AI Diagnostics"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        {/* Locomotion Subject & Scenario Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs w-full md:w-auto justify-center md:justify-end">
          {/* Locomotion Type Selector */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setLocomotionType('quadruped_robot')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                locomotionType === 'quadruped_robot'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Quadruped</span>
            </button>
            <button
              onClick={() => setLocomotionType('exoskeleton_human')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                locomotionType === 'exoskeleton_human'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Human Exo</span>
            </button>
            <button
              onClick={() => setLocomotionType('equine_locomotion')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                locomotionType === 'equine_locomotion'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Equine</span>
            </button>
          </div>

          {/* Scenario Presets Dropdown */}
          <select
            value={activePresetId}
            onChange={(e) => onApplyPreset(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 font-mono outline-none cursor-pointer"
          >
            <option value="" disabled>
              Select Telemetry Scenario...
            </option>
            {PRESET_SCENARIOS.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>

          {/* Status Badges */}
          <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {fps} FPS
            </span>
            <span className="text-slate-600">|</span>
            <span className={`flex items-center gap-1 ${ringConnected ? 'text-indigo-400' : 'text-slate-500'}`}>
              <Bluetooth className="w-3 h-3" />
              {ringConnected ? 'Ring Sync' : 'Ring Disconnected'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              INTERMETANCE
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onResetTelemetry}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
              title="Reset Telemetry Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onExportReport}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
              title="Export CSV Log Report"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleAIDrawer}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs transition-all shadow-md shadow-indigo-900/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Diagnostics</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
