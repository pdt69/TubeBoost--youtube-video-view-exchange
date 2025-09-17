import React, { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../contexts/AppContext';

interface SubmitVideoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SubmitVideoModal: React.FC<SubmitVideoModalProps> = ({ isOpen, onClose }) => {
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const context = useContext(AppContext);

    if (!isOpen || !context || !context.currentUser) return null;
    
    const { currentUser, settings, spendPoints, addVideo, addPoints } = context;
    const points = currentUser.points;

    const isValidYouTubeUrl = (urlToValidate: string): boolean => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = urlToValidate.match(regExp);
        return !!(match && match[2].length === 11);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!url) {
            setError("Please enter a YouTube URL.");
            return;
        }
        
        if (!isValidYouTubeUrl(url)) {
            setError("Please enter a valid YouTube video URL.");
            return;
        }

        if (points < settings.costPerSubmission) {
            setError("You don't have enough points to submit a video.");
            return;
        }
        
        try {
            if(spendPoints(settings.costPerSubmission)) {
                await addVideo(url, description);
                setUrl('');
                setDescription('');
                onClose();
            } else {
                 setError("Transaction failed. Not enough points.");
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            // refund points on failure
            addPoints(settings.costPerSubmission);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[--color-bg-secondary] rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4 text-[--color-text-primary]">Submit a Video</h2>
                        <p className="text-[--color-text-muted] mb-4">
                            It costs <span className="font-bold text-[--color-accent]">{settings.costPerSubmission} points</span> to add your video to the queue.
                        </p>
                        <p className="text-[--color-text-muted] mb-6">
                            Your current balance: <span className="font-bold text-[--color-special-offer]">{points} points</span>.
                        </p>
                        
                        <div className="flex items-start p-3 mb-4 bg-[--color-warning-bg] border border-[--color-warning-border] rounded-lg text-[--color-warning-text] text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.22 3.006-1.742 3.006H4.42c-1.522 0-2.492-1.672-1.742-3.006l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <strong>Content Warning:</strong> Submissions containing pornographic or sexual content are strictly prohibited. Violating videos will be automatically deleted.
                            </div>
                        </div>

                        <div>
                            <label htmlFor="video-url" className="block text-sm font-medium text-[--color-text-secondary] mb-1">
                                YouTube Video URL
                            </label>
                            <input
                                type="text"
                                id="video-url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary] placeholder-[--color-text-muted] focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                        </div>

                        <div className="mt-4">
                            <label htmlFor="video-description" className="block text-sm font-medium text-[--color-text-secondary] mb-1">
                                Description (optional)
                            </label>
                            <textarea
                                id="video-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary] placeholder-[--color-text-muted] focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
                                placeholder="A brief description of your video..."
                                rows={3}
                            />
                        </div>

                        {error && <p className="text-[--color-danger] text-sm mt-2">{error}</p>}
                    </div>

                    <div className="bg-[--color-bg-tertiary] px-6 py-4 flex justify-end items-center space-x-3 rounded-b-lg">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-[--color-bg-quaternary] text-[--color-text-primary] rounded-md hover:opacity-80 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={points < settings.costPerSubmission}
                            className="px-4 py-2 bg-[--color-accent] text-white font-semibold rounded-md hover:bg-[--color-accent-hover] disabled:bg-[--color-bg-quaternary] disabled:cursor-not-allowed transition"
                        >
                            Submit Video
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubmitVideoModal;