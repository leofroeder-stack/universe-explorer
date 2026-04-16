import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { LAYER_COLORS } from './moonData';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import MoonPhaseOverlay from './MoonPhaseOverlay';

const DEFAULT_CAMERA_Z = 3.2;
const MIN_ZOOM = 1.5;
const MAX_ZOOM = 6.0;
const AUTO_SWITCH_THRESHOLD = 1.7;
const IDLE_RESTART_MS = 5000; // resume auto-rotation after 5s of no interaction

const PLANET_TEXTURES = {
  moon: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
  mars: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/USGS-MarsMap-thnewcolor-Nasa-PIA00591.jpg/1280px-USGS-MarsMap-thnewcolor-Nasa-PIA00591.jpg',
};

const PLANET_GLOW = {
  moon: 'vec4(0.15, 0.2, 0.5, 1.0)',
  mars: 'vec4(0.6, 0.25, 0.1, 1.0)',
};

export default function Moon3DGlobe({ markers, selectedMarker, onSelectMarker, onAutoSwitch2D, planet = 'moon' }) {
  const containerRef = useRef(null);
  const sceneRef = useRef({});
  const [isLoading, setIsLoading] = useState(true);
  const animatingToMarkerRef = useRef(false);
  // idle timer ref — shared with the animation loop closure
  const idleTimerRef = useRef(null);
  const autoRotatingRef = useRef(true); // starts auto-rotating

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
    const fillLight = new THREE.DirectionalLight(0x334488, 0.4);
    fillLight.position.set(-8, -2, -6);
    scene.add(fillLight);

    const geometry = new THREE.SphereGeometry(1, 128, 128);
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';

    const textureUrl = PLANET_TEXTURES[planet] || PLANET_TEXTURES.moon;
    const moonTexture = textureLoader.load(
      textureUrl,
      () => setIsLoading(false),
      undefined,
      () => setIsLoading(false)
    );
    const bumpMap = textureLoader.load(textureUrl);

    const material = new THREE.MeshStandardMaterial({
      map: moonTexture,
      bumpMap: bumpMap,
      bumpScale: 0.012,
      roughness: 0.95,
      metalness: 0.0,
    });

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
          onSelectMarker(hits[0].object.userData);
          // marker selection handles its own idle restart timer
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

    // ── Touch ─────────────────────────────────────────────────────────────────
    const onTouchStart = (e) => {
      isDragging = true;
      hasMoved = false;
      dragVelX = 0;
      dragVelY = 0;
      previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      autoRotatingRef.current = false;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
    const onTouchMove = (e) => {
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
    const onTouchEnd = () => {
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
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('wheel', onWheel, { passive: false });

    let animId;
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

      // Auto-switch to 2D when zoomed in very close
      if (camera.position.z <= AUTO_SWITCH_THRESHOLD && !autoSwitchTriggered) {
        autoSwitchTriggered = true;
        if (onAutoSwitch2D) onAutoSwitch2D();
      }
      if (camera.position.z > AUTO_SWITCH_THRESHOLD + 0.2) autoSwitchTriggered = false;

      stars.rotation.y += 0.00005;
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

  // ─── Rotate to selected marker ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedMarker) return;
    rotateMoonToMarker(selectedMarker, () => {
      animateCameraZ(2.1, 700);
    });
  }, [selectedMarker]);

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

      const color = LAYER_COLORS[marker.type];
      const isSelected = selectedMarker?.id === marker.id;

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(isSelected ? 0.032 : 0.018, 16, 16),
        new THREE.MeshBasicMaterial({ color })
      );
      dot.position.set(x * 1.008, y * 1.008, z * 1.008);
      dot.userData = marker;
      moon.add(dot);
      sceneRef.current.markerMeshes.push(dot);

      if (isSelected) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.036, 0.055, 32),
          new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
        );
        ring.position.set(x * 1.01, y * 1.01, z * 1.01);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        moon.add(ring);
        sceneRef.current.markerMeshes.push(ring);
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
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
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
        {/* Moon Phase button — only for moon */}
        {planet === 'moon' && (
          <div className="relative">
            <MoonPhaseOverlay />
          </div>
        )}
      </div>

      <div className="absolute bottom-14 left-4 text-[10px] text-muted-foreground/60 font-body">
        Drag to rotate • Scroll to zoom • Click markers
      </div>
    </div>
  );
}