import * as THREE from 'three';
import VRLunarRoverModel from '@/components/vr/VRLunarRoverModel';
import { getAllMarkers } from '@/components/moon/moonData';

const heightAt = (x, z) => Math.sin(x * 0.18) * Math.cos(z * 0.18) * 0.35 + Math.sin(Math.hypot(x - 6, z + 8) * 0.8) * 0.18;

export default function VRLunarRoverScene() {
  const group = new THREE.Group(), pickables = [];
  group.add(new THREE.AmbientLight(0x94a3b8, 1.3));
  const sun = new THREE.DirectionalLight(0xfff4e0, 3.8); sun.position.set(12, 18, 10); group.add(sun);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1.4, 32, 24), new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.6 }));
  earth.position.set(-14, 12, -28); group.add(earth);
  new THREE.TextureLoader().load('/textures/earth.jpg', tex => { tex.colorSpace = THREE.SRGBColorSpace; earth.material.map = tex; earth.material.color.set(0xffffff); earth.material.needsUpdate = true; });
  const rover = VRLunarRoverModel();
  let cockpit = false, rx = 0, rz = 0, heading = 0, driveCmd = 0, steerCmd = 0, waypoint = null;
  const placeRover = () => rover.mesh.position.set(0, cockpit ? -0.38 : -0.52, cockpit ? -0.35 : -1.55);
  placeRover(); group.add(rover.mesh);
  const pivot = new THREE.Group(); pivot.position.copy(rover.mesh.position); group.add(pivot);
  const terrainGeo = new THREE.PlaneGeometry(90, 90, 96, 96); terrainGeo.rotateX(-Math.PI / 2);
  const pos = terrainGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
  terrainGeo.computeVertexNormals();
  const terrainMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.95 });
  new THREE.TextureLoader().load('/textures/moon.jpg', tex => { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(8, 8); terrainMat.map = tex; terrainMat.bumpMap = tex; terrainMat.bumpScale = 0.04; terrainMat.needsUpdate = true; });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat); pivot.add(terrain);
  const items = getAllMarkers().slice(0, 12).map((m, i) => {
    const angle = (i / 12) * Math.PI * 2, dist = 6 + (i % 3) * 6;
    const x = Math.sin(angle) * dist, z = -Math.cos(angle) * dist, y = heightAt(x, z);
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.4, 12), new THREE.MeshBasicMaterial({ color: m.type === 'events' ? 0xa855f7 : m.type === 'objects' ? 0xf59e0b : 0x38bdf8 }));
    beacon.position.set(x, y + 0.7, z);
    beacon.userData = { ...m, roverX: x, roverZ: z };
    terrain.add(beacon); pickables.push(beacon);
    return beacon.userData;
  });
  const driveTo = item => { if (item?.roverX !== undefined) waypoint = { x: item.roverX, z: item.roverZ }; };
  return {
    group,
    options: () => ({
      title: `Lunar Rover · ${cockpit ? 'Cockpit' : 'Chase'} View`,
      items, itemsLabel: 'Lunar Landmarks (Drive To)', pickables,
      onSelect: driveTo,
      onDrive: (fwd, turn) => { driveCmd = fwd; steerCmd = turn; if (Math.abs(fwd) > 0.05 || Math.abs(turn) > 0.05) waypoint = null; },
      actions: [
        { label: cockpit ? 'Switch to Chase Camera' : 'Switch to Cockpit Camera', onSelect: () => { cockpit = !cockpit; placeRover(); pivot.position.copy(rover.mesh.position); } },
        { label: 'Drive Forward', onSelect: () => { waypoint = { x: rx + Math.sin(heading) * 5, z: rz - Math.cos(heading) * 5 }; } },
        { label: 'Turn Left 45°', onSelect: () => { heading -= Math.PI / 4; } },
        { label: 'Turn Right 45°', onSelect: () => { heading += Math.PI / 4; } },
        { label: 'Stop Rover', onSelect: () => { waypoint = null; driveCmd = 0; steerCmd = 0; } },
        { label: 'Exit Rover (Back to Moon Globe)', onSelect: () => group.userData.onExitRover?.() },
      ],
    }),
    update(delta) {
      let fwd = driveCmd, turn = steerCmd;
      if (waypoint) {
        const dx = waypoint.x - rx, dz = waypoint.z - rz, dist = Math.hypot(dx, dz);
        if (dist < 0.8) waypoint = null;
        else {
          const targetH = Math.atan2(dx, -dz), diff = Math.atan2(Math.sin(targetH - heading), Math.cos(targetH - heading));
          turn = THREE.MathUtils.clamp(diff * 1.8, -1, 1); fwd = 1;
        }
      }
      heading += turn * delta * 1.4;
      const speed = fwd * 2.6;
      rx = THREE.MathUtils.clamp(rx + Math.sin(heading) * speed * delta, -38, 38);
      rz = THREE.MathUtils.clamp(rz - Math.cos(heading) * speed * delta, -38, 38);
      rover.animate(speed, turn, delta);
      pivot.rotation.y = heading;
      terrain.position.set(-rx, -heightAt(rx, rz), -rz);
      driveCmd *= 0.85; steerCmd *= 0.85;
    },
  };
}