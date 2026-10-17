import VRPanel from '@/components/vr/VRPanel';
import VRMotion from '@/components/vr/VRMotion';
import VRMenu from '@/components/vr/VRMenu';
import VRMap from '@/components/vr/VRMap';
import VRDestinations from '@/components/vr/VRDestinations';
import VRPointer from '@/components/vr/VRPointer';
import VRQuickNav from '@/components/vr/VRQuickNav';
import VRVoiceGesture from '@/components/vr/VRVoiceGesture';
import { Clock } from 'three';

export default function VRInteraction(renderer, rig, getOptions) {
  const destinations = VRDestinations(rig.parent, rig, getOptions);
  const currentOptions = destinations.options;
  const createMap = () => currentOptions().target && currentOptions().target.userData.destination !== 'sun' ? VRMap(rig, currentOptions) : null;
  let map = createMap(), pointer = null, voiceGesture = null;
  const selectDestination = key => {
    map?.dispose(); map = null; destinations.select(key); map = createMap(); motion.rebase();
    quickNav.setState({ activeKey: key });
    pointer?.controllers.forEach(({ controller }) => { controller.userData.previous = null; controller.userData.dragging = false; });
  };
  const optionsForView = () => ({ ...currentOptions(), destinations: destinations.destinations, selectDestination, map: map?.visible ? map : null, switchView: map ? () => map.toggle() : null });
  const panel = VRPanel(), motion = VRMotion(rig, optionsForView);
  const quickNav = VRQuickNav(selectDestination, () => voiceGesture?.toggleVoice());
  voiceGesture = VRVoiceGesture(renderer, quickNav, selectDestination);
  const menu = VRMenu(panel, motion, optionsForView, () => renderer.xr.getSession()?.end());
  rig.add(panel.mesh, quickNav.mesh);
  const clock = new Clock();
  pointer = VRPointer(renderer, rig, panel, quickNav, currentOptions, () => map, hit => {
    if (hit?.object === quickNav.mesh) { quickNav.select(hit.uv); menu.refresh(); return; }
    if (hit?.object === panel.mesh) { panel.select(hit.uv); menu.refresh(); return; }
    if (!hit?.item) return;
    const item = hit.item, dest = item.destination || item.name?.toLowerCase();
    if (!currentOptions().target && destinations.destinations.some(d => d.key === dest)) {
      currentOptions().onSelect?.(item);
      selectDestination(dest);
      menu.refresh();
      return;
    }
    if (item.id || item.name) { menu.pick(item); menu.refresh(); }
  });
  return {
    update() {
      const delta = Math.min(clock.getDelta(), 0.05);
      pointer.controllers.forEach(({ controller }) => motion.update(controller, delta));
      voiceGesture.update(pointer.controllers, delta);
      destinations.update(delta);
      map?.update();
      pointer.update();
      menu.refresh();
    },
    dispose() {
      voiceGesture.dispose(); pointer.dispose();
      rig.remove(panel.mesh, quickNav.mesh); panel.dispose(); quickNav.dispose(); map?.dispose(); destinations.dispose();
    },
  };
}