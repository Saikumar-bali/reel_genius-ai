
import React, { useState, useMemo } from 'react';
import { ReelState, ExportStatus, LyricSegment, ReelMedia, LyricAnimation, TransitionType, VolumeHighlight } from '../types';

interface EditorPanelProps {
  state: ReelState;
  setState: React.Dispatch<React.SetStateAction<ReelState>>;
  handleImageUpload: (files: FileList | null) => void;
  handleAudioUpload: (file: File | null) => void;
  handleLyricsUpload: (file: File | null) => void;
  generateLyrics: () => void;
  handleExport: () => void;
  exportStatus: ExportStatus;
  currentTime: number;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  state,
  setState,
  handleImageUpload,
  handleAudioUpload,
  handleLyricsUpload,
  generateLyrics,
  handleExport,
  exportStatus,
  currentTime
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'lyrics' | 'style' | 'branding'>('content');

  const totalReelDuration = useMemo(() => {
    return state.images.reduce((acc, img) => acc + img.duration, 0) || 0;
  }, [state.images]);

  const updateImage = (index: number, updates: Partial<ReelMedia>) => {
    setState(prev => {
      const nextImages = [...prev.images];
      nextImages[index] = { ...nextImages[index], ...updates };
      return { ...prev, images: nextImages };
    });
  };

  const updateLyric = (index: number, updates: Partial<LyricSegment>) => {
    setState(prev => {
      const next = [...prev.lyrics];
      next[index] = { ...next[index], ...updates };
      return { ...prev, lyrics: next };
    });
  };

  const updateLyricStyle = (updates: Partial<typeof state.lyricStyle>) => {
    setState(prev => ({
      ...prev,
      lyricStyle: { ...prev.lyricStyle, ...updates }
    }));
  };

  const updateWatermark = (updates: Partial<typeof state.watermark>) => {
    setState(prev => ({
      ...prev,
      watermark: { ...prev.watermark, ...updates }
    }));
  };

  const updateLogoPosition = (updates: Partial<typeof state.logoPosition>) => {
    setState(prev => ({
      ...prev,
      logoPosition: { ...prev.logoPosition, ...updates }
    }));
  };

  const addVolumeHighlight = () => {
    const newHighlight: VolumeHighlight = {
      id: Math.random().toString(36).substr(2, 9),
      start: currentTime,
      end: Math.min(currentTime + 3, totalReelDuration),
      volume: 1.5
    };
    setState(prev => ({ ...prev, musicHighlights: [...prev.musicHighlights, newHighlight] }));
  };

  const updateHighlight = (id: string, updates: Partial<VolumeHighlight>) => {
    setState(prev => ({
      ...prev,
      musicHighlights: prev.musicHighlights.map(h => h.id === id ? { ...h, ...updates } : h)
    }));
  };

  const teluguFonts = ['Hind Guntur', 'Ramabhadra', 'Gidugu', 'Gurajada', 'Suranna', 'NTR', 'Tenali Ramakrishna'];
  const latinFonts = ['Inter', 'Montserrat', 'Pacifico', 'Bungee', 'Playfair Display', 'Space Mono'];
  
  const animations: { label: string; value: LyricAnimation; icon: string }[] = [
    { label: 'None', value: 'none', icon: 'fa-slash' },
    { label: 'Fade', value: 'fade', icon: 'fa-eye' },
    { label: 'Slide', value: 'slide-up', icon: 'fa-arrow-up' },
    { label: 'Zoom', value: 'scale', icon: 'fa-expand' },
    { label: 'Type', value: 'typewriter', icon: 'fa-keyboard' },
    { label: 'Neon', value: 'glow-pulse', icon: 'fa-bolt' },
    { label: 'Float', value: 'float', icon: 'fa-cloud' },
    { label: 'Bounce', value: 'bounce', icon: 'fa-baseball-ball' },
    { label: 'Rotate', value: 'rotate', icon: 'fa-sync-alt' },
  ];

  const transitions: { label: string; value: TransitionType }[] = [
    { label: 'Fade Out', value: 'fade' },
    { label: 'Zoom In', value: 'zoom-in' },
    { label: 'Zoom Out', value: 'zoom-out' },
    { label: 'Slide Left', value: 'slide-left' },
    { label: 'Slide Right', value: 'slide-right' },
    { label: 'Blur', value: 'blur' },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const maxStartTime = Math.max(0, state.audioDuration - totalReelDuration);

  return (
    <div className="h-full flex flex-col glass rounded-[2.5rem] border-slate-800/50 shadow-2xl overflow-hidden">
      <div className="flex p-2 bg-slate-900/50 border-b border-slate-800">
        {[
          { id: 'content', icon: 'fa-images' },
          { id: 'lyrics', icon: 'fa-clock' },
          { id: 'style', icon: 'fa-wand-magic-sparkles' },
          { id: 'branding', icon: 'fa-copyright' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${
              activeTab === tab.id ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-sm`}></i>
            <span className="text-[9px] font-black uppercase tracking-tighter">{tab.id}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-7 space-y-8 custom-scrollbar">
        {activeTab === 'content' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-pink-500">Timeline & Mixing</h3>
              <div className="space-y-4">
                {state.images.map((media, idx) => (
                  <div key={idx} className="bg-slate-900/40 rounded-3xl p-5 border border-slate-800/50 group space-y-4 transition-all hover:bg-slate-800/40">
                    <div className="flex gap-4 items-center">
                        <div className="w-20 aspect-[4/5] rounded-xl overflow-hidden relative shrink-0 shadow-lg">
                        {media.type === 'video' ? (
                            <video src={media.url} className="w-full h-full object-cover" />
                        ) : (
                            <img src={media.url} className="w-full h-full object-cover" />
                        )}
                        <button onClick={() => setState(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><i className="fa-solid fa-trash-can"></i></button>
                        <div className="absolute top-1 left-1 bg-black/50 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white backdrop-blur-sm">
                            {media.type}
                        </div>
                        </div>
                        <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                            <i className="fa-solid fa-stopwatch text-slate-500 text-xs"></i>
                            <input 
                            type="number" 
                            step="0.1" 
                            value={media.duration} 
                            max={media.type === 'video' ? media.originalDuration : undefined}
                            onChange={(e) => {
                                const newDur = parseFloat(e.target.value);
                                if (media.type === 'video') {
                                    const maxPossible = (media.originalDuration || 0) - (media.trimStart || 0);
                                    const clampedDur = Math.min(newDur, maxPossible);
                                    updateImage(idx, { 
                                        duration: clampedDur,
                                        trimEnd: (media.trimStart || 0) + clampedDur
                                    });
                                } else {
                                    updateImage(idx, { duration: newDur });
                                }
                            }} 
                            className="w-20 bg-slate-800 border-none rounded-lg text-xs font-bold text-pink-400 p-2 outline-none" 
                            />
                            <span className="text-[10px] font-black text-slate-600 uppercase">Seconds</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase px-1">Transition</label>
                            <select 
                            value={media.transition}
                            onChange={(e) => updateImage(idx, { transition: e.target.value as any })}
                            className="w-full bg-slate-800 border-none rounded-lg text-[10px] font-bold text-slate-300 p-2 outline-none cursor-pointer hover:bg-slate-700"
                            >
                            {transitions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-600 uppercase px-1">Scale: {media.scale.toFixed(1)}x</label>
                                <input type="range" min="0.5" max="3" step="0.1" value={media.scale} onChange={(e) => updateImage(idx, { scale: parseFloat(e.target.value) })} className="w-full h-1 accent-pink-500" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-600 uppercase px-1">Y Offset: {media.offsetY}px</label>
                                <input type="range" min="-500" max="500" step="1" value={media.offsetY} onChange={(e) => updateImage(idx, { offsetY: parseInt(e.target.value) })} className="w-full h-1 accent-pink-500" />
                            </div>
                        </div>
                        </div>
                    </div>

                    {media.type === 'video' && (
                        <div className="pt-3 border-t border-slate-800/50 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                                    <i className={`fa-solid ${media.audioEnabled ? 'fa-volume-high text-indigo-500' : 'fa-volume-xmark text-red-500'}`}></i>
                                    Original Audio
                                </label>
                                <button 
                                    onClick={() => updateImage(idx, { audioEnabled: !media.audioEnabled })}
                                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter transition-all ${media.audioEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                                >
                                    {media.audioEnabled ? 'MUTED OFF' : 'MUTE CLIP'}
                                </button>
                            </div>
                            {media.audioEnabled && (
                                <div className="flex items-center gap-3 px-1 animate-in slide-in-from-top-2">
                                    <span className="text-[9px] font-bold text-slate-500 w-8">VOL</span>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1" 
                                        step="0.05" 
                                        value={media.volume} 
                                        onChange={(e) => updateImage(idx, { volume: parseFloat(e.target.value) })} 
                                        className="flex-1 accent-indigo-500" 
                                    />
                                    <span className="text-[9px] font-bold text-indigo-400">{Math.round(media.volume * 100)}%</span>
                                </div>
                            )}

                            <div className="space-y-3 pt-2 border-t border-slate-800/30">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Video Trim</span>
                                    <span className="text-[9px] font-bold text-pink-400">
                                        {formatTime(media.trimStart || 0)} - {formatTime(media.trimEnd || media.originalDuration || 0)}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[8px] font-bold text-slate-600 w-8 uppercase">Start</span>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max={media.originalDuration || 0} 
                                            step="0.1" 
                                            value={media.trimStart || 0} 
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                const safeVal = Math.min(val, (media.trimEnd || media.originalDuration || 0) - 0.1);
                                                updateImage(idx, { 
                                                    trimStart: safeVal,
                                                    duration: (media.trimEnd || media.originalDuration || 0) - safeVal
                                                });
                                            }} 
                                            className="flex-1 accent-pink-500" 
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[8px] font-bold text-slate-600 w-8 uppercase">End</span>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max={media.originalDuration || 0} 
                                            step="0.1" 
                                            value={media.trimEnd || media.originalDuration || 0} 
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                const safeVal = Math.max(val, (media.trimStart || 0) + 0.1);
                                                updateImage(idx, { 
                                                    trimEnd: safeVal,
                                                    duration: safeVal - (media.trimStart || 0)
                                                });
                                            }} 
                                            className="flex-1 accent-pink-500" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                  </div>
                ))}
                <label className="w-full py-8 rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center cursor-pointer hover:border-pink-500/50 hover:bg-pink-500/5 transition-all">
                  <i className="fa-solid fa-film text-2xl text-slate-600 mb-2"></i>
                  <span className="text-[10px] font-black uppercase text-slate-500">Add Slide</span>
                  <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
                </label>
              </div>
            </section>
            
            <section className="space-y-4 pt-4 border-t border-slate-800/50">
              <h3 className="text-sm font-black uppercase tracking-widest text-violet-500">Audio Highlighting</h3>
              
              <div className="space-y-4">
                <label className="w-full p-5 bg-slate-900 border border-slate-800 rounded-[1.5rem] flex items-center gap-4 cursor-pointer hover:bg-slate-800 transition-all border-dashed">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${state.audioUrl ? 'bg-violet-600 shadow-lg shadow-violet-500/20' : 'bg-slate-800'}`}>
                    <i className={`fa-solid ${state.audioUrl ? 'fa-music' : 'fa-upload'}`}></i>
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-xs font-black text-white truncate uppercase tracking-tight">{state.audioName || 'BACKGROUND MUSIC'}</p>
                    {state.audioUrl && <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase">Syncing to Reel Length</p>}
                  </div>
                  <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudioUpload(e.target.files?.[0] || null)} />
                </label>

                {state.audioUrl && (
                  <div className="space-y-4 animate-in slide-in-from-top-4">
                    <div className="bg-slate-900/60 p-5 rounded-3xl border border-violet-500/20 space-y-5">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-violet-400 tracking-widest">Precision Crop (Song Start)</span>
                            <span className="text-[18px] font-black text-white">{formatTime(state.audioTrim.start)}</span>
                          </div>
                          <div className="flex gap-2">
                             <button 
                                onClick={() => setState(prev => ({ ...prev, vocalIsolationEnabled: !prev.vocalIsolationEnabled }))}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 ${state.vocalIsolationEnabled ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                                title="Filters out instruments to highlight only the singer's voice"
                             >
                                <i className="fa-solid fa-microphone-lines"></i>
                                {state.vocalIsolationEnabled ? 'SINGER ONLY' : 'VOCAL MODE'}
                             </button>
                             <button 
                                onClick={() => setState(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }))}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${state.musicEnabled ? 'bg-violet-600 text-white' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}
                             >
                                <i className={`fa-solid ${state.musicEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
                             </button>
                          </div>
                        </div>

                        <div className="relative pt-2 pb-6 px-1">
                          <input 
                            type="range" 
                            min="0" 
                            max={state.audioDuration} 
                            step="0.01"
                            value={state.audioTrim.start} 
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              const maxStart = Math.max(0, state.audioDuration - totalReelDuration);
                              const safeVal = Math.min(val, maxStart);
                              setState(prev => ({ 
                                ...prev, 
                                audioTrim: { ...prev.audioTrim, start: safeVal } 
                              }));
                            }}
                            className="w-full h-2 accent-violet-500 appearance-none bg-slate-800 rounded-full cursor-pointer" 
                          />
                        </div>

                        <div className="space-y-4 pt-2">
                          <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Background Volume</span>
                              <span className="text-[10px] font-black text-violet-400">{Math.round(state.musicVolume * 100)}%</span>
                          </div>
                          <input 
                              type="range" 
                              min="0" 
                              max="1" 
                              step="0.01" 
                              value={state.musicVolume} 
                              onChange={(e) => setState(prev => ({ ...prev, musicVolume: parseFloat(e.target.value) }))} 
                              className="w-full accent-violet-500" 
                          />
                          
                          <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Playback Speed</span>
                              <span className="text-[10px] font-black text-violet-400">{state.musicPlaybackRate.toFixed(1)}x</span>
                          </div>
                          <input 
                              type="range" 
                              min="0.5" 
                              max="1.5" 
                              step="0.1" 
                              value={state.musicPlaybackRate} 
                              onChange={(e) => setState(prev => ({ ...prev, musicPlaybackRate: parseFloat(e.target.value) }))} 
                              className="w-full accent-violet-500" 
                          />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Highlight & Mute Zones</h4>
                            <button 
                                onClick={addVolumeHighlight}
                                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[8px] font-black uppercase rounded-lg shadow-lg transition-all flex items-center gap-2"
                            >
                                <i className="fa-solid fa-plus"></i> Add Highlight
                            </button>
                        </div>
                        
                        {state.musicHighlights.length === 0 && (
                            <div className="p-8 border-2 border-dashed border-slate-800 rounded-3xl text-center">
                                <p className="text-[9px] font-bold text-slate-600 uppercase">No highlights set. Music volume remains constant.</p>
                            </div>
                        )}

                        {state.musicHighlights.map((h) => (
                            <div key={h.id} className={`bg-slate-900/80 p-4 rounded-3xl border transition-all ${currentTime >= h.start && currentTime <= h.end ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-slate-800'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black text-violet-500 flex items-center gap-2 uppercase tracking-tight">
                                        <i className={`fa-solid ${h.volume === 0 ? 'fa-volume-mute text-red-500' : 'fa-bolt'}`}></i> 
                                        {h.volume === 0 ? 'Mute Zone' : 'Highlight Zone'}
                                    </span>
                                    <button 
                                        onClick={() => setState(prev => ({ ...prev, musicHighlights: prev.musicHighlights.filter(x => x.id !== h.id) }))}
                                        className="text-slate-600 hover:text-red-500 transition-colors"
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-600 uppercase">In: {h.start.toFixed(1)}s</label>
                                        <input type="range" min="0" max={totalReelDuration} step="0.1" value={h.start} onChange={(e) => updateHighlight(h.id, { start: parseFloat(e.target.value) })} className="w-full accent-slate-700" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-600 uppercase">Out: {h.end.toFixed(1)}s</label>
                                        <input type="range" min="0" max={totalReelDuration} step="0.1" value={h.end} onChange={(e) => updateHighlight(h.id, { end: parseFloat(e.target.value) })} className="w-full accent-slate-700" />
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-4">
                                    <span className="text-[8px] font-black text-slate-600 uppercase shrink-0">Volume Multiplier</span>
                                    <input type="range" min="0" max="3" step="0.1" value={h.volume} onChange={(e) => updateHighlight(h.id, { volume: parseFloat(e.target.value) })} className="flex-1 accent-violet-500" />
                                    <span className={`text-[10px] font-black ${h.volume === 0 ? 'text-red-500' : 'text-violet-400'}`}>{Math.round(h.volume * 100)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button 
                      onClick={() => setState(prev => ({ ...prev, audioUrl: null, audioName: null, musicHighlights: [], musicEnabled: true, musicPlaybackRate: 1.0, vocalIsolationEnabled: false }))}
                      className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-red-500/20"
                    >
                      Clear All Audio Settings
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'lyrics' && (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
            <section className="space-y-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-500">Telugu Lyric Sync (తెలుగు)</h3>
              <p className="text-[11px] text-slate-400 italic font-medium leading-relaxed">Generated lyrics will be strictly in Telugu script with emojis. Set start/end points during preview.</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Song name (e.g. Srivalli, Butta Bomma...)" 
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all text-white"
                  value={state.songTitle}
                  onChange={(e) => setState(prev => ({ ...prev, songTitle: e.target.value }))}
                />
                <button onClick={generateLyrics} disabled={!state.songTitle} className="px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase text-white shadow-lg disabled:opacity-30 flex items-center gap-2">
                  <i className="fa-solid fa-sparkles text-[10px]"></i> AI Sync
                </button>
              </div>
            </section>

            <section className="space-y-3">
              {state.lyrics.map((l, i) => (
                <div key={i} className={`bg-slate-900/60 p-5 rounded-3xl border transition-all ${currentTime >= l.startTime && currentTime <= l.endTime ? 'border-pink-500 shadow-xl shadow-pink-500/10' : 'border-slate-800'}`}>
                  <textarea 
                    value={l.text}
                    onChange={(e) => updateLyric(i, { text: e.target.value })}
                    className="w-full bg-slate-800/40 rounded-xl p-5 border border-slate-700/50 text-[16px] leading-[1.6] font-bold text-white resize-y min-h-[6rem] outline-none custom-scrollbar focus:border-indigo-500 transition-colors"
                    placeholder="లిరిక్స్ ఇక్కడ రాయండి..."
                    style={{ fontFamily: state.lyricStyle.fontFamily }}
                  />
                  <div className="flex items-center gap-2 mt-4">
                    <button 
                      onClick={() => updateLyric(i, { startTime: currentTime })}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${l.startTime > 0 ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-slate-800 text-slate-400 hover:bg-indigo-600 hover:text-white'}`}
                    >
                      {l.startTime > 0 ? `In: ${l.startTime.toFixed(1)}s` : 'Set Start'}
                    </button>
                    <button 
                      onClick={() => updateLyric(i, { endTime: currentTime })}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${l.endTime > 0 ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'bg-slate-800 text-slate-400 hover:bg-pink-600 hover:text-white'}`}
                    >
                      {l.endTime > 0 ? `Out: ${l.endTime.toFixed(1)}s` : 'Set End'}
                    </button>
                    <button onClick={() => setState(prev => ({ ...prev, lyrics: prev.lyrics.filter((_, idx) => idx !== i) }))} className="p-3 text-slate-700 hover:text-red-500"><i className="fa-solid fa-trash-can text-sm"></i></button>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setState(prev => ({ ...prev, lyrics: [...prev.lyrics, { text: 'కొత్త లైన్ ఇక్కడ ✨', startTime: 0, endTime: 0 }] }))}
                className="w-full py-5 border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 font-black uppercase text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
              >
                <i className="fa-solid fa-plus"></i> లైన్ జోడించు
              </button>
            </section>
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-8 animate-in slide-in-from-right duration-300 pb-10">
            <section className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500">Visual Styling</h3>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-1">Telugu Specialized Fonts</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                  {[...teluguFonts, ...latinFonts].map(font => (
                    <button key={font} onClick={() => updateLyricStyle({ fontFamily: font })} className={`p-4 rounded-2xl text-[11px] font-bold truncate border transition-all ${state.lyricStyle.fontFamily === font ? 'bg-emerald-600 border-emerald-500 text-white shadow-md' : 'bg-slate-900 border-slate-800 text-slate-500'}`} style={{ fontFamily: font }}>{font}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500">Text Color</label>
                    <input type="color" value={state.lyricStyle.color} onChange={(e) => updateLyricStyle({ color: e.target.value })} className="w-full h-12 rounded-xl bg-slate-900 border-none cursor-pointer p-1" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500">Gradient Fill</label>
                    <button onClick={() => updateLyricStyle({ gradient: !state.lyricStyle.gradient })} className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase border transition-all ${state.lyricStyle.gradient ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500'}`}>{state.lyricStyle.gradient ? 'ACTIVE' : 'OFF'}</button>
                  </div>
                </div>
                
                {state.lyricStyle.gradient && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase text-slate-600">Color 1</label>
                      <input type="color" value={state.lyricStyle.gradientColors[0]} onChange={(e) => updateLyricStyle({ gradientColors: [e.target.value, state.lyricStyle.gradientColors[1]] })} className="w-full h-10 rounded-lg bg-slate-800 border-none cursor-pointer p-1" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase text-slate-600">Color 2</label>
                      <input type="color" value={state.lyricStyle.gradientColors[1]} onChange={(e) => updateLyricStyle({ gradientColors: [state.lyricStyle.gradientColors[0], e.target.value] })} className="w-full h-10 rounded-lg bg-slate-800 border-none cursor-pointer p-1" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500">Neon Glow</label>
                    <input type="color" value={state.lyricStyle.glowColor} onChange={(e) => updateLyricStyle({ glowColor: e.target.value })} className="w-full h-12 rounded-xl bg-slate-900 border-none cursor-pointer p-1" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500">Glow Force</label>
                    <input type="range" min="0" max="80" value={state.lyricStyle.glowIntensity} onChange={(e) => updateLyricStyle({ glowIntensity: parseInt(e.target.value) })} className="w-full accent-emerald-500 h-12" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-500">Text Stroke / Outline</label>
                    <button onClick={() => updateLyricStyle({ stroke: !state.lyricStyle.stroke })} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${state.lyricStyle.stroke ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-500'}`}>{state.lyricStyle.stroke ? 'ON' : 'OFF'}</button>
                  </div>
                  {state.lyricStyle.stroke && (
                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-slate-600">Outline Color</label>
                        <input type="color" value={state.lyricStyle.strokeColor} onChange={(e) => updateLyricStyle({ strokeColor: e.target.value })} className="w-full h-10 rounded-lg bg-slate-800 border-none cursor-pointer p-1" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-slate-600">Width: {state.lyricStyle.strokeWidth}px</label>
                        <input type="range" min="1" max="15" value={state.lyricStyle.strokeWidth} onChange={(e) => updateLyricStyle({ strokeWidth: parseInt(e.target.value) })} className="w-full accent-emerald-500 h-10" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500">Text Animation</h3>
              <div className="grid grid-cols-3 gap-3">
                {animations.map(anim => (
                  <button 
                    key={anim.value}
                    onClick={() => updateLyricStyle({ animation: anim.value })}
                    className={`p-4 rounded-2xl flex flex-col items-center gap-2 border transition-all ${state.lyricStyle.animation === anim.value ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-emerald-500/30'}`}
                  >
                    <i className={`fa-solid ${anim.icon} text-lg`}></i>
                    <span className="text-[8px] font-black uppercase tracking-tighter">{anim.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500">Layout Metrics</h3>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500"><span>Font Size</span><span className="text-emerald-500">{state.lyricStyle.fontSize}px</span></div>
                    <input type="range" min="20" max="180" value={state.lyricStyle.fontSize} onChange={(e) => updateLyricStyle({ fontSize: parseInt(e.target.value) })} className="w-full accent-emerald-500" />
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500"><span>Line Gap</span><span className="text-emerald-500">{state.lyricStyle.lineGap}x</span></div>
                    <input type="range" min="0.5" max="4" step="0.1" value={state.lyricStyle.lineGap} onChange={(e) => updateLyricStyle({ lineGap: parseFloat(e.target.value) })} className="w-full accent-emerald-500" />
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500"><span>Vertical Pos</span><span className="text-emerald-500">{state.lyricStyle.verticalPosition}%</span></div>
                    <input type="range" min="0" max="100" value={state.lyricStyle.verticalPosition} onChange={(e) => updateLyricStyle({ verticalPosition: parseInt(e.target.value) })} className="w-full accent-emerald-500" />
                 </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="space-y-8 animate-in slide-in-from-right duration-300 pb-10">
             <section className="space-y-5">
               <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">Logo Management</h3>
               <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800 space-y-6">
                 <div className="flex gap-4 items-center">
                    <label className="w-24 h-24 bg-slate-800 rounded-2xl flex items-center justify-center cursor-pointer border border-slate-700 overflow-hidden shrink-0 group hover:border-amber-500 transition-all">
                      {state.logo ? <img src={state.logo} className="w-full h-full object-contain" /> : <i className="fa-solid fa-plus text-slate-500 text-xl"></i>}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0];
                        if(f) {
                          const r = new FileReader();
                          r.onload = (ev) => setState(prev => ({ ...prev, logo: ev.target?.result as string }));
                          r.readAsDataURL(f);
                        }
                      }} />
                    </label>
                    <div className="flex-1 space-y-3">
                       <p className="text-[10px] font-black uppercase text-slate-500">Scale: {state.logoPosition.size}px</p>
                       <input type="range" min="40" max="600" value={state.logoPosition.size} onChange={(e) => updateLogoPosition({ size: parseInt(e.target.value) })} className="w-full accent-amber-500" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-500">Logo X (%)</label>
                       <input type="range" min="0" max="100" value={state.logoPosition.x} onChange={(e) => updateLogoPosition({ x: parseInt(e.target.value) })} className="w-full accent-amber-500" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-500">Logo Y (%)</label>
                       <input type="range" min="0" max="100" value={state.logoPosition.y} onChange={(e) => updateLogoPosition({ y: parseInt(e.target.value) })} className="w-full accent-amber-500" />
                    </div>
                 </div>
                 {state.logo && <button onClick={() => setState(prev => ({ ...prev, logo: null }))} className="w-full py-3.5 bg-red-600/10 border border-red-600/30 text-red-500 text-[10px] font-black uppercase rounded-xl hover:bg-red-600 hover:text-white transition-all">Discard Logo</button>}
               </div>
             </section>

             <section className="space-y-5">
               <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">Watermark Label</h3>
               <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500">Custom Text</label>
                    <input type="text" value={state.watermark.text} onChange={(e) => updateWatermark({ text: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-xs font-black text-amber-500 outline-none focus:border-amber-500" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500">Color</label>
                        <input type="color" value={state.watermark.color} onChange={(e) => updateWatermark({ color: e.target.value })} className="w-full h-12 rounded-xl bg-slate-900 border-none cursor-pointer p-1" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500">Font Size</label>
                        <input type="range" min="10" max="120" value={state.watermark.size} onChange={(e) => updateWatermark({ size: parseInt(e.target.value) })} className="w-full accent-amber-500 h-12" />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500">Pos X (%)</label>
                        <input type="range" min="0" max="100" value={state.watermark.x} onChange={(e) => updateWatermark({ x: parseInt(e.target.value) })} className="w-full accent-amber-500" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500">Pos Y (%)</label>
                        <input type="range" min="0" max="100" value={state.watermark.y} onChange={(e) => updateWatermark({ y: parseInt(e.target.value) })} className="w-full accent-amber-500" />
                     </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500"><span>Transparency</span><span className="text-amber-500">{Math.round(state.watermark.opacity * 100)}%</span></div>
                    <input type="range" min="0" max="1" step="0.1" value={state.watermark.opacity} onChange={(e) => updateWatermark({ opacity: parseFloat(e.target.value) })} className="w-full accent-amber-500" />
                  </div>
               </div>
             </section>

             <section className="space-y-5">
               <h3 className="text-sm font-black uppercase tracking-widest text-pink-500">Stickers & Overlays</h3>
               <div className="space-y-4">
                 <label className="w-full py-6 rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center cursor-pointer hover:border-pink-500/50 hover:bg-pink-500/5 transition-all">
                   <i className="fa-solid fa-face-smile text-2xl text-slate-600 mb-2"></i>
                   <span className="text-[10px] font-black uppercase text-slate-500">Add Sticker</span>
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                     const f = e.target.files?.[0];
                     if(f) {
                       const r = new FileReader();
                       r.onload = (ev) => {
                         const newSticker = {
                           id: Math.random().toString(36).substr(2, 9),
                           url: ev.target?.result as string,
                           x: 50,
                           y: 50,
                           width: 200,
                          height: 200,
                           rotation: 0,
                           opacity: 1
                         };
                         setState(prev => ({ ...prev, stickers: [...prev.stickers, newSticker] }));
                       };
                       r.readAsDataURL(f);
                     }
                   }} />
                 </label>

                 {state.stickers.map(s => (
                   <div key={s.id} className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800 space-y-4">
                     <div className="flex gap-4 items-center">
                       <img src={s.url} className="w-16 h-16 object-contain bg-slate-800 rounded-xl" />
                       <div className="flex-1 space-y-2">
                         <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-slate-500">Width: {Math.round(s.width)}px</span>
                           <button onClick={() => setState(prev => ({ ...prev, stickers: prev.stickers.filter(x => x.id !== s.id) }))} className="text-red-500 hover:text-red-400"><i className="fa-solid fa-trash-can"></i></button>
                         </div>
                         <input type="range" min="20" max="800" value={s.width} onChange={(e) => setState(prev => ({ ...prev, stickers: prev.stickers.map(x => x.id === s.id ? { ...x, width: parseInt(e.target.value) } : x) }))} className="w-full accent-pink-500" />
                         <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-slate-500">Height: {Math.round(s.height)}px</span>
                         </div>
                         <input type="range" min="20" max="800" value={s.height} onChange={(e) => setState(prev => ({ ...prev, stickers: prev.stickers.map(x => x.id === s.id ? { ...x, height: parseInt(e.target.value) } : x) }))} className="w-full accent-pink-500" />
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <label className="text-[8px] font-black text-slate-600 uppercase">Pos X: {s.x}%</label>
                         <input type="range" min="0" max="100" value={s.x} onChange={(e) => setState(prev => ({ ...prev, stickers: prev.stickers.map(x => x.id === s.id ? { ...x, x: parseInt(e.target.value) } : x) }))} className="w-full accent-pink-500" />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[8px] font-black text-slate-600 uppercase">Pos Y: {s.y}%</label>
                         <input type="range" min="0" max="100" value={s.y} onChange={(e) => setState(prev => ({ ...prev, stickers: prev.stickers.map(x => x.id === s.id ? { ...x, y: parseInt(e.target.value) } : x) }))} className="w-full accent-pink-500" />
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <label className="text-[8px] font-black text-slate-600 uppercase">Rotation: {s.rotation}°</label>
                         <input type="range" min="-180" max="180" value={s.rotation} onChange={(e) => setState(prev => ({ ...prev, stickers: prev.stickers.map(x => x.id === s.id ? { ...x, rotation: parseInt(e.target.value) } : x) }))} className="w-full accent-pink-500" />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[8px] font-black text-slate-600 uppercase">Opacity: {Math.round(s.opacity * 100)}%</label>
                         <input type="range" min="0" max="1" step="0.1" value={s.opacity} onChange={(e) => setState(prev => ({ ...prev, stickers: prev.stickers.map(x => x.id === s.id ? { ...x, opacity: parseFloat(e.target.value) } : x) }))} className="w-full accent-pink-500" />
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </section>
          </div>
        )}
      </div>

      <div className="p-7 bg-slate-900/50 border-t border-slate-800">
        <button 
          onClick={handleExport}
          disabled={state.images.length === 0}
          className="w-full py-5 rounded-[2.5rem] bg-gradient-to-r from-pink-600 via-indigo-600 to-violet-600 text-white font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] disabled:opacity-30"
        >
          Render Full Reel
        </button>
      </div>
    </div>
  );
};

export default EditorPanel;
