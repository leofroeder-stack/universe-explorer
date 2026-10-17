import * as THREE from 'three';

export default function VRMotion(rig, getOptions) {
  let origin = rig.position.clone(), orientation = rig.quaternion.clone();
  let targetRotation = getOptions().target?.rotation.clone();
  const up = new THREE.Vector3(0, 1, 0);
  const rotate = (x, y = 0) => {
    if (getOptions().map) { getOptions().map.pan(x, y); return; }
    const target = getOptions().target;
    if (target) {
      target.rotation.y += x;
      target.rotation.x = THREE.MathUtils.clamp(target.rotation.x + y, -Math.PI / 2, Math.PI / 2);
    } else {
      const turn = new THREE.Quaternion().setFromAxisAngle(up, x);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(rig.quaternion);
      turn.premultiply(new THREE.Quaternion().setFromAxisAngle(right, y));
      rig.position.applyQuaternion(turn); rig.quaternion.premultiply(turn);
    }
  };
  const pan = (x, y) => {
    if (getOptions().map) { getOptions().map.pan(x, y); return; }
    const speed = Math.max(0.3, rig.position.length() * 0.2);
    rig.position.add(new THREE.Vector3(x, y, 0).applyQuaternion(rig.quaternion).multiplyScalar(speed));
  };
  const zoom = amount => {
    if (getOptions().map) { getOptions().map.zoom(amount); return; }
    const { target, minDistance = 1.5, maxDistance = 8 } = getOptions();
    const center = target ? target.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3();
    const offset = rig.position.clone().sub(center);
    const distance = THREE.MathUtils.clamp(offset.length() * Math.exp(amount), minDistance, maxDistance);
    rig.position.copy(center).add(offset.normalize().multiplyScalar(distance));
  };
  return {
    rotate, pan, zoom,
    rebase() { origin = rig.position.clone(); orientation = rig.quaternion.clone(); targetRotation = getOptions().target?.rotation.clone(); },
    reset() {
      getOptions().map?.reset();
      rig.position.copy(origin); rig.quaternion.copy(orientation);
      if (targetRotation && getOptions().target) getOptions().target.rotation.copy(targetRotation);
    },
    update(controller, delta) {
      const source = controller.userData.source;
      const axes = source?.gamepad?.axes || [];
      const x = Math.abs(axes[axes.length - 2] || 0) > 0.15 ? axes[axes.length - 2] : 0;
      const y = Math.abs(axes[axes.length - 1] || 0) > 0.15 ? axes[axes.length - 1] : 0;
      if (getOptions().onDrive && (x || y)) { getOptions().onDrive(-y, x, delta); return; }
      if (source?.handedness === 'left') pan(x * delta, -y * delta);
      else { rotate(-x * delta); zoom(y * delta); }
      if (controller.userData.dragging) {
        const previous = controller.userData.previous;
        if (previous) rotate((controller.position.x - previous.x) * 3, (controller.position.y - previous.y) * 3);
        controller.userData.previous = controller.position.clone();
      } else controller.userData.previous = null;
    },
  };
}