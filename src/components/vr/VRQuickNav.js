import * as THREE from 'three';

const ITEMS = [
  { key: 'solar-system', label: 'Solar System', hint: 'Voice: "Solar System" • 1 Finger / X+Left' },
  { key: 'moon', label: 'Moon', hint: 'Voice: "Moon" • 2 Fingers / X+Up' },
  { key: 'mars', label: 'Mars', hint: 'Voice: "Mars" • 3 Fingers / X+Right' },
  { key: 'lunar-rover', label: 'Lunar Rover Explorer', hint: 'Voice: "Rover" • 4 Fingers / Drive on Moon' },
];

export default function VRQuickNav(onSelectDestination, onToggleVoice) {
  const canvas = document.createElement('canvas');
  canvas.width = 768; canvas.height = 760;
  const ctx = canvas.getContext('2d'), texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.77), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, toneMapped: false, depthTest: false, depthWrite: false }));
  mesh.renderOrder = 100; mesh.position.set(-0.78, -0.15, -1.65); mesh.rotation.y = 0.25;
  const styles = window.getComputedStyle(document.documentElement);
  const color = name => `hsl(${styles.getPropertyValue(name).trim()})`;
  let hidden = false, activeKey = 'moon', voiceOn = false, statusText = 'Press X • Voice or Hand Gesture', hovered = null;
  const hitAt = uv => {
    if (!uv) return null;
    const x = uv.x * 768, y = (1 - uv.y) * 760;
    if (y >= 18 && y <= 84) {
      if (x >= 430 && x <= 580) return 'show';
      if (x >= 592 && x <= 742) return 'hide';
    }
    if (hidden) return (y >= 18 && y <= 84 && x >= 24 && x <= 580) ? 'show' : null;
    if (x < 24 || x > 744) return null;
    const idx = Math.floor((y - 100) / 96);
    if (y >= 100 && idx >= 0 && idx < ITEMS.length && (y - 100) % 96 <= 84) return ITEMS[idx].key;
    if (y >= 492 && y <= 558) return 'voice';
    return null;
  };
  const drawBtn = (x, y, w, h, label, sub, isHot, isCurrent) => {
    ctx.fillStyle = isHot ? color('--primary') : isCurrent ? color('--accent') : color('--secondary');
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = color('--primary'); ctx.lineWidth = isHot || isCurrent ? 4 : 2; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = isHot ? color('--primary-foreground') : color('--foreground');
    ctx.font = 'bold 26px sans-serif'; ctx.fillText(label, x + 20, y + (sub ? 34 : h / 2 + 9));
    if (sub) { ctx.fillStyle = isHot ? color('--primary-foreground') : color('--muted-foreground'); ctx.font = '19px sans-serif'; ctx.fillText(sub, x + 20, y + 66); }
  };
  const render = () => {
    ctx.clearRect(0, 0, 768, 760);
    ctx.fillStyle = color('--card'); ctx.fillRect(10, 10, 748, hidden ? 84 : 740);
    ctx.strokeStyle = color('--primary'); ctx.lineWidth = 4; ctx.strokeRect(10, 10, 748, hidden ? 84 : 740);
    ctx.fillStyle = color('--foreground'); ctx.font = 'bold 28px sans-serif';
    ctx.fillText(hidden ? 'Quick Nav (X)' : 'Quick Nav [X]', 28, 60);
    drawBtn(430, 20, 150, 62, 'Show', null, hovered === 'show', !hidden);
    drawBtn(592, 20, 150, 62, 'Hide', null, hovered === 'hide', hidden);
    if (!hidden) {
      ITEMS.forEach((item, i) => drawBtn(24, 100 + i * 96, 720, 84, item.label, item.hint, hovered === item.key, activeKey === item.key));
      drawBtn(24, 492, 720, 66, voiceOn ? 'Voice Commands: ON (Solar System / Moon / Mars / Rover)' : 'Voice Commands: OFF (Click to enable)', null, hovered === 'voice', voiceOn);
      ctx.fillStyle = color('--muted-foreground'); ctx.font = '21px sans-serif';
      ctx.fillText(statusText.slice(0, 52), 28, 602);
      ctx.fillText('Hand: 1=Solar • 2=Moon • 3=Mars • 4=Rover', 28, 640);
      ctx.fillText('Controller: Press X to Show/Hide • X+Tilt to switch', 28, 678);
    }
    texture.needsUpdate = true;
  };
  render();
  return {
    mesh,
    containsUv: uv => !!hitAt(uv) || !hidden,
    setState(patch) {
      if (patch.hidden !== undefined) hidden = patch.hidden;
      if (patch.activeKey) activeKey = patch.activeKey;
      if (patch.voiceOn !== undefined) voiceOn = patch.voiceOn;
      if (patch.statusText) statusText = patch.statusText;
      render();
    },
    toggleHidden() { hidden = !hidden; render(); },
    hover(uv) { const next = hitAt(uv); if (next !== hovered) { hovered = next; render(); } },
    select(uv) {
      const id = hitAt(uv);
      if (id === 'show') { hidden = false; render(); }
      else if (id === 'hide') { hidden = true; render(); }
      else if (id === 'voice') onToggleVoice();
      else if (id) { activeKey = id; onSelectDestination(id); render(); }
    },
    dispose() { mesh.geometry.dispose(); mesh.material.dispose(); texture.dispose(); },
  };
}