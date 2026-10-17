import * as THREE from 'three';

export default function VRPointer(renderer, rig, panel, quickNav, getOptions, getMap, onTrigger) {
  const raycaster = new THREE.Raycaster(), rotation = new THREE.Matrix4(), worldPos = new THREE.Vector3();
  const resolveItem = obj => { let cur = obj; while (cur && !cur.userData?.id && !cur.userData?.name && !cur.userData?.planet) cur = cur.parent; return cur ? (cur.userData.planet || cur.userData) : null; };
  const syncController = (controller, source, frame) => {
    try {
      const refSpace = renderer.xr.getReferenceSpace(), space = source?.targetRaySpace || source?.gripSpace;
      const pose = frame && refSpace && space ? frame.getPose(space, refSpace) : null;
      if (!pose) return false;
      controller.matrix.fromArray(pose.transform.matrix);
      controller.matrix.decompose(controller.position, controller.rotation, controller.scale);
      controller.visible = true; controller.userData.source = source;
      return true;
    } catch { return false; }
  };
  const cast = controller => {
    rig.parent?.updateMatrixWorld(true); rig.updateWorldMatrix(true, true);
    rotation.extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(rotation).normalize();
    const quickHit = quickNav ? raycaster.intersectObject(quickNav.mesh, false)[0] : null;
    if (quickHit && quickNav.containsUv(quickHit.uv)) return { object: quickNav.mesh, uv: quickHit.uv, distance: quickHit.distance };
    const panelHit = raycaster.intersectObject(panel.mesh, false)[0];
    if (panelHit) return { object: panel.mesh, uv: panelHit.uv, distance: panelHit.distance };
    const map = getMap(), options = getOptions(), pickables = map?.visible ? map.pickables : (options.pickables || []);
    const hit = raycaster.intersectObjects(pickables, true)[0];
    if (hit) return { object: hit.object, distance: hit.distance, item: resolveItem(hit.object) };
    let best = null, bestAngle = 0.065;
    pickables.forEach(mesh => {
      mesh.getWorldPosition(worldPos);
      const dist = worldPos.clone().sub(raycaster.ray.origin).dot(raycaster.ray.direction);
      const angle = dist > 0.2 ? raycaster.ray.distanceToPoint(worldPos) / dist : 1;
      if (angle < bestAngle) { bestAngle = angle; best = { object: mesh, distance: dist, item: resolveItem(mesh) }; }
    });
    if (best) return best;
    const targetHit = !map?.visible && options.target ? raycaster.intersectObject(options.target, true)[0] : null;
    return targetHit ? { object: targetHit.object, distance: targetHit.distance, item: resolveItem(targetHit.object) } : null;
  };
  const fire = (controller, source, frame) => {
    if (performance.now() - (controller.userData.lastSelect || 0) < 150) return;
    controller.userData.lastSelect = performance.now();
    syncController(controller, source, frame);
    onTrigger(cast(controller));
  };
  const controllers = [0, 1].map(index => {
    const controller = renderer.xr.getController(index);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0x3c83f6, depthTest: false, depthWrite: false, transparent: true, opacity: 0.95 }));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8, depthTest: false, depthWrite: false }));
    line.renderOrder = 101; dot.renderOrder = 102; line.scale.z = 20; dot.position.z = -1.8;
    controller.visible = index === 0; controller.add(line, dot); rig.add(controller);
    const handlers = {
      connected: e => { controller.userData.source = e.data; controller.visible = true; },
      disconnected: () => { controller.userData.source = null; controller.userData.dragging = false; },
      squeezestart: () => { controller.userData.dragging = true; },
      squeezeend: () => { controller.userData.dragging = false; },
      selectstart: e => fire(controller, e?.data || controller.userData.source, renderer.xr.getFrame()),
    };
    Object.entries(handlers).forEach(([ev, fn]) => controller.addEventListener(ev, fn));
    return { controller, line, dot, handlers };
  });
  const onSessionSelect = e => {
    const entry = controllers.find(c => c.controller.userData.source === e.inputSource) || controllers[0];
    fire(entry.controller, e.inputSource, e.frame);
  };
  const session = renderer.xr.getSession();
  session?.addEventListener('selectstart', onSessionSelect);
  return {
    controllers,
    update() {
      const frame = renderer.xr.getFrame(), sources = Array.from(renderer.xr.getSession()?.inputSources || []);
      let panelUv = null, quickUv = null;
      controllers.forEach(({ controller, line, dot }, i) => {
        const source = sources[i] || controller.userData.source;
        if (!syncController(controller, source, frame) && i === 0 && !sources.length) {
          const cam = renderer.xr.getCamera();
          controller.position.copy(cam.position); controller.quaternion.copy(cam.quaternion); controller.updateMatrix(); controller.visible = true;
        }
        const btnPressed = !!source?.gamepad?.buttons?.[0]?.pressed;
        if (btnPressed && !controller.userData.btnPressed) fire(controller, source, frame);
        controller.userData.btnPressed = btnPressed;
        const hit = controller.visible ? cast(controller) : null;
        if (hit?.object === panel.mesh && !panelUv) panelUv = hit.uv;
        if (hit?.object === quickNav?.mesh && !quickUv) quickUv = hit.uv;
        const dist = hit?.distance || 20, active = !!(hit?.object === panel.mesh || hit?.object === quickNav?.mesh || hit?.item);
        line.scale.z = dist; line.material.color.setHex(active ? 0x38bdf8 : 0x3c83f6);
        dot.visible = controller.visible; dot.position.z = -dist; dot.scale.setScalar(Math.max(0.8, dist * 0.4));
        dot.material.color.setHex(active ? 0x38bdf8 : 0x3c83f6);
      });
      panel.hover(panelUv); quickNav?.hover(quickUv);
    },
    dispose() {
      session?.removeEventListener('selectstart', onSessionSelect);
      controllers.forEach(({ controller, line, dot, handlers }) => {
        Object.entries(handlers).forEach(([ev, fn]) => controller.removeEventListener(ev, fn));
        controller.remove(line, dot); rig.remove(controller);
        line.geometry.dispose(); line.material.dispose(); dot.geometry.dispose(); dot.material.dispose();
      });
    },
  };
}