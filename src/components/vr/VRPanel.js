import * as THREE from 'three';

export default function VRPanel() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 1440;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.48), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false, depthTest: false, depthWrite: false }));
  mesh.renderOrder = 100;
  mesh.position.set(1.1, -0.05, -1.8);
  mesh.rotation.y = -0.3;
  const styles = window.getComputedStyle(document.documentElement);
  const color = name => `hsl(${styles.getPropertyValue(name).trim()})`;
  let rows = [];
  return {
    mesh,
    draw(title, entries) {
      rows = entries;
      context.fillStyle = color('--card'); context.fillRect(0, 0, 1024, 1440);
      context.strokeStyle = color('--primary'); context.lineWidth = 5; context.strokeRect(3, 3, 1018, 1434);
      context.fillStyle = color('--foreground'); context.font = 'bold 42px sans-serif';
      context.fillText(title.slice(0, 38), 42, 76);
      rows.forEach((row, index) => {
        const y = 125 + index * 100;
        context.fillStyle = color(row.onSelect ? '--secondary' : '--card');
        context.fillRect(28, y, 968, 88);
        context.fillStyle = color(row.onSelect ? '--primary' : '--foreground');
        context.font = '34px sans-serif'; context.fillText(row.label.slice(0, 49), 46, y + 54);
      });
      context.fillStyle = color('--muted-foreground'); context.font = '27px sans-serif';
      context.fillText('Point + trigger to select • Squeeze to drag', 40, 1380);
      context.fillText('Left stick: pan • Right stick: rotate / zoom', 40, 1420);
      texture.needsUpdate = true;
    },
    select(uv) {
      const y = (1 - uv.y) * 1440;
      const row = rows[Math.floor((y - 125) / 100)];
      if (y >= 125 && y < 125 + rows.length * 100 && uv.x > 0.027 && uv.x < 0.973) row?.onSelect?.();
    },
    dispose() { mesh.geometry.dispose(); mesh.material.dispose(); texture.dispose(); },
  };
}