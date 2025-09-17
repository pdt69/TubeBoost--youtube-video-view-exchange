import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../contexts/AppContext';
import { Navigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
    const context = useContext(AppContext);
    
    if (!context || !context.currentUser) {
        // Can show a loading state or redirect. Redirecting is simpler.
        return <Navigate to="/" replace />;
    }

    const { currentUser, videos, updateUserDisplayName } = context;
    
    const [displayName, setDisplayName] = useState(currentUser.displayName);
    const [isEditing, setIsEditing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const userSubmittedVideos = useMemo(() => videos.filter(v => v.submittedBy === currentUser.id), [videos, currentUser.id]);
    const viewsReceived = useMemo(() => userSubmittedVideos.reduce((acc, video) => acc + video.views, 0), [userSubmittedVideos]);

    const stats = [
        { label: 'Total Points Earned', value: currentUser.totalPointsEarned.toLocaleString() },
        { label: 'Videos Watched', value: (currentUser.watchedVideoIds || []).length.toLocaleString() },
        { label: 'Videos Submitted', value: userSubmittedVideos.length.toLocaleString() },
        { label: 'Views Received', value: viewsReceived.toLocaleString() },
        { label: 'Users Referred', value: (currentUser.referredUserIds || []).length.toLocaleString() },
    ];

    const handleSave = () => {
        if (displayName.trim() === '' || displayName.trim() === currentUser.displayName) {
            setIsEditing(false);
            setDisplayName(currentUser.displayName);
            return;
        }
        setSaveStatus('saving');
        updateUserDisplayName(displayName.trim());
        setTimeout(() => {
            setSaveStatus('saved');
            setIsEditing(false);
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 500);
    };

    const handleCopy = () => {
        const referralLink = `${window.location.origin}${window.location.pathname}#/?ref=${currentUser.referralCode}`;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="container mx-auto max-w-4xl">
            <div className="bg-[--color-bg-secondary] p-6 sm:p-8 rounded-lg shadow-xl">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                    <div className="flex-shrink-0 w-24 h-24 bg-[--color-accent] rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="text-3xl font-bold bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-1 text-[--color-text-primary] focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
                                    autoFocus
                                />
                                <button onClick={handleSave} className="px-4 py-2 bg-[--color-success] text-white font-semibold rounded-md hover:opacity-90 transition">
                                    Save
                                </button>
                                <button onClick={() => { setIsEditing(false); setDisplayName(currentUser.displayName); }} className="px-4 py-2 bg-[--color-bg-quaternary] text-[--color-text-primary] rounded-md hover:opacity-80 transition">
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 justify-center sm:justify-start">
                                <h1 className="text-4xl font-bold text-[--color-text-primary]">{currentUser.displayName}</h1>
                                <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-full hover:bg-[--color-bg-tertiary] text-[--color-text-muted] hover:text-[--color-text-primary]" aria-label="Edit display name">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                {saveStatus === 'saved' && <span className="text-sm text-[--color-success]">Saved!</span>}
                            </div>
                        )}
                        <p className="text-sm text-[--color-text-muted] font-mono mt-2">User ID: {currentUser.id}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-[--color-text-primary] mb-4">Your Statistics</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.map(stat => (
                            <div key={stat.label} className="bg-[--color-bg-tertiary] p-4 rounded-lg">
                                <p className="text-sm text-[--color-text-muted]">{stat.label}</p>
                                <p className="text-3xl font-bold text-[--color-text-primary]">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-[--color-text-primary] mb-4">Your Referral Code</h2>
                    <div className="bg-[--color-bg-tertiary] p-4 rounded-lg">
                        <p className="text-sm text-[--color-text-muted] mb-2">Share this code or the full link to earn referral points.</p>
                        <div className="flex items-center justify-between bg-[--color-bg-primary] p-3 rounded-md">
                            <span className="text-xl font-bold font-mono text-[--color-accent]">{currentUser.referralCode}</span>
                            <button onClick={handleCopy} className="bg-[--color-bg-quaternary] text-[--color-text-primary] font-semibold px-4 py-2 rounded-md hover:opacity-80 transition text-sm">
                                {copied ? 'Copied Link!' : 'Copy Link'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
