
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Lock, Download, Youtube, Bell, CheckCircle, Eye, Zap, AlertTriangle } from 'lucide-react';
import { PlayerState, YouTubePlayer } from './types';

// CONFIGURATION
const VIDEO_ID = 'vm_spvQSRYE'; 
const CHANNEL_NAME = 'junglebootz'; 
const PDF_URL = 'https://drive.google.com/file/d/1WNhdoPmArlx5qwNHXAkYFfnUlF0kLsUq/view?usp=sharing';
const REQUIRED_WATCH_TIME = 60; // Seconds
const STORAGE_KEY = 'intel_portal_watch_time';

const App: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<number>(REQUIRED_WATCH_TIME);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [showSubscribeReminder, setShowSubscribeReminder] = useState<boolean>(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  
  const playerRef = useRef<YouTubePlayer | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  // Ref for the container where we will inject the player
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedTime = localStorage.getItem(STORAGE_KEY);
    if (savedTime) {
      const parsed = parseInt(savedTime, 10);
      if (parsed <= 0) {
        setTimeLeft(0);
        setIsUnlocked(true);
      } else {
        setTimeLeft(parsed);
      }
    }
  }, []);

  // Save progress to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, timeLeft.toString());
    if (timeLeft <= 0 && !isUnlocked) {
      setIsUnlocked(true);
    }
  }, [timeLeft, isUnlocked]);

  const onPlayerStateChange = useCallback((event: any) => {
    const state = event.data;
    if (state === PlayerState.PLAYING) {
      setIsPlaying(true);
      setShowSubscribeReminder(true);
      setTimeout(() => setShowSubscribeReminder(false), 5000);
      setPlayerError(null);
    } else {
      setIsPlaying(false);
    }
  }, []);

  const onPlayerError = useCallback((event: any) => {
    console.error('YouTube Player Error:', event.data);
    let message = `Error Code: ${event.data}`;
    if (event.data === 150 || event.data === 101) {
      message = "Playback restricted on this domain";
    } else if (event.data === 153) {
       message = "Configuration or origin error";
    }
    setPlayerError(message);
  }, []);

  // Timer logic
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPlaying, timeLeft]);

  // Player Initialization Logic
  const initPlayer = useCallback(() => {
    // If player is already initialized, do nothing
    if (playerRef.current) return;

    // Ensure the container is available
    if (!playerContainerRef.current) return;

    // Check if API is loaded
    if (!window.YT || !window.YT.Player) return;

    try {
      // Create a clean div for the player to replace
      // This is crucial because YT.Player replaces the element
      // and if we unmount/remount, the original element might be gone or reused incorrectly.
      // We clear the container first.
      playerContainerRef.current.innerHTML = '';
      const placeholder = document.createElement('div');
      placeholder.id = 'youtube-player-placeholder';
      playerContainerRef.current.appendChild(placeholder);

      const origin = window.location.origin;
      const playerVars: any = {
        autoplay: 1,
        mute: 1,
        modestbranding: 1,
        rel: 0,
        controls: 1,
        showinfo: 0,
        cc_load_policy: 1,
        enablejsapi: 1,
      };

      // Only add origin if it's a valid http/https URL to avoid issues with file:// or other protocols
      if (origin && (origin.startsWith('http://') || origin.startsWith('https://'))) {
        playerVars.origin = origin;
      }

      playerRef.current = new window.YT.Player(placeholder, {
        height: '100%',
        width: '100%',
        videoId: VIDEO_ID,
        playerVars: playerVars,
        events: {
          onStateChange: onPlayerStateChange,
          onError: onPlayerError,
        },
      });
    } catch (err) {
      console.error('Failed to initialize YT Player:', err);
      setPlayerError('Initialization Failed');
    }
  }, [onPlayerStateChange, onPlayerError]);

  useEffect(() => {
    // If API is already loaded in index.html, it calls this if we define it
    // Or we can check periodically
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Setup the callback for when the API is ready
      // Note: This global callback might be overwritten if multiple components use it,
      // but since this is likely the main player, it's acceptable.
      // A better approach for multiple players is polling or a shared loader.
      const existingCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (existingCallback) existingCallback();
        initPlayer();
      };
    }

    return () => {
      if (playerRef.current) {
        // Destroying the player removes the iframe
        try {
            playerRef.current.destroy();
        } catch (e) {
            console.error("Error destroying player", e);
        }
        playerRef.current = null;
      }
    };
  }, [initPlayer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (isUnlocked) {
      window.open(PDF_URL, '_blank');
    }
  };

  const progressPercentage = ((REQUIRED_WATCH_TIME - timeLeft) / REQUIRED_WATCH_TIME) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505] text-zinc-300 antialiased selection:bg-red-900/30 selection:text-white">
      {/* Background Grid/Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%]"></div>
      </div>

      <div className="w-full max-w-4xl mb-8 text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-md border border-zinc-800 bg-zinc-900/50 text-zinc-500 text-[10px] mono uppercase tracking-[0.3em]">
          <Shield className="w-3.5 h-3.5 text-red-900" />
          Transmission: Secure Node 092
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tighter text-white uppercase italic">
          Mission <span className="text-zinc-700">Briefing</span>
        </h1>
        <div className="h-1 w-24 bg-red-900 mx-auto mb-6"></div>
        <p className="text-zinc-500 max-w-lg mx-auto text-sm mono uppercase tracking-tight leading-relaxed">
          Authorized personnel only. Complete the visual briefing to initiate decryption sequence of Level 4 assets.
        </p>
      </div>

      <div className="w-full max-w-4xl bg-[#0d0d0d] border border-zinc-800 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10">
        <div className="bg-zinc-900/80 border-b border-zinc-800 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-red-950/20 border border-red-900/20 rounded">
              <Youtube className="w-5 h-5 text-red-800" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-200 uppercase tracking-widest mono">Central Intelligence Feed</p>
              <p className="text-[10px] text-zinc-600 mono uppercase">Channel: {CHANNEL_NAME}</p>
            </div>
          </div>
          <a 
            href={`https://www.youtube.com/@${CHANNEL_NAME}?sub_confirmation=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2 border border-red-900/50 hover:bg-red-900/10 active:scale-95 transition-all text-red-500 font-bold rounded text-[10px] uppercase tracking-widest group mono"
          >
            <Bell className="w-3 h-3 group-hover:animate-pulse" />
            Establish Sub-Link
          </a>
        </div>

        <div className="aspect-video bg-black relative group">
          {/* Player Error State */}
          {playerError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-20 p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-700 mb-4 animate-pulse" />
              <h2 className="text-xl font-bold text-white uppercase mono mb-2">Protocol Failure</h2>
              <p className="text-zinc-500 text-sm mono mb-6 uppercase tracking-wider">{playerError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors mono text-xs uppercase"
              >
                Restart Transmission
              </button>
            </div>
          )}

          {/* This DIV is used as a container for the player */}
          <div ref={playerContainerRef} className="w-full h-full"></div>
          
          {showSubscribeReminder && !isUnlocked && isPlaying && (
             <div className="absolute inset-x-0 bottom-12 flex justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-1000">
               <div className="bg-red-950/90 backdrop-blur-md border border-red-800/50 px-4 py-2 rounded-sm flex items-center gap-3 text-white text-[10px] mono uppercase tracking-wider">
                 <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                 Link Account to avoid future delays
               </div>
             </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900">
            <div 
              className="h-full bg-red-900 transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(153,27,27,0.5)]" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="p-8 md:p-12 bg-zinc-900/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex flex-col gap-6 w-full md:w-auto">
              <div className="space-y-1">
                <div className="text-[10px] text-zinc-600 mono uppercase tracking-widest">Protocol Status</div>
                <div className={`flex items-center gap-2 font-black italic uppercase tracking-tighter text-xl ${isPlaying ? 'text-green-500' : 'text-zinc-600'}`}>
                  {isPlaying ? 'Receiving...' : 'Awaiting Input'}
                </div>
              </div>
              <div className="flex gap-8">
                <div>
                   <div className="text-[10px] text-zinc-600 mono uppercase mb-1">Decryption</div>
                   <div className="text-lg font-bold mono text-zinc-300">{Math.round(progressPercentage)}%</div>
                </div>
                <div className="w-px h-10 bg-zinc-800"></div>
                <div>
                   <div className="text-[10px] text-zinc-600 mono uppercase mb-1">Signal</div>
                   <div className="text-lg font-bold mono text-zinc-300">4.2 TB/s</div>
                </div>
              </div>
            </div>

            <div className="relative group">
               <div className="absolute inset-0 bg-red-900/5 blur-3xl rounded-full scale-150 group-hover:bg-red-900/10 transition-colors"></div>
               {timeLeft > 0 ? (
                 <div className="relative text-center">
                    <div className="text-7xl md:text-8xl font-black mono text-white tabular-nums tracking-tighter leading-none mb-2">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-500 text-[9px] uppercase tracking-[0.2em] mono">
                      <Eye className="w-3 h-3" />
                      Visual Lock Active
                    </div>
                 </div>
               ) : (
                 <div className="relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
                    <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-full mb-4">
                      <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                    <div className="text-2xl font-black text-white uppercase tracking-tighter italic">Briefing Authenticated</div>
                 </div>
               )}
            </div>

            <div className="w-full md:w-auto min-w-[200px]">
              {isUnlocked ? (
                <button
                  onClick={handleDownload}
                  className="w-full group relative flex items-center justify-center gap-3 py-4 px-8 bg-zinc-100 hover:bg-white text-black font-black text-sm uppercase tracking-[0.2em] rounded-sm transition-all shadow-[0_10px_30px_rgba(255,255,255,0.05)] active:scale-95"
                >
                  <Download className="w-5 h-5 transition-transform group-hover:translate-y-0.5" />
                  Access Files
                </button>
              ) : (
                <div className="w-full relative flex flex-col items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-sm opacity-50">
                  <Lock className="w-8 h-8 text-zinc-800" />
                  <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.3em] mono text-center">Encryption: AES-256</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 bg-black/50 px-6 py-2 flex justify-between items-center opacity-30 pointer-events-none">
          <div className="text-[8px] mono uppercase tracking-widest">Node ID: AF-1092-X</div>
          <div className="text-[8px] mono uppercase tracking-widest">System Timestamp: {new Date().toISOString().split('T')[0]}</div>
        </div>
      </div>

      <footer className="mt-12 text-zinc-700 text-[9px] uppercase tracking-[0.4em] mono flex flex-col items-center gap-6 z-10">
        <div className="flex gap-8">
          <span className="hover:text-zinc-500 cursor-help transition-colors">Classified Intelligence</span>
          <span className="hover:text-zinc-500 cursor-help transition-colors">Operational Security</span>
          <span className="hover:text-zinc-500 cursor-help transition-colors">Digital Vault</span>
        </div>
        <p className="opacity-50 text-center px-4">This portal is monitored. Unauthorized attempts to bypass protocol will result in IP blacklisting.</p>
      </footer>
    </div>
  );
};

export default App;
