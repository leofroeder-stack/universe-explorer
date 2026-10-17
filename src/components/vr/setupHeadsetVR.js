import { Group } from 'three';

export default function setupHeadsetVR(renderer, scene, camera) {
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local');
  const rig = new Group();
  scene.add(rig);
  let saved = null;
  const start = () => {
    saved = { position: camera.position.clone(), quaternion: camera.quaternion.clone(), parent: camera.parent };
    rig.position.copy(saved.position);
    rig.quaternion.copy(saved.quaternion);
    rig.add(camera);
    camera.position.set(0, 0, 0);
    camera.quaternion.identity();
    camera.updateMatrixWorld(true);
  };
  const end = () => {
    if (!saved) return;
    rig.remove(camera);
    if (saved.parent) saved.parent.add(camera);
    camera.position.copy(saved.position);
    camera.quaternion.copy(saved.quaternion);
    camera.updateMatrixWorld(true);
    saved = null;
  };
  renderer.xr.addEventListener('sessionstart', start);
  renderer.xr.addEventListener('sessionend', end);
  return () => {
    const session = renderer.xr.getSession();
    if (session) session.end();
    renderer.xr.removeEventListener('sessionstart', start);
    renderer.xr.removeEventListener('sessionend', end);
    end();
    scene.remove(rig);
  };
}