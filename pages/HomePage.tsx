import React, { useContext, useState, FormEvent } from 'react';
import { AppContext } from '../contexts/AppContext';
import VideoPlayer from '../components/VideoPlayer';
import SubmitVideoModal from '../components/SubmitVideoModal';
import type { Video, PaymentOption } from '../types';
import PaymentSimulationModal from '../components/PaymentSimulationModal';

const LoadingSkeleton: React.FC = () => (
    <div className="container mx-auto max-w-7xl animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div className="bg-[--color-bg-secondary] aspect-video rounded-lg"></div>
                <div className="bg-[--color-bg-secondary] h-40 mt-4 rounded-lg"></div>
            </div>
            <div className="space-y-6">
                <div className="bg-[--color-bg-secondary] h-64 rounded-lg"></div>
                <div className="bg-[--color-bg-secondary] h-72 rounded-lg"></div>
            </div>
        </div>
    </div>
);

const WatchCountdown: React.FC = () => {
    const context = useContext(AppContext);
    if (!context || !context.currentVideo) return null;

    const { videoProgress, settings, isWatching } = context;
    const WATCH_DURATION = settings.watchDuration || 30;
    const remainingTime = WATCH_DURATION - videoProgress;
    
    if (!isWatching || remainingTime <= 0) {
         return (
            <div className="bg-[--color-bg-secondary] p-4 rounded-lg shadow-lg text-center flex flex-col justify-center min-h-[168px]">
                <h3 className="text-lg font-bold mb-2 text-[--color-text-primary]">Earning Points</h3>
                <p className="text-[--color-text-secondary]">Play the video to start the countdown.</p>
            </div>
        );
    }
    
    const progressPercentage = (videoProgress / WATCH_DURATION) * 100;
    
    return (
        <div className="bg-[--color-bg-secondary] p-4 rounded-lg shadow-lg text-center min-h-[168px]">
            <h3 className="text-lg font-bold mb-3 text-[--color-text-primary]">Points Awarded In:</h3>
            <div className="relative w-24 h-24 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
                    <circle
                        className="text-[--color-bg-tertiary]"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                    />
                    <circle
                        className="text-[--color-accent]"
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={2 * Math.PI * 45 * (1 - progressPercentage / 100)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        transform="rotate(-90 50 50)"
                    />
                </svg>
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  aria-live="polite"
                  aria-atomic="true"
                >
                    <span className="text-3xl font-bold font-mono text-[--color-text-primary]">
                      {remainingTime}
                      <span className="sr-only">seconds remaining</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

const VideoQueue: React.FC<{ videoQueue: Video[] }> = ({ videoQueue }) => {
    return (
        <div className="bg-[--color-bg-secondary] p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-[--color-text-primary]">Up Next</h2>
            {videoQueue.length > 0 ? (
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                    {videoQueue.map((video) => (
                        <li key={video.id} className="flex items-center space-x-3 text-sm pr-2">
                            <img src={`https://i.ytimg.com/vi/${video.id}/default.jpg`} alt="" className="w-16 h-9 object-cover rounded flex-shrink-0" />
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[--color-text-primary] font-semibold truncate">{video.title}</p>
                                <p className="text-[--color-text-muted] text-xs">Views: {video.views}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-[--color-text-secondary] text-sm">No more videos in the queue.</p>
            )}
        </div>
    );
};

const WatchStats: React.FC = () => {
    const context = useContext(AppContext);
    if (!context || !context.currentUser) return null;
    const { currentUser, videos } = context;

    const videosWatchedCount = currentUser.watchedVideoIds?.length || 0;
    const totalWatchableVideos = videos.length;

    return (
        <div className="bg-[--color-bg-secondary] p-4 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-bold mb-2 text-[--color-text-primary]">Your Progress</h3>
            <div className="flex items-baseline justify-center gap-1">
                <p className="text-3xl font-bold text-[--color-accent]">{videosWatchedCount}</p>
                <p className="text-lg text-[--color-text-muted]">/ {totalWatchableVideos}</p>
            </div>
            <p className="text-sm text-[--color-text-muted] mt-1">Videos Watched</p>
        </div>
    );
};

const ReferralSection: React.FC = () => {
    const context = useContext(AppContext);
    const [copied, setCopied] = useState(false);

    if (!context || !context.currentUser) return null;
    const { currentUser, settings } = context;
    const referralLink = `${window.location.origin}${window.location.pathname}#/?ref=${currentUser.referralCode}`;
    
    const referredUsersCount = currentUser.referredUserIds?.length || 0;
    const referralPointsEarned = referredUsersCount * settings.referralPoints;


    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div>
            <h3 className="text-lg font-bold mb-2 text-[--color-text-primary]">Refer a Friend</h3>
            <p className="text-sm text-[--color-text-muted] mb-2">
                Share your referral link! You'll earn <span className="font-bold text-[--color-accent]">{settings.referralPoints} points</span> when a new user signs up.
            </p>
            {settings.referralTiers && settings.referralTiers.length > 0 && (
                <div className="mt-2 mb-4 p-3 bg-[--color-bg-tertiary] rounded-lg">
                    <h4 className="text-sm font-bold text-[--color-text-primary] mb-2">Tiered Bonuses:</h4>
                    <ul className="space-y-1 text-xs text-[--color-text-secondary]">
                        {settings.referralTiers.sort((a,b) => a.referralCount - b.referralCount).map(tier => (
                             <li key={tier.id} className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[--color-special-offer]" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM9 2a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V6H7a1 1 0 010-2h1V3a1 1 0 011-1zm5 4a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V9h-1a1 1 0 110-2h1V7a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                <span>Reach <span className="font-bold text-[--color-accent]">{tier.referralCount} referrals</span> for a <span className="font-bold text-[--color-special-offer]">{tier.bonusPoints.toLocaleString()} point</span> bonus!</span>
                             </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={referralLink} 
                    readOnly 
                    className="flex-grow bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-sm text-[--color-text-secondary] font-mono"
                />
                <button onClick={handleCopy} className="bg-[--color-bg-quaternary] text-[--color-text-primary] font-semibold px-4 rounded-md hover:opacity-80 transition text-sm">
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                 <div className="bg-[--color-bg-tertiary] p-3 rounded-lg">
                    <p className="text-2xl font-bold text-[--color-text-primary]">{referredUsersCount}</p>
                    <p className="text-xs text-[--color-text-muted]">Users Referred</p>
                </div>
                <div className="bg-[--color-bg-tertiary] p-3 rounded-lg">
                    <p className="text-2xl font-bold text-[--color-text-primary]">{referralPointsEarned.toLocaleString()}</p>
                    <p className="text-xs text-[--color-text-muted]">Points Earned</p>
                </div>
            </div>
        </div>
    );
};

const UserActions: React.FC<{ onOpenSubmitModal: () => void }> = ({ onOpenSubmitModal }) => {
    const context = useContext(AppContext);
    const [codeToRedeem, setCodeToRedeem] = useState('');
    const [redeemMessage, setRedeemMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    if (!context) return null;
    const { redeemPurchaseCode } = context;

    const handleRedeem = (e: React.FormEvent) => {
        e.preventDefault();
        setRedeemMessage(null);
        if (!codeToRedeem.trim()) {
            setRedeemMessage({ type: 'error', text: 'Please enter a code.' });
            return;
        }

        const success = redeemPurchaseCode(codeToRedeem);
        if (success) {
            setRedeemMessage({ type: 'success', text: 'Code redeemed successfully!' });
            setCodeToRedeem('');
        } else {
            setRedeemMessage({ type: 'error', text: 'Invalid or already redeemed code.' });
        }
        setTimeout(() => setRedeemMessage(null), 4000);
    };

    return (
        <div className="bg-[--color-bg-secondary] p-4 rounded-lg shadow-lg space-y-6">
            <div>
                <h2 className="text-xl font-bold mb-2 text-[--color-text-primary]">Actions</h2>
                <button
                    onClick={onOpenSubmitModal}
                    className="w-full bg-[--color-accent] text-white font-bold py-3 px-4 rounded-lg hover:bg-[--color-accent-hover] transition duration-300"
                >
                    Submit a Video
                </button>
            </div>
            <div>
                <h3 className="text-lg font-bold mb-2 text-[--color-text-primary]">Redeem Code</h3>
                <form onSubmit={handleRedeem} className="flex gap-2">
                    <input 
                        type="text" 
                        value={codeToRedeem}
                        onChange={(e) => setCodeToRedeem(e.target.value)}
                        placeholder="Enter code" 
                        className="flex-grow bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-sm text-[--color-text-primary] placeholder-[--color-text-muted] focus:outline-none focus:ring-1 focus:ring-[--color-accent]" 
                    />
                    <button type="submit" className="bg-[--color-bg-quaternary] text-[--color-text-primary] font-semibold px-4 rounded-md hover:opacity-80 transition text-sm">
                        Redeem
                    </button>
                </form>
                {redeemMessage && (
                    <p className={`mt-2 text-sm ${redeemMessage.type === 'success' ? 'text-[--color-success]' : 'text-[--color-danger]'}`}>
                        {redeemMessage.text}
                    </p>
                )}
            </div>
             <ReferralSection />
        </div>
    );
};


const BuyPointsSection: React.FC = () => {
    const context = useContext(AppContext);
    const [generatedCode, setGeneratedCode] = useState<{ code: string; points: number } | null>(null);
    const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'PayPal' | 'ClickBank' | null>(null);
    
    if (!context) return null;
    const { settings, generatePurchaseCode } = context;
    
    const handleInitiatePurchase = (option: PaymentOption, method: 'PayPal' | 'ClickBank') => {
        setPaymentMethod(method);
        setSelectedOption(option);
    };

    const handleConfirmPurchase = (points: number) => {
        const newCode = generatePurchaseCode(points);
        setGeneratedCode({ code: newCode.code, points: newCode.points });
        setTimeout(() => {
            document.getElementById('generated-code-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    return (
        <>
            <div className="mt-12 bg-[--color-bg-secondary] p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-[--color-text-primary]">Buy Points</h2>
                <p className="text-[--color-text-muted] mb-6">Need more points to submit videos? Purchase a code below. This is a simulation - no real payment is required.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {settings.paymentOptions.sort((a,b) => a.price - b.price).map(option => (
                        <div key={option.id} className={`p-6 rounded-lg border-2 flex flex-col justify-between ${option.isSpecialOffer ? 'border-[--color-special-offer]' : 'border-[--color-border]'}`}>
                            <div>
                                {option.isSpecialOffer && <span className="text-xs font-bold uppercase text-white bg-[--color-special-offer] px-2 py-1 rounded-full">Special Offer</span>}
                                <h3 className="text-3xl font-bold my-3 text-[--color-text-primary]">{option.points.toLocaleString()} Points</h3>
                                <p className="text-lg text-[--color-text-secondary]">for <span className="font-bold text-[--color-accent]">${option.price}</span></p>
                            </div>
                            <div className="mt-6 flex items-center justify-center gap-2">
                                <button 
                                    onClick={() => handleInitiatePurchase(option, 'PayPal')}
                                    className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-sm">
                                    PayPal
                                </button>
                                <button 
                                    onClick={() => handleInitiatePurchase(option, 'ClickBank')}
                                    className="w-full bg-[#ff5722] hover:bg-[#f44336] text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-sm">
                                    ClickBank
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                
                {generatedCode && (
                    <div id="generated-code-section" className="mt-8 p-4 bg-[--color-bg-tertiary] border border-[--color-border] rounded-lg">
                        <h3 className="text-lg font-bold text-[--color-success]">Purchase Successful!</h3>
                        <p className="text-[--color-text-secondary]">Your code for {generatedCode.points.toLocaleString()} points is:</p>
                        <div className="mt-2 p-3 bg-[--color-bg-primary] rounded font-mono text-center text-[--color-text-primary] text-lg select-all">
                            {generatedCode.code}
                        </div>
                        <p className="text-xs text-right mt-2 text-[--color-text-muted]">You can now redeem this code in the "Redeem Code" section above.</p>
                    </div>
                )}
            </div>
            {selectedOption && paymentMethod && (
                <PaymentSimulationModal 
                    option={selectedOption}
                    paymentMethod={paymentMethod}
                    onClose={() => setSelectedOption(null)}
                    onConfirm={handleConfirmPurchase}
                />
            )}
        </>
    );
}

const UserStatistics: React.FC = () => {
    const context = useContext(AppContext);
    if (!context || !context.currentUser) return null;

    const { currentUser, videos } = context;

    const userSubmittedVideos = videos.filter(v => v.submittedBy === currentUser.id);
    const videosSubmittedCount = userSubmittedVideos.length;
    const viewsReceived = userSubmittedVideos.reduce((acc, video) => acc + video.views, 0);
    const videosWatchedCount = currentUser.watchedVideoIds?.length || 0;

    const stats = [
        { 
            label: 'Total Points Earned', 
            value: currentUser.totalPointsEarned.toLocaleString(), 
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.975-2.888a1 1 0 00-1.176 0l-3.975-2.888c-.783.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            )
        },
        { 
            label: 'Videos Watched', 
            value: videosWatchedCount.toLocaleString(),
            icon: (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            )
        },
        { 
            label: 'Videos Submitted', 
            value: videosSubmittedCount.toLocaleString(),
            icon: (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )
        },
        { 
            label: 'Views Received', 
            value: viewsReceived.toLocaleString(),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.022 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                </svg>
            )
        },
    ];

    return (
        <div className="mt-8 bg-[--color-bg-secondary] p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-[--color-text-primary]">Your Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-[--color-bg-tertiary] p-4 rounded-lg flex flex-col items-center justify-center">
                        {stat.icon}
                        <p className="text-3xl font-bold text-[--color-text-primary]">{stat.value}</p>
                        <p className="text-sm text-[--color-text-muted] mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const InstallInstructionsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="install-title">
            <div className="bg-[--color-bg-secondary] rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 id="install-title" className="text-2xl font-bold text-[--color-text-primary]">Add to Your Device</h2>
                        <button onClick={onClose} className="text-4xl leading-none text-[--color-text-muted] hover:text-[--color-text-primary] transition-colors" aria-label="Close dialog">&times;</button>
                    </div>
                    <div className="space-y-4 text-[--color-text-secondary]">
                        <div>
                            <h3 className="font-bold text-[--color-text-primary] mb-1">iPhone & iPad (Safari)</h3>
                            <p>1. Tap the <span className="font-bold">Share</span> button at the bottom of the screen.</p>
                            <p>2. Scroll down and tap on <span className="font-bold">'Add to Home Screen'</span>.</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-[--color-text-primary] mb-1">Android (Chrome)</h3>
                            <p>1. Tap the <span className="font-bold">three-dot menu</span> in the top right corner.</p>
                            <p>2. Tap on <span className="font-bold">'Install app'</span> or <span className="font-bold">'Add to Home screen'</span>.</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[--color-bg-tertiary] px-6 py-4 flex justify-end items-center space-x-3 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-[--color-accent] text-white font-semibold rounded-md hover:bg-[--color-accent-hover] transition">
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};


const HomePage: React.FC = () => {
    const context = useContext(AppContext);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

    if (!context) return null;
    const { isLoading, currentVideo, videoQueue, currentUser, settings, selectNextVideo, incrementViewCount, markVideoAsWatched } = context;
    
    const handleOpenSubmitModal = () => {
        if (!currentUser) return;
        if (currentUser.points >= settings.costPerSubmission) {
            setIsSubmitModalOpen(true);
        } else {
            alert(`You need at least ${settings.costPerSubmission} points to submit a video. You can buy more points below.`);
        }
    };
    
    const handleSkipVideo = () => {
        if (!currentVideo) return;
        incrementViewCount(currentVideo.id);
        markVideoAsWatched(currentVideo.id);
        selectNextVideo();
    };

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <>
            <div className="container mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {currentVideo ? (
                            <VideoPlayer video={currentVideo} />
                        ) : (
                            <div className="bg-[--color-bg-secondary] aspect-video rounded-lg shadow-lg flex items-center justify-center p-4">
                                <p className="text-[--color-text-secondary] text-center">No videos available to watch. You might have watched them all! Try submitting a new video or check back later.</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <VideoQueue videoQueue={videoQueue} />

                        {currentVideo && <WatchCountdown />}

                        <WatchStats />

                        {currentVideo && (
                             <button
                                onClick={handleSkipVideo}
                                className="w-full bg-[--color-special-offer] hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg text-base transition duration-300 ease-in-out flex items-center justify-center gap-2"
                                aria-label="Skip to next video"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6.362-3.696a1 1 0 000-1.664L11.555 5.804A1 1 0 0010 6.47v2.73L4.555 5.168z" />
                                </svg>
                                Skip Video
                            </button>
                        )}

                        <UserActions onOpenSubmitModal={handleOpenSubmitModal} />
                    </div>
                </div>
                
                <UserStatistics />

                <BuyPointsSection />
            </div>

            <footer className="text-center py-8 mt-8 border-t border-[--color-border]">
                <div className="flex justify-center items-center gap-4 mb-4">
                     <button 
                        onClick={() => setIsInstallModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[--color-bg-tertiary] hover:bg-[--color-bg-quaternary] transition-colors text-xs text-[--color-text-secondary] font-semibold"
                        title="Create a shortcut on your device"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                        <span>Create Shortcut</span>
                    </button>
                    <button 
                        onClick={() => setIsInstallModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[--color-bg-tertiary] hover:bg-[--color-bg-quaternary] transition-colors text-xs text-[--color-text-secondary] font-semibold"
                        title="Add this web app to your home screen"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>Add to Home</span>
                    </button>
                </div>
                <p className="text-xs text-[--color-text-muted]">© {new Date().getFullYear()} TubeBoost. All Rights Reserved.</p>
            </footer>

            {isSubmitModalOpen && (
                <SubmitVideoModal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} />
            )}
            {isInstallModalOpen && <InstallInstructionsModal onClose={() => setIsInstallModalOpen(false)} />}
        </>
    );
};

export default HomePage;