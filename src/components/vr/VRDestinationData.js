import { PLANET_INFO, PLANET_BODIES } from '@/components/solar/solarData';
import { getAllMarkers } from '@/components/moon/moonData';
import { getAllMarsMarkers } from '@/components/moon/marsData';

export const VR_WORLDS = {
  sun: { name: 'Sun', color: '#FDB813', description: 'The star at the center of our Solar System.' },
  moon: { name: 'Moon', color: '#aaaaaa', description: "Earth's natural satellite." },
  ...PLANET_INFO,
};
export const VR_DESTINATIONS = [
  { key: 'original', label: 'Return to original view' },
  { key: 'lunar-rover', label: 'Lunar Rover Explorer (Moon Surface)' },
  { key: 'solar-system', label: 'Solar System' },
  ...Object.entries(VR_WORLDS).map(([key, world]) => ({ key, label: world.name })),
];
export function destinationItems(key) {
  if (key === 'moon') return getAllMarkers();
  if (key === 'mars') return getAllMarsMarkers();
  return PLANET_BODIES[key] || [];
}