import * as THREE from 'three';

export default function VRMap(rig, getOptions) {
  const group = new THREE.Group(); group.position.set(0, 0, -2.8); group.visible = false;
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.4), material);
  group.add(plane); rig.add(group);
  let signature = '', markers = [], originalVisibility = true;
  const clear = () => { markers.forEach(mesh => { group.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }); markers = []; };
  const reset = () => { group.position.set(0, 0, -2.8); group.scale.setScalar(1); };
  return {
    get visible() { return group.visible; },
    get pickables() { return markers; },
    toggle() {
      const target = getOptions().target;
      if (!group.visible) originalVisibility = target.visible;
      group.visible = !group.visible; target.visible = group.visible ? false : originalVisibility;
      reset();
    },
    pan(x, y) {
      const limit = 1.4 * group.scale.x;
      group.position.x = THREE.MathUtils.clamp(group.position.x + x, -limit, limit);
      group.position.y = THREE.MathUtils.clamp(group.position.y + y, -limit / 2, limit / 2);
    },
    zoom(amount) { group.scale.setScalar(THREE.MathUtils.clamp(group.scale.x * Math.exp(-amount), 0.7, 8)); },
    reset,
    update() {
      const options = getOptions(), texture = options.target?.material?.map;
      if (material.map !== texture) { material.map = texture || null; material.color.set(texture ? 0xffffff : 0x334466); material.needsUpdate = true; }
      const next = JSON.stringify((options.items || []).map(item => [item.id, item.lat, item.lng]));
      if (next !== signature) {
        clear(); signature = next;
        (options.items || []).filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lng)).forEach(item => {
          const source = options.pickables?.find(mesh => mesh.userData.id === item.id);
          const marker = new THREE.Mesh(new THREE.CircleGeometry(0.018, 16), new THREE.MeshBasicMaterial({ color: source?.material.color || 0x3c83f6 }));
          marker.position.set(item.lng / 360 * 2.8, item.lat / 180 * 1.4, 0.01);
          marker.userData = item; markers.push(marker); group.add(marker);
        });
      }
    },
    dispose() {
      if (group.visible && getOptions().target) getOptions().target.visible = originalVisibility;
      clear(); rig.remove(group); plane.geometry.dispose(); material.dispose();
    },
  };
}