import React, { useState, useRef, useEffect } from 'react';
import { HeatmapPoint, CV2Telemetry } from '../types';
import { Flame, Layers, Info, RotateCcw, Crosshair, AlertCircle } from 'lucide-react';

interface EventHeatMapProps {
  telemetry: CV2Telemetry;
  heatmapPoints: HeatmapPoint[];
  setHeatmapPoints: React.Dispatch<React.SetStateAction<HeatmapPoint[]>>;
}

export const EventHeatMap: React.FC<EventHeatMapProps> = ({
  telemetry,
  heatmapPoints,
  setHeatmapPoints,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<HeatmapPoint | null>(null);
  const [palette, setPalette] = useState<'thermal' | 'jet' | 'viridis' | 'neon'>('thermal');
  const [showLeakageOnly, setShowLeakageOnly] = useState<boolean>(false);

  // Render Heatmap Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Dark canvas background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Draw floor grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Color gradient resolver based on selected palette
    const getColor = (intensity: number, isLeakage: boolean) => {
      if (showLeakageOnly && !isLeakage) {
        return 'rgba(100, 116, 139, 0.1)';
      }

      if (isLeakage) {
        return `rgba(245, 158, 11, ${0.4 + intensity * 0.5})`; // Amber warning for leakage bound
      }

      switch (palette) {
        case 'thermal':
          // Red-Orange-Yellow-White
          if (intensity > 0.8) return `rgba(255, 255, 255, ${intensity})`;
          if (intensity > 0.5) return `rgba(239, 68, 68, ${intensity})`;
          if (intensity > 0.2) return `rgba(249, 115, 22, ${intensity})`;
          return `rgba(234, 179, 8, ${intensity})`;

        case 'jet':
          // Blue-Cyan-Green-Yellow-Red
          if (intensity > 0.75) return `rgba(239, 68, 68, ${intensity})`;
          if (intensity > 0.5) return `rgba(34, 197, 94, ${intensity})`;
          if (intensity > 0.25) return `rgba(6, 182, 212, ${intensity})`;
          return `rgba(59, 130, 246, ${intensity})`;

        case 'neon':
          // Magenta-Purple-Cyan
          if (intensity > 0.7) return `rgba(236, 72, 153, ${intensity})`;
          if (intensity > 0.4) return `rgba(168, 85, 247, ${intensity})`;
          return `rgba(6, 182, 212, ${intensity})`;

        case 'viridis':
        default:
          // Yellow-Teal-Purple
          if (intensity > 0.7) return `rgba(234, 179, 8, ${intensity})`;
          if (intensity > 0.4) return `rgba(20, 184, 166, ${intensity})`;
          return `rgba(99, 102, 241, ${intensity})`;
      }
    };

    // Draw Heatmap Points
    heatmapPoints.forEach((pt) => {
      const px = (pt.x / 100) * width;
      const py = (pt.y / 100) * height;
      const radius = 25 + pt.intensity * 35;

      const gradient = ctx.createRadialGradient(px, py, 2, px, py, radius);
      const color = getColor(pt.intensity, pt.leakageRisk);

      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw center core dot
      ctx.fillStyle = pt.leakageRisk ? '#fbbf24' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();

      // Selected highlight ring
      if (selectedPoint && selectedPoint.x === pt.x && selectedPoint.y === pt.y) {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }, [heatmapPoints, palette, showLeakageOnly, selectedPoint]);

  // Click Canvas to inspect or add point
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if clicked near an existing point
    const found = heatmapPoints.find(
      (pt) => Math.hypot(pt.x - clickX, pt.y - clickY) < 8
    );

    if (found) {
      setSelectedPoint(found);
    } else {
      // Add new impact heat point
      const newPt: HeatmapPoint = {
        x: Math.round(clickX),
        y: Math.round(clickY),
        intensity: +(0.4 + Math.random() * 0.55).toFixed(2),
        leakageRisk: Math.random() < 0.35,
        dwellMs: Math.round(120 + Math.random() * 260),
      };
      setHeatmapPoints((prev) => [...prev, newPt]);
      setSelectedPoint(newPt);
    }
  };

  const handleResetHeatmap = () => {
    setHeatmapPoints([
      { x: 30, y: 70, intensity: 0.9, leakageRisk: false, dwellMs: 320 },
      { x: 75, y: 72, intensity: 0.95, leakageRisk: false, dwellMs: 340 },
      { x: 45, y: 68, intensity: 0.5, leakageRisk: true, dwellMs: 140 },
    ]);
    setSelectedPoint(null);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-4 flex flex-col gap-3">
      {/* Module Title */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
            Event Heat Map • Consumed Intermittance
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Leakage Bound Sensor Matrix
          </span>
        </div>

        {/* Palette & Controls */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={palette}
            onChange={(e) => setPalette(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 font-mono outline-none cursor-pointer"
          >
            <option value="thermal">Palette: Infrared Thermal</option>
            <option value="jet">Palette: Jet Flow</option>
            <option value="viridis">Palette: Viridis</option>
            <option value="neon">Palette: Cyber Neon</option>
          </select>

          <button
            onClick={() => setShowLeakageOnly(!showLeakageOnly)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
              showLeakageOnly
                ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            Leakage Filter
          </button>

          <button
            onClick={handleResetHeatmap}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700"
            title="Reset Heatmap Grid"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Heatmap Grid & Inspection Details Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Heatmap Canvas */}
        <div className="md:col-span-2 relative bg-slate-950 rounded-lg border border-slate-800 overflow-hidden group aspect-[4/3]">
          <canvas
            ref={canvasRef}
            width={480}
            height={360}
            onClick={handleCanvasClick}
            className="w-full h-full block cursor-crosshair"
          />

          <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-sm px-2 py-1 rounded border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
            <Crosshair className="w-3 h-3 text-amber-400" /> Click grid to inspect or place footfall impact
          </div>
        </div>

        {/* Selected Heatmap Metric Inspector Panel */}
        <div className="bg-slate-950/80 rounded-lg border border-slate-800/80 p-3 flex flex-col justify-between text-xs font-mono">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
              <Info className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-slate-200 text-xs">Impact Node Inspector</span>
            </div>

            {selectedPoint ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">Position (X, Y):</span>
                  <span className="text-sky-300 font-bold">{selectedPoint.x}%, {selectedPoint.y}%</span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">Force Intensity:</span>
                  <span className="text-emerald-400 font-bold">{(selectedPoint.intensity * 100).toFixed(0)}%</span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">Stance Dwell Time:</span>
                  <span className="text-indigo-300 font-bold">{selectedPoint.dwellMs} ms</span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">Ground Slip Risk:</span>
                  <span className={selectedPoint.leakageRisk ? 'text-amber-400 font-bold flex items-center gap-1' : 'text-slate-400'}>
                    {selectedPoint.leakageRisk && <AlertCircle className="w-3 h-3" />}
                    {selectedPoint.leakageRisk ? 'Leakage Hazard' : 'Nominal Friction'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 italic text-[11px]">
                Click any footstep thermal region on the heat map to inspect localized stance metrics.
              </div>
            )}
          </div>

          {/* Footfall Summary Bar */}
          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Total Active Footprints:</span>
              <span className="text-slate-200 font-bold">{heatmapPoints.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Slip Leakage Nodes:</span>
              <span className="text-amber-400 font-bold">
                {heatmapPoints.filter((p) => p.leakageRisk).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
