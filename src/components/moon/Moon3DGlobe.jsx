import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LAYER_COLORS } from './moonData';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const DEFAULT_CAMERA_Z = 3.5;
const MIN_Z = 1.8;
const MAX_Z = 7;

// NASA official Moon GLB (Solar System Exploration embed)
const NASA_MOON_GLB = 'https://solarsystem.nasa.gov/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcllRIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--7d626e5badbf2157a4fa43b9e891ab22ca767f3e/Moon_1_3474.glb?disposition=inline';
// Fallback: NASA SVS LRO small model
const NASA_SVS_GLB = 'https://svs.gsfc.nasa.gov/vis/a010000/a014900/a014959/moon_small.glb';

export default function Moon3DGlobe({ markers, selectedMarker, onSelectMarker }) {
  const containerRef = useRef(null);
  const sceneRef = useRef({});
  const cameraRef = useRef(null);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error

  const handleZoom = useCallback((dir) => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.max(MIN_Z, Math.min(MAX_Z, cameraRef.current.position.z + dir * 0.5));
  }, []);

  const handleReset = useCallback(() => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = DEFAULT_CAMERA_Z;
    if (sceneRef.current.moonGroup) {
      sceneRef.current.moonGroup.rotation.set(0, 0, 0);
    }
    if (sceneRef.current.vel) {
      sceneRef.current.vel.x = 0;
      sceneRef.current.vel.y = 0.001;
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true,
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // ── Scene & Camera ────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010409);

    const camera = new THREE.PerspectiveCamera(42, w / h, 0.01, 1000);
    camera.position.z = DEFAULT_CAMERA_Z;
    cameraRef.current = camera;

    // ── Lighting ──────────────────────────────────────────────
    // Dim ambient (space is dark)
    scene.add(new THREE.AmbientLight(0x222244, 0.8));

    // Main sun — warm directional
    const sun = new THREE.DirectionalLight(0xfff4e0, 4.0);
    sun.position.set(5, 2, 3);
    scene.add(sun);

    // Earthshine — subtle cool fill
    const earthShine = new THREE.DirectionalLight(0x3355cc, 0.3);
    earthShine.position.set(-5, -2, -3);
    scene.add(earthShine);

    // ── Stars (twinkling via shader) ───────────────────────────
    const STAR_COUNT = 4000;
    const sPos = new Float32Array(STAR_COUNT * 3);
    const sSizes = new Float32Array(STAR_COUNT);
    const sPhases = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 100 + Math.random() * 150;
      sPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      sPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      sPos[i * 3 + 2] = r * Math.cos(phi);
      sSizes[i] = 0.4 + Math.random() * 2.8;
      sPhases[i] = Math.random() * Math.PI * 2;
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    starsGeo.setAttribute('size', new THREE.BufferAttribute(sSizes, 1));
    starsGeo.setAttribute('phase', new THREE.BufferAttribute(sPhases, 1));

    const starsMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute float phase;
        uniform float time;
        varying float vAlpha;
        void main() {
          vAlpha = 0.5 + 0.5 * sin(time * 1.5 + phase);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (280.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.05, d) * vAlpha;
          gl_FragColor = vec4(1.0, 1.0, 1.0, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // ── Backglow / halo (large atmospheric ring) ──────────────
    const haloGeo = new THREE.SphereGeometry(1.6, 64, 64);
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          float glow = pow(rim, 2.0);
          vec3 col = mix(vec3(0.15, 0.3, 0.9), vec3(0.6, 0.8, 1.0), rim * 0.4);
          gl_FragColor = vec4(col, glow * 0.18);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    scene.add(halo);

    // Tight rim glow
    const rimGeo = new THREE.SphereGeometry(1.04, 64, 64);
    const rimMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          float a = pow(rim, 4.0) * 0.45;
          gl_FragColor = vec4(0.65, 0.82, 1.0, a);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(rimGeo, rimMat));

    // ── Moon group (will hold the GLTF mesh + markers) ────────
    const moonGroup = new THREE.Group();
    scene.add(moonGroup);
    sceneRef.current = {
      scene, camera, renderer, moonGroup, stars, starsMat,
      markerMeshes: [], vel: { x: 0, y: 0.001 }, moonRadius: 1,
    };

    // ── Load NASA GLTF ────────────────────────────────────────
    const loader = new GLTFLoader();

    const tryLoad = (url, isFallback) => {
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;

          // Normalize scale to radius ≈ 1
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2.0 / maxDim; // diameter = 2 → radius = 1
          model.scale.setScalar(scale);

          // Center
          const center = new THREE.Vector3();
          box.getCenter(center);
          model.position.sub(center.multiplyScalar(scale));

          // Improve materials
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = false;
              child.receiveShadow = false;
              if (child.material) {
                child.material.roughness = 0.92;
                child.material.metalness = 0.0;
                if (child.material.map) child.material.map.colorSpace = THREE.SRGBColorSpace;
              }
            }
          });

          sceneRef.current.moonRadius = 1;
          moonGroup.add(model);
          setLoadState('ready');
        },
        undefined,
        (err) => {
          if (!isFallback) {
            tryLoad(NASA_SVS_GLB, true);
          } else {
            // Both failed — build procedural fallback
            buildProceduralMoon();
            setLoadState('ready');
          }
        }
      );
    };

    const buildProceduralMoon = () => {
      const tl = new THREE.TextureLoader();
      const tex = tl.load('https://upload.wikimedia.org/wikipedia/commons/a/a8/Solarsystemscope_texture_2k_moon.jpg');
      tex.colorSpace = THREE.SRGBColorSpace;
      const bump = tl.load('https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg');
      const geo = new THREE.SphereGeometry(1, 128, 128);
      const mat = new THREE.MeshStandardMaterial({ map: tex, bumpMap: bump, bumpScale: 0.04, roughness: 0.95 });
      moonGroup.add(new THREE.Mesh(geo, mat));
    };

    tryLoad(NASA_MOON_GLB, false);

    // ── Interaction ────────────────────────────────────────────
    let dragging = false;
    let prev = { x: 0, y: 0 };
    const vel = sceneRef.current.vel;

    const onDown = (x, y) => { dragging = true; prev = { x, y }; };
    const onMove = (x, y) => {
      if (!dragging) return;
      vel.x = (y - prev.y) * 0.005;
      vel.y = (x - prev.x) * 0.005;
      prev = { x, y };
    };
    const onUp = () => { dragging = false; };
    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(MIN_Z, Math.min(MAX_Z, camera.position.z + e.deltaY * 0.003));
    };

    container.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY));
    container.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onUp);
    container.addEventListener('touchstart', (e) => onDown(e.touches[0].clientX, e.touches[0].clientY));
    container.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX, e.touches[0].clientY));
    container.addEventListener('touchend', onUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // ── Animation loop ─────────────────────────────────────────
    let raf, t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.016;
      starsMat.uniforms.time.value = t;

      if (!dragging) {
        vel.x *= 0.92;
        vel.y *= 0.92;
        if (Math.abs(vel.y) < 0.0004) vel.y = 0.001;
      }
      moonGroup.rotation.x += vel.x;
      moonGroup.rotation.y += vel.y;

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ─────────────────────────────────────────────────
    const onResize = () => {
      const nw = container.clientWidth, nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
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
    const { scene, moonGroup } = sceneRef.current;
    if (!scene || !moonGroup) return;

    sceneRef.current.markerMeshes.forEach(m => moonGroup.remove(m));
    sceneRef.current.markerMeshes = [];

    markers.forEach((marker) => {
      const latR = (marker.lat * Math.PI) / 180;
      const lngR = ((-marker.lng + 90) * Math.PI) / 180;
      const x = Math.cos(latR) * Math.cos(lngR);
      const y = Math.sin(latR);
      const z = Math.cos(latR) * Math.sin(lngR);

      const color = new THREE.Color(LAYER_COLORS[marker.type]);
      const isSelected = selectedMarker?.id === marker.id;
      const r = isSelected ? 0.034 : 0.02;

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(r, 16, 16),
        new THREE.MeshBasicMaterial({ color })
      );
      dot.position.set(x * 1.01, y * 1.01, z * 1.01);
      dot.userData = marker;
      moonGroup.add(dot);
      sceneRef.current.markerMeshes.push(dot);

      if (isSelected) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.044, 0.062, 32),
          new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
        );
        ring.position.copy(dot.position);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        moonGroup.add(ring);
        sceneRef.current.markerMeshes.push(ring);
      }
    });
  }, [markers, selectedMarker]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading overlay */}
      {loadState === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-20">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
          <p className="text-sm text-muted-foreground font-body">Loading NASA Moon model…</p>
          <p className="text-[11px] text-muted-foreground/60 font-body mt-1">Source: NASA Solar System Exploration</p>
        </div>
      )}

      {/* Zoom + Reset controls */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        {[
          { icon: ZoomIn, title: 'Zoom in', action: () => handleZoom(-1) },
          { icon: ZoomOut, title: 'Zoom out', action: () => handleZoom(1) },
          null,
          { icon: RotateCcw, title: 'Reset view', action: handleReset },
        ].map((btn, i) =>
          btn === null ? (
            <div key={i} className="w-px h-3 bg-border mx-auto" />
          ) : (
            <button
              key={i}
              onClick={btn.action}
              title={btn.title}
              className="w-9 h-9 flex items-center justify-center bg-card/80 backdrop-blur-sm border border-border rounded-xl hover:bg-secondary transition-colors shadow-lg"
            >
              <btn.icon className="w-4 h-4 text-foreground" />
            </button>
          )
        )}
      </div>

      {/* Source credit */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-muted-foreground font-body">3D model: NASA / LRO</span>
      </div>
      <div className="absolute bottom-4 left-4 text-[10px] text-muted-foreground font-body opacity-50">
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}