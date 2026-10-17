import * as THREE from 'three';

export default function VRLunarRoverModel() {
  const root = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xd4d8de, metalness: 0.65, roughness: 0.35 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.7, roughness: 0.3 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.72), metal);
  chassis.position.y = 0.14; root.add(chassis);
  const batteryBay = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.24), gold);
  batteryBay.position.set(0, 0.2, -0.18); root.add(batteryBay);
  [-0.11, 0.11].forEach(x => {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.14, 0.14), dark);
    seat.position.set(x, 0.23, 0.08); root.add(seat);
  });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.32, 8), metal);
  mast.position.set(-0.14, 0.32, -0.15); root.add(mast);
  const dish = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.06, 16, 1, true), gold);
  dish.rotation.x = Math.PI * 0.75; dish.position.set(-0.14, 0.48, -0.15); root.add(dish);
  const camHead = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.09), metal);
  camHead.position.set(0.14, 0.32, -0.22); root.add(camHead);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
  lamp.position.set(0, 0.25, -0.31); root.add(lamp);
  const wheels = [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]].map(([x, z], i) => {
    const pivot = new THREE.Group(); pivot.position.set(x, 0.11, z);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 18), dark);
    tire.rotation.z = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.075, 12), gold);
    hub.rotation.z = Math.PI / 2; tire.add(hub);
    const fender = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.18), gold);
    fender.position.set(0, 0.12, 0); pivot.add(tire, fender); root.add(pivot);
    return { pivot, tire, front: i < 2 };
  });
  return {
    mesh: root,
    animate(speed, steer, delta) {
      wheels.forEach(w => {
        w.tire.rotation.x -= speed * delta * 3.5;
        if (w.front) w.pivot.rotation.y = -steer * 0.45;
      });
    },
  };
}