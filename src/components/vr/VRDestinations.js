import * as THREE from 'three';
import VRDestinationScene from '@/components/vr/VRDestinationScene';
import { VR_DESTINATIONS } from '@/components/vr/VRDestinationData';
import { disposeVRWorld } from '@/components/vr/VRPlanetMesh';

export default function VRDestinations(scene, rig, getOptions) {
  let world = null, hidden = [], pose = null;
  const restore = () => {
    if (world) disposeVRWorld(world.group);
    world = null;
    hidden.forEach(([object, visible]) => { object.visible = visible; }); hidden = [];
    if (pose) { rig.position.copy(pose.position); rig.quaternion.copy(pose.quaternion); pose = null; }
  };
  return {
    destinations: VR_DESTINATIONS,
    options: () => world ? world.options() : getOptions(),
    select(key) {
      if (!VR_DESTINATIONS.some(destination => destination.key === key)) return;
      restore();
      if (key === 'original') return;
      pose = { position: rig.position.clone(), quaternion: rig.quaternion.clone() };
      hidden = scene.children.filter(object => object !== rig).map(object => [object, object.visible]);
      hidden.forEach(([object]) => { object.visible = false; });
      world = VRDestinationScene(key); scene.add(world.group); world.update(0);
      const view = new THREE.PerspectiveCamera();
      view.position.set(0, key === 'solar-system' ? 10 : 0, key === 'solar-system' ? 19 : 3.2);
      view.lookAt(0, 0, 0); rig.position.copy(view.position); rig.quaternion.copy(view.quaternion);
      rig.updateWorldMatrix(true, true);
    },
    update(delta) { world?.update(delta); world?.group.updateMatrixWorld(true); },
    dispose: restore,
  };
}