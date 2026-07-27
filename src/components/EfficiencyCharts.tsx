import React, { useState, useEffect } from 'react';
import { CV2Telemetry, MonthlyHistoryRecord } from '../types';
import { MONTHLY_HISTORY_LOGS } from '../data/mockTelemetry';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Cpu, TrendingUp, Zap, Calendar, Activity } from 'lucide-react';

interface EfficiencyChartsProps {
  telemetry: CV2Telemetry;
}

export const EfficiencyCharts: React.FC<EfficiencyChartsProps> = ({ telemetry }) => {
  const [activeTab, setActiveTab] = useState<'realtime' | 'monthly'>('realtime');
  const [realtimeData, setRealtimeData] = useState<any[]>([]);

  // Sample real-time efficiency points every second
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeData((prev) => {
        const now = new Date();
        const timeStr = `${now.getMinutes()}:${now.getSeconds().toString().padStart(2, '0')}`;
        const newEntry = {
          time: timeStr,
          efficiency: +(telemetry.concaveEfficiencyScore + (Math.random() * 4 - 2)).toFixed(1),
          power: Math.round(telemetry.consumedPowerWatts + Math.random() * 30 - 15),
          hover: +telemetry.hoverStrength.toFixed(1),
          iRAT: +telemetry.trafficSnailIRAT.toFixed(2),
        };
        const updated = [...prev.slice(-15), newEntry];
        return updated;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [telemetry]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-4 flex flex-col gap-3">
      {/* Header with Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
            INTERMETANCE Processor • Concave Efficiency Status
          </h3>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-mono">
          <button
            onClick={() => setActiveTab('realtime')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              activeTab === 'realtime'
                ? 'bg-cyan-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Stream</span>
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              activeTab === 'monthly'
                ? 'bg-cyan-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>By Month History</span>
          </button>
        </div>
      </div>

      {/* Tab Content 1: Live Concave Efficiency Realtime Curve */}
      {activeTab === 'realtime' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: Concave Efficiency & Power Consumed */}
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-300 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Concave Efficiency (%) vs Power (W)
              </span>
              <span className="text-cyan-400 font-bold">{telemetry.concaveEfficiencyScore.toFixed(1)}% Eff</span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={realtimeData}>
                  <defs>
                    <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" domain={[50, 100]} stroke="#06b6d4" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px', color: '#e2e8f0' }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="efficiency"
                    name="Efficiency (%)"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#effGrad)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="power"
                    name="Power (Watts)"
                    stroke="#f59e0b"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Hover Strength vs iRAT Gait Speed Ratio */}
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-300 font-semibold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-indigo-400" /> Hover Strength vs iRAT Speed Ratio
              </span>
              <span className="text-indigo-400 font-bold">{telemetry.trafficSnailIRAT.toFixed(2)} iRAT</span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={realtimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" stroke="#818cf8" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#a7f3d0" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px', color: '#e2e8f0' }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="hover"
                    name="Hover (N/cm²)"
                    stroke="#818cf8"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="iRAT"
                    name="iRAT Speed"
                    stroke="#a7f3d0"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        /* Tab Content 2: Monthly History Bar Chart (by_month_history) */
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300 font-semibold">
              Monthly Consumed Energy (kWh) vs Freezing of Gait (FOG) Incidents
            </span>
            <span className="text-slate-400">INTERMETANCE Schedule Reflected</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_HISTORY_LOGS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '11px', color: '#e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Bar
                  yAxisId="left"
                  dataKey="consumedPowerKWh"
                  name="Consumed Energy (kWh)"
                  fill="#38bdf8"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="fogEventsCount"
                  name="FOG Anomalies Count"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
