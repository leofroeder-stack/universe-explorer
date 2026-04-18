import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action = 'getUpcoming' } = await req.json();

    let result;

    switch (action) {
      case 'getUpcoming':
        result = getUpcomingLunarEvents();
        break;
      case 'getCurrentPhase':
        result = getCurrentLunarPhase();
        break;
      case 'getAlert':
        result = generateLunarAlert();
        break;
      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    return Response.json(result);
  } catch (error) {
    console.error('[Lunar Event Alerts] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Reference epoch: January 6, 2000, 18:14 UTC was a New Moon
const REFERENCE_NEW_MOON = new Date('2000-01-06T18:14:00Z');
const LUNAR_CYCLE_DAYS = 29.53058867;

function getCurrentLunarPhase() {
  const now = new Date();
  const daysSinceEpoch = (now - REFERENCE_NEW_MOON) / (1000 * 60 * 60 * 24);
  const phase = daysSinceEpoch % LUNAR_CYCLE_DAYS;
  const illumination = (1 - Math.cos((2 * Math.PI * phase) / LUNAR_CYCLE_DAYS)) / 2;

  let phaseName = '';
  if (phase < 1.84) phaseName = 'New Moon';
  else if (phase < 7.38) phaseName = 'Waxing Crescent';
  else if (phase < 9.23) phaseName = 'First Quarter';
  else if (phase < 14.77) phaseName = 'Waxing Gibbous';
  else if (phase < 16.61) phaseName = 'Full Moon';
  else if (phase < 22.15) phaseName = 'Waning Gibbous';
  else if (phase < 23.99) phaseName = 'Last Quarter';
  else phaseName = 'Waning Crescent';

  return {
    phaseName,
    illuminationPercent: Math.round(illumination * 100),
    cycleDay: Math.round(phase),
    cycleLength: LUNAR_CYCLE_DAYS,
    nextPhaseDay: Math.ceil(LUNAR_CYCLE_DAYS - phase),
    timestamp: now.toISOString(),
  };
}

function getUpcomingLunarEvents() {
  const now = new Date();
  const events = [];

  // Calculate next 6 lunar events (new moons and full moons)
  const daysSinceEpoch = (now - REFERENCE_NEW_MOON) / (1000 * 60 * 60 * 24);
  const currentCycle = Math.floor(daysSinceEpoch / LUNAR_CYCLE_DAYS);

  for (let i = 0; i < 12; i++) {
    const cycleNumber = currentCycle + Math.floor(i / 2);
    const eventTime = new Date(REFERENCE_NEW_MOON);
    const daysToAdd = cycleNumber * LUNAR_CYCLE_DAYS + (i % 2 === 0 ? 0 : LUNAR_CYCLE_DAYS / 2);
    eventTime.setTime(eventTime.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    if (eventTime > now) {
      const isFullMoon = i % 2 === 1;
      const daysUntil = Math.round((eventTime - now) / (1000 * 60 * 60 * 24));

      events.push({
        type: isFullMoon ? 'Full Moon' : 'New Moon',
        date: eventTime.toISOString(),
        daysUntil,
        dateFormatted: eventTime.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        timeFormatted: eventTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/New_York',
        }),
        description: isFullMoon
          ? 'The Moon is fully illuminated and rises as the Sun sets. Perfect for observation.'
          : 'The Moon is invisible in the Sun\'s glare. Excellent time for stargazing.',
      });

      if (events.length >= 6) break;
    }
  }

  return {
    upcoming: events,
    generatedAt: now.toISOString(),
  };
}

function generateLunarAlert() {
  const currentPhase = getCurrentLunarPhase();
  const upcomingEvents = getUpcomingLunarEvents();

  let alertLevel = 'info';
  let title = '';
  let message = '';
  let actionItems = [];

  const nextEvent = upcomingEvents.upcoming[0];

  if (currentPhase.phaseName === 'Full Moon') {
    alertLevel = 'important';
    title = '🌕 Full Moon Tonight!';
    message = 'The moon is fully illuminated. Perfect night for lunar observation and photography.';
    actionItems = [
      'Best viewing time: 2-3 hours after sunset',
      'Use binoculars or telescope for crater details',
      'High tides affected by full moon gravity',
    ];
  } else if (currentPhase.phaseName === 'New Moon') {
    alertLevel = 'info';
    title = '🌑 New Moon - Dark Skies Ahead';
    message = 'The moon is not visible. Excellent conditions for deep-sky stargazing without moonlight.';
    actionItems = [
      'Milky Way is at its brightest',
      'Galaxies and nebulae easier to observe',
      'Best night for astronomy',
    ];
  } else if (currentPhase.phaseName.includes('Waxing')) {
    alertLevel = 'info';
    title = '🌒 Waxing Moon - Growing Light';
    message = `Moon is ${currentPhase.illuminationPercent}% illuminated and growing brighter.`;
    actionItems = [
      `Next Full Moon in ${currentPhase.nextPhaseDay} days`,
      'Terminator line reveals crater details',
      'Evening observation ideal',
    ];
  } else if (currentPhase.phaseName.includes('Waning')) {
    alertLevel = 'info';
    title = '🌘 Waning Moon - Fading Light';
    message = `Moon is ${currentPhase.illuminationPercent}% illuminated and fading.`;
    actionItems = [
      `Next New Moon in ${currentPhase.nextPhaseDay} days`,
      'Pre-dawn observation excellent',
      'Morning skies becoming darker',
    ];
  }

  if (nextEvent && nextEvent.daysUntil <= 3) {
    alertLevel = 'important';
    title += ` • ${nextEvent.type} in ${nextEvent.daysUntil} day${nextEvent.daysUntil === 1 ? '' : 's'}`;
  }

  return {
    alertLevel, // 'info', 'important', 'critical'
    title,
    message,
    currentPhase,
    nextEvent,
    actionItems,
    timestamp: new Date().toISOString(),
  };
}