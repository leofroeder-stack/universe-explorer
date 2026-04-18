import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ParallaxStarfield
 * Renders a full-screen Three.js canvas behind the globe.
 * Stars drift subtly based on globeRotation (passed as a ref).
 */
export default function ParallaxStarfield({ globeRotationRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 2000);
    camera.position.z = 1;

    // ── Layer 1: dense small stars (far, slow) ─────────────────────────────
    const buildStarLayer = (count, spread, size, opacity, colorVariation) => {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = spread * (0.85 + Math.random() * 0.15);
        positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);

        // Subtle star color variation (blue-white to warm yellow)
        const warm = Math.random();
        if (colorVariation) {
          colors[i * 3]     = 0.75 + warm * 0.25;
          colors[i * 3 + 1] = 0.80 + warm * 0.15;
          colors[i * 3 + 2] = 0.95 - warm * 0.35;
        } else {
          colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = 0.85 + Math.random() * 0.15;
        }
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        size,
        vertexColors: true,
        transparent: true,
        opacity,
        sizeAttenuation: false,
      });
      return new THREE.Points(geo, mat);
    };

    // Far small dense stars
    const layerFar  = buildStarLayer(3500, 600, 0.9, 0.75, false);
    // Mid stars — slightly larger, color variation
    const layerMid  = buildStarLayer(1000, 400, 1.4, 0.65, true);
    // Near large bright stars — parallax most visible here
    const layerNear = buildStarLayer(250,  200, 2.2, 0.85, true);

    scene.add(layerFar, layerMid, layerNear);

    // ── Nebula-like haze (additive blended large points) ───────────────────
    const hazeGeo = new THREE.BufferGeometry();
    const hazeCount = 60;
    const hazePos = new Float32Array(hazeCount * 3);
    const hazeCol = new Float32Array(hazeCount * 3);
    const hazePalette = [
      [0.12, 0.15, 0.40], // deep blue
      [0.25, 0.08, 0.35], // purple
      [0.05, 0.20, 0.30], // teal
      [0.30, 0.12, 0.12], // dark red
    ];
    for (let i = 0; i < hazeCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 380 + Math.random() * 80;
      hazePos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      hazePos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      hazePos[i * 3 + 2] = r * Math.cos(phi);
      const c = hazePalette[Math.floor(Math.random() * hazePalette.length)];
      hazeCol[i * 3]     = c[0];
      hazeCol[i * 3 + 1] = c[1];
      hazeCol[i * 3 + 2] = c[2];
    }
    hazeGeo.setAttribute('position', new THREE.BufferAttribute(hazePos, 3));
    hazeGeo.setAttribute('color', new THREE.BufferAttribute(hazeCol, 3));
    const hazeMat = new THREE.PointsMaterial({
      size: 18,
      vertexColors: true,
      transparent: true,
      opacity: 0.18,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(hazeGeo, hazeMat));

    // ── Resize handler ─────────────────────────────────────────────────────
    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Animation loop ─────────────────────────────────────────────────────
    let animId;
    let smoothRotX = 0;
    let smoothRotY = 0;
    let prevGlobeRotY = globeRotationRef?.current ?? 0;
    let driftX = 0;
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.001;

      const currentRotY = globeRotationRef?.current ?? 0;
      const deltaY = currentRotY - prevGlobeRotY;
      prevGlobeRotY = currentRotY;

      // Accumulate horizontal parallax from globe spin
      driftX += deltaY * 0.3;
      driftX *= 0.92; // decay

      // Target scene rotation: parallax from globe + gentle autonomous drift
      const targetRotY = currentRotY * 0.018 + Math.sin(time * 0.25) * 0.04;
      const targetRotX = Math.sin(time * 0.18) * 0.025;

      // Smooth follow
      smoothRotY += (targetRotY - smoothRotY) * 0.04;
      smoothRotX += (targetRotX - smoothRotX) * 0.03;

      // Apply with different parallax depth per layer
      layerFar.rotation.y  = smoothRotY * 0.4;
      layerFar.rotation.x  = smoothRotX * 0.4;
      layerMid.rotation.y  = smoothRotY * 0.7;
      layerMid.rotation.x  = smoothRotX * 0.7;
      layerNear.rotation.y = smoothRotY * 1.2;
      layerNear.rotation.x = smoothRotX * 1.2;

      // Twinkle: modulate opacity slightly per frame
      layerMid.material.opacity  = 0.60 + Math.sin(time * 3.1) * 0.05;
      layerNear.material.opacity = 0.80 + Math.sin(time * 2.3 + 1.0) * 0.08;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}