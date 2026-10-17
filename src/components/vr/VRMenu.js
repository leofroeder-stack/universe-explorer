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
    if (screen === 'home') {
      rows = [
        row('Explore planets & Solar System', () => open('destinations')),
        row('Lunar Rover Explorer (Drive on Moon)', () => { options.selectDestination('lunar-rover'); back(); }),
        ...(options.target ? [row('Solar System overview', () => { options.selectDestination('solar-system'); back(); })] : []),
        row('View controls', () => open('controls')),
        ...(options.switchView ? [row(options.map ? 'Switch to 3D globe' : 'Switch to 2D map', options.switchView)] : []),
        row(options.itemsLabel || 'Locations', () => open('items')),
        ...(options.actions?.length ? [row('Layers and options', () => open('actions'))] : []),
        row('Controller help', () => open('help')),
        row('Exit VR', exit),
      ];
    } else if (screen === 'destinations') {
      title = 'Select Planet or Solar System';
      rows = (options.destinations || []).map(destination => row(destination.label, () => { options.selectDestination(destination.key); back(); }));
    } else if (controls[screen]) {
      title = 'View controls'; rows = controls[screen].map(([label, action]) => row(label, action));
    } else if (screen === 'help') {
      rows = ['Point a controller and press trigger.', 'Point at any planet or menu button.', 'Hold squeeze and move to rotate.', 'Left thumbstick pans the view.', 'Right thumbstick turns and zooms.', 'Use Reset view to return to start.', 'Headset system menu can also exit VR.'].map(label => row(label));
    } else if (screen === 'items') {
      title = options.itemsLabel || 'Locations';
      rows = (options.items || []).map(item => row(item.name || item.title || item.id, () => {
        const dest = item.destination || item.name?.toLowerCase();
        if (!options.target && options.destinations?.some(d => d.key === dest)) { options.onSelect?.(item); options.selectDestination(dest); back(); }
        else pick(item);
      }));
      if (!rows.length) rows = [row('No locations match the active layers.')];
    } else if (screen === 'actions') {
      title = 'Layers and options'; rows = (options.actions || []).map(action => row(action.label, action.onSelect));
    } else {
      title = selected?.name || selected?.title || 'Details';
      const summary = [selected?.description, ...(selected?.facts || []), selected?.type && `Type: ${selected.type}`, selected?.date && `Date: ${selected.date}`, selected?.agency && `Agency: ${selected.agency}`].filter(Boolean).join(' • ');
      rows = ((summary || 'Selected item').match(/.{1,48}(?:\s|$)|\S{1,48}/g) || []).slice(0, 7).map(label => row(label.trim()));
      const destination = selected?.destination || selected?.name?.toLowerCase();
      if (options.destinations?.some(entry => entry.key === destination)) rows.unshift(row(`Explore ${selected.name}`, () => { options.selectDestination(destination); back(); }));
    }
    const maxPerPage = 9;
    const pages = Math.max(1, Math.ceil(rows.length / maxPerPage)); page = Math.min(page, pages - 1);
    if (rows.length > maxPerPage) {
      rows = rows.slice(page * maxPerPage, page * maxPerPage + maxPerPage);
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