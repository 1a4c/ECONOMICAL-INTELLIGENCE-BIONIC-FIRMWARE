import React, { useState, useEffect } from 'react';
import { MuscleRingTelemetry, CV2Telemetry } from '../types';
import { Bluetooth, Zap, Activity, ShieldCheck, BatteryCharging, Wifi, Sliders, Radio } from 'lucide-react';

interface MuscleRingWidgetProps {
  ring: MuscleRingTelemetry;
  setRing: React.Dispatch<React.SetStateAction<MuscleRingTelemetry>>;
  telemetry: CV2Telemetry;
  setTelemetry: React.Dispatch<React.SetStateAction<CV2Telemetry>>;
}

export const MuscleRingWidget: React.FC<MuscleRingWidgetProps> = ({
  ring,
  setRing,
  telemetry,
  setTelemetry,
}) => {
  const [emgWave, setEmgWave] = useState<number[]>(Array(24).fill(200));
  const [hapticTriggered, setHapticTriggered] = useState<boolean>(false);

  // Animate EMG Waveform
  useEffect(() => {
    if (!ring.connected) return;

    const interval = setInterval(() => {
      setEmgWave((prev) => {
        const nextVal = Math.round(180 + Math.random() * 280 + (telemetry.fogDetected ? 180 : 0));
        const updated = [...prev.slice(1), nextVal];
        return updated;
      });

      setRing((prev) => ({
        ...prev,
        emgSignalMicrovolts: Math.round(180 + Math.random() * 280 + (telemetry.fogDetected ? 180 : 0)),
      }));
    }, 150);

    return () => clearInterval(interval);
  }, [ring.connected, telemetry.fogDetected]);

  // Trigger Haptic Ring Pulse
  const handleHapticTest = () => {
    setHapticTriggered(true);
    setTimeout(() => setHapticTriggered(false), 1200);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
            Bluetooth Access Ring Telemetry
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Muscle-Verified
          </span>
        </div>

        <button
          onClick={() => setRing((prev) => ({ ...prev, connected: !prev.connected }))}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
            ring.connected
              ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}
        >
          <Bluetooth className="w-3.5 h-3.5" />
          <span>{ring.connected ? 'Connected' : 'Disconnected'}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Card 1: Device Status & EMG Signal Wave */}
        <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 flex flex-col justify-between gap-2">
          <div className="flex justify-between items-start text-xs font-mono">
            <div>
              <p className="text-slate-200 font-semibold">{ring.deviceName}</p>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-emerald-400">
                  <BatteryCharging className="w-3 h-3" /> {ring.batteryLevel}%
                </span>
                <span className="flex items-center gap-1 text-sky-400">
                  <Wifi className="w-3 h-3" /> {ring.signalRSSI} dBm
                </span>
              </p>
            </div>
            <span className="p-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>

          {/* EMG Waveform visualizer */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Muscle Activation EMG:</span>
              <span className="text-indigo-400 font-bold">{ring.emgSignalMicrovolts} uV</span>
            </div>
            <div className="h-10 bg-slate-900 rounded border border-slate-800/80 flex items-end gap-1 p-1 overflow-hidden">
              {emgWave.map((v, i) => (
                <div
                  key={i}
                  style={{ height: `${Math.min((v / 600) * 100, 100)}%` }}
                  className={`flex-1 rounded-t transition-all duration-100 ${
                    v > 450 ? 'bg-indigo-400' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Hover Strength Control & Amplified Attitude Vector */}
        <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 flex flex-col justify-between gap-2 text-xs">
          <div className="flex items-center justify-between font-mono">
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Hover Strength:
            </span>
            <span className="text-amber-400 font-bold">{telemetry.hoverStrength.toFixed(1)} N/cm²</span>
          </div>

          <input
            type="range"
            min="10"
            max="100"
            step="1"
            value={telemetry.hoverStrength}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setTelemetry((prev) => ({ ...prev, hoverStrength: val }));
              setRing((prev) => ({ ...prev, hoverStrengthTarget: val }));
            }}
            className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between items-center text-[11px] font-mono pt-1 border-t border-slate-800/80 text-slate-400">
            <span>Muscle Authenticity Score:</span>
            <span className="text-emerald-400 font-bold">{ring.muscleVerificationScore}%</span>
          </div>
        </div>

        {/* Card 3: Amplified Attitude Roll & Pitch Adjuster + Haptic Test */}
        <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 flex flex-col justify-between gap-2 text-xs">
          <div className="flex items-center justify-between font-mono">
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-sky-400" /> Amplified Attitude Pitch:
            </span>
            <span className="text-sky-300 font-bold">{telemetry.amplifiedAttitudePitch.toFixed(1)}°</span>
          </div>

          <input
            type="range"
            min="-20"
            max="30"
            step="0.5"
            value={telemetry.amplifiedAttitudePitch}
            onChange={(e) =>
              setTelemetry((prev) => ({ ...prev, amplifiedAttitudePitch: parseFloat(e.target.value) }))
            }
            className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />

          <button
            onClick={handleHapticTest}
            className={`w-full py-1.5 rounded font-mono text-[11px] border transition-all ${
              hapticTriggered
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-lg shadow-amber-500/30 animate-bounce'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {hapticTriggered ? '⚡ HAPTIC PULSE SENT TO RING' : 'Trigger Ring Haptic Bio-Pulse'}
          </button>
        </div>
      </div>
    </div>
  );
};
