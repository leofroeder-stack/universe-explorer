import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Music, ChevronUp, ChevronDown, Upload, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// NASA / ESA public domain space sounds
const LIBRARY = [
  {
    id: 's1',
    name: 'Earth from Space',
    source: 'NASA / Voyager 1',
    url: 'https://www.nasa.gov/wp-content/uploads/2015/05/earth_magnetosphere.mp3',
    license: 'Public Domain – NASA',
  },
  {
    id: 's2',
    name: 'Saturn Radio Emissions',
    source: 'NASA / Cassini',
    url: 'https://www.nasa.gov/wp-content/uploads/2015/05/saturnradio.mp3',
    license: 'Public Domain – NASA',
  },
  {
    id: 's3',
    name: 'Jupiter Radio Bursts',
    source: 'NASA / Voyager',
    url: 'https://www.nasa.gov/wp-content/uploads/2015/05/jupiter.mp3',
    license: 'Public Domain – NASA',
  },
  {
    id: 's4',
    name: 'Solar Wind (Sun)',
    source: 'NASA / STEREO',
    url: 'https://www.nasa.gov/wp-content/uploads/2015/05/sun_radio_waves.mp3',
    license: 'Public Domain – NASA',
  },
  {
    id: 's5',
    name: 'Interstellar Medium',
    source: 'NASA / Voyager 1',
    url: 'https://www.nasa.gov/wp-content/uploads/2015/05/interstellar_medium_sound.mp3',
    license: 'Public Domain – NASA',
  },
];

export default function SpaceAudioPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [customTrack, setCustomTrack] = useState(null); // { name, url }
  const [loadError, setLoadError] = useState(false);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  const tracks = customTrack ? [...LIBRARY, customTrack] : LIBRARY;
  const current = tracks[currentIdx] || tracks[0];

  // Sync volume/mute
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // Load & play when track changes
  useEffect(() => {
    if (!audioRef.current || !current?.url) return;
    setLoadError(false);
    audioRef.current.src = current.url;
    audioRef.current.loop = true;
    audioRef.current.volume = muted ? 0 : volume;
    if (playing) {
      audioRef.current.play().catch(() => setLoadError(true));
    }
  }, [currentIdx, current?.url]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      setLoadError(false);
      audioRef.current.play()
        .then(() => setPlaying(true))
        .catch(() => { setLoadError(true); setPlaying(false); });
    }
  }, [playing]);

  const toggleMute = useCallback(() => setMuted(m => !m), []);

  const prev = () => setCurrentIdx(i => (i - 1 + tracks.length) % tracks.length);
  const next = () => setCurrentIdx(i => (i + 1) % tracks.length);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newTrack = { id: 'custom', name: file.name.replace(/\.[^.]+$/, ''), url, source: 'Your device', license: 'Your file' };
    setCustomTrack(newTrack);
    setCurrentIdx(LIBRARY.length); // select it
    setLoadError(false);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.loop = true;
      audioRef.current.volume = muted ? 0 : volume;
      audioRef.current.play()
        .then(() => setPlaying(true))
        .catch(() => setLoadError(true));
    }
  };

  return (
    <>
      <audio ref={audioRef} loop preload="none" />

      {/* Floating button + panel */}
      <div className="absolute bottom-14 right-4 z-[500] flex flex-col items-end gap-2">
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-72 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Music className="w-4 h-4 text-primary" />
                <span className="font-heading font-bold text-sm text-foreground">Space Sounds</span>
                <span className="ml-auto text-[10px] text-muted-foreground font-body">Spatial Audio</span>
              </div>

              {/* Now playing */}
              <div className="px-4 py-3 bg-primary/5 border-b border-border">
                <p className="text-xs font-body font-semibold text-foreground truncate">{current?.name}</p>
                <p className="text-[10px] text-muted-foreground font-body mt-0.5 truncate">{current?.source}</p>
                {loadError && (
                  <p className="text-[10px] text-destructive font-body mt-1">⚠ Could not load this track</p>
                )}
              </div>

              {/* Controls */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                <button onClick={prev} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <SkipBack className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors shadow-lg"
                >
                  {playing ? <Pause className="w-4 h-4 text-primary-foreground" /> : <Play className="w-4 h-4 text-primary-foreground ml-0.5" />}
                </button>
                <button onClick={next} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <SkipForward className="w-4 h-4 text-foreground" />
                </button>
                <button onClick={toggleMute} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  {muted ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-foreground" />}
                </button>
                <input
                  type="range" min={0} max={1} step={0.01}
                  value={muted ? 0 : volume}
                  onChange={e => { setVolume(+e.target.value); setMuted(false); }}
                  className="w-20 accent-primary"
                />
              </div>

              {/* Track list */}
              <div className="max-h-44 overflow-y-auto">
                {tracks.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => { setCurrentIdx(i); setLoadError(false); }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-muted/60 transition-colors border-b border-border/30 last:border-0 ${i === currentIdx ? 'bg-primary/10' : ''}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === currentIdx && playing ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-body font-medium text-foreground truncate">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground font-body truncate">{t.source}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Upload custom */}
              <div className="px-4 py-3 border-t border-border">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-border hover:border-primary/60 hover:bg-primary/5 transition-all text-xs font-body text-muted-foreground hover:text-foreground"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload your own music
                </button>
                <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
              </div>

              {/* Attribution */}
              <div className="px-4 py-2 bg-muted/30 border-t border-border">
                <p className="text-[9px] text-muted-foreground/70 font-body leading-relaxed">
                  Space sounds from <strong>NASA.gov</strong> — public domain. All recordings are property of NASA / ESA and respective agencies. Luna Atlas does not claim ownership of any audio content.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle button */}
        <button
          onClick={() => setExpanded(e => !e)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-lg backdrop-blur-xl transition-all ${
            playing
              ? 'bg-primary/20 border-primary/60 text-primary'
              : 'bg-card/90 border-border text-muted-foreground hover:text-foreground'
          }`}
          title="Space Audio"
        >
          {muted || !playing ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="text-xs font-body font-medium hidden sm:inline">
            {playing ? (muted ? 'Muted' : 'Playing') : 'Audio'}
          </span>
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>
    </>
  );
}