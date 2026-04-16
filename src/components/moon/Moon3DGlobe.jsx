import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { LAYER_COLORS } from './moonData';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const DEFAULT_CAMERA_Z = 2.8;
const MIN_Z = 1.5;
const MAX_Z = 6;

// High-quality NASA/LRO moon textures (color map from CGI Moon Kit)
const MOON_COLOR_URL = 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_2k.jpg';
const MOON_COLOR_FALLBACK = 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Solarsystemscope_texture_2k_moon.jpg';
const MOON_BUMP_URL = 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg';

export default function Moon3DGlobe({ markers, selectedMarker, onSelectMarker }) {
  const containerRef = useRef(null);
  const sceneRef = useRef({});
  const cameraRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleZoom = useCallback((dir) => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.max(MIN_Z, Math.min(MAX_Z, cameraRef.current.position.z + dir * 0.45));
  }, []);

  const handleReset = useCallback(() => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = DEFAULT_CAMERA_Z;
    if (sceneRef.current.moon) sceneRef.current.moon.rotation.set(0, 0, 0);
    if (sceneRef.current.vel) { sceneRef.current.vel.x = 0; sceneRef.current.vel.y = 0.001; }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // ── Scene & Camera ────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020508);
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.01, 1000);
    camera.position.z = DEFAULT_CAMERA_Z;
    cameraRef.current = camera;

    // ── Lighting — bright enough to reveal surface detail ─────
    // Strong ambient so no hemisphere is pitch black
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    // Main sun — from upper-right
    const sun = new THREE.DirectionalLight(0xfff8ee, 2.8);
    sun.position.set(4, 2, 3);
    scene.add(sun);
    // Soft fill so shadow side shows texture
    const fill = new THREE.DirectionalLight(0xaabbcc, 0.6);
    fill.position.set(-4, -1, -2);
    scene.add(fill);

    // ── Stars ─────────────────────────────────────────────────
    const STAR_COUNT = 3500;
    const sPos = new Float32Array(STAR_COUNT * 3);
    const sSizes = new Float32Array(STAR_COUNT);
    const sPhases = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 90 + Math.random() * 120;
      sPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      sPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      sPos[i * 3 + 2] = r * Math.cos(phi);
      sSizes[i]  = 0.4 + Math.random() * 2.5;
      sPhases[i] = Math.random() * Math.PI * 2;
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    starsGeo.setAttribute('size',     new THREE.BufferAttribute(sSizes, 1));
    starsGeo.setAttribute('phase',    new THREE.BufferAttribute(sPhases, 1));
    const starsMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size; attribute float phase; uniform float time; varying float vA;
        void main() {
          vA = 0.5 + 0.5 * sin(time * 1.4 + phase);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (260.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          gl_FragColor = vec4(1.0, 1.0, 1.0, smoothstep(0.5, 0.05, d) * vA);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(starsGeo, starsMat));

    // ── Moon sphere ───────────────────────────────────────────
    const moonGeo = new THREE.SphereGeometry(1, 128, 128);
    const texLoader = new THREE.TextureLoader();

    let loadedCount = 0;
    const onTexLoaded = () => { loadedCount++; if (loadedCount >= 1) setIsLoading(false); };

    // Load color texture with fallback
    const colorTex = texLoader.load(MOON_COLOR_URL, onTexLoaded, undefined, () => {
      // fallback
      const fb = texLoader.load(MOON_COLOR_FALLBACK, onTexLoaded);
      fb.colorSpace = THREE.SRGBColorSpace;
      if (sceneRef.current.moon) sceneRef.current.moon.material.map = fb;
      sceneRef.current.moon?.material && (sceneRef.current.moon.material.needsUpdate = true);
    });
    colorTex.colorSpace = THREE.SRGBColorSpace;

    const bumpTex = texLoader.load(MOON_BUMP_URL);

    const moonMat = new THREE.MeshStandardMaterial({
      map: colorTex,
      bumpMap: bumpTex,
      bumpScale: 0.06,
      roughness: 0.92,
      metalness: 0.0,
    });

    const moon = new THREE.Mesh(moonGeo, moonMat);
    scene.add(moon);

    // ── Atmosphere backglow ────────────────────────────────────
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vN; void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 vN; void main(){float r=1.-abs(dot(vN,vec3(0,0,1)));float g=pow(r,2.2);gl_FragColor=vec4(mix(vec3(.15,.3,.9),vec3(.6,.8,1.),r*.4),g*.18);}`,
      side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.55, 64, 64), haloMat));

    const rimMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vN; void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 vN; void main(){float r=1.-abs(dot(vN,vec3(0,0,1)));gl_FragColor=vec4(.65,.82,1.,pow(r,4.)*0.4);}`,
      side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.035, 64, 64), rimMat));

    const vel = { x: 0, y: 0.001 };
    sceneRef.current = { scene, camera, renderer, moon, stars: null, starsMat, markerMeshes: [], vel };

    // ── Interaction ────────────────────────────────────────────
    let dragging = false, prev = { x: 0, y: 0 };
    const onDown  = (x, y) => { dragging = true; prev = { x, y }; };
    const onMove  = (x, y) => { if (!dragging) return; vel.x = (y - prev.y) * 0.005; vel.y = (x - prev.x) * 0.005; prev = { x, y }; };
    const onUp    = () => { dragging = false; };
    const onWheel = (e) => { e.preventDefault(); camera.position.z = Math.max(MIN_Z, Math.min(MAX_Z, camera.position.z + e.deltaY * 0.003)); };

    container.addEventListener('mousedown',  (e) => onDown(e.clientX, e.clientY));
    container.addEventListener('mousemove',  (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onUp);
    container.addEventListener('touchstart', (e) => onDown(e.touches[0].clientX, e.touches[0].clientY));
    container.addEventListener('touchmove',  (e) => onMove(e.touches[0].clientX, e.touches[0].clientY));
    container.addEventListener('touchend', onUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // ── Animation ─────────────────────────────────────────────
    let raf, t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.016;
      starsMat.uniforms.time.value = t;
      if (!dragging) {
        vel.x *= 0.92; vel.y *= 0.92;
        if (Math.abs(vel.y) < 0.0004) vel.y = 0.001;
      }
      moon.rotation.x += vel.x;
      moon.rotation.y += vel.y;
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
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mouseup', onUp);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  // ── Markers ────────────────────────────────────────────────
  useEffect(() => {
    const { scene, moon } = sceneRef.current;
    if (!scene || !moon) return;
    sceneRef.current.markerMeshes.forEach(m => moon.remove(m));
    sceneRef.current.markerMeshes = [];

    markers.forEach((marker) => {
      const latR = (marker.lat * Math.PI) / 180;
      const lngR = ((-marker.lng + 90) * Math.PI) / 180;
      const x = Math.cos(latR) * Math.cos(lngR);
      const y = Math.sin(latR);
      const z = Math.cos(latR) * Math.sin(lngR);

      const color = new THREE.Color(LAYER_COLORS[marker.type]);
      const isSelected = selectedMarker?.id === marker.id;

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(isSelected ? 0.032 : 0.019, 16, 16),
        new THREE.MeshBasicMaterial({ color })
      );
      dot.position.set(x * 1.01, y * 1.01, z * 1.01);
      dot.userData = marker;
      moon.add(dot);
      sceneRef.current.markerMeshes.push(dot);

      if (isSelected) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.042, 0.058, 32),
          new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
        );
        ring.position.copy(dot.position);
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020508]/90 backdrop-blur-sm z-20">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
          <p className="text-sm text-muted-foreground font-body">Loading Moon surface…</p>
          <p className="text-[11px] text-muted-foreground/50 font-body mt-1">NASA Lunar Reconnaissance Orbiter</p>
        </div>
      )}

      {/* Zoom + Reset */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        {[
          { icon: ZoomIn,    title: 'Zoom in',    fn: () => handleZoom(-1) },
          { icon: ZoomOut,   title: 'Zoom out',   fn: () => handleZoom(1)  },
          null,
          { icon: RotateCcw, title: 'Reset view', fn: handleReset          },
        ].map((btn, i) =>
          btn === null
            ? <div key={i} className="w-px h-3 bg-border mx-auto" />
            : <button key={i} onClick={btn.fn} title={btn.title}
                className="w-9 h-9 flex items-center justify-center bg-card/80 backdrop-blur-sm border border-border rounded-xl hover:bg-secondary transition-colors shadow-lg">
                <btn.icon className="w-4 h-4 text-foreground" />
              </button>
        )}
      </div>

      <div className="absolute bottom-4 left-4 text-[10px] text-muted-foreground/50 font-body">
        Drag to rotate · Scroll to zoom
      </div>
      <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground/40 font-body">
        NASA / LRO
      </div>
    </div>
  );
}