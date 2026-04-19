import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { LAYER_COLORS } from './moonData';
import { ZoomIn, ZoomOut, RotateCcw, Telescope } from 'lucide-react';
import MoonPhaseOverlay from './MoonPhaseOverlay';
import GlobeCompass from './GlobeCompass';
import SunAngleDisplay from './SunAngleDisplay';
import GuidedTour from './GuidedTour';
import { base44 } from '@/api/base44Client';
import { useAppSettings } from '@/components/AppSettingsProvider';
import { SCIENTIFIC_LAYER_META } from './scientificLayers';
import { ScientificLayerLegend } from './ScientificLayerOverlay';
import MoonPhaseDisplay from './MoonPhaseDisplay';

// In-memory cache (survives re-renders in same session)
const memoryCache = {};
// In-flight deduplication: store promises to avoid parallel duplicate fetches
const inFlightCache = {};

const STORAGE_KEY_PREFIX = 'luna_tex_';

async function fetchTextureDataUrl(url) {
  // 1. Memory cache hit (fastest)
  if (memoryCache[url]) return memoryCache[url];

  // 2. SessionStorage cache hit (survives remounts)
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY_PREFIX + url);
    if (stored) {
      memoryCache[url] = stored;
      return stored;
    }
  } catch (_) {}

  // 3. Deduplicate in-flight requests for the same URL
  if (inFlightCache[url]) return inFlightCache[url];

  inFlightCache[url] = (async () => {
    const res = await base44.functions.invoke('proxyTexture', { url });
    const dataUrl = res.data?.dataUrl;
    if (dataUrl) {
      memoryCache[url] = dataUrl;
      try { sessionStorage.setItem(STORAGE_KEY_PREFIX + url, dataUrl); } catch (_) {}
    }
    delete inFlightCache[url];
    return dataUrl;
  })();

  return inFlightCache[url];
}

const DEFAULT_CAMERA_Z = 3.2;
const MIN_ZOOM = 1.5;
const MAX_ZOOM = 6.0;
const AUTO_SWITCH_THRESHOLD = 1.7;
const IDLE_RESTART_MS = 5000; // resume auto-rotation after 5s of no interaction

const PLANET_TEXTURES = {
  moon: 'https://www.solarsystemscope.com/textures/download/2k_moon.jpg',
  mars: 'https://www.solarsystemscope.com/textures/download/2k_mars.jpg',
};

const PLANET_GLOW = {
  moon: 'vec4(0.15, 0.2, 0.5, 1.0)',
  mars: 'vec4(0.6, 0.25, 0.1, 1.0)',
};

// Helper: parse hex color string to THREE.Color
function hexToThreeColor(hex) {
  return new THREE.Color(hex);
}

// Helper: interpolate gradient by value [0..1]
function valueToThreeColor(gradient, value) {
  const n = gradient.length - 1;
  const pos = Math.max(0, Math.min(1, value)) * n;
  const lo = Math.floor(pos);
  const hi = Math.min(n, lo + 1);
  const t = pos - lo;
  const c1 = new THREE.Color(gradient[lo]);
  const c2 = new THREE.Color(gradient[hi]);
  return new THREE.Color(
    c1.r + (c2.r - c1.r) * t,
    c1.g + (c2.g - c1.g) * t,
    c1.b + (c2.b - c1.b) * t,
  );
}

function getMoonPhaseFromDate(date) {
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  const synodicMonth = 29.53058867;
  const diffDays = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  return ((diffDays % synodicMonth) + synodicMonth) % synodicMonth / synodicMonth;
}

function getPhaseName(phase) {
  if (phase < 0.03 || phase >= 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

export default function Moon3DGlobe({ markers, selectedMarker, onSelectMarker, onAutoSwitch2D, planet = 'moon', uiHidden = false, activeScientificLayers = [], phaseDate = null }) {
  const containerRef = useRef(null);
  const sceneRef = useRef({});
  const [isLoading, setIsLoading] = useState(true);
  const animatingToMarkerRef = useRef(false);
  const idleTimerRef = useRef(null);
  const autoRotatingRef = useRef(true);

  // Refs exposed to overlay components
  const globeRotYRef = useRef(0);   // live Y rotation of globe (for compass)
  const sunLightRef = useRef(null); // live ref to Three.js directional light (for sun angle)
  const phaseDateRef = useRef(phaseDate);

  // Guided tour
  const [tourActive, setTourActive] = useState(false);

  // ─── Stop auto-rotation, restart after IDLE_RESTART_MS ─────────────────────
  const pauseAndScheduleRestart = useCallback(() => {
    autoRotatingRef.current = false;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      autoRotatingRef.current = true;
      if (sceneRef.current.rotationVelocity) {
        sceneRef.current.rotationVelocity.y = 0.0008;
        sceneRef.current.rotationVelocity.x = 0;
      }
    }, IDLE_RESTART_MS);
  }, []);

  // ─── Smooth animate camera.position.z ───────────────────────────────────────
  const animateCameraZ = useCallback((targetZ, duration = 800, onDone) => {
    const { camera } = sceneRef.current;
    if (!camera) return;
    const startZ = camera.position.z;
    const startTime = performance.now();
    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      camera.position.z = startZ + (targetZ - startZ) * ease;
      if (t < 1) requestAnimationFrame(tick);
      else { camera.position.z = targetZ; if (onDone) onDone(); }
    };
    requestAnimationFrame(tick);
  }, []);

  // ─── Rotate moon so marker faces camera ────────────────────────────────────
  const rotateMoonToMarker = useCallback((marker, onDone) => {
    const { moon } = sceneRef.current;
    if (!moon) return;

    const latRad = (marker.lat * Math.PI) / 180;
    const lngRad = (marker.lng * Math.PI) / 180;
    const targetRotY = -lngRad + Math.PI / 2;
    const targetRotX = -latRad;

    let fromX = moon.rotation.x % (2 * Math.PI);
    let fromY = moon.rotation.y % (2 * Math.PI);
    const diffX = ((targetRotX - fromX) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    const diffY = ((targetRotY - fromY) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    const toX = fromX + diffX;
    const toY = fromY + diffY;

    sceneRef.current.rotationVelocity = { x: 0, y: 0 };
    animatingToMarkerRef.current = true;
    autoRotatingRef.current = false;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    const duration = 1200;
    const startTime = performance.now();
    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      moon.rotation.x = fromX + diffX * ease;
      moon.rotation.y = fromY + diffY * ease;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        moon.rotation.x = toX;
        moon.rotation.y = toY;
        animatingToMarkerRef.current = false;
        // schedule restart of auto-rotation after idle
        idleTimerRef.current = setTimeout(() => {
          autoRotatingRef.current = true;
          if (sceneRef.current.rotationVelocity) {
            sceneRef.current.rotationVelocity.y = 0.0008;
            sceneRef.current.rotationVelocity.x = 0;
          }
        }, IDLE_RESTART_MS);
        if (onDone) onDone();
      }
    };
    requestAnimationFrame(tick);
  }, []);

  const handleZoom = useCallback((dir) => {
    const { camera } = sceneRef.current;
    if (!camera) return;
    const newZ = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, camera.position.z + dir * 0.5));
    if (navigator.vibrate) navigator.vibrate(8);
    animateCameraZ(newZ, 400);
  }, [animateCameraZ]);

  const handleReset = useCallback(() => {
    const { camera, moon } = sceneRef.current;
    if (!camera || !moon) return;
    animateCameraZ(DEFAULT_CAMERA_Z, 600);
    const fromX = moon.rotation.x, fromY = moon.rotation.y;
    const startTime = performance.now();
    const tick = (now) => {
      const t = Math.min((now - startTime) / 600, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      moon.rotation.x = fromX * (1 - ease);
      moon.rotation.y = fromY * (1 - ease);
      if (t < 1) requestAnimationFrame(tick);
      else {
        autoRotatingRef.current = true;
        sceneRef.current.rotationVelocity = { x: 0, y: 0.0008 };
      }
    };
    requestAnimationFrame(tick);
  }, [animateCameraZ]);

  // ─── Scene setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = DEFAULT_CAMERA_Z;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x221e3b, 1.2);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xfff4e0, 4.5);
    sunLight.position.set(8, 2, 6);
    sunLight.castShadow = true;
    scene.add(sunLight);
    sunLightRef.current = sunLight; // expose for SunAngleDisplay
    const fillLight = new THREE.DirectionalLight(0x334488, 0.4);
    fillLight.position.set(-8, -2, -6);
    scene.add(fillLight);

    // Calculate real-time sun position for realistic lighting
    const updateSunPosition = () => {
      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60;
      const sunAltitude = Math.sin((hour - 6) / 12 * Math.PI) * 0.9; // ~-1 to 1 throughout day
      const sunAzimuth = ((hour - 6) / 12) * Math.PI * 2; // 0 to 2π
      
      // Position sun in 3D space (moon at origin)
      const sunDist = 12;
      const sunX = sunDist * Math.cos(sunAzimuth) * Math.cos(sunAltitude);
      const sunY = sunDist * sunAltitude;
      const sunZ = sunDist * Math.sin(sunAzimuth) * Math.cos(sunAltitude);
      
      sunLight.position.set(sunX, sunY, sunZ);
      // Adjust intensity based on sun altitude (lower = dimmer)
      const altitudeIntensity = Math.max(0.5, Math.sin((hour - 6) / 12 * Math.PI) + 0.6);
      sunLight.intensity = 4.5 * altitudeIntensity;
    };
    updateSunPosition();
    sceneRef.current.updateSunPosition = updateSunPosition;

    // Calculate moon phase and adjust lighting
    const REFERENCE_NEW_MOON = new Date('2000-01-06T18:14:00Z');
    const LUNAR_CYCLE_DAYS = 29.53058867;
    const updateMoonPhase = () => {
      const now = new Date();
      const daysSinceEpoch = (now - REFERENCE_NEW_MOON) / (1000 * 60 * 60 * 24);
      const phase = daysSinceEpoch % LUNAR_CYCLE_DAYS;
      const illumination = (1 - Math.cos((2 * Math.PI * phase) / LUNAR_CYCLE_DAYS)) / 2;
      sceneRef.current.moonIllumination = illumination;
      sceneRef.current.moonPhase = phase;
    };
    updateMoonPhase();
    sceneRef.current.updateMoonPhase = updateMoonPhase;

    const geometry = new THREE.SphereGeometry(1, 128, 128);
    const textureLoader = new THREE.TextureLoader();
    const textureUrl = PLANET_TEXTURES[planet] || PLANET_TEXTURES.moon;

    const material = new THREE.MeshStandardMaterial({
      roughness: 0.95,
      metalness: 0.0,
    });

    // Fetch texture via backend proxy to avoid CORS/hotlink issues
    fetchTextureDataUrl(textureUrl).then((dataUrl) => {
      if (!dataUrl) { setIsLoading(false); return; }
      textureLoader.load(dataUrl, (tex) => {
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        material.map = tex;
        material.bumpMap = tex;
        material.bumpScale = 0.012;
        material.needsUpdate = true;
        setIsLoading(false);
      });
    }).catch(() => setIsLoading(false));

    const moon = new THREE.Mesh(geometry, material);
    moon.receiveShadow = true;
    scene.add(moon);

    const glowGeometry = new THREE.SphereGeometry(1.035, 64, 64);
    const glowMaterial = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 vNormal; void main() { float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0); gl_FragColor = ${PLANET_GLOW[planet] || PLANET_GLOW.moon} * intensity * 0.25; }`,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    scene.add(new THREE.Mesh(glowGeometry, glowMaterial));

    const starsGeo = new THREE.BufferGeometry();
    const starPos = [], starColors = [];
    for (let i = 0; i < 3000; i++) {
      starPos.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
      starColors.push(0.8 + Math.random() * 0.2, 0.8 + Math.random() * 0.2, 0.9 + Math.random() * 0.1);
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    starsGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0.9 }));
    scene.add(stars);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    sceneRef.current = {
      scene, camera, renderer, moon, stars,
      markerMeshes: [], material,
      rotationVelocity: { x: 0, y: 0.002 },
    };

    // ── Drag state ──────────────────────────────────────────────────────────
    let isDragging = false;
    let hasMoved = false;
    let previousMouse = { x: 0, y: 0 };
    let dragVelX = 0, dragVelY = 0; // track drag velocity for inertia
    let autoSwitchTriggered = false;

    const onMouseDown = (e) => {
      isDragging = true;
      hasMoved = false;
      dragVelX = 0;
      dragVelY = 0;
      previousMouse = { x: e.clientX, y: e.clientY };
      // Pause auto-rotation on any click/drag
      autoRotatingRef.current = false;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - previousMouse.x;
      const dy = e.clientY - previousMouse.y;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) hasMoved = true;
      // Direct rotation while dragging — improved responsiveness
      moon.rotation.y += dx * 0.008;
      moon.rotation.x += dy * 0.008;
      // Clamp vertical tilt so globe doesn't flip
      moon.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, moon.rotation.x));
      // Store velocity for momentum on release
      dragVelX = dy * 0.008;
      dragVelY = dx * 0.008;
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e) => {
      isDragging = false;
      // Apply captured drag velocity as inertia
      sceneRef.current.rotationVelocity = { x: dragVelX, y: dragVelY };

      if (!hasMoved) {
        // It was a click — check for marker hit
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(sceneRef.current.markerMeshes.filter(m => m.userData?.id));
        if (hits.length > 0 && onSelectMarker) {
          haptic(20); // haptic feedback on marker tap
          onSelectMarker(hits[0].object.userData);
          return;
        }
      }
      // Schedule auto-rotation restart after idle
      idleTimerRef.current = setTimeout(() => {
        autoRotatingRef.current = true;
        if (sceneRef.current.rotationVelocity) {
          sceneRef.current.rotationVelocity.y = 0.0008;
          sceneRef.current.rotationVelocity.x = 0;
        }
      }, IDLE_RESTART_MS);
    };

    // ── Haptics helper ────────────────────────────────────────────────────────
    const haptic = (duration = 10, strength = 1.0) => {
      if (navigator.vibrate) navigator.vibrate(duration);
      // Web Vibration API covers Android; iOS requires a workaround via AudioContext
      // (no reliable cross-browser haptic API beyond vibrate)
    };

    // ── Touch ─────────────────────────────────────────────────────────────────
    let pinchStartDist = null; // for pinch-to-zoom
    let pinchStartZ = null;

    const getPinchDist = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onTouchStart = (e) => {
      autoRotatingRef.current = false;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      if (e.touches.length === 2) {
        // Pinch start — cancel single-finger drag
        isDragging = false;
        pinchStartDist = getPinchDist(e.touches);
        pinchStartZ = camera.position.z;
        haptic(8); // light haptic on pinch start
      } else {
        isDragging = true;
        hasMoved = false;
        dragVelX = 0;
        dragVelY = 0;
        previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        pinchStartDist = null;
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && pinchStartDist !== null) {
        // Pinch-to-zoom — prevent native browser zoom
        e.preventDefault();
        hasMoved = true;
        const dist = getPinchDist(e.touches);
        const scale = pinchStartDist / dist; // >1 = zoom out, <1 = zoom in
        const newZ = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchStartZ * scale));

        // Haptic bump when hitting zoom limits
        if ((newZ === MIN_ZOOM && camera.position.z > MIN_ZOOM + 0.05) ||
            (newZ === MAX_ZOOM && camera.position.z < MAX_ZOOM - 0.05)) {
          haptic(15);
        }
        camera.position.z = newZ;
        return;
      }

      if (!isDragging) return;
      hasMoved = true;
      const dx = e.touches[0].clientX - previousMouse.x;
      const dy = e.touches[0].clientY - previousMouse.y;
      moon.rotation.y += dx * 0.008;
      moon.rotation.x += dy * 0.008;
      moon.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, moon.rotation.x));
      dragVelX = dy * 0.008;
      dragVelY = dx * 0.008;
      previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) pinchStartDist = null;

      if (!isDragging) return;
      isDragging = false;
      sceneRef.current.rotationVelocity = { x: dragVelX, y: dragVelY };
      idleTimerRef.current = setTimeout(() => {
        autoRotatingRef.current = true;
        if (sceneRef.current.rotationVelocity) {
          sceneRef.current.rotationVelocity.y = 0.0008;
          sceneRef.current.rotationVelocity.x = 0;
        }
      }, IDLE_RESTART_MS);
    };

    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, camera.position.z + e.deltaY * 0.003));
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('wheel', onWheel, { passive: false });

    let animId;
    let frameCounter = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const vel = sceneRef.current.rotationVelocity;

      if (!isDragging && !animatingToMarkerRef.current) {
        if (autoRotatingRef.current) {
          // Smooth auto-rotation
          vel.x *= 0.95;
          vel.y = vel.y * 0.95 + 0.0008 * 0.05;
          moon.rotation.x += vel.x;
          moon.rotation.y += vel.y;
        } else {
          // Inertia wind-down after manual drag
          vel.x *= 0.88;
          vel.y *= 0.88;
          moon.rotation.x += vel.x;
          moon.rotation.y += vel.y;
        }
      }

      // Better resolution as camera zooms in
      const zoomFactor = Math.max(0, (DEFAULT_CAMERA_Z - camera.position.z) / (DEFAULT_CAMERA_Z - MIN_ZOOM));
      material.bumpScale = 0.008 + zoomFactor * 0.04;

      // Update sun position every 30 frames — skip if phase override is active
      if (frameCounter % 30 === 0 && sceneRef.current.updateSunPosition && !phaseDateRef.current) {
        sceneRef.current.updateSunPosition();
      }

      // Update moon phase every 60 frames for real-time illumination tracking
      if (frameCounter % 60 === 0 && sceneRef.current.updateMoonPhase) {
        sceneRef.current.updateMoonPhase();
      }
      frameCounter++;

      // Auto-switch to 2D when zoomed in very close
      if (camera.position.z <= AUTO_SWITCH_THRESHOLD && !autoSwitchTriggered) {
        autoSwitchTriggered = true;
        if (onAutoSwitch2D) onAutoSwitch2D();
      }
      if (camera.position.z > AUTO_SWITCH_THRESHOLD + 0.2) autoSwitchTriggered = false;

      stars.rotation.y += 0.00005;
      // Keep compass ref in sync
      globeRotYRef.current = moon.rotation.y;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  // ─── Phase date override: reposition sun light to match lunar phase ─────────
  useEffect(() => {
    phaseDateRef.current = phaseDate;
    const light = sunLightRef.current;
    if (!light) return;
    if (!phaseDate) {
      // Restore real-time sun position
      if (sceneRef.current.updateSunPosition) sceneRef.current.updateSunPosition();
      return;
    }
    // Calculate sun angle from phase: phase 0 = New Moon (sun behind moon from Earth),
    // phase 0.5 = Full Moon (sun in front). Angle goes 0→2π over the cycle.
    const phase = getMoonPhaseFromDate(phaseDate);
    // Phase angle: 0=new (dark), 0.5=full (bright). Map to sun azimuth around moon.
    const phaseAngle = phase * 2 * Math.PI;
    const sunDist = 12;
    const sunX = Math.cos(phaseAngle) * sunDist;
    const sunZ = Math.sin(phaseAngle) * sunDist;
    light.position.set(sunX, 1, sunZ);
    light.intensity = phase < 0.03 || phase > 0.97 ? 0.5 : 4.5;
  }, [phaseDate]);

  // ─── Rotate to selected marker ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedMarker) return;
    rotateMoonToMarker(selectedMarker, () => {
      animateCameraZ(2.1, 700);
    });
  }, [selectedMarker]);

  // ─── Guided tour: focus on a marker ────────────────────────────────────────
  const handleTourFocus = useCallback((marker) => {
    rotateMoonToMarker(marker, () => animateCameraZ(2.2, 700));
    if (onSelectMarker) onSelectMarker(marker);
  }, [rotateMoonToMarker, animateCameraZ, onSelectMarker]);

  // ─── Scientific layer overlays on globe ────────────────────────────────────
  useEffect(() => {
    const { moon, scene } = sceneRef.current;
    if (!moon) return;

    // Remove old scientific meshes
    (sceneRef.current.scientificMeshes || []).forEach(m => moon.remove(m));
    sceneRef.current.scientificMeshes = [];

    activeScientificLayers.forEach(layerKey => {
      const meta = SCIENTIFIC_LAYER_META[layerKey];
      if (!meta) return;

      meta.regions.forEach(region => {
        const color = valueToThreeColor(meta.gradient, region.value);
        // Convert lat/lng to 3D unit sphere position (using same mapping as markers)
        const latRad = (region.lat * Math.PI) / 180;
        const lngRad = ((-region.lng + 90) * Math.PI) / 180;
        const x = Math.cos(latRad) * Math.cos(lngRad);
        const y = Math.sin(latRad);
        const z = Math.cos(latRad) * Math.sin(lngRad);

        // Use a flat circle (disc) on the surface, sized by region.r (degrees → ~0.01 per degree)
        const discRadius = region.r * 0.017;
        const disc = new THREE.Mesh(
          new THREE.CircleGeometry(discRadius, 32),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.42,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        // Place just above surface
        disc.position.set(x * 1.002, y * 1.002, z * 1.002);
        // Face outward from globe center
        disc.lookAt(new THREE.Vector3(0, 0, 0));
        moon.add(disc);
        sceneRef.current.scientificMeshes.push(disc);
      });
    });
  }, [activeScientificLayers]);

  // ─── Update markers ────────────────────────────────────────────────────────
  useEffect(() => {
    const { moon } = sceneRef.current;
    if (!moon) return;
    sceneRef.current.markerMeshes.forEach(m => moon.remove(m));
    sceneRef.current.markerMeshes = [];

    markers.forEach(marker => {
      const latRad = (marker.lat * Math.PI) / 180;
      const lngRad = ((-marker.lng + 90) * Math.PI) / 180;
      const x = Math.cos(latRad) * Math.cos(lngRad);
      const y = Math.sin(latRad);
      const z = Math.cos(latRad) * Math.sin(lngRad);
      const normal = new THREE.Vector3(x, y, z);

      const color = LAYER_COLORS[marker.type];
      const isSelected = selectedMarker?.id === marker.id;

      // Outer halo ring (always visible, soft glow)
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.022, 0.034, 32),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: isSelected ? 0.9 : 0.45 })
      );
      halo.position.set(x * 1.005, y * 1.005, z * 1.005);
      halo.lookAt(new THREE.Vector3(0, 0, 0));
      halo.userData = marker;
      moon.add(halo);
      sceneRef.current.markerMeshes.push(halo);

      // Inner bright core
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(isSelected ? 0.018 : 0.011, 16, 16),
        new THREE.MeshBasicMaterial({ color })
      );
      core.position.set(x * 1.012, y * 1.012, z * 1.012);
      core.userData = marker;
      moon.add(core);
      sceneRef.current.markerMeshes.push(core);

      // Spike / stem pointing outward from surface
      const stemGeo = new THREE.CylinderGeometry(0.003, 0.001, 0.045, 6);
      const stem = new THREE.Mesh(stemGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }));
      stem.position.set(x * 1.03, y * 1.03, z * 1.03);
      stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      moon.add(stem);
      sceneRef.current.markerMeshes.push(stem);

      if (isSelected) {
        // Large outer selection ring
        const selRing = new THREE.Mesh(
          new THREE.RingGeometry(0.042, 0.056, 48),
          new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
        );
        selRing.position.set(x * 1.003, y * 1.003, z * 1.003);
        selRing.lookAt(new THREE.Vector3(0, 0, 0));
        moon.add(selRing);
        sceneRef.current.markerMeshes.push(selRing);
      }
    });
  }, [markers, selectedMarker]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground font-body">Loading {planet === 'mars' ? 'Mars' : 'Moon'} textures…</p>
          </div>
        </div>
      )}

      {/* Zoom, Reset & Phase Controls */}
      {!uiHidden && <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <button onClick={() => handleZoom(-1)}
          className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-lg"
          title="Zoom In">
          <ZoomIn className="w-4 h-4 text-foreground" />
        </button>
        <button onClick={() => handleZoom(1)}
          className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-lg"
          title="Zoom Out">
          <ZoomOut className="w-4 h-4 text-foreground" />
        </button>
        <button onClick={handleReset}
          className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-lg"
          title="Reset View">
          <RotateCcw className="w-4 h-4 text-foreground" />
        </button>
        {/* Moon Phase Display — only for moon */}
        {planet === 'moon' && (
          <MoonPhaseDisplay />
        )}
        {/* Guided Tour button */}
        {markers.length > 0 && (
          <button
            onClick={() => setTourActive(t => !t)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors shadow-lg ${
              tourActive
                ? 'bg-primary/30 border-primary text-primary'
                : 'bg-card/90 backdrop-blur-xl border-border hover:bg-secondary'
            }`}
            title="Guided Tour"
          >
            <Telescope className="w-4 h-4" />
          </button>
        )}
      </div>}

      {/* Sun angle + compass overlays */}
      {!uiHidden && <SunAngleDisplay sunLightRef={sunLightRef} />}
      {!uiHidden && <GlobeCompass globeRotationRef={globeRotYRef} />}

      {/* Guided tour */}
      <GuidedTour
        markers={markers}
        isActive={tourActive}
        onFocusMarker={handleTourFocus}
        onClose={() => setTourActive(false)}
      />

      {/* Scientific layer legend on 3D globe */}
      {activeScientificLayers.length > 0 && (
        <ScientificLayerLegend activeScientificLayers={activeScientificLayers} />
      )}

      {!uiHidden && (
        <div className="absolute bottom-14 left-4 text-[10px] text-muted-foreground/60 font-body">
          Drag to rotate • Pinch/scroll to zoom • Tap markers
        </div>
      )}

      {/* Phase date badge — shown when a date is selected from Moon Cycle Calendar */}
      {phaseDate && (() => {
        const phase = getMoonPhaseFromDate(phaseDate);
        const illumination = Math.round(((1 - Math.cos(phase * 2 * Math.PI)) / 2) * 100);
        const phaseName = getPhaseName(phase);
        return (
          <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-1 pointer-events-none">
            <div className="px-3 py-2 rounded-xl border border-primary/40 bg-card/90 backdrop-blur-xl shadow-lg flex items-center gap-2.5">
              <span className="text-lg">{illumination === 100 ? '🌕' : illumination === 0 ? '🌑' : phase < 0.5 ? '🌒' : '🌘'}</span>
              <div>
                <p className="text-[10px] text-muted-foreground font-body">
                  {phaseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-xs font-heading font-semibold text-foreground">{phaseName}</p>
                <p className="text-[10px] font-body" style={{ color: '#e2c97e' }}>{illumination}% illuminated</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}