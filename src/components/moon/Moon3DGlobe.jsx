import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { LAYER_COLORS } from './moonData';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const DEFAULT_CAMERA_Z = 3.2;
const MIN_Z = 1.6;
const MAX_Z = 6;

export default function Moon3DGlobe({ markers, selectedMarker, onSelectMarker }) {
  const containerRef = useRef(null);
  const sceneRef = useRef({});
  const [isLoading, setIsLoading] = useState(true);
  const cameraRef = useRef(null);

  const handleZoom = useCallback((direction) => {
    if (!cameraRef.current) return;
    const step = 0.4;
    const newZ = Math.max(MIN_Z, Math.min(MAX_Z, cameraRef.current.position.z + direction * step));
    cameraRef.current.position.z = newZ;
  }, []);

  const handleReset = useCallback(() => {
    if (!cameraRef.current || !sceneRef.current.moon) return;
    cameraRef.current.position.z = DEFAULT_CAMERA_Z;
    sceneRef.current.moon.rotation.set(0, 0, 0);
    if (sceneRef.current.rotationVelocity) {
      sceneRef.current.rotationVelocity.x = 0;
      sceneRef.current.rotationVelocity.y = 0.001;
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // --- Renderer (WebGL) ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // --- Scene ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010409);

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = DEFAULT_CAMERA_Z;
    cameraRef.current = camera;

    // --- Lighting ---
    // Dim ambient so craters catch shadow
    const ambientLight = new THREE.AmbientLight(0x334466, 0.6);
    scene.add(ambientLight);

    // Primary sun light (warm)
    const sunLight = new THREE.DirectionalLight(0xfff5e0, 3.5);
    sunLight.position.set(6, 2, 4);
    scene.add(sunLight);

    // Soft blue fill from opposite side (earthshine)
    const earthShine = new THREE.DirectionalLight(0x3366cc, 0.25);
    earthShine.position.set(-6, -2, -4);
    scene.add(earthShine);

    // --- Star field with twinkling ---
    const starCount = 3500;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starPhases = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 80 + Math.random() * 120;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
      starSizes[i] = 0.5 + Math.random() * 2.5;
      starPhases[i] = Math.random() * Math.PI * 2;
    }

    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starsGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    starsGeo.setAttribute('phase', new THREE.BufferAttribute(starPhases, 1));

    const starsMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute float phase;
        uniform float time;
        varying float vAlpha;
        void main() {
          vAlpha = 0.55 + 0.45 * sin(time * 1.2 + phase);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, d) * vAlpha;
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(starsGeo, starsMaterial);
    scene.add(stars);

    // --- Moon ---
    const moonGeo = new THREE.SphereGeometry(1, 128, 128);
    const textureLoader = new THREE.TextureLoader();

    // Load multiple moon textures for realism
    let loadCount = 0;
    const onLoaded = () => { loadCount++; if (loadCount >= 2) setIsLoading(false); };

    const moonColorTex = textureLoader.load(
      'https://upload.wikimedia.org/wikipedia/commons/a/a8/Solarsystemscope_texture_2k_moon.jpg',
      onLoaded, undefined, onLoaded
    );
    moonColorTex.colorSpace = THREE.SRGBColorSpace;

    // Bump/displacement for crater realism
    const moonBumpTex = textureLoader.load(
      'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg',
      onLoaded, undefined, onLoaded
    );

    const moonMaterial = new THREE.MeshStandardMaterial({
      map: moonColorTex,
      bumpMap: moonBumpTex,
      bumpScale: 0.04,
      roughness: 0.95,
      metalness: 0.0,
    });

    const moon = new THREE.Mesh(moonGeo, moonMaterial);
    scene.add(moon);

    // --- Atmosphere / backglow (large halo behind moon) ---
    const haloGeo = new THREE.SphereGeometry(1.45, 64, 64);
    const haloMat = new THREE.ShaderMaterial({
      uniforms: {},
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
          float glow = pow(rim, 2.2);
          vec3 col = mix(vec3(0.2, 0.4, 0.9), vec3(0.7, 0.85, 1.0), rim * 0.5);
          gl_FragColor = vec4(col, glow * 0.22);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    scene.add(halo);

    // Inner atmosphere rim
    const rimGeo = new THREE.SphereGeometry(1.035, 64, 64);
    const rimMat = new THREE.ShaderMaterial({
      uniforms: {},
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
          float alpha = pow(rim, 3.5) * 0.5;
          gl_FragColor = vec4(0.6, 0.8, 1.0, alpha);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    scene.add(rim);

    // Store
    const rotationVelocity = { x: 0, y: 0.001 };
    sceneRef.current = { scene, camera, renderer, moon, halo, rim, stars, starsMaterial, markerMeshes: [], rotationVelocity };

    // --- Mouse / touch drag ---
    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      previousMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      rotationVelocity.x = (e.clientY - previousMouse.y) * 0.005;
      rotationVelocity.y = (e.clientX - previousMouse.x) * 0.005;
      previousMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDragging = false; };

    const onTouchStart = (e) => {
      isDragging = true;
      previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e) => {
      if (!isDragging) return;
      rotationVelocity.x = (e.touches[0].clientY - previousMouse.y) * 0.005;
      rotationVelocity.y = (e.touches[0].clientX - previousMouse.x) * 0.005;
      previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { isDragging = false; };

    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(MIN_Z, Math.min(MAX_Z, camera.position.z + e.deltaY * 0.003));
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchmove', onTouchMove);
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('wheel', onWheel, { passive: false });

    // --- Animation ---
    let animationId;
    let time = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.016;

      starsMaterial.uniforms.time.value = time;

      if (!isDragging) {
        rotationVelocity.x *= 0.92;
        rotationVelocity.y *= 0.92;
        if (Math.abs(rotationVelocity.y) < 0.0004) rotationVelocity.y = 0.001;
      }

      moon.rotation.x += rotationVelocity.x;
      moon.rotation.y += rotationVelocity.y;

      renderer.render(scene, camera);
    };
    animate();

    // --- Resize ---
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  // --- Update markers ---
  useEffect(() => {
    const { scene, moon } = sceneRef.current;
    if (!scene || !moon) return;

    sceneRef.current.markerMeshes.forEach(m => moon.remove(m));
    sceneRef.current.markerMeshes = [];

    markers.forEach(marker => {
      const latRad = (marker.lat * Math.PI) / 180;
      const lngRad = ((-marker.lng + 90) * Math.PI) / 180;
      const x = Math.cos(latRad) * Math.cos(lngRad);
      const y = Math.sin(latRad);
      const z = Math.cos(latRad) * Math.sin(lngRad);

      const color = new THREE.Color(LAYER_COLORS[marker.type]);
      const isSelected = selectedMarker?.id === marker.id;
      const r = isSelected ? 0.032 : 0.018;

      const dotGeo = new THREE.SphereGeometry(r, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(x * 1.008, y * 1.008, z * 1.008);
      dot.userData = marker;
      moon.add(dot);
      sceneRef.current.markerMeshes.push(dot);

      if (isSelected) {
        const ringGeo = new THREE.RingGeometry(0.042, 0.058, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
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
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground font-body">Loading Moon textures…</p>
          </div>
        </div>
      )}

      {/* Zoom + Reset controls */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        <button
          onClick={() => handleZoom(-1)}
          className="w-9 h-9 flex items-center justify-center bg-card/80 backdrop-blur-sm border border-border rounded-xl hover:bg-secondary transition-colors shadow-lg"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={() => handleZoom(1)}
          className="w-9 h-9 flex items-center justify-center bg-card/80 backdrop-blur-sm border border-border rounded-xl hover:bg-secondary transition-colors shadow-lg"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4 text-foreground" />
        </button>
        <div className="w-px h-3 bg-border mx-auto" />
        <button
          onClick={handleReset}
          className="w-9 h-9 flex items-center justify-center bg-card/80 backdrop-blur-sm border border-border rounded-xl hover:bg-secondary transition-colors shadow-lg"
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4 text-foreground" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 text-[10px] text-muted-foreground font-body opacity-60">
        Drag to rotate · Scroll or use controls to zoom
      </div>
    </div>
  );
}