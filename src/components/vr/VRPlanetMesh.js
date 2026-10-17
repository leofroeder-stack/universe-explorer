import * as THREE from 'three';
import { VR_WORLDS } from '@/components/vr/VRDestinationData';

export default function VRPlanetMesh(key, radius, status) {
  const info = VR_WORLDS[key];
  const material = key === 'sun'
    ? new THREE.MeshBasicMaterial({ color: info.color })
    : new THREE.MeshStandardMaterial({ color: info.color, roughness: info.roughness ?? 0.85 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 40), material);
  mesh.userData = { id: key, name: info.name, description: info.description, destination: key };
  if (key !== 'sun') {
    status.pending++;
    new THREE.TextureLoader().load(`/textures/${key}.jpg`, texture => {
      status.pending--;
      if (material.userData.disposed) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
      material.map = texture; material.color.set(0xffffff); material.needsUpdate = true;
    }, undefined, () => { status.pending--; status.failed.push(info.name); });
  }
  if (key === 'saturn' || key === 'uranus') {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 1.3, radius * (key === 'saturn' ? 2.2 : 1.6), 96), new THREE.MeshStandardMaterial({ color: info.color, side: THREE.DoubleSide, transparent: true, opacity: 0.65 }));
    ring.rotation.x = Math.PI / 2.4; mesh.add(ring);
  }
  return mesh;
}

export function disposeVRWorld(group) {
  group.traverse(object => {
    object.geometry?.dispose();
    const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
    materials.forEach(material => { material.userData.disposed = true; material.map?.dispose(); material.dispose(); });
  });
  group.removeFromParent();
}