import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Camera, AlertCircle, Crosshair } from 'lucide-react';
import { LAYER_COLORS, LAYER_TYPES } from './moonData';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ARView – camera passthrough with a moon AR overlay.
 *
 * Strategy:
 *  1. Request rear camera via getUserMedia.
 *  2. Use DeviceOrientationEvent to detect when the phone is roughly pointed at the sky.
 *  3. Overlay mission / landing-site pins as HTML elements positioned in a fixed grid
 *     that subtly shifts with device tilt, giving a parallax "pinned to the sky" feel.
 *  4. Tapping a pin selects and shows its details.
 */

const MOON_MISSIONS_ONLY = true; // only show missions (not geological events) in AR mode

function useDeviceOrientation() {
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 90, gamma: 0 });
  const [permissionGranted, setPermissionGranted] = useState(null); // null | true | false

  useEffect(() => {
    const handler = (e) => {
      setOrientation({ alpha: e.alpha || 0, beta: e.beta || 90, gamma: e.gamma || 0 });
    };

    // iOS 13+ requires permission
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(state => {
          if (state === 'granted') {
            setPermissionGranted(true);
            window.addEventListener('deviceorientation', handler);
          } else {
            setPermissionGranted(false);
          }
        })
        .catch(() => setPermissionGranted(false));
    } else {
      // Android / desktop
      setPermissionGranted(true);
      window.addEventListener('deviceorientation', handler);
    }

    return () => window.removeEventListener('deviceorientation', handler);
  }, []);

  return { orientation, permissionGranted };
}

export default function ARView({ markers, onClose, onSelectMarker }) {
  const videoRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const { orientation, permissionGranted } = useDeviceOrientation();

  // ─── Start camera ──────────────────────────────────────────────────────────
  useEffect(() => {
    let stream = null;
    navigator.mediaDevices?.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    }).then(s => {
      stream = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
        setCameraReady(true);
      }
    }).catch(err => {
      setCameraError(err.name === 'NotAllowedError'
        ? 'Camera access was denied. Please allow camera access in your browser settings.'
        : 'Unable to access camera on this device.');
    });

    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ─── Filter to missions + objects only for AR ───────────────────────────────
  const arMarkers = markers.filter(m => m.type === LAYER_TYPES.MISSIONS || m.type === 'mission');

  // ─── Compute parallax offset from device orientation ───────────────────────
  // beta  = forward/backward tilt  (90 = looking up at sky, 0 = straight ahead)
  // gamma = left/right tilt        (-90 left, +90 right)
  const tiltX = Math.max(-30, Math.min(30, (orientation.gamma || 0) * 0.6)); // horizontal shift
  const tiltY = Math.max(-30, Math.min(30, ((orientation.beta || 90) - 90) * 0.4)); // vertical shift

  // Are we roughly pointing at the sky? (beta between 50–130)
  const pointingAtSky = orientation.beta >= 40 && orientation.beta <= 140;

  // ─── Pin positions: distribute markers across the "moon disc" area ─────────
  const pinLayout = arMarkers.map((marker, i) => {
    // Distribute evenly in a circular pattern centered in viewport
    const count = arMarkers.length;
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    const radius = 28 + (i % 3) * 7; // 28–42% of container
    const cx = 50 + Math.cos(angle) * radius;
    const cy = 50 + Math.sin(angle) * radius * 0.7; // slight vertical compression
    return { ...marker, cx, cy };
  });

  const handlePinTap = (marker) => {
    setSelectedPin(prev => prev?.id === marker.id ? null : marker);
    if (onSelectMarker) onSelectMarker(marker);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex flex-col">
      {/* Camera feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Dark overlay when camera not ready */}
      {!cameraReady && !cameraError && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-white/70 text-sm font-body">Starting camera…</p>
          </div>
        </div>
      )}

      {/* Camera error */}
      {cameraError && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-destructive/20 flex items-center justify-center">
              <Camera className="w-7 h-7 text-destructive" />
            </div>
            <p className="text-white font-heading font-semibold">Camera Unavailable</p>
            <p className="text-white/60 text-sm font-body">{cameraError}</p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-body font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* AR Overlay */}
      {cameraReady && (
        <>
          {/* Sky targeting hint */}
          <AnimatePresence>
            {!pointingAtSky && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2 z-10"
              >
                <Crosshair className="w-3.5 h-3.5 text-primary" />
                <span className="text-white/80 text-xs font-body">Point your device at the moon in the sky</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Moon targeting reticle — subtle circle */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: `calc(50% + ${tiltX * 0.5}px)`,
              top: `calc(50% + ${tiltY * 0.5}px)`,
              transform: 'translate(-50%, -50%)',
              transition: 'left 0.1s, top 0.1s',
            }}
          >
            <div className="w-40 h-40 rounded-full border-2 border-white/20 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border border-white/10" />
              <div className="absolute w-2 h-2 rounded-full bg-white/30" />
            </div>
          </div>

          {/* AR Pins */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: `translate(${tiltX * 0.8}px, ${tiltY * 0.8}px)`,
              transition: 'transform 0.12s ease-out',
            }}
          >
            {pinLayout.map((marker) => {
              const color = LAYER_COLORS[marker.type] || '#60a5fa';
              const isSelected = selectedPin?.id === marker.id;
              return (
                <div
                  key={marker.id}
                  className="absolute pointer-events-auto"
                  style={{ left: `${marker.cx}%`, top: `${marker.cy}%`, transform: 'translate(-50%, -100%)' }}
                >
                  {/* Pin */}
                  <button
                    onClick={() => handlePinTap(marker)}
                    className="flex flex-col items-center group"
                  >
                    {/* Label */}
                    <div
                      className="px-2 py-0.5 rounded-md text-[10px] font-body font-semibold mb-1 whitespace-nowrap shadow-lg"
                      style={{
                        background: isSelected ? color : 'rgba(0,0,0,0.75)',
                        color: isSelected ? '#000' : color,
                        border: `1px solid ${color}60`,
                        backdropFilter: 'blur(6px)',
                        boxShadow: isSelected ? `0 0 12px ${color}80` : 'none',
                      }}
                    >
                      {marker.name}
                    </div>
                    {/* Dot + stem */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-3 h-3 rounded-full shadow-lg"
                        style={{
                          background: color,
                          boxShadow: `0 0 ${isSelected ? 12 : 6}px ${color}`,
                        }}
                      />
                      <div className="w-px h-4" style={{ background: `${color}80` }} />
                    </div>
                  </button>

                  {/* Selected card */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 4 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-52 rounded-xl border p-3 shadow-2xl z-10"
                        style={{ background: 'rgba(10,14,30,0.92)', backdropFilter: 'blur(12px)', borderColor: `${color}40` }}
                      >
                        <p className="font-heading font-semibold text-xs text-white leading-tight mb-1">{marker.name}</p>
                        {marker.date && <p className="text-[10px] font-body mb-1" style={{ color }}>{marker.date}</p>}
                        <p className="text-[10px] font-body text-white/60 leading-relaxed line-clamp-3">{marker.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* No missions warning */}
          {arMarkers.length === 0 && (
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 rounded-full border border-white/20">
              <span className="text-white/60 text-xs font-body">Enable the Missions layer to see AR pins</span>
            </div>
          )}

          {/* Orientation debug hint */}
          <div className="absolute bottom-20 right-4 text-[9px] font-body text-white/30">
            β {Math.round(orientation.beta)}° γ {Math.round(orientation.gamma)}°
          </div>
        </>
      )}

      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-safe pb-3 pt-4 bg-gradient-to-b from-black/80 to-transparent z-20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-sm font-heading font-semibold">AR View</span>
          <span className="text-white/40 text-xs font-body ml-1">• Moon</span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}