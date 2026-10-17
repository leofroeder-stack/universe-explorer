export default function VRMenu(panel, motion, getOptions, exit) {
  let screen = 'home', page = 0, selected = null, signature = '';
  const row = (label, onSelect) => ({ label, onSelect });
  const open = (next, item = null) => { screen = next; selected = item; page = 0; signature = ''; };
  const back = () => open('home');
  const controls = {
    controls: [['Zoom', () => open('zoom')], ['Rotate', () => open('rotate')], ['Pan', () => open('pan')], ['Reset view', motion.reset]],
    zoom: [['Zoom in', () => motion.zoom(-0.2)], ['Zoom out', () => motion.zoom(0.2)]],
    rotate: [['Rotate left', () => motion.rotate(-0.25)], ['Rotate right', () => motion.rotate(0.25)], ['Tilt up', () => motion.rotate(0, -0.2)], ['Tilt down', () => motion.rotate(0, 0.2)]],
    pan: [['Pan left', () => motion.pan(-0.3, 0)], ['Pan right', () => motion.pan(0.3, 0)], ['Pan up', () => motion.pan(0, 0.3)], ['Pan down', () => motion.pan(0, -0.3)]],
  };
  const pick = item => { getOptions().onSelect?.(item); open('details', item); };
  const refresh = () => {
    const options = getOptions();
    let title = options.title || 'Explorer', rows;
    if (screen === 'home') rows = [row('Explore planets & Solar System', () => open('destinations')), row('View controls', () => open('controls')), ...(options.switchView ? [row(options.map ? 'Switch to 3D globe' : 'Switch to 2D map', options.switchView)] : []), row(options.itemsLabel || 'Locations', () => open('items')), ...(options.actions?.length ? [row('Layers and options', () => open('actions'))] : []), row('Controller help', () => open('help')), row('Exit VR', exit)];
    else if (screen === 'destinations') { title = 'Choose a destination'; rows = (options.destinations || []).map(destination => row(destination.label, () => { options.selectDestination(destination.key); back(); })); }
    else if (controls[screen]) { title = 'View controls'; rows = controls[screen].map(([label, action]) => row(label, action)); }
    else if (screen === 'help') rows = ['Point a controller and press its trigger.', 'Select markers or menu entries.', 'Hold squeeze and move to rotate.', 'Left thumbstick pans the view.', 'Right thumbstick turns and zooms.', 'Use Reset view to return to your start.', 'Headset system menu can also exit VR.'].map(label => row(label));
    else if (screen === 'items') {
      title = options.itemsLabel || 'Locations';
      rows = (options.items || []).map(item => row(item.name || item.title || item.id, () => pick(item)));
      if (!rows.length) rows = [row('No locations match the active layers.')];
    } else if (screen === 'actions') { title = 'Layers and options'; rows = (options.actions || []).map(action => row(action.label, action.onSelect)); }
    else {
      title = selected?.name || selected?.title || 'Details';
      const text = Object.entries(selected || {}).filter(([key, value]) => key !== 'id' && value != null).map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`).join('  ');
      rows = (text.match(/.{1,48}(?:\s|$)|\S{1,48}/g) || []).map(label => row(label.trim()));
      const destination = selected?.destination || selected?.name?.toLowerCase();
      if (options.destinations?.some(entry => entry.key === destination)) rows.unshift(row(`Explore ${selected.name}`, () => { options.selectDestination(destination); back(); }));
    }
    const pages = Math.max(1, Math.ceil(rows.length / 8)); page = Math.min(page, pages - 1);
    if (rows.length > 8) {
      rows = rows.slice(page * 8, page * 8 + 8);
      if (page > 0) rows.push(row('Previous page', () => { page--; signature = ''; }));
      if (page < pages - 1) rows.push(row('Next page', () => { page++; signature = ''; }));
      title += ` (${page + 1}/${pages})`;
    }
    if (screen !== 'home') rows.push(row('Back to menu', back));
    const next = JSON.stringify([title, rows.map(entry => entry.label)]);
    if (next !== signature) { panel.draw(title, rows); signature = next; }
  };
  return { refresh, pick };
}