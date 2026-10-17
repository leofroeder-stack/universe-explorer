import { VR_DESTINATIONS } from '@/components/vr/VRDestinationData';
import VRDestinationScene from '@/components/vr/VRDestinationScene';
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
      const savedPose = pose || { position: rig.position.clone(), quaternion: rig.quaternion.clone() };
      const savedHidden = hidden.length ? hidden : scene.children.filter(object => object !== rig && !object.isPoints).map(object => [object, object.visible]);
      if (world) disposeVRWorld(world.group);
      world = null;
      if (key === 'original') {
        savedHidden.forEach(([object, visible]) => { object.visible = visible; });
        hidden = [];
        rig.position.copy(savedPose.position); rig.quaternion.copy(savedPose.quaternion);
        pose = null;
        rig.updateWorldMatrix(true, true);
        return;
      }
      pose = savedPose;
      hidden = savedHidden;
      hidden.forEach(([object]) => { object.visible = false; });
      world = VRDestinationScene(key);
      scene.add(world.group);
      world.update(0);
      world.group.updateMatrixWorld(true);
      rig.position.set(0, 0, key === 'solar-system' ? 16 : 3.2);
      rig.quaternion.identity();
      rig.updateWorldMatrix(true, true);
    },
    update(delta) { world?.update(delta); world?.group.updateMatrixWorld(true); },
    dispose: restore,
  };
}