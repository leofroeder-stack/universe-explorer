import * as THREE from 'three';

export default function VRVoiceGesture(renderer, quickNav, onSelectDestination) {
  const Speech = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  let recognition = null, voiceOn = false, gestureHold = { key: null, time: 0 }, lastAction = 0;
  const wrist = new THREE.Vector3(), tip = new THREE.Vector3(), xOrigin = new THREE.Vector3();
  const triggerNav = (key, label) => {
    if (performance.now() - lastAction < 900) return;
    lastAction = performance.now();
    quickNav.setState({ activeKey: key, statusText: label });
    onSelectDestination(key);
  };
  const applyTranscript = text => {
    const t = text.toLowerCase();
    if (t.includes('rover') || t.includes('drive')) triggerNav('lunar-rover', 'Voice: Launched Lunar Rover');
    else if (t.includes('solar')) triggerNav('solar-system', 'Voice: Switched to Solar System');
    else if (t.includes('moon') || t.includes('lunar')) triggerNav('moon', 'Voice: Switched to Moon');
    else if (t.includes('mars')) triggerNav('mars', 'Voice: Switched to Mars');
    else if (t.includes('hide')) quickNav.setState({ hidden: true, statusText: 'Voice: Hidden Quick Nav' });
    else if (t.includes('show') || t.includes('open')) quickNav.setState({ hidden: false, statusText: 'Voice: Shown Quick Nav' });
  };
  const toggleVoice = () => {
    if (!Speech) { quickNav.setState({ voiceOn: false, statusText: 'Voice not supported in this browser' }); return; }
    if (voiceOn) { voiceOn = false; recognition?.stop(); quickNav.setState({ voiceOn: false, statusText: 'Voice commands paused' }); return; }
    recognition = new Speech(); recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US';
    recognition.onresult = e => { const res = e.results[e.results.length - 1]; if (res?.[0]?.transcript) applyTranscript(res[0].transcript); };
    recognition.onend = () => { if (voiceOn) try { recognition.start(); } catch {} };
    try { recognition.start(); voiceOn = true; quickNav.setState({ voiceOn: true, statusText: 'Listening: Say Solar System, Moon, or Mars' }); }
    catch { quickNav.setState({ voiceOn: false, statusText: 'Click Voice button to allow microphone' }); }
  };
  const onKeyDown = e => { if (e.key === 'x' || e.key === 'X') quickNav.toggleHidden(); };
  window.addEventListener('keydown', onKeyDown);
  return {
    toggleVoice,
    update(controllers, delta) {
      const frame = renderer.xr.getFrame(), refSpace = renderer.xr.getReferenceSpace();
      const sources = Array.from(renderer.xr.getSession()?.inputSources || []);
      sources.forEach(source => {
        if (source.hand && frame && refSpace) {
          const wPose = frame.getJointPose(source.hand.get('wrist'), refSpace);
          if (!wPose) return;
          wrist.set(wPose.transform.position.x, wPose.transform.position.y, wPose.transform.position.z);
          const tips = ['index-finger-tip', 'middle-finger-tip', 'ring-finger-tip', 'pinky-finger-tip'];
          const extended = tips.filter(name => {
            const p = frame.getJointPose(source.hand.get(name), refSpace);
            return p && tip.set(p.transform.position.x, p.transform.position.y, p.transform.position.z).distanceTo(wrist) > 0.12;
          }).length;
          const key = extended === 1 ? 'solar-system' : extended === 2 ? 'moon' : extended === 3 ? 'mars' : extended === 4 ? 'lunar-rover' : null;
          if (key && gestureHold.key === key) {
            gestureHold.time += delta;
            if (gestureHold.time > 0.55) { gestureHold.time = 0; triggerNav(key, `Hand gesture (${extended} fingers): ${key}`); }
          } else gestureHold = { key, time: 0 };
        }
      });
      controllers.forEach(({ controller }) => {
        const buttons = controller.userData.source?.gamepad?.buttons || [];
        const xPressed = !!(buttons[4]?.pressed || buttons[5]?.pressed);
        if (xPressed && !controller.userData.xPressed) {
          controller.userData.xStart = performance.now();
          controller.userData.xOrigin = controller.position.clone();
          controller.userData.xSwiped = false;
        } else if (xPressed && controller.userData.xOrigin && !controller.userData.xSwiped) {
          xOrigin.copy(controller.position).sub(controller.userData.xOrigin);
          if (xOrigin.x < -0.14) { controller.userData.xSwiped = true; triggerNav('solar-system', 'X + Swipe Left: Solar System'); }
          else if (xOrigin.y > 0.14) { controller.userData.xSwiped = true; triggerNav('moon', 'X + Swipe Up: Moon'); }
          else if (xOrigin.x > 0.14) { controller.userData.xSwiped = true; triggerNav('mars', 'X + Swipe Right: Mars'); }
        } else if (!xPressed && controller.userData.xPressed && !controller.userData.xSwiped) {
          quickNav.toggleHidden();
        }
        controller.userData.xPressed = xPressed;
      });
    },
    dispose() {
      voiceOn = false; try { recognition?.stop(); } catch {}
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}