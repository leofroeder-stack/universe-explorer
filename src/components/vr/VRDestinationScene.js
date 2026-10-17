import * as THREE from 'three';
import VRPlanetMesh from '@/components/vr/VRPlanetMesh';
import { VR_WORLDS, destinationItems } from '@/components/vr/VRDestinationData';

export default function VRDestinationScene(key) {
  const group = new THREE.Group(), status = { pending: 0, failed: [] }, pickables = [];
  group.add(new THREE.AmbientLight(0xffffff, 1.5));
  const light = new THREE.DirectionalLight(0xfff4e0, 3); light.position.set(5, 3, 6); group.add(light);
  let paused = false, target = null;
  const orbits = [], solar = key === 'solar-system';
  const items = solar ? Object.entries(VR_WORLDS).filter(([id]) => id !== 'moon').map(([id, info]) => ({ id, name: info.name, description: info.description, destination: id })) : destinationItems(key);
  if (solar) {
    group.rotation.x = 0.42;
    const sun = VRPlanetMesh('sun', 0.9, status);
    group.add(sun); pickables.push(sun);
    Object.keys(VR_WORLDS).filter(id => !['sun', 'moon'].includes(id)).forEach((id, index) => {
      const distance = [2.1, 3.2, 4.3, 5.5, 7.3, 9.5, 11.4, 13.2][index];
      const mesh = VRPlanetMesh(id, [0.22, 0.3, 0.32, 0.26, 0.72, 0.62, 0.45, 0.44][index], status);
      const points = Array.from({ length: 97 }, (_, i) => new THREE.Vector3(Math.cos(i / 96 * Math.PI * 2) * distance, 0, Math.sin(i / 96 * Math.PI * 2) * distance));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x445566, transparent: true, opacity: 0.5 })));
      group.add(mesh); pickables.push(mesh); orbits.push({ mesh, distance, angle: index * 0.8, speed: 0.18 / (index + 1) });
    });
  } else {
    target = VRPlanetMesh(key, 1, status); group.add(target);
    items.forEach(item => {
      const lat = item.lat * Math.PI / 180, lng = (-item.lng + 90) * Math.PI / 180;
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), new THREE.MeshBasicMaterial({ color: item.type === 'events' ? 0xa855f7 : item.type === 'objects' ? 0xf59e0b : 0x3b82f6 }));
      marker.position.set(Math.cos(lat) * Math.cos(lng), Math.sin(lat), Math.cos(lat) * Math.sin(lng)).multiplyScalar(1.015);
      marker.userData = item; target.add(marker); pickables.push(marker);
    });
  }
  return {
    group,
    options: () => ({ title: `${solar ? 'Solar System' : VR_WORLDS[key].name}${status.pending ? ' · Loading' : ''}`, target, pickables, items, itemsLabel: solar ? 'Planets' : 'Locations', minDistance: solar ? 3 : 1.5, maxDistance: solar ? 80 : 8,
      actions: [...(solar ? [{ label: paused ? 'Resume orbits' : 'Pause orbits', onSelect: () => { paused = !paused; } }] : []), ...status.failed.map(name => ({ label: `${name}: texture unavailable` }))] }),
    update(delta) {
      orbits.forEach(orbit => {
        if (!paused) orbit.angle += delta * orbit.speed;
        orbit.mesh.position.set(Math.cos(orbit.angle) * orbit.distance, 0, Math.sin(orbit.angle) * orbit.distance);
        orbit.mesh.rotation.y += delta * 0.4;
      });
    },
  };
}