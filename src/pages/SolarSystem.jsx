import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, ExternalLink } from 'lucide-react';
import { PLANET_BODIES } from '../components/solar/solarData';

const PLANETS = [
  {
    name: 'Sun',
    radius: 3.5,
    distance: 0,
    speed: 0,
    color: 0xFDB813,
    emissive: 0xFDB813,
    emissiveIntensity: 2.5,
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/1024px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
    description: 'The Sun is the star at the center of our Solar System. It is a nearly perfect ball of hot plasma, heated to incandescence by nuclear fusion reactions.',
    facts: ['Diameter: 1.39 million km', 'Surface temp: 5,500°C', 'Age: 4.6 billion years', 'Contains 99.8% of Solar System mass'],
    color3: '#FDB813',
  },
  {
    name: 'Mercury',
    radius: 0.38,
    distance: 7,
    speed: 4.15,
    color: 0xB5B5B5,
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mercury_in_true_color.jpg/800px-Mercury_in_true_color.jpg',
    description: 'Mercury is the smallest planet and closest to the Sun. It has a very thin atmosphere and extreme temperature variations.',
    facts: ['Diameter: 4,880 km', 'Day: 59 Earth days', 'Year: 88 Earth days', 'Temp range: -180°C to 430°C'],
    color3: '#B5B5B5',
  },
  {
    name: 'Venus',
    radius: 0.95,
    distance: 11,
    speed: 1.62,
    color: 0xE8C36A,
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Venus-real_color.jpg/800px-Venus-real_color.jpg',
    description: 'Venus is the hottest planet in our solar system. Its thick atmosphere traps heat in a runaway greenhouse effect.',
    facts: ['Diameter: 12,104 km', 'Day: 243 Earth days', 'Year: 225 Earth days', 'Surface temp: 465°C'],
    color3: '#E8C36A',
  },
  {
    name: 'Earth',
    radius: 1.0,
    distance: 16,
    speed: 1.0,
    color: 0x2E86AB,
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/The_Blue_Marble_%28remastered%29.jpg/800px-The_Blue_Marble_%28remastered%29.jpg',
    description: 'Earth is the third planet from the Sun and the only known planet to harbor life. It has liquid water on its surface and a protective magnetic field.',
    facts: ['Diameter: 12,742 km', 'Day: 24 hours', 'Year: 365.25 days', 'Moon: 1 natural satellite'],
    color3: '#2E86AB',
  },
  {
    name: 'Mars',
    radius: 0.53,
    distance: 22,
    speed: 0.53,
    color: 0xC1440E,
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/USGS-MarsMap-thnewcolor-Nasa-PIA00591.jpg/800px-USGS-MarsMap-thnewcolor-Nasa-PIA00591.jpg',
    description: 'Mars is the fourth planet and is known as the Red Planet. It has the largest volcano and the deepest canyon in the solar system.',
    facts: ['Diameter: 6,779 km', 'Day: 24.6 hours', 'Year: 687 Earth days', 'Moons: Phobos & Deimos'],
    color3: '#C1440E',
  },
  {
    name: 'Jupiter',
    radius: 2.8,
    distance: 34,
    speed: 0.084,
    color: 0xC88B3A,
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg/800px-Jupiter_and_its_shrunken_Great_Red_Spot.jpg',
    description: 'Jupiter is the largest planet in the Solar System. Its Great Red Spot is a storm that has raged for hundreds of years.',
    facts: ['Diameter: 139,820 km', 'Day: 10 hours', 'Year: 12 Earth years', 'Moons: 95 known'],
    color3: '#C88B3A',
  },
  {
    name: 'Saturn',
    radius: 2.3,
    distance: 48,
    speed: 0.034,
    color: 0xE4D191,
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/800px-Saturn_during_Equinox.jpg',
    hasRing: true,
    description: 'Saturn is famous for its stunning ring system made of ice and rock. It is the least dense planet and could float on water.',
    facts: ['Diameter: 116,460 km', 'Day: 10.7 hours', 'Year: 29 Earth years', 'Moons: 146 known'],
    color3: '#E4D191',
  },
  {
    name: 'Uranus',
    radius: 1.6,
    distance: 61,
    speed: 0.012,
    color: 0x7DE8E8,
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Uranus2.jpg/800px-Uranus2.jpg',
    description: 'Uranus rotates on its side with an axial tilt of 98°. It is an ice giant with a blue-green color from methane in its atmosphere.',
    facts: ['Diameter: 50,724 km', 'Day: 17.2 hours', 'Year: 84 Earth years', 'Moons: 28 known'],
    color3: '#7DE8E8',
  },
  {
    name: 'Neptune',
    radius: 1.5,
    distance: 74,
    speed: 0.006,
    color: 0x4B70DD,
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Neptune_Full.jpg/800px-Neptune_Full.jpg',
    description: 'Neptune is the farthest planet and the windiest. It has the strongest winds in the solar system, reaching 2,100 km/h.',
    facts: ['Diameter: 49,244 km', 'Day: 16 hours', 'Year: 165 Earth years', 'Moons: 16 known'],
    color3: '#4B70DD',
  },
];

export default function SolarSystem() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const sceneRef = useRef({});
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const clockRef = useRef(0);

  const handlePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020408);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 55, 90);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 5000; i++) {
      const r = 600 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.8 })));

    // Sun light — much brighter so planets are clearly lit
    const sunLight = new THREE.PointLight(0xFFF4E0, 8, 1200);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    // Secondary warm fill so the dark side of planets isn't pitch-black
    const fillLight = new THREE.PointLight(0xffd580, 1.5, 1200);
    fillLight.position.set(0, 0, 0);
    scene.add(fillLight);
    // Ambient so you can always see planet detail
    scene.add(new THREE.AmbientLight(0x334466, 1.2));

    // Load textures + build meshes
    const loader = new THREE.TextureLoader();
    const planetMeshes = [];
    let loaded = 0;

    PLANETS.forEach((p, i) => {
      // Orbit ring (skip Sun)
      if (p.distance > 0) {
        const orbitGeo = new THREE.RingGeometry(p.distance - 0.05, p.distance + 0.05, 128);
        const orbitMat = new THREE.MeshBasicMaterial({ color: 0x334466, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
        const orbit = new THREE.Mesh(orbitGeo, orbitMat);
        orbit.rotation.x = Math.PI / 2;
        scene.add(orbit);
      }

      const geo = new THREE.SphereGeometry(p.radius, 64, 64);
      loader.load(
        p.textureUrl,
        (tex) => {
          const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: p.name === 'Sun' ? 1 : 0.65,
            metalness: p.name === 'Sun' ? 0 : 0.05,
            emissive: p.emissive ? new THREE.Color(p.emissive) : new THREE.Color(0x000000),
            emissiveIntensity: p.emissiveIntensity || 0,
            emissiveMap: p.name === 'Sun' ? tex : null,
          });
          mesh.material = mat;
          mesh.material.needsUpdate = true;
          loaded++;
          if (loaded >= PLANETS.length) setIsLoading(false);
        },
        undefined,
        () => {
          loaded++;
          if (loaded >= PLANETS.length) setIsLoading(false);
        }
      );

      const mat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { planet: p, index: i };

      // Initial angle spread
      const initAngle = (i / PLANETS.length) * Math.PI * 2;
      mesh.userData.angle = initAngle;

      if (p.distance > 0) {
        mesh.position.set(Math.cos(initAngle) * p.distance, 0, Math.sin(initAngle) * p.distance);
      }
      scene.add(mesh);
      planetMeshes.push(mesh);

      // Sun glow — inner + outer layers for a realistic corona look
      if (p.name === 'Sun') {
        const vsGlow = `varying vec3 vNormal; void main(){ vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
        // Inner bright halo
        const innerGlowGeo = new THREE.SphereGeometry(p.radius * 1.18, 32, 32);
        const innerGlowMat = new THREE.ShaderMaterial({
          vertexShader: vsGlow,
          fragmentShader: `varying vec3 vNormal; void main(){ float i = pow(0.55 - dot(vNormal, vec3(0,0,1)), 2.2); gl_FragColor = vec4(1.0,0.85,0.3,1.0)*i*2.0; }`,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          transparent: true,
        });
        scene.add(new THREE.Mesh(innerGlowGeo, innerGlowMat));
        // Outer soft corona
        const outerGlowGeo = new THREE.SphereGeometry(p.radius * 1.7, 32, 32);
        const outerGlowMat = new THREE.ShaderMaterial({
          vertexShader: vsGlow,
          fragmentShader: `varying vec3 vNormal; void main(){ float i = pow(0.5 - dot(vNormal, vec3(0,0,1)), 3.5); gl_FragColor = vec4(1.0,0.6,0.05,1.0)*i*0.9; }`,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          transparent: true,
        });
        scene.add(new THREE.Mesh(outerGlowGeo, outerGlowMat));
      }

      // Saturn rings
      if (p.hasRing) {
        const ringGeo = new THREE.RingGeometry(p.radius * 1.4, p.radius * 2.5, 128);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xC2A26B, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 3;
        mesh.add(ring);
      }
    });

    // Camera drag orbit controls (simplified)
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let theta = 0.3;
    let phi = 1.0;
    let radius = 110;

    const updateCamera = () => {
      camera.position.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(0, 0, 0);
    };
    updateCamera();

    const onMouseDown = (e) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      theta -= dx * 0.005;
      phi = Math.max(0.2, Math.min(Math.PI - 0.2, phi + dy * 0.005));
      prevMouse = { x: e.clientX, y: e.clientY };
      updateCamera();
    };
    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e) => {
      radius = Math.max(30, Math.min(250, radius + e.deltaY * 0.08));
      updateCamera();
    };

    // Touch
    let touchPrev = null;
    let pinchDist0 = null, pinchRadius0 = null;
    const getTouchDist = (t) => {
      const dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx*dx+dy*dy);
    };
    const onTouchStart = (e) => {
      if (e.touches.length === 2) { pinchDist0 = getTouchDist(e.touches); pinchRadius0 = radius; }
      else { touchPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2 && pinchDist0) {
        e.preventDefault();
        const d = getTouchDist(e.touches);
        radius = Math.max(30, Math.min(250, pinchRadius0 * (pinchDist0 / d)));
        updateCamera();
      } else if (touchPrev) {
        const dx = e.touches[0].clientX - touchPrev.x, dy = e.touches[0].clientY - touchPrev.y;
        theta -= dx * 0.005;
        phi = Math.max(0.2, Math.min(Math.PI - 0.2, phi + dy * 0.005));
        touchPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        updateCamera();
      }
    };
    const onTouchEnd = () => { touchPrev = null; pinchDist0 = null; };

    // Click detection
    const raycaster = new THREE.Raycaster();
    const mouse2 = new THREE.Vector2();
    let clickStart = { x: 0, y: 0 };

    const onPointerDown = (e) => { clickStart = { x: e.clientX, y: e.clientY }; };
    const onPointerUp = (e) => {
      const dist = Math.hypot(e.clientX - clickStart.x, e.clientY - clickStart.y);
      if (dist > 5) return;
      const rect = container.getBoundingClientRect();
      mouse2.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse2.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse2, camera);
      const hits = raycaster.intersectObjects(planetMeshes);
      if (hits.length > 0) {
        setSelectedPlanet(hits[0].object.userData.planet);
        if (navigator.vibrate) navigator.vibrate(15);
      } else {
        setSelectedPlanet(null);
      }
    };

    // Hover
    const onPointerMoveHover = (e) => {
      const rect = container.getBoundingClientRect();
      mouse2.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse2.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse2, camera);
      const hits = raycaster.intersectObjects(planetMeshes);
      setHoveredPlanet(hits.length > 0 ? hits[0].object.userData.planet.name : null);
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointermove', onPointerMoveHover);

    sceneRef.current = { scene, camera, renderer, planetMeshes };

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!pausedRef.current) {
        clockRef.current += 0.008;
        planetMeshes.forEach((mesh) => {
          const { planet } = mesh.userData;
          if (planet.distance > 0) {
            mesh.userData.angle += planet.speed * 0.003;
            mesh.position.set(
              Math.cos(mesh.userData.angle) * planet.distance,
              0,
              Math.sin(mesh.userData.angle) * planet.distance
            );
          }
          mesh.rotation.y += 0.003;
        });
      }
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
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointermove', onPointerMoveHover);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" style={{ background: '#020408' }}>
      {/* Header */}
      <header className="flex-shrink-0 z-10 px-4 py-3 flex items-center justify-between border-b border-white/10" style={{ background: 'rgba(2,4,8,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10 text-white/70 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading font-bold text-lg leading-tight text-white">Solar System</h1>
            <p className="text-[11px] text-white/50 font-body">Interactive 3D Overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePause}
            className="px-3 py-1.5 rounded-lg text-xs font-body font-medium border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors"
          >
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>
      </header>

      {/* 3D Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ cursor: hoveredPlanet ? 'pointer' : 'grab' }}
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
              <p className="text-xs text-white/60 font-body">Loading Solar System…</p>
            </div>
          </div>
        )}

        {/* Planet label on hover */}
        {hoveredPlanet && !selectedPlanet && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-body font-medium text-white border border-white/20" style={{ background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(8px)' }}>
            {hoveredPlanet}
          </div>
        )}

        {/* Controls hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/30 font-body text-center">
          Drag to orbit • Scroll/pinch to zoom • Click a planet
        </div>

        {/* Planet list chips */}
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2 flex-wrap justify-center px-4">
          {PLANETS.map(p => {
            const bodyCount = p.name !== 'Sun' ? (PLANET_BODIES[p.name.toLowerCase()]?.length || 0) : 0;
            return (
              <button
                key={p.name}
                onClick={() => setSelectedPlanet(selectedPlanet?.name === p.name ? null : p)}
                className="px-2.5 py-1 rounded-full text-[10px] font-body font-medium border transition-all"
                style={{
                  borderColor: selectedPlanet?.name === p.name ? p.color3 : 'rgba(255,255,255,0.15)',
                  color: selectedPlanet?.name === p.name ? p.color3 : 'rgba(255,255,255,0.55)',
                  background: selectedPlanet?.name === p.name ? `${p.color3}18` : 'rgba(10,15,30,0.6)',
                }}
              >
                {p.name}{bodyCount > 0 ? ` (${bodyCount})` : ''}
              </button>
            );
          })}
        </div>

        {/* Info panel */}
        {selectedPlanet && (
          <div
            className="absolute top-4 right-4 w-72 rounded-2xl border border-white/15 p-4 flex flex-col gap-3"
            style={{ background: 'rgba(8,12,24,0.92)', backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: selectedPlanet.color3, boxShadow: `0 0 10px ${selectedPlanet.color3}80` }} />
                <h2 className="text-base font-heading font-bold text-white">{selectedPlanet.name}</h2>
              </div>
              <button onClick={() => setSelectedPlanet(null)} className="text-white/40 hover:text-white/80 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-white/65 font-body leading-relaxed">{selectedPlanet.description}</p>
            <div className="space-y-1.5">
              {selectedPlanet.facts.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] font-body text-white/70">
                  <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: selectedPlanet.color3 }} />
                  {f}
                </div>
              ))}
            </div>
            {selectedPlanet.name !== 'Sun' && PLANET_BODIES[selectedPlanet.name.toLowerCase()] && (
              <button
                onClick={() => navigate(`/planet/${selectedPlanet.name.toLowerCase()}`)}
                className="w-full mt-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-body font-semibold transition-all border"
                style={{
                  borderColor: `${selectedPlanet.color3}60`,
                  color: selectedPlanet.color3,
                  background: `${selectedPlanet.color3}15`,
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Explore {selectedPlanet.name} ({PLANET_BODIES[selectedPlanet.name.toLowerCase()].length} bodies)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}