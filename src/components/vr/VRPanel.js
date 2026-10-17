import * as THREE from 'three';

export default function VRPanel() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 1440;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.48), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false, depthTest: false, depthWrite: false }));
  mesh.renderOrder = 100;
  mesh.position.set(0.85, -0.05, -1.75);
  mesh.rotation.y = -0.25;
  const styles = window.getComputedStyle(document.documentElement);
  const FALLBACKS = { '--card': '#0d1322', '--primary': '#3c83f6', '--primary-foreground': '#080c16', '--secondary': '#1c2536', '--foreground': '#f1f5f9', '--muted-foreground': '#7588a3' };
  const color = name => { const v = styles.getPropertyValue(name).trim(); return v ? `hsl(${v.replace(/\s+/g, ', ')})` : (FALLBACKS[name] || '#ffffff'); };
  let titleText = '', rows = [], hovered = -1;
  const rowAt = uv => {
    if (!uv || uv.x < 0.02 || uv.x > 0.98) return -1;
    const y = (1 - uv.y) * 1440, idx = Math.floor((y - 108) / 88);
    return y >= 108 && idx >= 0 && idx < rows.length && (y - 108) % 88 <= 78 ? idx : -1;
  };
  const render = () => {
    context.fillStyle = color('--card'); context.fillRect(0, 0, 1024, 1440);
    context.strokeStyle = color('--primary'); context.lineWidth = 5; context.strokeRect(3, 3, 1018, 1434);
    context.fillStyle = color('--foreground'); context.font = 'bold 40px sans-serif';
    context.fillText(titleText.slice(0, 38), 40, 72);
    rows.forEach((row, index) => {
      const y = 108 + index * 88, active = index === hovered && !!row.onSelect;
      context.fillStyle = active ? color('--primary') : color(row.onSelect ? '--secondary' : '--card');
      context.fillRect(28, y, 968, 76);
      if (row.onSelect) { context.strokeStyle = color('--primary'); context.lineWidth = active ? 4 : 1.5; context.strokeRect(28, y, 968, 76); }
      context.fillStyle = active ? color('--primary-foreground') : color(row.onSelect ? '--primary' : '--foreground');
      context.font = `${active ? 'bold ' : ''}32px sans-serif`; context.fillText(row.label.slice(0, 50), 46, y + 49);
    });
    context.fillStyle = color('--muted-foreground'); context.font = '26px sans-serif';
    context.fillText('Point + trigger to select • Squeeze to drag', 40, 1382);
    context.fillText('Left stick: pan • Right stick: rotate / zoom', 40, 1418);
    texture.needsUpdate = true;
  };
  return {
    mesh,
    draw(title, entries) { titleText = title; rows = entries; render(); },
    hover(uv) { const next = rowAt(uv); if (next !== hovered) { hovered = next; render(); } },
    select(uv) { rows[rowAt(uv)]?.onSelect?.(); },
    dispose() { mesh.geometry.dispose(); mesh.material.dispose(); texture.dispose(); },
  };
}