import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
// Fix: Changed the named import of `YouTube` to a default import to resolve the module resolution error.
import YouTube from 'react-youtube';
// Fix: Import `YouTubeProps` to derive the `Options` type, as `Options` may not be directly exported.
import type { YouTubePlayer, YouTubeProps } from 'react-youtube';
import { AppContext } from '../contexts/AppContext';
import type { Video } from '../types';

interface VideoPlayerProps {
    video: Video;
}

// The `Options` type is derived from `YouTubeProps` for better version compatibility.
type Options = YouTubeProps['opts'];

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
    const [completionMessage, setCompletionMessage] = useState<string | null>(null);
    const context = useContext(AppContext);
    const playerRef = useRef<YouTubePlayer | null>(null);
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
        markVideoAsWatched,
        addNotification
    } = context;
    const WATCH_DURATION = settings.watchDuration || 30;

    useEffect(() => {
        // Cleanup timers from any previous video instance
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        // Reset state for the new video
        setCompletionMessage(null);

        // Auto-skip if the user has already watched this video
        if (currentUser?.watchedVideoIds?.includes(video.id)) {
            console.log(`Video ${video.id} already watched. Skipping.`);
            const skipTimeout = setTimeout(() => {
                selectNextVideo();
            }, 100); // Small delay to prevent rapid-fire state update loops
            return () => clearTimeout(skipTimeout);
        }
    }, [video.id, currentUser, selectNextVideo]);


    const handleWatchComplete = useCallback(() => {
        if (!currentUser) return;
        const pointsEarned = settings.pointsPerWatch;
        setCompletionMessage(`Video watched! +${pointsEarned} points earned.`);

        addPoints(pointsEarned);
        incrementViewCount(video.id);
        markVideoAsWatched(video.id);
        addNotification(currentUser.id, `You earned ${pointsEarned} points for watching a video.`, 'success');
        
        setTimeout(() => {
            setIsWatching(false);
            selectNextVideo();
            setTimeout(() => setCompletionMessage(null), 2000); 
        }, 1500);
    }, [settings.pointsPerWatch, addPoints, incrementViewCount, markVideoAsWatched, video.id, setIsWatching, selectNextVideo, addNotification, currentUser]);
    
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

    const onPlayerReady = (event: { target: YouTubePlayer }) => {
        playerRef.current = event.target;
    };

    const onPlayerStateChange = useCallback((event: { data: number }) => {
        // Player state: PLAYING
        if (event.data === 1) {
            startTimer();
        } else {
            stopTimer();
        }
    }, [startTimer, stopTimer]);
    
    // Explicitly type `opts` with `Options` to ensure correct type inference for playerVars.
    const opts: Options = {
        height: '390',
        width: '640',
        playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
        },
    };

    const progressPercentage = (videoProgress / WATCH_DURATION) * 100;

    return (
        <div className="bg-[--color-bg-secondary] rounded-lg shadow-2xl overflow-hidden">
            <div className="aspect-w-16 aspect-h-9 relative">
                <YouTube 
                    videoId={video.id} 
                    opts={opts}
                    onReady={onPlayerReady} 
                    onStateChange={onPlayerStateChange}
                    className="w-full h-full"
                    iframeClassName="w-full h-full"
                />
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