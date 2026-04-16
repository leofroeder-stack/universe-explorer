import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { LAYER_COLORS } from './moonData';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const DEFAULT_CAMERA_Z = 3.2;
const MIN_ZOOM = 1.8;
const MAX_ZOOM = 6.0;

export default function Moon3DGlobe({ markers, selectedMarker, onSelectMarker }) {
  const containerRef = useRef(null);
  const sceneRef = useRef({});
  const [isLoading, setIsLoading] = useState(true);

  const handleZoom = useCallback((dir) => {
    const { camera } = sceneRef.current;
    if (!camera) return;
    camera.position.z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, camera.position.z + dir * 0.5));
  }, []);

  const handleReset = useCallback(() => {
    const { camera, moon } = sceneRef.current;
    if (!camera || !moon) return;
    camera.position.z = DEFAULT_CAMERA_Z;
    moon.rotation.set(0, 0, 0);
    sceneRef.current.rotationVelocity = { x: 0, y: 0.002 };
  }, []);

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

    // Realistic lighting — sun-like key light, dim ambient
    const ambientLight = new THREE.AmbientLight(0x221e3b, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff4e0, 4.5);
    sunLight.position.set(8, 2, 6);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Subtle blue-ish fill from space
    const fillLight = new THREE.DirectionalLight(0x334488, 0.4);
    fillLight.position.set(-8, -2, -6);
    scene.add(fillLight);

    const geometry = new THREE.SphereGeometry(1, 128, 128);

    const textureLoader = new THREE.TextureLoader();

    // NASA CGI Moon texture (high res)
    const moonTexture = textureLoader.load(
      'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_1k.jpg',
      () => setIsLoading(false),
      undefined,
      () => {
        // Fallback to Wikipedia texture
        moonTexture.image = null;
        const fallbackTexture = textureLoader.load(
          'https://upload.wikimedia.org/wikipedia/commons/a/a8/Solarsystemscope_texture_2k_moon.jpg',
          () => setIsLoading(false)
        );
        material.map = fallbackTexture;
        material.needsUpdate = true;
        setIsLoading(false);
      }
    );

    // NASA bump map for surface detail
    const bumpMap = textureLoader.load(
      'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg'
    );

    const material = new THREE.MeshStandardMaterial({
      map: moonTexture,
      bumpMap: bumpMap,
      bumpScale: 0.018,
      roughness: 0.95,
      metalness: 0.0,
    });

    const moon = new THREE.Mesh(geometry, material);
    moon.receiveShadow = true;
    scene.add(moon);

    // Subtle atmospheric glow
    const glowGeometry = new THREE.SphereGeometry(1.035, 64, 64);
    const glowMaterial = new THREE.ShaderMaterial({
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
          float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
          gl_FragColor = vec4(0.15, 0.2, 0.5, 1.0) * intensity * 0.25;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starPos = [];
    const starColors = [];
    for (let i = 0; i < 3000; i++) {
      starPos.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
      const r = 0.8 + Math.random() * 0.2;
      const g = 0.8 + Math.random() * 0.2;
      const b = 0.9 + Math.random() * 0.1;
      starColors.push(r, g, b);
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    starsGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    const starsMat = new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0.9 });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // Raycaster for click selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    sceneRef.current = { scene, camera, renderer, moon, glow, stars, markerMeshes: [], markerData: [], rotationVelocity: { x: 0, y: 0.002 } };

    let isDragging = false;
    let hasMoved = false;
    let previousMouse = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      hasMoved = false;
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMouse.x;
      const deltaY = e.clientY - previousMouse.y;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) hasMoved = true;
      sceneRef.current.rotationVelocity.x = deltaY * 0.005;
      sceneRef.current.rotationVelocity.y = deltaX * 0.005;
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e) => {
      isDragging = false;
      if (!hasMoved) {
        // Click — raycast for marker selection
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const dotMeshes = sceneRef.current.markerMeshes.filter(m => m.userData?.id);
        const intersects = raycaster.intersectObjects(dotMeshes);
        if (intersects.length > 0) {
          const hit = intersects[0].object.userData;
          if (onSelectMarker) onSelectMarker(hit);
        }
      }
    };

    const onTouchStart = (e) => {
      isDragging = true;
      hasMoved = false;
      previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.touches[0].clientX - previousMouse.x;
      const deltaY = e.touches[0].clientY - previousMouse.y;
      hasMoved = true;
      sceneRef.current.rotationVelocity.x = deltaY * 0.005;
      sceneRef.current.rotationVelocity.y = deltaX * 0.005;
      previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { isDragging = false; };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchmove', onTouchMove);
    container.addEventListener('touchend', onTouchEnd);

    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, camera.position.z + e.deltaY * 0.003));
    };
    container.addEventListener('wheel', onWheel, { passive: false });

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const vel = sceneRef.current.rotationVelocity;
      if (!isDragging) {
        vel.x *= 0.92;
        vel.y *= 0.92;
        if (Math.abs(vel.y) < 0.0005) vel.y = 0.0008;
      }
      moon.rotation.x += vel.x;
      moon.rotation.y += vel.y;
      stars.rotation.y += 0.00005;
      renderer.render(scene, camera);
    };
    animate();

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

  // Update markers
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

      const color = LAYER_COLORS[marker.type];
      const isSelected = selectedMarker?.id === marker.id;

      const dotGeo = new THREE.SphereGeometry(isSelected ? 0.032 : 0.018, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(x * 1.008, y * 1.008, z * 1.008);
      dot.userData = marker;
      moon.add(dot);
      sceneRef.current.markerMeshes.push(dot);

      if (isSelected) {
        const ringGeo = new THREE.RingGeometry(0.036, 0.052, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(x * 1.009, y * 1.009, z * 1.009);
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
            <p className="text-xs text-muted-foreground font-body">Loading NASA textures…</p>
          </div>
        </div>
      )}

      {/* Zoom & Reset Controls */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <button
          onClick={() => handleZoom(-1)}
          className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-lg"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={() => handleZoom(1)}
          className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-lg"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={handleReset}
          className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-lg"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4 text-foreground" />
        </button>
      </div>

      <div className="absolute bottom-14 left-4 text-[10px] text-muted-foreground/60 font-body">
        Drag to rotate • Scroll to zoom • Click markers
      </div>
    </div>
  );
}