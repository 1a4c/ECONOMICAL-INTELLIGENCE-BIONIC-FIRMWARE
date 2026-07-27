/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CV2Telemetry,
  Joint2D,
  LocomotionType,
  MuscleRingTelemetry,
  HeatmapPoint,
} from './types';
import {
  INITIAL_CV2_TELEMETRY,
  INITIAL_JOINTS,
  INITIAL_MUSCLE_RING,
  MOCK_HEATMAP_POINTS,
  PRESET_SCENARIOS,
} from './data/mockTelemetry';

import { Navbar } from './components/Navbar';
import { CV2VisionCanvas } from './components/CV2VisionCanvas';
import { EventHeatMap } from './components/EventHeatMap';
import { MuscleRingWidget } from './components/MuscleRingWidget';
import { EfficiencyCharts } from './components/EfficiencyCharts';
import { HistoricalTable } from './components/HistoricalTable';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';

import {
  Activity,
  AlertTriangle,
  Zap,
  ShieldCheck,
  TrendingUp,
  Sliders,
  Compass,
} from 'lucide-react';

export default function App() {
  const [telemetry, setTelemetry] = useState<CV2Telemetry>(INITIAL_CV2_TELEMETRY);
  const [joints, setJoints] = useState<Joint2D[]>(INITIAL_JOINTS);
  const [ring, setRing] = useState<MuscleRingTelemetry>(INITIAL_MUSCLE_RING);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>(MOCK_HEATMAP_POINTS);
  const [locomotionType, setLocomotionType] = useState<LocomotionType>('quadruped_robot');
  const [activePresetId, setActivePresetId] = useState<string>('normal_trot');
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState<boolean>(false);

  // Apply scenario preset
  const handleApplyPreset = (presetId: string) => {
    setActivePresetId(presetId);
    const found = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (found) {
      setTelemetry((prev) => ({
        ...prev,
        ...found.telemetry,
      }));
    }
  };

  // Reset telemetry to initial state
  const handleResetTelemetry = () => {
    setTelemetry(INITIAL_CV2_TELEMETRY);
    setJoints(INITIAL_JOINTS);
    setRing(INITIAL_MUSCLE_RING);
    setHeatmapPoints(MOCK_HEATMAP_POINTS);
    setActivePresetId('normal_trot');
  };

  // Export full telemetry report
  const handleExportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      locomotionType,
      telemetry,
      muscleRing: ring,
      activeHeatmapPointsCount: heatmapPoints.length,
    };

    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `Legged_CV2_Telemetry_Report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white pb-12">
      {/* Top Navigation */}
      <Navbar
        locomotionType={locomotionType}
        setLocomotionType={setLocomotionType}
        activePresetId={activePresetId}
        onApplyPreset={handleApplyPreset}
        onToggleAIDrawer={() => setIsAIDrawerOpen(true)}
        onResetTelemetry={handleResetTelemetry}
        onExportReport={handleExportReport}
        ringConnected={ring.connected}
        fps={telemetry.fps}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 pt-4 flex flex-col gap-4">
        {/* Top Key Metrics KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* KPI 1: captured_non-FOG Score */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800/80 p-3 flex flex-col gap-1 shadow-md">
            <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              non-FOG Flow
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-emerald-400">
                {telemetry.nonFogScore.toFixed(1)}%
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 truncate">
              {telemetry.fogDetected ? 'FOG ALERT TRIGGERED' : 'Nominal Gait Flow'}
            </span>
          </div>

          {/* KPI 2: Tunnel Topple Risk */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800/80 p-3 flex flex-col gap-1 shadow-md">
            <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              Tunnel Topple
              <AlertTriangle className={telemetry.tunnelToppleRisk > 50 ? 'w-3.5 h-3.5 text-red-400' : 'w-3.5 h-3.5 text-slate-500'} />
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-xl font-bold font-mono ${
                  telemetry.tunnelToppleRisk > 50 ? 'text-red-400' : 'text-slate-200'
                }`}
              >
                {telemetry.tunnelToppleRisk.toFixed(1)}%
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 truncate">Instability Threshold</span>
          </div>

          {/* KPI 3: traffic_snail iRAT */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800/80 p-3 flex flex-col gap-1 shadow-md">
            <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              iRAT Speed Ratio
              <Activity className="w-3.5 h-3.5 text-violet-400" />
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-violet-400">
                {telemetry.trafficSnailIRAT.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 truncate">Gait Velocity Index</span>
          </div>

          {/* KPI 4: Hover Strength */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800/80 p-3 flex flex-col gap-1 shadow-md">
            <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              Hover Strength
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-amber-400">
                {telemetry.hoverStrength.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-slate-400">N/cm²</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 truncate">Ring Boost Applied</span>
          </div>

          {/* KPI 5: Concave Efficiency */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800/80 p-3 flex flex-col gap-1 shadow-md">
            <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              Concave Eff.
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-cyan-400">
                {telemetry.concaveEfficiencyScore.toFixed(1)}%
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 truncate">{telemetry.consumedPowerWatts} Watts</span>
          </div>

          {/* KPI 6: Leakage Bound Coeff */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800/80 p-3 flex flex-col gap-1 shadow-md">
            <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              Bound Leakage
              <Compass className="w-3.5 h-3.5 text-sky-400" />
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-sky-300">
                {telemetry.leakageBoundCoeff.toFixed(3)}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 truncate">Slant Slanted Contact</span>
          </div>
        </div>

        {/* Core Vision & Heatmap Dual Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CV2VisionCanvas
            telemetry={telemetry}
            setTelemetry={setTelemetry}
            joints={joints}
            setJoints={setJoints}
            locomotionType={locomotionType}
          />

          <EventHeatMap
            telemetry={telemetry}
            heatmapPoints={heatmapPoints}
            setHeatmapPoints={setHeatmapPoints}
          />
        </div>

        {/* Bluetooth Muscle Ring Telemetry Module */}
        <MuscleRingWidget
          ring={ring}
          setRing={setRing}
          telemetry={telemetry}
          setTelemetry={setTelemetry}
        />

        {/* INTERMETANCE Processor Efficiency Curves & Monthly History */}
        <EfficiencyCharts telemetry={telemetry} />

        {/* Historical Telemetry Logs Table */}
        <HistoricalTable />
      </main>

      {/* AI Telemetry Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        telemetry={telemetry}
        ring={ring}
      />
    </div>
  );
}
