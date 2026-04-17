import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { BODY_COLORS } from './solarData';
import { base44 } from '@/api/base44Client';

// Cache fetched textures (dataUrl) by URL to avoid re-downloading
const textureCache = {};

async function fetchTextureDataUrl(url) {
  if (textureCache[url]) return textureCache[url];
  const res = await base44.functions.invoke('proxyTexture', { url });
  const dataUrl = res.data?.dataUrl;
  if (dataUrl) textureCache[url] = dataUrl;
  return dataUrl;
}

const DEFAULT_Z = 3.2;
const MIN_ZOOM = 1.6;
const MAX_ZOOM = 6.0;

export default function PlanetGlobe({ planet, bodies, selectedBody, onSelectBody }) {
  const containerRef = useRef(null);
  const sceneRef = useRef({});
  const [isLoading, setIsLoading] = useState(true);
  const autoRotRef = useRef(true);
  const idleRef = useRef(null);

  const scheduleResume = useCallback(() => {
    autoRotRef.current = false;
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => { autoRotRef.current = true; }, 4000);
  }, []);

  const animateZ = useCallback((targetZ, ms = 600) => {
    const { camera } = sceneRef.current;
    if (!camera) return;
    const start = camera.position.z, t0 = performance.now();
    const tick = (now) => {
      const t = Math.min((now - t0) / ms, 1);
      const e = 1 - Math.pow(1 - t, 3);
      camera.position.z = start + (targetZ - start) * e;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const handleZoom = useCallback((dir) => {
    const { camera } = sceneRef.current;
    if (!camera) return;
    if (navigator.vibrate) navigator.vibrate(8);
    animateZ(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, camera.position.z + dir * 0.5)), 400);
  }, [animateZ]);

  const handleReset = useCallback(() => {
    const { camera, globe } = sceneRef.current;
    if (!camera || !globe) return;
    animateZ(DEFAULT_Z, 600);
    const fx = globe.rotation.x, fy = globe.rotation.y, t0 = performance.now();
    const tick = (now) => {
      const t = Math.min((now - t0) / 600, 1);
      const e = 1 - Math.pow(1 - t, 3);
      globe.rotation.x = fx * (1 - e);
      globe.rotation.y = fy * (1 - e);
      if (t < 1) requestAnimationFrame(tick);
      else { autoRotRef.current = true; }
    };
    requestAnimationFrame(tick);
  }, [animateZ]);

  // Build scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth, h = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.z = DEFAULT_Z;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x334466, 1.2));
    const sun = new THREE.DirectionalLight(0xfff4e0, 5.5);
    sun.position.set(8, 2, 6);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x224488, 0.8);
    fill.position.set(-8, -2, -6);
    scene.add(fill);

    // Stars
    const sp = [];
    for (let i = 0; i < 2000; i++) {
      sp.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.08, color: 0xffffff, transparent: true, opacity: 0.7 })));

    // Planet globe
    const geo = new THREE.SphereGeometry(1, 128, 128);
    const roughness = planet.roughness ?? 0.85;
    const mat = new THREE.MeshStandardMaterial({
      color: parseInt(planet.color.replace('#', ''), 16),
      roughness,
      metalness: 0.0,
    });
    const globe = new THREE.Mesh(geo, mat);
    scene.add(globe);

    // Globe is ready to render — show it immediately, texture loads async
    setIsLoading(false);

    // Atmospheric glow
    const glowColor = planet.glowColor || 'vec4(0.3, 0.4, 0.8, 1.0)';
    const glowGeo = new THREE.SphereGeometry(1.035, 64, 64);
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 vNormal; void main() { float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0); gl_FragColor = ${glowColor} * intensity * 0.3; }`,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    // Fetch texture via backend proxy to avoid CORS/hotlink issues
    fetchTextureDataUrl(planet.textureUrl).then((dataUrl) => {
      if (!dataUrl) return;
      const loader = new THREE.TextureLoader();
      loader.load(dataUrl, (tex) => {
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        mat.map = tex;
        mat.bumpMap = tex;
        mat.bumpScale = planet.bumpScale ?? 0.012;
        mat.roughness = roughness;
        mat.needsUpdate = true;
      });
    }).catch(() => { /* solid color fallback already visible */ });

    sceneRef.current = { scene, camera, renderer, globe, markerMeshes: [], rotVel: { x: 0, y: 0.002 } };

    // Drag
    let drag = false, moved = false, px = 0, py = 0, vx = 0, vy = 0;
    let pinchDist0 = null, pinchZ0 = null;

    const getPinch = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const onMD = (e) => { drag = true; moved = false; px = e.clientX; py = e.clientY; scheduleResume(); };
    const onMM = (e) => {
      if (!drag) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) moved = true;
      globe.rotation.y += dx * 0.008;
      globe.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x + dy * 0.008));
      vx = dy * 0.008; vy = dx * 0.008;
      px = e.clientX; py = e.clientY;
    };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onMU = (e) => {
      drag = false;
      sceneRef.current.rotVel = { x: vx, y: vy };
      if (!moved) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(sceneRef.current.markerMeshes.filter(m => m.userData?.id));
        if (hits.length > 0 && onSelectBody) {
          if (navigator.vibrate) navigator.vibrate(15);
          onSelectBody(hits[0].object.userData);
          return;
        }
      }
      scheduleResume();
    };
    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, camera.position.z + e.deltaY * 0.003));
    };

    const onTS = (e) => {
      scheduleResume();
      if (e.touches.length === 2) { drag = false; pinchDist0 = getPinch(e.touches); pinchZ0 = camera.position.z; }
      else { drag = true; moved = false; vx = 0; vy = 0; px = e.touches[0].clientX; py = e.touches[0].clientY; pinchDist0 = null; }
    };
    const onTM = (e) => {
      if (e.touches.length === 2 && pinchDist0 !== null) {
        e.preventDefault();
        camera.position.z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchZ0 * (pinchDist0 / getPinch(e.touches))));
        return;
      }
      if (!drag) return;
      moved = true;
      const dx = e.touches[0].clientX - px, dy = e.touches[0].clientY - py;
      globe.rotation.y += dx * 0.008;
      globe.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x + dy * 0.008));
      vx = dy * 0.008; vy = dx * 0.008;
      px = e.touches[0].clientX; py = e.touches[0].clientY;
    };
    const onTE = (e) => {
      if (e.touches.length < 2) pinchDist0 = null;
      if (!drag) return;
      drag = false;
      sceneRef.current.rotVel = { x: vx, y: vy };
      scheduleResume();
    };

    container.addEventListener('mousedown', onMD);
    container.addEventListener('mousemove', onMM);
    container.addEventListener('mouseup', onMU);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTS, { passive: true });
    container.addEventListener('touchmove', onTM, { passive: false });
    container.addEventListener('touchend', onTE, { passive: true });

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const vel = sceneRef.current.rotVel;
      if (!drag) {
        if (autoRotRef.current) {
          vel.y = vel.y * 0.95 + 0.0008 * 0.05;
          vel.x *= 0.95;
        } else {
          vel.x *= 0.88; vel.y *= 0.88;
        }
        globe.rotation.x += vel.x;
        globe.rotation.y += vel.y;
      }
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nw = container.clientWidth, nh = container.clientHeight;
      camera.aspect = nw / nh; camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      if (idleRef.current) clearTimeout(idleRef.current);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onMD);
      container.removeEventListener('mousemove', onMM);
      container.removeEventListener('mouseup', onMU);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTS);
      container.removeEventListener('touchmove', onTM);
      container.removeEventListener('touchend', onTE);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [planet]);

  // Update markers
  useEffect(() => {
    const { globe } = sceneRef.current;
    if (!globe) return;
    sceneRef.current.markerMeshes?.forEach(m => globe.remove(m));
    sceneRef.current.markerMeshes = [];

    bodies.forEach(body => {
      const latRad = (body.lat * Math.PI) / 180;
      const lngRad = ((-body.lng + 90) * Math.PI) / 180;
      const x = Math.cos(latRad) * Math.cos(lngRad);
      const y = Math.sin(latRad);
      const z = Math.cos(latRad) * Math.sin(lngRad);

      const color = parseInt(BODY_COLORS[body.type].replace('#', ''), 16);
      const isSelected = selectedBody?.id === body.id;
      const size = isSelected ? 0.032 : 0.018;

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(size, 16, 16),
        new THREE.MeshBasicMaterial({ color })
      );
      dot.position.set(x * 1.01, y * 1.01, z * 1.01);
      dot.userData = body;
      globe.add(dot);
      sceneRef.current.markerMeshes.push(dot);

      if (isSelected) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(size * 1.5, size * 2.2, 32),
          new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
        );
        ring.position.set(x * 1.012, y * 1.012, z * 1.012);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        globe.add(ring);
        sceneRef.current.markerMeshes.push(ring);
      }
    });
  }, [bodies, selectedBody]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <button onClick={() => handleZoom(-1)} className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-lg"><ZoomIn className="w-4 h-4" /></button>
        <button onClick={() => handleZoom(1)} className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-lg"><ZoomOut className="w-4 h-4" /></button>
        <button onClick={handleReset} className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-lg"><RotateCcw className="w-4 h-4" /></button>
      </div>
      <div className="absolute bottom-14 left-4 text-[10px] text-muted-foreground/60 font-body">
        Drag to rotate • Pinch/scroll to zoom • Tap markers
      </div>
    </div>
  );
}