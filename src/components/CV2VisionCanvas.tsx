import React, { useRef, useEffect, useState } from 'react';
import { CV2Telemetry, Joint2D, LocomotionType } from '../types';
import { Play, Pause, SkipForward, Camera, AlertTriangle, ShieldCheck, Eye, Compass, Layers, Sliders } from 'lucide-react';

interface CV2VisionCanvasProps {
  telemetry: CV2Telemetry;
  setTelemetry: React.Dispatch<React.SetStateAction<CV2Telemetry>>;
  joints: Joint2D[];
  setJoints: React.Dispatch<React.SetStateAction<Joint2D[]>>;
  locomotionType: LocomotionType;
}

export const CV2VisionCanvas: React.FC<CV2VisionCanvasProps> = ({
  telemetry,
  setTelemetry,
  joints,
  setJoints,
  locomotionType,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showCVBox, setShowCVBox] = useState<boolean>(true);
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  const animationFrameRef = useRef<number | null>(null);
  const stepRef = useRef<number>(0);

  // Toggle Camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (useWebcam) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 640, height: 360 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            setCameraActive(true);
          }
        })
        .catch((err) => {
          console.warn('Webcam not accessible, returning to synthetic simulation mode', err);
          setUseWebcam(false);
          setCameraActive(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useWebcam]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear background
      ctx.fillStyle = '#0b0f19'; // Deep Slate
      ctx.fillRect(0, 0, width, height);

      // 2. Draw webcam video if active, or synthetic grid
      if (useWebcam && cameraActive && videoRef.current && videoRef.current.readyState === 4) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        ctx.restore();
      } else {
        // Render Synthetic Laboratory Grid
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Update gait step phase if playing
      if (isPlaying) {
        stepRef.current += 0.05 * playbackSpeed;
      }
      const t = stepRef.current;

      // 3. Render Slanted Ground Surface
      const slantRad = (telemetry.slantedSurfaceAngle * Math.PI) / 180;
      const groundYCenter = height * 0.78;
      const groundLeftY = groundYCenter + Math.sin(slantRad) * (width / 2);
      const groundRightY = groundYCenter - Math.sin(slantRad) * (width / 2);

      // Ground plane
      ctx.beginPath();
      ctx.moveTo(0, groundLeftY);
      ctx.lineTo(width, groundRightY);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // Slanted Ground Line Accent
      ctx.strokeStyle = telemetry.leakageBoundCoeff > 0.08 ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, groundLeftY);
      ctx.lineTo(width, groundRightY);
      ctx.stroke();

      // Slanted Surface Angle Marker
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText(`SLANT ANGLE: ${telemetry.slantedSurfaceAngle.toFixed(1)}°`, 16, height - 20);
      ctx.fillText(`LEAKAGE BOUND COEFF: ${telemetry.leakageBoundCoeff.toFixed(3)}`, 180, height - 20);

      // 4. Calculate Gait Positions for Joint Skeleton
      // Simulated 4 legs or bipedal joints depending on locomotionType
      const centerX = width * 0.5;
      const bodyY = groundYCenter - 110 + Math.sin(t * 2) * (telemetry.fogDetected ? 2 : 12);

      // Body / Chassis Box
      ctx.save();
      ctx.translate(centerX, bodyY);
      ctx.rotate((-telemetry.amplifiedAttitudePitch * Math.PI) / 180);

      ctx.fillStyle = telemetry.fogDetected ? '#7f1d1d' : '#1e1b4b';
      ctx.strokeStyle = telemetry.fogDetected ? '#ef4444' : '#6366f1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-80, -30, 160, 60, 10);
      ctx.fill();
      ctx.stroke();

      // Center Core Badge
      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(locomotionType.toUpperCase().replace('_', ' '), 0, 4);

      ctx.restore();

      // Joint Calculations & Leg Drawing
      const legOffsets = [-60, -20, 20, 60]; // 4 legs
      const updatedJoints: Joint2D[] = [];

      legOffsets.forEach((offsetX, idx) => {
        const isRear = idx >= 2;
        const phaseShift = idx % 2 === 0 ? 0 : Math.PI;
        const phase = t * 2 + phaseShift;

        // Gait cycle logic with FOG freezing influence
        const legMovementX = telemetry.fogDetected ? Math.sin(t * 0.5) * 4 : Math.sin(phase) * 35;
        const legMovementY = telemetry.fogDetected ? Math.cos(t * 0.5) * 3 : Math.abs(Math.cos(phase)) * 25;

        const hipX = centerX + offsetX;
        const hipY = bodyY + 20;

        const groundYAtX = groundYCenter - Math.sin(slantRad) * (hipX + legMovementX - centerX);
        const footX = hipX + legMovementX;
        const footY = Math.min(groundYAtX, hipY + 80 - legMovementY);

        const isContact = footY >= groundYAtX - 4;
        const forceN = isContact
          ? (telemetry.hoverStrength * 3.5 + Math.random() * 20) * (1 - telemetry.leakageBoundCoeff)
          : 5;

        // Knee joint calculation
        const kneeX = (hipX + footX) / 2 + (idx % 2 === 0 ? 15 : -15);
        const kneeY = (hipY + footY) / 2;

        updatedJoints.push(
          { id: `hip_${idx}`, name: `Hip ${idx + 1}`, x: (hipX / width) * 100, y: (hipY / height) * 100, contact: false, forceN: 10 },
          { id: `foot_${idx}`, name: `Foot ${idx + 1}`, x: (footX / width) * 100, y: (footY / height) * 100, contact: isContact, forceN }
        );

        if (showSkeleton) {
          // Draw Leg Limbs
          ctx.strokeStyle = isContact ? (isRear ? '#a855f7' : '#38bdf8') : '#64748b';
          ctx.lineWidth = isContact ? 4 : 2;
          ctx.beginPath();
          ctx.moveTo(hipX, hipY);
          ctx.lineTo(kneeX, kneeY);
          ctx.lineTo(footX, footY);
          ctx.stroke();

          // Draw Joint Nodes
          ctx.fillStyle = isContact ? '#f43f5e' : '#e2e8f0';
          ctx.beginPath();
          ctx.arc(footX, footY, isContact ? 6 : 4, 0, Math.PI * 2);
          ctx.fill();

          // Force Vector Arrows
          if (showVectors && isContact) {
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(footX, footY);
            ctx.lineTo(footX, footY - Math.min(forceN * 0.25, 45));
            ctx.stroke();
          }
        }
      });

      // Update state sampled
      if (Math.random() < 0.2) {
        setJoints(updatedJoints);
      }

      // 5. Render Hover Strength Vector Effect above body
      if (showVectors && telemetry.hoverStrength > 0) {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
        ctx.lineWidth = Math.min(telemetry.hoverStrength * 0.1, 8);
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(centerX, bodyY - 35);
        ctx.lineTo(centerX, bodyY - 35 - telemetry.hoverStrength * 0.6);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = '#818cf8';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`HOVER: ${telemetry.hoverStrength.toFixed(1)} N/cm²`, centerX, bodyY - 45 - telemetry.hoverStrength * 0.6);
      }

      // 6. Draw Computer Vision (CV2) Detection Overlay Bounding Box
      if (showCVBox) {
        const boxWidth = 240;
        const boxHeight = 180;
        const boxX = centerX - boxWidth / 2;
        const boxY = bodyY - boxHeight / 2 - 10;

        const isFOG = telemetry.fogDetected;

        ctx.strokeStyle = isFOG ? '#ef4444' : '#10b981';
        ctx.lineWidth = 2;

        // Corner bracket style bounding box
        const cornerLen = 20;
        // Top Left
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + cornerLen);
        ctx.lineTo(boxX, boxY);
        ctx.lineTo(boxX + cornerLen, boxY);
        // Top Right
        ctx.moveTo(boxX + boxWidth - cornerLen, boxY);
        ctx.lineTo(boxX + boxWidth, boxY);
        ctx.lineTo(boxX + boxWidth, boxY + cornerLen);
        // Bottom Right
        ctx.moveTo(boxX + boxWidth, boxY + boxHeight - cornerLen);
        ctx.lineTo(boxX + boxWidth, boxY + boxHeight);
        ctx.lineTo(boxX + boxWidth - cornerLen, boxY + boxHeight);
        // Bottom Left
        ctx.moveTo(boxX + cornerLen, boxY + boxHeight);
        ctx.lineTo(boxX, boxY + boxHeight);
        ctx.lineTo(boxX, boxY + boxHeight - cornerLen);
        ctx.stroke();

        // Bounding Box Telemetry HUD Labels (From user request specifications)
        ctx.fillStyle = isFOG ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)';
        ctx.fillRect(boxX, boxY - 24, 210, 22);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
          isFOG ? 'CV2: ALERT_FOG_DETECTED' : `cv2.captured_non-FOG: ${telemetry.nonFogScore.toFixed(1)}%`,
          boxX + 6,
          boxY - 8
        );

        // Sub HUD details box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(boxX + boxWidth - 160, boxY + boxHeight + 6, 160, 56);
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(boxX + boxWidth - 160, boxY + boxHeight + 6, 160, 56);

        ctx.font = '10px monospace';
        ctx.fillStyle = telemetry.tunnelToppleRisk > 50 ? '#f87171' : '#38bdf8';
        ctx.fillText(`tunnel_topple: ${telemetry.tunnelToppleRisk.toFixed(1)}%`, boxX + boxWidth - 152, boxY + boxHeight + 20);

        ctx.fillStyle = '#a7f3d0';
        ctx.fillText(`traffic_snail.iRAT: ${telemetry.trafficSnailIRAT.toFixed(2)}`, boxX + boxWidth - 152, boxY + boxHeight + 35);

        ctx.fillStyle = '#c084fc';
        ctx.fillText(`attitude: ${telemetry.amplifiedAttitudePitch.toFixed(1)}° pitch`, boxX + boxWidth - 152, boxY + boxHeight + 50);
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, showSkeleton, showVectors, showCVBox, telemetry, locomotionType, useWebcam, cameraActive]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-4 flex flex-col gap-3">
      {/* Hidden Video for Webcam capture if enabled */}
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
            CV2 Gait & Vision Processor
          </h2>
          {telemetry.fogDetected ? (
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
              <AlertTriangle className="w-3 h-3" /> FOG DETECTED
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" /> Flow Nominal
            </span>
          )}
        </div>

        {/* Vision Toggles */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
              showSkeleton
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            Skeleton
          </button>
          <button
            onClick={() => setShowVectors(!showVectors)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
              showVectors
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            Vectors
          </button>
          <button
            onClick={() => setShowCVBox(!showCVBox)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
              showCVBox
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            CV HUD
          </button>
          <button
            onClick={() => setUseWebcam(!useWebcam)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono border transition-colors ${
              useWebcam
                ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle Live Camera Input Overlay"
          >
            <Camera className="w-3 h-3" />
            <span>{useWebcam ? 'Cam Active' : 'Simulated'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative w-full aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-800/80 shadow-inner group">
        <canvas ref={canvasRef} width={640} height={360} className="w-full h-full object-contain block" />

        {/* Live Overlay HUD Stats Top Right */}
        <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-slate-300 flex flex-col gap-1 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">FPS:</span>
            <span className="text-emerald-400 font-bold">{telemetry.fps}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">non-FOG Score:</span>
            <span className="text-sky-400 font-bold">{telemetry.nonFogScore.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Tunnel Topple:</span>
            <span className={telemetry.tunnelToppleRisk > 50 ? 'text-red-400 font-bold' : 'text-slate-200'}>
              {telemetry.tunnelToppleRisk.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">iRAT Speed Index:</span>
            <span className="text-violet-400 font-bold">{telemetry.trafficSnailIRAT.toFixed(2)}</span>
          </div>
        </div>

        {/* Playback & Step Toolbar Overlaid Bottom Left */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-sm border border-slate-800 rounded-lg p-1.5 shadow-md">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-200 transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => {
              stepRef.current += 0.2;
            }}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
            title="Step Forward Frame"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <span className="text-slate-600 text-xs px-1">|</span>

          {/* Speed selector */}
          <div className="flex items-center gap-1 text-[10px] font-mono">
            {[0.5, 1.0, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-1.5 py-0.5 rounded ${
                  playbackSpeed === s ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Slanted Angle & Leakage Bound Parameters Control Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
        {/* Slanted Surface Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between font-mono text-slate-300">
            <span className="flex items-center gap-1 text-slate-400">
              <Compass className="w-3.5 h-3.5 text-indigo-400" /> Terrain Slant Angle:
            </span>
            <span className="font-bold text-indigo-300">{telemetry.slantedSurfaceAngle.toFixed(1)}°</span>
          </div>
          <input
            type="range"
            min="-15"
            max="45"
            step="1"
            value={telemetry.slantedSurfaceAngle}
            onChange={(e) =>
              setTelemetry((prev) => ({
                ...prev,
                slantedSurfaceAngle: parseFloat(e.target.value),
              }))
            }
            className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Leakage Bound Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between font-mono text-slate-300">
            <span className="flex items-center gap-1 text-slate-400">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Stance Leakage Coeff:
            </span>
            <span className="font-bold text-amber-300">{telemetry.leakageBoundCoeff.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min="0.005"
            max="0.250"
            step="0.005"
            value={telemetry.leakageBoundCoeff}
            onChange={(e) =>
              setTelemetry((prev) => ({
                ...prev,
                leakageBoundCoeff: parseFloat(e.target.value),
              }))
            }
            className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
