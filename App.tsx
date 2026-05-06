
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ReelState, LyricSegment, ExportStatus, ReelMedia, VolumeHighlight } from './types';
import { GeminiService } from './services/geminiService';
import EditorPanel from './components/EditorPanel';
import PreviewCanvas from './components/PreviewCanvas';
import Header from './components/Header';

const App: React.FC = () => {
  const [state, setState] = useState<ReelState>({
    images: [],
    logo: null,
    logoPosition: { x: 85, y: 10, size: 120 },
    audioUrl: null,
    audioName: null,
    audioDuration: 0,
    audioTrim: { start: 0, end: 15 },
    musicVolume: 0.8,
    musicEnabled: true,
    musicPlaybackRate: 1.0,
    vocalIsolationEnabled: false,
    musicHighlights: [],
    lyrics: [],
    lyricStyle: {
      fontFamily: 'Ramabhadra',
      fontSize: 84,
      lineGap: 1.3,
      color: '#ffffff',
      animation: 'slide-up',
      verticalPosition: 50,
      textAlign: 'center',
      shadow: true,
      glowColor: '#ec4899',
      glowIntensity: 20,
      gradient: true,
      gradientColors: ['#ffffff', '#f472b6'],
      stroke: true,
      strokeColor: '#000000',
      strokeWidth: 5
    },
    watermark: {
      text: 'Created with ReelGenius',
      color: '#ffffff',
      size: 28,
      opacity: 0.7,
      x: 50,
      y: 90,
      textAlign: 'center'
    },
    songTitle: '',
    stickers: []
  });

  const [exportStatus, setExportStatus] = useState<ExportStatus>({
    progress: 0,
    status: 'idle',
    message: ''
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicGainNodeRef = useRef<GainNode | null>(null);
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const exportDestNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const filterNodesRef = useRef<{ hp: BiquadFilterNode; lp: BiquadFilterNode } | null>(null);

  const gemini = GeminiService.getInstance();

  const totalDuration = useMemo(() => {
    return state.images.reduce((acc, img) => acc + img.duration, 0) || 0.1;
  }, [state.images]);

  const handleMediaUpload = async (files: FileList | null) => {
    if (!files) return;
    const filesArray = Array.from(files);
    const newMediaItems: ReelMedia[] = [];
    
    for (const file of filesArray) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        const promise = new Promise<void>((resolve) => {
          reader.onload = (e) => {
            if (e.target?.result) {
              newMediaItems.push({ 
                url: e.target.result as string, 
                type: 'image',
                duration: 3,
                transition: 'zoom-in',
                audioEnabled: false,
                volume: 1.0,
                scale: 1.0,
                offsetY: 0
              });
            }
            resolve();
          };
          reader.readAsDataURL(file);
        });
        await promise;
      } else if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        const tempVideo = document.createElement('video');
        tempVideo.src = url;
        const promise = new Promise<void>((resolve) => {
          tempVideo.onloadedmetadata = () => {
            const vidDuration = tempVideo.duration;
            newMediaItems.push({
              url: url,
              type: 'video',
              duration: vidDuration,
              originalDuration: vidDuration,
              transition: 'fade',
              audioEnabled: true,
              volume: 1.0,
              trimStart: 0,
              trimEnd: vidDuration,
              scale: 1.0,
              offsetY: 0
            });
            resolve();
          };
        });
        await promise;
      }
    }
    
    setState(prev => ({ ...prev, images: [...prev.images, ...newMediaItems] }));
  };

  const handleAudioUpload = (file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      setState(prev => ({ 
        ...prev, 
        audioUrl: url, 
        audioName: file.name,
        audioDuration: tempAudio.duration,
        audioTrim: { start: 0, end: Math.min(tempAudio.duration, totalDuration) }
      }));
      if (audioRef.current) audioRef.current.src = url;
    };
  };

  const generateLyrics = async () => {
    if (!state.songTitle) return;
    setExportStatus({ status: 'generating', progress: 10, message: 'AI is thinking of Telugu lyrics...', });
    try {
      const lyrics = await gemini.generateLyricsTimestamps(state.songTitle, totalDuration);
      setState(prev => ({ ...prev, lyrics }));
      setExportStatus({ status: 'idle', progress: 0, message: '' });
    } catch (err) {
      setExportStatus({ status: 'error', progress: 0, message: 'Failed to generate Telugu lyrics' });
    }
  };

  const handleExport = async () => {
    if (state.images.length === 0) return;
    
    // Ensure audio context is initialized and resumed
    await initAudio();
    
    setIsExporting(true);
    setExportStatus({ status: 'generating', progress: 0, message: 'Preparing high-def recorder...' });
    
    setCurrentTime(0);
    recordedChunksRef.current = [];

    const canvas = document.getElementById('reel-preview-canvas') as HTMLCanvasElement;
    if (!canvas) {
      setExportStatus({ status: 'error', progress: 0, message: 'Canvas engine not found.' });
      return;
    }

    const canvasStream = canvas.captureStream(30); 
    let finalStream = canvasStream;
    
    if (audioCtxRef.current && exportDestNodeRef.current) {
        const audioStream = exportDestNodeRef.current.stream;
        const audioTracks = audioStream.getAudioTracks();
        
        if (audioTracks.length > 0) {
          finalStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...audioTracks
          ]);
        } else {
          console.warn("No audio tracks found in export destination stream");
        }
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
      ? 'video/webm;codecs=vp9,opus' 
      : 'video/webm';
    
    const recorder = new MediaRecorder(finalStream, { 
      mimeType,
      audioBitsPerSecond: 128000,
      videoBitsPerSecond: 5000000 
    });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
    recorder.onerror = (e) => {
      console.error("MediaRecorder error:", e);
      setExportStatus({ status: 'error', progress: 0, message: 'Recording failed. Please try again.' });
      setIsExporting(false);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `telugu-reel-${Date.now()}.webm`;
      a.click();
      setExportStatus({ status: 'completed', progress: 100, message: 'Cinema-quality Reel downloaded!' });
      setIsExporting(false);
      setIsPlaying(false);
    };

    mediaRecorderRef.current = recorder;
    
    // Start playback first
    setIsPlaying(true);
    
    // Give audio a tiny bit of time to start before recording
    await new Promise(resolve => setTimeout(resolve, 100));
    
    recorder.start();
  };

  const initAudio = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Master Gain for all audio
      masterGainNodeRef.current = audioCtxRef.current.createGain();
      masterGainNodeRef.current.connect(audioCtxRef.current.destination);
      
      // Export Destination
      exportDestNodeRef.current = audioCtxRef.current.createMediaStreamDestination();
      masterGainNodeRef.current.connect(exportDestNodeRef.current);

      if (audioRef.current) {
        const source = audioCtxRef.current.createMediaElementSource(audioRef.current);
        const gainNode = audioCtxRef.current.createGain();
        
        // Vocal Isolation Filters
        const hp = audioCtxRef.current.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 350; // Cut bass
        
        const lp = audioCtxRef.current.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 6000; // Cut extreme highs
        
        filterNodesRef.current = { hp, lp };

        // Normal route: Source -> Gain -> Master
        source.connect(hp).connect(lp).connect(gainNode).connect(masterGainNodeRef.current);
        musicGainNodeRef.current = gainNode;
      }
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
  };

  // Sync Vocal Mode
  useEffect(() => {
    if (!filterNodesRef.current) return;
    const { hp, lp } = filterNodesRef.current;
    if (state.vocalIsolationEnabled) {
      hp.frequency.setTargetAtTime(350, audioCtxRef.current?.currentTime || 0, 0.1);
      lp.frequency.setTargetAtTime(6000, audioCtxRef.current?.currentTime || 0, 0.1);
    } else {
      hp.frequency.setTargetAtTime(20, audioCtxRef.current?.currentTime || 0, 0.1);
      lp.frequency.setTargetAtTime(20000, audioCtxRef.current?.currentTime || 0, 0.1);
    }
  }, [state.vocalIsolationEnabled]);

  // Sync Playback Rate in real-time
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = state.musicPlaybackRate;
    }
  }, [state.musicPlaybackRate]);

  useEffect(() => {
    const syncAudio = async () => {
      if (isPlaying) {
        await initAudio();
        if (audioRef.current) {
          audioRef.current.playbackRate = state.musicPlaybackRate;
          audioRef.current.currentTime = state.audioTrim.start + currentTime;
          audioRef.current.play().catch(e => console.warn("Audio play blocked", e));
        }
      } else {
        if (audioRef.current) audioRef.current.pause();
      }
    };
    syncAudio();
  }, [isPlaying]);

  useEffect(() => {
    if (!musicGainNodeRef.current) return;
    const activeHighlight = state.musicHighlights.find(h => currentTime >= h.start && currentTime <= h.end);
    let targetVolume = state.musicEnabled 
      ? (activeHighlight ? state.musicVolume * activeHighlight.volume : state.musicVolume)
      : 0;
    
    musicGainNodeRef.current.gain.setTargetAtTime(targetVolume, audioCtxRef.current?.currentTime || 0, 0.1);
  }, [currentTime, state.musicVolume, state.musicHighlights, state.musicEnabled]);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const nextTime = prev + 0.016; // ~60fps
          if (isExporting) {
             const progress = Math.min(100, Math.floor((nextTime / totalDuration) * 100));
             setExportStatus(s => ({ ...s, progress, message: `Capturing frames: ${progress}%` }));
          }
          if (nextTime >= totalDuration) {
            setIsPlaying(false);
            if (audioRef.current) audioRef.current.pause();
            if (isExporting && mediaRecorderRef.current) mediaRecorderRef.current.stop();
            return totalDuration;
          }
          return nextTime;
        });
      }, 16); // ~60fps
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration, isExporting]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <audio ref={audioRef} className="absolute opacity-0 pointer-events-none" src={state.audioUrl || ''} crossOrigin="anonymous" />
      <main className="flex-1 flex flex-col md:flex-row p-4 gap-6 max-w-[1400px] mx-auto w-full overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="relative aspect-[9/16] w-full max-w-[420px] lg:max-w-[480px] bg-black rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-8 border-slate-800 group">
            <PreviewCanvas 
              state={state} 
              currentTime={currentTime} 
              isPlaying={isPlaying} 
              audioContext={audioCtxRef.current}
              audioDestination={masterGainNodeRef.current}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
              {!isExporting && (
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/40 transition-all transform active:scale-95 shadow-xl">
                  <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-white text-2xl`}></i>
                </button>
              )}
            </div>
            {isExporting && (
               <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full animate-pulse shadow-lg">
                 <div className="w-2 h-2 bg-white rounded-full"></div>
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">RECORDING LIVE</span>
               </div>
            )}
            <div className="absolute bottom-4 left-4 right-4 h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
               <div className="h-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all duration-100 ease-linear" style={{ width: `${(currentTime / totalDuration) * 100}%` }} />
            </div>
          </div>
          <div className="flex gap-4">
             <button disabled={isExporting} onClick={() => setIsPlaying(!isPlaying)} className={`px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${isPlaying ? 'bg-slate-700 text-white' : 'bg-pink-600 text-white hover:bg-pink-500 shadow-lg shadow-pink-500/30'} disabled:opacity-50`}>
               <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i> {isPlaying ? 'PAUSE' : 'PLAY REEL'}
             </button>
             <button disabled={isExporting} onClick={() => { setCurrentTime(0); if (audioRef.current) audioRef.current.currentTime = state.audioTrim.start; }} className="px-6 py-3 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold border border-slate-700 disabled:opacity-50">
               <i className="fa-solid fa-rotate-left mr-2"></i> RESTART
             </button>
          </div>
        </div>
        <div className="w-full md:w-[420px] lg:w-[520px] h-[calc(100vh-140px)]">
          <EditorPanel 
            state={state} 
            setState={setState} 
            handleImageUpload={handleMediaUpload} 
            generateLyrics={generateLyrics} 
            handleExport={handleExport} 
            exportStatus={exportStatus} 
            handleAudioUpload={handleAudioUpload} 
            handleLyricsUpload={(f) => {}} 
            currentTime={currentTime} 
          />
        </div>
      </main>
      {exportStatus.status !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="glass p-10 rounded-[3rem] w-full max-w-md text-center space-y-8 shadow-2xl border-white/10">
            <div className="text-3xl font-black text-white tracking-tight">
              {exportStatus.status === 'completed' ? 'Success! 🎉' : 'Cinema AI Engine'}
            </div>
            {(exportStatus.status === 'generating' || exportStatus.status === 'idle') && (
              <div className="flex flex-col items-center gap-8">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 border-4 border-pink-500/20 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-pink-500 text-2xl font-black">{exportStatus.progress}%</div>
                </div>
                <div className="text-slate-300 text-sm font-bold uppercase tracking-widest">{exportStatus.message}</div>
              </div>
            )}
            {exportStatus.status === 'completed' && (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto text-4xl">
                  <i className="fa-solid fa-check"></i>
                </div>
                <p className="text-slate-300 font-medium">Your cinematic Telugu reel has been rendered and saved to your device.</p>
                <button onClick={() => setExportStatus(prev => ({ ...prev, status: 'idle' }))} className="w-full py-5 rounded-2xl bg-gradient-to-r from-pink-600 to-violet-600 font-black text-white uppercase tracking-widest hover:scale-[1.02] transition-all">Continue Creating</button>
              </div>
            )}
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
