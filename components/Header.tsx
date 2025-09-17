import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../contexts/AppContext';

const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.975-2.888a1 1 0 00-1.176 0l-3.975-2.888c-.783.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const timeSince = (date: number) => {
    const seconds = Math.floor((new Date().getTime() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
};

const Header: React.FC = () => {
    const context = useContext(AppContext);
    const [copied, setCopied] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsPanelOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!context) return null;

    const { currentUser, notifications, markAllNotificationsAsRead, markNotificationAsRead } = context;

    const userNotifications = useMemo(() => {
        if (!currentUser || !notifications) return [];
        return notifications.filter(n => n.userId === currentUser.id);
    }, [notifications, currentUser]);
    
    const unreadCount = useMemo(() => {
        return userNotifications.filter(n => !n.isRead).length;
    }, [userNotifications]);

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

    const notificationTypeStyles = {
        success: { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-[--color-success]' },
        info: { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-[--color-accent]' },
        warning: { icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'text-[--color-special-offer]' },
        danger: { icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-[--color-danger]' },
    };

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
                                <div className="relative ml-2" ref={panelRef}>
                                    <button
                                        onClick={() => setIsPanelOpen(prev => !prev)}
                                        className="p-2 rounded-full bg-[--color-bg-quaternary] text-[--color-text-secondary] hover:bg-[--color-accent] hover:text-white transition-colors duration-200"
                                        title="Notifications"
                                        aria-label="View notifications"
                                    >
                                        <BellIcon />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[--color-danger] text-xs font-bold text-white">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>
                                    {isPanelOpen && (
                                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[--color-bg-secondary] rounded-lg shadow-2xl z-20 border border-[--color-border] overflow-hidden">
                                            <div className="p-3 flex justify-between items-center border-b border-[--color-border]">
                                                <h3 className="font-bold text-[--color-text-primary]">Notifications</h3>
                                                {userNotifications.length > 0 && (
                                                    <button onClick={markAllNotificationsAsRead} className="text-xs text-[--color-accent] hover:underline">Mark all as read</button>
                                                )}
                                            </div>
                                            <div className="max-h-96 overflow-y-auto">
                                                {userNotifications.length === 0 ? (
                                                    <p className="text-center text-[--color-text-muted] p-6 text-sm">You have no notifications.</p>
                                                ) : (
                                                    <ul>
                                                        {userNotifications.map(n => {
                                                            const style = notificationTypeStyles[n.type];
                                                            return (
                                                                <li key={n.id} onClick={() => markNotificationAsRead(n.id)} className={`flex items-start gap-3 p-3 border-b border-[--color-border] cursor-pointer hover:bg-[--color-bg-tertiary] ${!n.isRead ? 'bg-[--color-bg-tertiary]/50' : ''}`}>
                                                                    <div className="flex-shrink-0 mt-1">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${style.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="flex-grow">
                                                                        <p className="text-sm text-[--color-text-secondary]">{n.message}</p>
                                                                        <p className="text-xs text-[--color-text-muted] mt-1">{timeSince(n.timestamp)} ago</p>
                                                                    </div>
                                                                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-[--color-accent] self-center flex-shrink-0"></div>}
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
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