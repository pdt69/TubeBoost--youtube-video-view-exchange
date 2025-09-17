import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../contexts/AppContext';

const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.975-2.888a1 1 0 00-1.176 0l-3.975-2.888c-.783.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const Header: React.FC = () => {
    const context = useContext(AppContext);
    const [copied, setCopied] = useState(false);

    if (!context) {
        return null;
    }

    const { currentUser } = context;

    const handleCopy = () => {
        if (!currentUser) return;
        const referralLink = `${window.location.origin}${window.location.pathname}#/?ref=${currentUser.referralCode}`;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const navLinkClasses = "px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap";
    const activeNavLinkClasses = "bg-[--color-accent] text-white";
    const inactiveNavLinkClasses = "text-[--color-text-secondary] hover:bg-[--color-bg-tertiary] hover:text-[--color-text-primary]";

    return (
        <header className="bg-[--color-bg-secondary] shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-bold text-[--color-text-primary] flex-shrink-0">
                            <NavLink to="/" className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[--color-accent]" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                TubeBoost
                            </NavLink>
                        </h1>
                        <nav className="ml-2 sm:ml-10">
                            <div className="flex items-baseline space-x-2 sm:space-x-4">
                                <NavLink to="/" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : inactiveNavLinkClasses}`}>
                                    Watch
                                </NavLink>
                                <NavLink to="/admin" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : inactiveNavLinkClasses}`}>
                                    Admin Area
                                </NavLink>
                            </div>
                        </nav>
                    </div>
                    <div className="flex items-center">
                        <div className="flex items-center bg-[--color-bg-tertiary] px-4 py-2 rounded-full shadow-inner">
                            <StarIcon className="text-yellow-400 mr-2" />
                            <span className="text-[--color-text-primary] font-bold text-lg">{currentUser ? currentUser.points : 0}</span>
                            <span className="text-[--color-text-muted] ml-2 text-sm hidden sm:inline">Points</span>
                        </div>
                        {currentUser && (
                             <>
                                <NavLink 
                                    to="/profile"
                                    className="ml-2 p-2 rounded-full bg-[--color-bg-quaternary] text-[--color-text-secondary] hover:bg-[--color-accent] hover:text-white transition-colors duration-200"
                                    title="View Profile"
                                    aria-label="View user profile"
                                    >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </NavLink>
                                <button 
                                    onClick={handleCopy}
                                    className="ml-2 bg-[--color-bg-quaternary] text-xs font-semibold px-3 py-2 rounded-full hover:opacity-80 transition-all duration-200"
                                    title="Copy referral link"
                                    >
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </button>
                             </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;