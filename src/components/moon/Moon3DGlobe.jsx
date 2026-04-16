import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { LAYER_COLORS } from './moonData';

export default function Moon3DGlobe({ markers, selectedMarker, onSelectMarker }) {
  const containerRef = useRef(null);
  const sceneRef = useRef({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    backLight.position.set(-5, -3, -5);
    scene.add(backLight);

    // Moon geometry
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // Texture
    const textureLoader = new THREE.TextureLoader();
    const moonTexture = textureLoader.load(
      'https://upload.wikimedia.org/wikipedia/commons/a/a8/Solarsystemscope_texture_2k_moon.jpg',
      () => setIsLoading(false),
      undefined,
      () => setIsLoading(false)
    );

    const material = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 0.9,
      metalness: 0.05,
    });

    const moon = new THREE.Mesh(geometry, material);
    scene.add(moon);

    // Glow effect
    const glowGeometry = new THREE.SphereGeometry(1.02, 64, 64);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        viewVector: { value: camera.position },
      },
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
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.3, 0.5, 1.0, 1.0) * intensity * 0.4;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    // Star field
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 2000; i++) {
      starPositions.push(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
      );
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Store refs
    sceneRef.current = { scene, camera, renderer, moon, glow, stars, markerMeshes: [] };

    // Mouse interaction
    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0.002 };

    const onMouseDown = (e) => {
      isDragging = true;
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMouse.x;
      const deltaY = e.clientY - previousMouse.y;
      rotationVelocity.x = deltaY * 0.005;
      rotationVelocity.y = deltaX * 0.005;
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => { isDragging = false; };

    // Touch support
    const onTouchStart = (e) => {
      isDragging = true;
      previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.touches[0].clientX - previousMouse.x;
      const deltaY = e.touches[0].clientY - previousMouse.y;
      rotationVelocity.x = deltaY * 0.005;
      rotationVelocity.y = deltaX * 0.005;
      previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { isDragging = false; };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchmove', onTouchMove);
    container.addEventListener('touchend', onTouchEnd);

    // Zoom
    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(2, Math.min(6, camera.position.z + e.deltaY * 0.003));
    };
    container.addEventListener('wheel', onWheel, { passive: false });

    // Animation
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (!isDragging) {
        rotationVelocity.x *= 0.95;
        rotationVelocity.y *= 0.95;
        if (Math.abs(rotationVelocity.y) < 0.0005) rotationVelocity.y = 0.001;
      }

      moon.rotation.x += rotationVelocity.x;
      moon.rotation.y += rotationVelocity.y;

      stars.rotation.y += 0.0001;

      renderer.render(scene, camera);
    };
    animate();

    // Resize
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
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update marker points on the globe
  useEffect(() => {
    const { scene, moon } = sceneRef.current;
    if (!scene || !moon) return;

    // Remove old markers
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

      const dotGeometry = new THREE.SphereGeometry(isSelected ? 0.035 : 0.02, 16, 16);
      const dotMaterial = new THREE.MeshBasicMaterial({ color });
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      dot.position.set(x * 1.005, y * 1.005, z * 1.005);
      dot.userData = marker;

      moon.add(dot);
      sceneRef.current.markerMeshes.push(dot);

      // Pulse ring for selected
      if (isSelected) {
        const ringGeometry = new THREE.RingGeometry(0.04, 0.06, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
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
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      <div className="absolute bottom-4 left-4 text-[10px] text-muted-foreground font-body">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}