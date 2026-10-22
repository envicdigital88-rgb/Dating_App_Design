'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CameraIcon, 
  RotateCcwIcon, 
  CheckCircle2Icon, 
  ShieldCheckIcon, 
  AlertCircleIcon,
  SparklesIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface LiveSelfieCaptureProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function LiveSelfieCapture({ value, onChange }: LiveSelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  // Start front selfie camera ONLY
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsStarting(true);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      let mediaStream: MediaStream;
      try {
        // Enforce front selfie camera
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 720 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (firstErr) {
        try {
          // Fallback for devices without strict resolution support
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
          });
        } catch (secondErr) {
          // Fallback for desktops / USB webcams without 'user' facingMode label
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      setStream(mediaStream);
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Selfie camera error:', err);
      let msg = 'Could not access selfie camera. Please allow camera permissions in your browser.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in your browser settings to continue.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No front selfie camera was found on this device.';
      }
      setCameraError(msg);
      setCameraActive(false);
    } finally {
      setIsStarting(false);
    }
  }, [stream]);

  // Ensure video element receives the stream as soon as the video element mounts
  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn('Video play error:', err);
      });
    }
  }, [cameraActive, stream]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Capture frame from front video feed
  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 220);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight) || 640;

    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center crop square & mirror horizontally for a natural selfie look
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
    onChange(dataUrl);
    stopCamera();
    toast.success('Selfie captured successfully!');
  };

  // Retake photo
  const handleRetake = () => {
    onChange(null);
    startCamera();
  };

  return (
    <div className="space-y-6">
      {/* Hidden helper canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── SECURITY EXPLANATION BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent p-5 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        {/* Subtle ambient glow dots */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#ec4899]/15 blur-2xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[#0ea5e9]/15 blur-2xl" />

        <div className="relative flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ec4899]/25 to-[#0ea5e9]/25 border border-[#ec4899]/40 text-[#f472b6] shadow-[0_0_15px_rgba(236,72,153,0.25)]">
            <ShieldCheckIcon className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-[14px] font-semibold text-white tracking-wide">
                Private Identity Verification
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ec4899]/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#f472b6] border border-[#ec4899]/35">
                <SparklesIcon className="h-2.5 w-2.5" /> Confidential
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-slate-300">
              This live selfie is reviewed <strong className="text-white">strictly by administrators</strong> to keep Wingle Mingle authentic and bot-free. It will <strong className="text-[#38bdf8] font-semibold underline decoration-[#ec4899] decoration-2 underline-offset-2">NEVER</strong> appear on your public profile or be shown to other members.
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN INTERACTIVE CAPTURE AREA ── */}
      <div className="flex flex-col items-center justify-center">
        {value ? (
          /* ── 1. CAPTURED PREVIEW STATE ── */
          <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-center backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            <div className="relative">
              {/* Glowing halo */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 to-[#0ea5e9] opacity-75 blur-md" />
              <div className="relative h-60 w-60 overflow-hidden rounded-full border-4 border-emerald-400 bg-black shadow-2xl">
                <img
                  src={value}
                  alt="Captured Live Selfie"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute bottom-1 right-3 rounded-full bg-emerald-500 p-2 text-white shadow-lg border-2 border-black">
                <CheckCircle2Icon className="h-6 w-6" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[16px] font-bold text-white flex items-center justify-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Selfie Verified!
              </p>
              <p className="text-[13px] text-slate-400">
                Your selfie is securely saved and ready for verification.
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-[13px] font-semibold text-white transition-all duration-200 hover:bg-white/20 hover:border-white/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <RotateCcwIcon className="h-4 w-4 text-[#38bdf8]" />
                Retake Selfie
              </button>
            </div>
          </div>
        ) : cameraActive ? (
          /* ── 2. ACTIVE LIVE CAMERA STREAM STATE ── */
          <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-center backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            
            {/* Live indicator badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Selfie Camera Live
            </div>

            {/* Glowing biometric viewfinder frame */}
            <div className="relative">
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-[#ec4899] via-[#8b2fc9] to-[#0ea5e9] opacity-70 blur-md animate-pulse" />
              
              <div className="relative h-72 w-72 overflow-hidden rounded-full border-4 border-white/40 bg-black shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={(e) => {
                    const el = e.currentTarget;
                    el.play().catch(() => {});
                  }}
                  className="h-full w-full object-cover -scale-x-100"
                />

                {/* White snapshot flash */}
                {isFlashing && (
                  <div className="absolute inset-0 bg-white transition-opacity duration-200 z-20" />
                )}

                {/* Inner oval guideline */}
                <div className="pointer-events-none absolute inset-4 rounded-full border-2 border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.3)] z-10" />
              </div>
            </div>

            <p className="text-[13px] text-slate-300">
              Align your face within the circle, look straight at the camera and tap below!
            </p>

            {/* Capture button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={captureSnapshot}
                className="group relative flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-[15px] font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-[0_0_35px_rgba(236,72,153,0.5)]"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b2fc9 50%, #0ea5e9 100%)' }}
              >
                <div className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="h-3.5 w-3.5 rounded-full bg-white transition-transform group-hover:scale-125" />
                </div>
                <span>Capture Live Selfie</span>
              </button>
            </div>
          </div>
        ) : (
          /* ── 3. IDLE / READY TO OPEN STATE ── */
          <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            
            {/* Glowing camera avatar */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#ec4899] to-[#0ea5e9] opacity-60 blur-md" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-[#ec4899]/20 to-[#0ea5e9]/20 border-2 border-white/20 text-white shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                <CameraIcon className="h-11 w-11 text-[#38bdf8]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display text-[20px] font-bold text-white">
                Take a Live Selfie
              </h3>
              <p className="text-[13px] leading-relaxed text-slate-300">
                Tap the button below to activate your front camera and take a quick live verification photo.
              </p>
            </div>

            {/* Camera error message if permission blocked */}
            {cameraError && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-rose-500/10 p-3.5 text-left text-[12px] text-rose-300 border border-rose-500/25">
                <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="w-full pt-1">
              <button
                type="button"
                onClick={startCamera}
                disabled={isStarting}
                className="group relative flex w-full items-center justify-center gap-2.5 rounded-full py-4 text-[15px] font-bold text-white shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_35px_rgba(14,165,233,0.45)] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b2fc9 50%, #0ea5e9 100%)' }}
              >
                {isStarting ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <CameraIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <span>Open Selfie Camera</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
