import * as THREE from 'three';
import VRPanel from '@/components/vr/VRPanel';
import VRMotion from '@/components/vr/VRMotion';
import VRMenu from '@/components/vr/VRMenu';
import VRMap from '@/components/vr/VRMap';

export default function VRInteraction(renderer, rig, getOptions) {
  const map = getOptions().target ? VRMap(rig, getOptions) : null;
  const optionsForView = () => ({ ...getOptions(), map: map?.visible ? map : null, switchView: map ? () => map.toggle() : null });
  const panel = VRPanel(), motion = VRMotion(rig, optionsForView);
  const menu = VRMenu(panel, motion, optionsForView, () => renderer.xr.getSession()?.end());
  rig.add(panel.mesh);
  const raycaster = new THREE.Raycaster(), rotation = new THREE.Matrix4();
  const clock = new THREE.Clock();
  const cast = controller => {
    rotation.extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(rotation);
    const panelHit = raycaster.intersectObject(panel.mesh, false)[0];
    if (panelHit) return panelHit;
    const options = getOptions();
    return raycaster.intersectObjects(map?.visible ? map.pickables : [...(options.pickables || []), ...(options.target ? [options.target] : [])], false)[0];
  };
  const controllers = [0, 1].map(index => {
    const controller = renderer.xr.getController(index);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0x3c83f6 }));
    line.scale.z = 5; controller.add(line); rig.add(controller);
    const handlers = {
      connected: event => { controller.userData.source = event.data; },
      disconnected: () => { controller.userData.source = null; controller.userData.dragging = false; },
      squeezestart: () => { controller.userData.dragging = true; },
      squeezeend: () => { controller.userData.dragging = false; },
      selectstart: () => {
        rig.updateWorldMatrix(true, true);
        const hit = cast(controller);
        if (hit?.object === panel.mesh) panel.select(hit.uv);
        else if (hit) { const item = hit.object.userData.planet || hit.object.userData; if (item.id || item.name) menu.pick(item); }
      },
    };
    Object.entries(handlers).forEach(([event, handler]) => controller.addEventListener(event, handler));
    return { controller, line, handlers };
  });
  return {
    update() {
      const delta = Math.min(clock.getDelta(), 0.05);
      controllers.forEach(({ controller }) => motion.update(controller, delta));
      map?.update(); getOptions().target?.updateWorldMatrix(true, true);
      rig.updateWorldMatrix(true, true);
      controllers.forEach(({ controller, line }) => { line.scale.z = cast(controller)?.distance || 5; });
      menu.refresh();
    },
    dispose() {
      controllers.forEach(({ controller, line, handlers }) => { Object.entries(handlers).forEach(([event, handler]) => controller.removeEventListener(event, handler)); controller.remove(line); rig.remove(controller); line.geometry.dispose(); line.material.dispose(); controller.userData.dragging = false; });
      rig.remove(panel.mesh); panel.dispose(); map?.dispose();
    },
  };
}