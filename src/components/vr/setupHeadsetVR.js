import { Group } from 'three';
import VRInteraction from '@/components/vr/VRInteraction';

export default function setupHeadsetVR(renderer, scene, camera, getOptions = () => ({})) {
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local');
  const rig = new Group();
  scene.add(rig);
  const connected = event => { event.target.userData.source = event.data; };
  const controllers = [0, 1].map(index => renderer.xr.getController(index));
  controllers.forEach(controller => controller.addEventListener('connected', connected));
  let saved = null, interaction = null;
  const start = () => {
    saved = { position: camera.position.clone(), quaternion: camera.quaternion.clone(), parent: camera.parent };
    const vrPos = getOptions().vrPosition;
    if (vrPos) rig.position.set(vrPos[0], vrPos[1], vrPos[2]);
    else rig.position.copy(saved.position);
    rig.quaternion.identity();
    rig.add(camera);
    camera.position.set(0, 0, 0);
    camera.quaternion.identity();
    camera.updateMatrixWorld(true);
    try { interaction = VRInteraction(renderer, rig, getOptions); } catch (e) { console.error('VR init error:', e); }
  };
  const end = () => {
    interaction?.dispose(); interaction = null;
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
  const cleanup = () => {
    const session = renderer.xr.getSession();
    if (session) session.end();
    renderer.xr.removeEventListener('sessionstart', start);
    renderer.xr.removeEventListener('sessionend', end);
    end();
    scene.remove(rig);
    controllers.forEach(controller => controller.removeEventListener('connected', connected));
  };
  cleanup.update = () => { if (renderer.xr.isPresenting) try { interaction?.update(); } catch (e) { console.error('VR frame error:', e); } };
  return cleanup;
}