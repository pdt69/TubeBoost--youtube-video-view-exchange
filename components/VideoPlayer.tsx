import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AppContext } from '../contexts/AppContext';
import type { Video } from '../types';

interface VideoPlayerProps {
    video: Video;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
    const [completionMessage, setCompletionMessage] = useState<string | null>(null);
    const context = useContext(AppContext);
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
            }, 100);
            return () => clearTimeout(skipTimeout);
        }
    }, [video.id, currentUser, selectNextVideo]);

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
                if (prev >= WATCH_DURATION) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return WATCH_DURATION;
                }
                return prev + 1;
            });
        }, 1000);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
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

    const progressPercentage = (videoProgress / WATCH_DURATION) * 100;
    const youtubeUrl = `https://www.youtube.com/watch?v=${video.id}`;
    const thumbnailUrl = `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`;

    return (
        <div className="bg-[--color-bg-secondary] rounded-lg shadow-2xl overflow-hidden">
            <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                        <img 
                            src={thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback to default thumbnail if maxres doesn't exist
                                e.currentTarget.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
                            }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                            <a 
                                href={youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 transition-colors duration-200 flex items-center justify-center"
                                aria-label={`Watch ${video.title} on YouTube`}
                            >
                                <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            </a>
                        </div>
                        <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                            Click to watch on YouTube
                        </div>
                    </div>
                </div>
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
                
                <div className="mt-4 p-4 bg-[--color-bg-tertiary] rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[--color-accent]" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-[--color-text-primary]">How to earn points:</span>
                    </div>
                    <ol className="text-sm text-[--color-text-secondary] space-y-1 ml-7">
                        <li>1. Click the play button above to watch the video on YouTube</li>
                        <li>2. Come back to this page and click "Start Timer" below</li>
                        <li>3. Wait {WATCH_DURATION} seconds to earn {settings.pointsPerWatch} points</li>
                    </ol>
                </div>

                <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-semibold text-[--color-text-secondary]">
                            {isWatching ? (
                                <span>Points will be awarded in:</span>
                            ) : (
                                <span>Start the timer to earn points</span>
                            )}
                        </div>
                        {isWatching && (
                            <div className="text-lg font-bold text-[--color-accent] font-mono" aria-live="polite">
                                {String(WATCH_DURATION - videoProgress).padStart(2, '0')}s
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 mb-2">
                        <button 
                            onClick={startTimer}
                            disabled={isWatching}
                            className="bg-[--color-accent] hover:bg-[--color-accent-hover] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                        >
                            ▶ Start Timer
                        </button>
                        <button 
                            onClick={stopTimer}
                            disabled={!isWatching}
                            className="bg-[--color-bg-quaternary] hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed text-[--color-text-primary] font-bold py-2 px-4 rounded-lg transition duration-300"
                        >
                            ⏸ Pause Timer
                        </button>
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