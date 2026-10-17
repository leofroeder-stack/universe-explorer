import React, { useEffect, useState } from 'react';
import { Glasses, Loader2 } from 'lucide-react';

export default function HeadsetVRButton({ sceneRef }) {
  const [supported, setSupported] = useState(null);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let mounted = true;
    const check = navigator.xr?.isSessionSupported('immersive-vr') || Promise.resolve(false);
    check.then(value => { if (mounted) setSupported(value); }, () => { if (mounted) setSupported(false); });
    return () => { mounted = false; };
  }, []);
  const toggle = async () => {
    setMessage('');
    if (!supported) { setMessage('Open this app in a WebXR-compatible headset browser to enter VR. If embedded, open the app directly.'); return; }
    const renderer = sceneRef.current.renderer;
    if (!renderer) { setMessage('The 3D view is still loading. Try again shortly.'); return; }
    setBusy(true);
    let next;
    try {
      if (session) { await session.end(); return; }
      next = await navigator.xr.requestSession('immersive-vr');
      next.addEventListener('end', () => setSession(null), { once: true });
      await renderer.xr.setSession(next);
      setSession(next);
    } catch (error) {
      if (next) await next.end();
      setMessage(error.name === 'NotAllowedError' ? 'VR permission was declined. Allow VR access in your headset browser and try again.' : 'Could not enter VR. Connect your headset and open the app directly in a WebXR-compatible browser.');
    } finally { setBusy(false); }
  };
  return (
    <div className="relative font-body">
      <button type="button" onClick={toggle} disabled={busy || supported === null} aria-label={session ? 'Exit immersive VR' : 'Enter immersive VR'} title="Look around with your headset. Use the headset system menu to leave VR."
        className="min-h-11 flex items-center justify-center gap-2 rounded-xl border border-primary/50 bg-card/90 px-3 text-xs font-medium text-primary shadow-lg hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Glasses className="h-4 w-4" />}
        {busy ? 'Connecting…' : session ? 'Exit VR' : 'Enter VR'}
      </button>
      {message && <div role="status" className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[80vw] rounded-xl border border-border bg-card p-3 text-sm text-foreground shadow-xl">
        <p>{message}</p><button type="button" onClick={() => setMessage('')} className="mt-2 min-h-11 text-primary underline">Dismiss</button>
      </div>}
    </div>
  );
}