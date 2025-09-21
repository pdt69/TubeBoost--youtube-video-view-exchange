import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AppContext } from '../contexts/AppContext';
import type { Video } from '../types';

// Declare YouTube API types
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface VideoPlayerProps {
    video: Video;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
    const [completionMessage, setCompletionMessage] = useState<string | null>(null);
    const [player, setPlayer] = useState<any>(null);
    const [apiReady, setApiReady] = useState(false);
    const context = useContext(AppContext);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<number | null>(null);
    const timeoutRef = useRef<number | null>(null);

    if (!context) return null;

    const { 
        videoProgress, 
        setVideoProgress, 
        settings, 
        isWatching, 
        setIsWatching,
        currentUser,
        selectNextVideo,
        addPoints,
        incrementViewCount,
        markVideoAsWatched
    } = context;
    const WATCH_DURATION = settings.watchDuration || 30;

    // Initialize YouTube API
    useEffect(() => {
        const initializeYouTubeAPI = () => {
            if (window.YT && window.YT.Player) {
                setApiReady(true);
            } else {
                window.onYouTubeIframeAPIReady = () => {
                    setApiReady(true);
                };
            }
        };

        if (document.readyState === 'complete') {
            initializeYouTubeAPI();
        } else {
            window.addEventListener('load', initializeYouTubeAPI);
            return () => window.removeEventListener('load', initializeYouTubeAPI);
        }
    }, []);

    // Create YouTube player when API is ready
    useEffect(() => {
        if (apiReady && playerContainerRef.current && !player) {
            const newPlayer = new window.YT.Player(playerContainerRef.current, {
                height: '100%',
                width: '100%',
                videoId: video.id,
                events: {
                    onStateChange: onPlayerStateChange,
                },
            });
            setPlayer(newPlayer);
        }
    }, [apiReady, video.id, player]);

    useEffect(() => {
        // Cleanup timers from any previous video instance
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        // Reset state for the new video
        setCompletionMessage(null);
        
        // Reset player for new video
        if (player) {
            player.loadVideoById(video.id);
        }

        // Auto-skip if the user has already watched this video
        if (currentUser?.watchedVideoIds?.includes(video.id)) {
            console.log(`Video ${video.id} already watched. Skipping.`);
            const skipTimeout = setTimeout(() => {
                selectNextVideo();
            }, 100); // Small delay to prevent rapid-fire state update loops
            return () => clearTimeout(skipTimeout);
        }
    }, [video.id, currentUser, selectNextVideo, player]);


    const handleWatchComplete = useCallback(() => {
        const pointsEarned = settings.pointsPerWatch;
        setCompletionMessage(`Video watched! +${pointsEarned} points earned.`);

        addPoints(pointsEarned);
        incrementViewCount(video.id);
        markVideoAsWatched(video.id);
        
        setTimeout(() => {
            setIsWatching(false);
            selectNextVideo(video.id);
            setTimeout(() => setCompletionMessage(null), 2000); 
        }, 1500);
    }, [settings.pointsPerWatch, addPoints, incrementViewCount, markVideoAsWatched, video.id, setIsWatching, selectNextVideo]);
    
    const startTimer = useCallback(() => {
        if (isWatching) return;
        setIsWatching(true);

        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = window.setInterval(() => {
            setVideoProgress(prev => {
                // Ensure progress doesn't exceed duration before timeout fires
                if (prev >= WATCH_DURATION) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return WATCH_DURATION;
                }
                return prev + 1;
            });
        }, 1000);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        // Deduct 1 second from timeout to sync with the final interval tick
        timeoutRef.current = window.setTimeout(() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setVideoProgress(WATCH_DURATION);
            handleWatchComplete();
        }, (WATCH_DURATION - videoProgress) * 1000);
    }, [isWatching, setIsWatching, setVideoProgress, WATCH_DURATION, handleWatchComplete, videoProgress]);

    const stopTimer = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsWatching(false);
    }, [setIsWatching]);

    const onPlayerStateChange = useCallback((event: { data: number }) => {
        // Player state: PLAYING
        if (event.data === 1) {
            startTimer();
        } else {
            stopTimer();
        }
    }, [startTimer, stopTimer]);

    const progressPercentage = (videoProgress / WATCH_DURATION) * 100;

    return (
        <div className="bg-[--color-bg-secondary] rounded-lg shadow-2xl overflow-hidden">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <div 
                    ref={playerContainerRef}
                    className="absolute inset-0 w-full h-full"
                />
                {!apiReady && (
                    <div className="absolute inset-0 bg-[--color-bg-tertiary] flex items-center justify-center">
                        <p className="text-[--color-text-secondary]">Loading video player...</p>
                    </div>
                )}
                 {completionMessage && (
                    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10 transition-opacity duration-300">
                        <div className="text-center text-[--color-text-primary] p-4 rounded-lg bg-[--color-bg-secondary]/80 backdrop-blur-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[--color-success] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xl font-bold">{completionMessage}</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="text-lg font-semibold truncate text-[--color-text-primary]">{video.title}</h3>
                <p className="text-sm text-[--color-text-muted] mt-1">Views: {video.views}</p>
                {video.description && (
                  <div className="mt-3 bg-[--color-bg-tertiary]/50 rounded-lg p-3">
                      <p className="text-sm text-[--color-text-secondary] whitespace-pre-wrap">{video.description}</p>
                  </div>
                )}
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-semibold text-[--color-text-secondary]">
                            {isWatching ? (
                                <span>Points will be awarded in:</span>
                            ) : (
                                <span>Play video to start earning points</span>
                            )}
                        </div>
                        {isWatching && (
                            <div className="text-lg font-bold text-[--color-accent] font-mono" aria-live="polite">
                                {String(WATCH_DURATION - videoProgress).padStart(2, '0')}s
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => player?.playVideo()}
                        className="mb-2 bg-[--color-accent] hover:bg-[--color-accent-hover] text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                    >
                        ▶ Play Video
                    </button>
                    <div className="w-full bg-[--color-bg-tertiary] rounded-full h-4 overflow-hidden">
                        <div 
                            className="bg-[--color-accent] h-4 rounded-full transition-all duration-1000 ease-linear flex items-center justify-center text-white text-xs font-bold" 
                            style={{ width: `${progressPercentage}%` }}>
                             {videoProgress > 1 && <span>{Math.round(progressPercentage)}%</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;