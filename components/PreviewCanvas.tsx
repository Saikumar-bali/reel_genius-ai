
import React, { useRef, useEffect } from 'react';
import { ReelState, ReelMedia, TransitionType } from '../types';

interface PreviewCanvasProps {
  state: ReelState;
  currentTime: number;
  isPlaying: boolean;
  audioContext: AudioContext | null;
  audioDestination: AudioNode | null;
}

const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ state, currentTime, isPlaying, audioContext, audioDestination }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const videoCache = useRef<Map<string, HTMLVideoElement>>(new Map());
  const videoSourceNodes = useRef<Map<string, MediaElementAudioSourceNode>>(new Map());

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    if (imageCache.current.has(src)) return Promise.resolve(imageCache.current.get(src)!);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        imageCache.current.set(src, img);
        resolve(img);
      };
      img.src = src;
    });
  };

  const loadVideo = (src: string): Promise<HTMLVideoElement> => {
    const connectAudio = (video: HTMLVideoElement) => {
      if (audioContext && audioDestination && !videoSourceNodes.current.has(src)) {
        try {
          const source = audioContext.createMediaElementSource(video);
          source.connect(audioDestination);
          videoSourceNodes.current.set(src, source);
        } catch (e) {
          console.warn('Failed to connect video audio to context:', e);
        }
      }
    };

    if (videoCache.current.has(src)) {
      const video = videoCache.current.get(src)!;
      connectAudio(video);
      return Promise.resolve(video);
    }

    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = src;
      video.muted = false; // We control volume via state
      video.loop = false;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.onloadedmetadata = () => {
        videoCache.current.set(src, video);
        connectAudio(video);
        resolve(video);
      };
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = async () => {
      const { width, height } = canvas;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Background Media Transitions
      if (state.images.length > 0) {
        let accumulatedTime = 0;
        let activeIndex = 0;
        for (let i = 0; i < state.images.length; i++) {
          const nextAccumulated = accumulatedTime + state.images[i].duration;
          if (currentTime < nextAccumulated) {
            activeIndex = i;
            break;
          }
          accumulatedTime = nextAccumulated;
        }

        const currentMedia = state.images[activeIndex];
        const nextMediaIndex = (activeIndex + 1) % state.images.length;
        const nextMedia = state.images[nextMediaIndex];
        
        const timeInCurrentSlide = currentTime - accumulatedTime;
        const progressInSlide = timeInCurrentSlide / currentMedia.duration;
        const transitionDuration = 0.8;
        const transitionThreshold = Math.max(0, currentMedia.duration - transitionDuration) / currentMedia.duration;

        const drawMediaCover = async (
          media: ReelMedia, 
          alpha: number, 
          scaleFactor: number = 1, 
          offsetX: number = 0, 
          offsetY: number = 0,
          blur: number = 0,
          mediaTime: number = 0,
          isActive: boolean = false
        ) => {
          ctx.save();
          ctx.globalAlpha = alpha;
          
          const mScale = (media.scale || 1) * scaleFactor;
          const mOffsetY = (media.offsetY || 0) + offsetY;

          let source: CanvasImageSource;
          let sWidth, sHeight;

          if (media.type === 'video') {
            const video = await loadVideo(media.url);
            
            // Apply volume settings
            video.muted = !media.audioEnabled;
            video.volume = media.volume;

            const trimStart = media.trimStart || 0;
            const trimEnd = media.trimEnd || media.originalDuration || video.duration;
            const slideDuration = media.duration;
            
            const desiredTime = trimStart + (mediaTime % slideDuration);
            
            if (Math.abs(video.currentTime - desiredTime) > 0.15) {
              video.currentTime = desiredTime;
            }

            if (isPlaying && isActive && video.paused) {
              video.play().catch(() => {});
            } else if ((!isPlaying || !isActive) && !video.paused) {
              video.pause();
            }

            source = video;
            sWidth = video.videoWidth;
            sHeight = video.videoHeight;
          } else {
            const img = await loadImage(media.url);
            source = img;
            sWidth = img.width;
            sHeight = img.height;
          }

          const mediaAspect = sWidth / sHeight;
          const canvasAspect = width / height;

          // If media is horizontal and we want "clear view", 
          // we draw a blurred background + contained foreground
          if (mediaAspect > canvasAspect + 0.1) {
            // 1. Draw blurred background (cover)
            ctx.save();
            ctx.filter = `blur(${blur + 40}px) brightness(0.6)`;
            const bgRatio = Math.max(width / sWidth, height / sHeight);
            const bgW = sWidth * bgRatio * mScale;
            const bgH = sHeight * bgRatio * mScale;
            ctx.drawImage(source, (width - bgW) / 2 + offsetX, (height - bgH) / 2 + mOffsetY, bgW, bgH);
            ctx.restore();
 
            // 2. Draw sharp foreground (contain)
            ctx.save();
            if (blur > 0) ctx.filter = `blur(${blur}px)`;
            const fgRatio = width / sWidth;
            const fgW = sWidth * fgRatio * mScale;
            const fgH = sHeight * fgRatio * mScale;
            ctx.drawImage(source, (width - fgW) / 2 + offsetX, (height - fgH) / 2 + mOffsetY, fgW, fgH);
            ctx.restore();
          } else {
            // Standard cover behavior for vertical/square media
            if (blur > 0) ctx.filter = `blur(${blur}px)`;
            const ratio = Math.max(width / sWidth, height / sHeight);
            const w = sWidth * ratio * mScale;
            const h = sHeight * ratio * mScale;
            const x = (width - w) / 2 + offsetX;
            const y = (height - h) / 2 + mOffsetY;
            ctx.drawImage(source, x, y, w, h);
          }
          
          ctx.restore();
        };

        // Clean up: Pause all videos that are NOT the active index to save resources
        videoCache.current.forEach((video, url) => {
          if (url !== currentMedia.url && !video.paused) {
            video.pause();
          }
        });

        if (progressInSlide > transitionThreshold && state.images.length > 1) {
          const t = (progressInSlide - transitionThreshold) / (1 - transitionThreshold); 
          const transition = currentMedia.transition || 'fade';

          if (transition === 'fade') {
            await drawMediaCover(currentMedia, 1 - t, 1, 0, 0, 0, timeInCurrentSlide, true);
            await drawMediaCover(nextMedia, t, 1, 0, 0, 0, 0, false);
          } else if (transition === 'zoom-in') {
            await drawMediaCover(currentMedia, 1 - t, 1 + t * 0.2, 0, 0, 0, timeInCurrentSlide, true);
            await drawMediaCover(nextMedia, t, 0.8 + t * 0.2, 0, 0, 0, 0, false);
          } else if (transition === 'zoom-out') {
            await drawMediaCover(currentMedia, 1 - t, 1 - t * 0.2, 0, 0, 0, timeInCurrentSlide, true);
            await drawMediaCover(nextMedia, t, 1.2 - t * 0.2, 0, 0, 0, 0, false);
          } else if (transition === 'slide-left') {
            await drawMediaCover(currentMedia, 1, 1, -t * width, 0, 0, timeInCurrentSlide, true);
            await drawMediaCover(nextMedia, 1, 1, width - t * width, 0, 0, 0, false);
          } else if (transition === 'slide-right') {
            await drawMediaCover(currentMedia, 1, 1, t * width, 0, 0, timeInCurrentSlide, true);
            await drawMediaCover(nextMedia, 1, 1, -width + t * width, 0, 0, 0, false);
          } else if (transition === 'blur') {
            await drawMediaCover(currentMedia, 1 - t, 1, 0, 0, t * 20, timeInCurrentSlide, true);
            await drawMediaCover(nextMedia, t, 1, 0, 0, (1 - t) * 20, 0, false);
          }
        } else {
          await drawMediaCover(currentMedia, 1, 1, 0, 0, 0, timeInCurrentSlide, true);
        }
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Logo Overlay
      if (state.logo) {
        const logoImg = await loadImage(state.logo);
        ctx.save();
        ctx.globalAlpha = 1.0;
        const lx = (width * state.logoPosition.x) / 100;
        const ly = (height * state.logoPosition.y) / 100;
        const lSize = state.logoPosition.size;
        ctx.drawImage(logoImg, lx - lSize/2, ly - lSize/2, lSize, lSize);
        ctx.restore();
      }

      // 3. Watermark
      if (state.watermark.text) {
        ctx.save();
        ctx.globalAlpha = state.watermark.opacity;
        ctx.fillStyle = state.watermark.color;
        ctx.font = `bold ${state.watermark.size}px Inter`;
        ctx.textAlign = state.watermark.textAlign;
        
        const wx = (width * state.watermark.x) / 100;
        const wy = (height * state.watermark.y) / 100;
        ctx.fillText(state.watermark.text.toUpperCase(), wx, wy);
        ctx.restore();
      }

      // 4. Stickers
      if (state.stickers && state.stickers.length > 0) {
        for (const sticker of state.stickers) {
          const stickerImg = await loadImage(sticker.url);
          ctx.save();
          ctx.globalAlpha = sticker.opacity;
          const sx = (width * sticker.x) / 100;
          const sy = (height * sticker.y) / 100;
          ctx.translate(sx, sy);
          ctx.rotate((sticker.rotation * Math.PI) / 180);
          ctx.drawImage(stickerImg, -sticker.width / 2, -sticker.height / 2, sticker.width, sticker.height);
          ctx.restore();
        }
      }

      // 5. Lyrics Engine
      const activeLyric = state.lyrics.find(l => currentTime >= l.startTime && currentTime <= l.endTime);
      if (activeLyric) {
        const { lyricStyle } = state;
        const fontStr = `bold ${lyricStyle.fontSize}px "${lyricStyle.fontFamily}", sans-serif`;
        try { await document.fonts.load(fontStr); } catch (e) {}

        const animDuration = 0.5;
        const segmentTime = currentTime - activeLyric.startTime;
        
        let alpha = 1;
        let scale = 1;
        let yOffset = 0;
        let rotation = 0;
        let charLimit = activeLyric.text.length;

        if (segmentTime < animDuration) {
          const t = segmentTime / animDuration;
          if (lyricStyle.animation === 'fade') alpha = t;
          else if (lyricStyle.animation === 'slide-up') { yOffset = (1 - t) * 60; alpha = t; }
          else if (lyricStyle.animation === 'scale') { scale = 0.5 + (t * 0.5); alpha = t; }
          else if (lyricStyle.animation === 'typewriter') charLimit = Math.floor(t * activeLyric.text.length);
          else if (lyricStyle.animation === 'rotate') { rotation = (1 - t) * Math.PI / 4; alpha = t; scale = 0.5 + (t * 0.5); }
        }

        if (lyricStyle.animation === 'float') yOffset += Math.sin(currentTime * 3) * 20;
        else if (lyricStyle.animation === 'bounce') yOffset += Math.abs(Math.sin(currentTime * 5)) * -40;
        else if (lyricStyle.animation === 'glow-pulse') {
          const pulse = (Math.sin(currentTime * 6) + 1) / 2;
          ctx.shadowBlur = lyricStyle.glowIntensity * (0.8 + pulse * 0.4);
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (lyricStyle.glowIntensity > 0) {
          ctx.shadowColor = lyricStyle.glowColor;
          ctx.shadowBlur = lyricStyle.glowIntensity;
        } else if (lyricStyle.shadow) {
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = 15;
          ctx.shadowOffsetY = 6;
        }

        ctx.font = fontStr;
        ctx.textAlign = lyricStyle.textAlign;

        const displayText = lyricStyle.animation === 'typewriter' ? activeLyric.text.slice(0, charLimit) : activeLyric.text;
        const lines = [];
        const words = displayText.split(' ');
        let currentLine = '';
        for (let word of words) {
          const test = currentLine + word + ' ';
          if (ctx.measureText(test).width > width - 120) {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
          } else {
            currentLine = test;
          }
        }
        lines.push(currentLine.trim());

        const baseLineHeight = lyricStyle.fontSize * lyricStyle.lineGap;
        const startY = (height * lyricStyle.verticalPosition / 100) + yOffset;
        const startX = lyricStyle.textAlign === 'center' ? width / 2 : (lyricStyle.textAlign === 'left' ? 60 : width - 60);

        ctx.translate(startX, startY);
        ctx.scale(scale, scale);
        ctx.rotate(rotation);
        ctx.translate(-startX, -startY);

        lines.forEach((l, i) => {
          const lineY = startY + (i * baseLineHeight);
          if (lyricStyle.stroke) {
            ctx.strokeStyle = lyricStyle.strokeColor;
            ctx.lineWidth = lyricStyle.strokeWidth;
            ctx.strokeText(l, startX, lineY);
          }
          if (lyricStyle.gradient) {
            const grad = ctx.createLinearGradient(startX - 200, lineY - 60, startX + 200, lineY + 60);
            grad.addColorStop(0, lyricStyle.gradientColors[0]);
            grad.addColorStop(1, lyricStyle.gradientColors[1]);
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = lyricStyle.color;
          }
          ctx.fillText(l, startX, lineY);
        });
        ctx.restore();
      }
    };

    render();
  }, [state, currentTime, isPlaying]);

  return <canvas id="reel-preview-canvas" ref={canvasRef} width={1080} height={1920} className="w-full h-full object-cover" />;
};

export default PreviewCanvas;
