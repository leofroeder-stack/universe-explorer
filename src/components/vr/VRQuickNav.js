import * as THREE from 'three';

const ITEMS = [
  { key: 'solar-system', label: 'Solar System', hint: 'Voice: "Solar System" • 1 Finger / X+Left' },
  { key: 'moon', label: 'Moon', hint: 'Voice: "Moon" • 2 Fingers / X+Up' },
  { key: 'mars', label: 'Mars', hint: 'Voice: "Mars" • 3 Fingers / X+Right' },
];

export default function VRQuickNav(onSelectDestination, onToggleVoice) {
  const canvas = document.createElement('canvas');
  canvas.width = 768; canvas.height = 680;
  const ctx = canvas.getContext('2d'), texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.69), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, toneMapped: false, depthTest: false, depthWrite: false }));
  mesh.renderOrder = 100; mesh.position.set(-0.78, -0.18, -1.65); mesh.rotation.y = 0.25;
  const styles = window.getComputedStyle(document.documentElement);
  const color = name => `hsl(${styles.getPropertyValue(name).trim()})`;
  let hidden = false, activeKey = 'moon', voiceOn = false, statusText = 'Press X • Voice or Hand Gesture', hovered = null;
  const hitAt = uv => {
    if (!uv) return null;
    const x = uv.x * 768, y = (1 - uv.y) * 680;
    if (y >= 18 && y <= 84) {
      if (x >= 430 && x <= 580) return 'show';
      if (x >= 592 && x <= 742) return 'hide';
    }
    if (hidden) return (y >= 18 && y <= 84 && x >= 24 && x <= 580) ? 'show' : null;
    if (x < 24 || x > 744) return null;
    if (y >= 104 && y <= 198) return 'solar-system';
    if (y >= 212 && y <= 306) return 'moon';
    if (y >= 320 && y <= 414) return 'mars';
    if (y >= 434 && y <= 504) return 'voice';
    return null;
  };
  const drawBtn = (x, y, w, h, label, sub, isHot, isCurrent) => {
    ctx.fillStyle = isHot ? color('--primary') : isCurrent ? color('--accent') : color('--secondary');
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = color('--primary'); ctx.lineWidth = isHot || isCurrent ? 4 : 2; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = isHot ? color('--primary-foreground') : color('--foreground');
    ctx.font = 'bold 28px sans-serif'; ctx.fillText(label, x + 20, y + (sub ? 38 : h / 2 + 10));
    if (sub) { ctx.fillStyle = isHot ? color('--primary-foreground') : color('--muted-foreground'); ctx.font = '20px sans-serif'; ctx.fillText(sub, x + 20, y + 72); }
  };
  const render = () => {
    ctx.clearRect(0, 0, 768, 680);
    ctx.fillStyle = color('--card'); ctx.fillRect(10, 10, 748, hidden ? 84 : 660);
    ctx.strokeStyle = color('--primary'); ctx.lineWidth = 4; ctx.strokeRect(10, 10, 748, hidden ? 84 : 660);
    ctx.fillStyle = color('--foreground'); ctx.font = 'bold 28px sans-serif';
    ctx.fillText(hidden ? 'Quick Nav (X)' : 'Quick Nav [X]', 28, 60);
    drawBtn(430, 20, 150, 62, 'Show', null, hovered === 'show', !hidden);
    drawBtn(592, 20, 150, 62, 'Hide', null, hovered === 'hide', hidden);
    if (!hidden) {
      ITEMS.forEach((item, i) => drawBtn(24, 104 + i * 108, 720, 94, item.label, item.hint, hovered === item.key, activeKey === item.key));
      drawBtn(24, 434, 720, 70, voiceOn ? 'Voice Commands: ON (Say Solar System / Moon / Mars)' : 'Voice Commands: OFF (Click to enable)', null, hovered === 'voice', voiceOn);
      ctx.fillStyle = color('--muted-foreground'); ctx.font = '22px sans-serif';
      ctx.fillText(statusText.slice(0, 52), 28, 552);
      ctx.fillText('Hand: 1 finger=Solar • 2=Moon • 3=Mars', 28, 592);
      ctx.fillText('Controller: Press X to Show/Hide • X+Tilt to switch', 28, 632);
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