import React, { useState } from 'react';
import { MonthlyHistoryRecord } from '../types';
import { MONTHLY_HISTORY_LOGS } from '../data/mockTelemetry';
import { Database, Search, Download, Filter, AlertTriangle, ShieldCheck } from 'lucide-react';

export const HistoricalTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  const filteredLogs = MONTHLY_HISTORY_LOGS.filter((log) => {
    const matchesSearch =
      log.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subjectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.locomotionType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = riskFilter === 'ALL' || log.leakageRiskIndex === riskFilter;

    return matchesSearch && matchesRisk;
  });

  const handleExportCSV = () => {
    const headers = ['Month', 'Subject ID', 'Locomotion Type', 'Total Hours', 'Consumed kWh', 'Avg Hover N/cm2', 'FOG Events', 'Avg Efficiency %', 'Leakage Risk'];
    const rows = filteredLogs.map(l => [
      l.month,
      l.subjectId,
      l.locomotionType,
      l.totalHours,
      l.consumedPowerKWh,
      l.avgHoverStrength,
      l.fogEventsCount,
      l.avgConcaveEfficiency,
      l.leakageRiskIndex
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Legged_Locomotion_Monthly_Telemetry_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-4 flex flex-col gap-3">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
              Historical Telemetry Database
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Reflected Schedule Monthly Consumed Energy & Gait Audit
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center flex-wrap gap-2 text-xs w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search month or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono placeholder:text-slate-600 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Risk Dropdown */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-mono outline-none cursor-pointer"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Moderate">Moderate Risk</option>
            <option value="High">High Risk</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3">Month</th>
              <th className="p-3">Subject ID</th>
              <th className="p-3">Locomotion Type</th>
              <th className="p-3 text-right">Hours</th>
              <th className="p-3 text-right">Energy (kWh)</th>
              <th className="p-3 text-right">Avg Hover (N/cm²)</th>
              <th className="p-3 text-right">FOG Events</th>
              <th className="p-3 text-right">Avg Efficiency</th>
              <th className="p-3 text-center">Leakage Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/50 text-slate-300">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-bold text-slate-200">{log.month}</td>
                  <td className="p-3 text-indigo-400">{log.subjectId}</td>
                  <td className="p-3 capitalize">{log.locomotionType.replace('_', ' ')}</td>
                  <td className="p-3 text-right">{log.totalHours}h</td>
                  <td className="p-3 text-right font-bold text-sky-400">{log.consumedPowerKWh} kWh</td>
                  <td className="p-3 text-right text-amber-300">{log.avgHoverStrength}</td>
                  <td className="p-3 text-right font-bold text-red-400">{log.fogEventsCount}</td>
                  <td className="p-3 text-right text-emerald-400 font-bold">{log.avgConcaveEfficiency}%</td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${
                        log.leakageRiskIndex === 'High'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : log.leakageRiskIndex === 'Moderate'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {log.leakageRiskIndex === 'High' ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <ShieldCheck className="w-3 h-3" />
                      )}
                      {log.leakageRiskIndex}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="p-6 text-center text-slate-500 italic">
                  No monthly telemetry records matched search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
