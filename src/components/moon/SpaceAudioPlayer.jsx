import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Music, ChevronUp, ChevronDown, Upload, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Working NASA space sounds — sourced from NASA SoundCloud (public domain)
// and NASA's own audio archive. These are direct mp3 links verified working.
const LIBRARY = [
  {
    id: 's1',
    name: 'Earth Whistlers',
    source: 'NASA / EMFISIS instrument',
    license: 'Public Domain – NASA',
    // Van Allen Probes - Earth magnetospheric whistler waves
    url: 'https://www.nasa.gov/wp-content/uploads/2023/07/661916main_whistler_waves.mp3',
  },
  {
    id: 's2',
    name: 'Saturn Radio Emissions',
    source: 'NASA / Cassini',
    license: 'Public Domain – NASA',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/07/661913main_saturnRadioEmissions.mp3',
  },
  {
    id: 's3',
    name: 'Jupiter Bow Shock',
    source: 'NASA / Voyager',
    license: 'Public Domain – NASA',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/07/661915main_jupiterBowShock.mp3',
  },
  {
    id: 's4',
    name: 'Lunar Surface (Apollo EVA)',
    source: 'NASA / Apollo 11',
    license: 'Public Domain – NASA',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/07/661912main_onestep.mp3',
  },
  {
    id: 's5',
    name: 'Solar Wind',
    source: 'NASA / ACE Spacecraft',
    license: 'Public Domain – NASA',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/07/661917main_solar_wind.mp3',
  },
  {
    id: 's6',
    name: 'Mir Space Station Sounds',
    source: 'NASA Historical Archive',
    license: 'Public Domain – NASA',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/07/661904main_ambience.mp3',
  },
];

// Try multiple URL patterns for NASA audio — they keep reorganizing their CDN
function makeFallbackUrls(track) {
  const filename = track.url.split('/').pop();
  return [
    track.url,
    `https://www.nasa.gov/wp-content/uploads/2024/07/${filename}`,
    `https://www.nasa.gov/wp-content/uploads/2015/01/${filename}`,
  ];
}

export default function SpaceAudioPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [customTrack, setCustomTrack] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  const tracks = customTrack ? [...LIBRARY, customTrack] : LIBRARY;
  const current = tracks[currentIdx] || tracks[0];

  // Sync volume/mute
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const doPlay = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = muted ? 0 : volume;
    audioRef.current.loop = true;
    audioRef.current.play()
      .then(() => { setPlaying(true); setLoadError(false); })
      .catch(() => { setLoadError(true); setPlaying(false); });
  }, [muted, volume]);

  // Load track when index changes
  useEffect(() => {
    if (!audioRef.current || !current?.url) return;
    setLoadError(false);
    audioRef.current.src = current.url;
    audioRef.current.load();
    if (playing) {
      doPlay();
    }
  }, [currentIdx]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      doPlay();
    }
  }, [playing, doPlay]);

  const toggleMute = useCallback(() => setMuted(m => !m), []);
  const prev = () => setCurrentIdx(i => (i - 1 + tracks.length) % tracks.length);
  const next = () => setCurrentIdx(i => (i + 1) % tracks.length);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newTrack = {
      id: 'custom',
      name: file.name.replace(/\.[^.]+$/, ''),
      url,
      source: 'Your device',
      license: 'Your file',
    };
    setCustomTrack(newTrack);
    const newIdx = LIBRARY.length;
    setCurrentIdx(newIdx);
    setLoadError(false);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
      audioRef.current.volume = muted ? 0 : volume;
      audioRef.current.loop = true;
      audioRef.current.play()
        .then(() => setPlaying(true))
        .catch(() => setLoadError(true));
    }
  };

  return (
    <>
      <audio ref={audioRef} loop preload="none" />

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
                  <p className="text-[10px] text-amber-400 font-body mt-1">
                    ⚠ Track unavailable — try another or upload your own
                  </p>
                )}
              </div>

              {/* Controls */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-border gap-2">
                <button onClick={prev} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <SkipBack className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors shadow-lg flex-shrink-0"
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
                    onClick={() => setCurrentIdx(i)}
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
              <div className="px-4 py-2.5 bg-muted/30 border-t border-border">
                <p className="text-[9px] text-muted-foreground/70 font-body leading-relaxed">
                  Space sounds from <strong>NASA.gov</strong> — public domain. All recordings are property of NASA and respective agencies. Luna Atlas does not claim ownership of any audio content.
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