import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppContext } from './contexts/AppContext';
import type { Video, AdminSettings, AppContextType, User, PaymentOption, PurchaseCode } from './types';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import Header from './components/Header';

const App: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AdminSettings>({
    adminPass: 'admin123',
    pointsPerWatch: 10,
    costPerSubmission: 100,
    referralPoints: 50,
    watchDuration: 30,
    paymentOptions: [
      { id: 'po1', points: 100000, price: 10, isSpecialOffer: false, payPalId: 'P-12345', clickBankId: 'CB-ITEM-A' },
      { id: 'po2', points: 250000, price: 25, isSpecialOffer: false, payPalId: 'P-67890', clickBankId: 'CB-ITEM-B' },
      { id: 'po3', points: 1000000, price: 50, isSpecialOffer: true, payPalId: 'P-54321', clickBankId: 'CB-ITEM-C' },
    ],
    referralTiers: [
      { id: 't1', referralCount: 5, bonusPoints: 250 },
      { id: 't2', referralCount: 10, bonusPoints: 1000 },
      { id: 't3', referralCount: 25, bonusPoints: 5000 },
    ]
  });
  const [purchaseCodes, setPurchaseCodes] = useState<PurchaseCode[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [videoQueue, setVideoQueue] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isWatching, setIsWatching] = useState(false);

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const storedVideos = localStorage.getItem('videos');
      const storedSettings = localStorage.getItem('settings');
      const storedUsers = localStorage.getItem('allUsers');
      const storedPurchaseCodes = localStorage.getItem('purchaseCodes');
      const currentUserId = localStorage.getItem('currentUserId');
      const sessionIsAdmin = sessionStorage.getItem('isAdmin');
      
      const loadedUsers: User[] = storedUsers ? JSON.parse(storedUsers) : [];
      // migration for users who dont have the new properties
      let usersToUpdate = loadedUsers.map(u => ({
          ...u,
          displayName: u.displayName || `User-${u.id.substring(0, 4)}`,
          watchedVideoIds: u.watchedVideoIds || [], 
          referredUserIds: u.referredUserIds || [] 
        }));
      const loadedSettings = storedSettings ? JSON.parse(storedSettings) : null;
      const effectiveSettings = { ...settings, ...loadedSettings };


      if (storedPurchaseCodes) setPurchaseCodes(JSON.parse(storedPurchaseCodes));
      
      if (currentUserId) {
        const foundUser = usersToUpdate.find(u => u.id === currentUserId);
        setCurrentUser(foundUser || null);
      } else {
        const newUserId = crypto.randomUUID();
        let referredBy: string | null = null;
        
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(hash.indexOf('?')));
        const refCode = params.get('ref');

        if (refCode) {
            const referrer = usersToUpdate.find(u => u.referralCode === refCode);
            if (referrer) {
                referredBy = referrer.id;

                let pointsToAdd = effectiveSettings.referralPoints || 50;
                const newReferralCount = (referrer.referredUserIds || []).length + 1;

                const tierReached = (effectiveSettings.referralTiers || []).find(tier => tier.referralCount === newReferralCount);
                if (tierReached) {
                    pointsToAdd += tierReached.bonusPoints;
                }

                usersToUpdate = usersToUpdate.map(u => u.id === referrer.id ? { 
                    ...u, 
                    points: u.points + pointsToAdd, 
                    totalPointsEarned: u.totalPointsEarned + pointsToAdd,
                    referredUserIds: [...(u.referredUserIds || []), newUserId]
                } : u);
            }
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        
        const newUser: User = { 
            id: newUserId, 
            displayName: `User-${newUserId.substring(0, 4)}`,
            points: 0, 
            totalPointsEarned: 0, 
            referralCode: crypto.randomUUID().substring(0, 8).toUpperCase(),
            referredBy: referredBy,
            watchedVideoIds: [],
            referredUserIds: [],
        };
        usersToUpdate.push(newUser);
        setCurrentUser(newUser);
        localStorage.setItem('currentUserId', newUserId);
      }
      setAllUsers(usersToUpdate);
      
      if (storedVideos) {
        setVideos(JSON.parse(storedVideos));
      } else {
        const defaultVideos: Video[] = [
          { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)', description: 'The official video for "Never Gonna Give You Up" by Rick Astley. This iconic 80s hit has become a cultural phenomenon and an internet sensation. Enjoy the classic!', submittedAt: Date.now(), isDefault: true, views: 0, duration: 212, submittedBy: 'admin' },
          { id: '3JZ_D3ELwOQ', title: 'iPhone 13 Pro Review: A Better Camera?', description: 'MKBHD provides an in-depth review of the iPhone 13 Pro, focusing on its camera improvements, ProMotion display, and battery life. Is it worth the upgrade?', submittedAt: Date.now(), isDefault: true, views: 0, duration: 635, submittedBy: 'admin' },
          { id: 'L_LUpnjgPso', title: '4K Drone Footage - The Beauty of Nature', description: 'Relax and enjoy stunning 4K drone footage showcasing majestic mountain ranges, serene lakes, and breathtaking landscapes. A perfect video to unwind.', submittedAt: Date.now(), isDefault: true, views: 0, duration: 180, submittedBy: 'admin' },
        ];
        setVideos(defaultVideos);
      }
      
      if (loadedSettings) {
        setSettings(effectiveSettings);
      }
      if (sessionIsAdmin) setIsAdmin(JSON.parse(sessionIsAdmin));

    } catch (error) {
      console.error("Failed to load state from storage:", error);
    } finally {
        setIsLoading(false);
    }
  }, []);
  
  // Persist state to localStorage whenever it changes
  useEffect(() => { if(!isLoading) localStorage.setItem('videos', JSON.stringify(videos)); }, [videos, isLoading]);
  useEffect(() => { if(!isLoading) localStorage.setItem('allUsers', JSON.stringify(allUsers)); }, [allUsers, isLoading]);
  useEffect(() => { if(!isLoading) localStorage.setItem('settings', JSON.stringify(settings)); }, [settings, isLoading]);
  useEffect(() => { if(!isLoading) localStorage.setItem('purchaseCodes', JSON.stringify(purchaseCodes)); }, [purchaseCodes, isLoading]);

  useEffect(() => {
    setVideoProgress(0);
    setIsWatching(false);
  }, [currentVideo]);

  const extractVideoId = (url: string): string | null => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  };

  const addVideo = async (url: string, description: string) => {
    if (!currentUser) throw new Error("No user found");
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error("Invalid YouTube URL");
    if (videos.some(v => v.id === videoId)) throw new Error("This video has already been submitted.");

    const newVideo: Video = {
        id: videoId,
        title: `User Video - ${videoId.substring(0, 5)}`,
        description: description || 'No description provided. Admin can add one later.',
        submittedAt: Date.now(),
        isDefault: false,
        views: 0,
        duration: 0,
        submittedBy: currentUser.id,
    };
    setVideos(prev => [...prev, newVideo]);
  };

  const updateVideo = (id: string, newTitle: string, newDescription: string, isDefault: boolean, newDuration: number) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, title: newTitle, description: newDescription, isDefault, duration: newDuration } : v));
  };
  
  const deleteVideo = (id: string) => { setVideos(prev => prev.filter(v => v.id !== id)); };

  const addPoints = (amount: number) => {
    if (!currentUser) return;
    setCurrentUser(prev => prev ? { ...prev, points: prev.points + amount, totalPointsEarned: prev.totalPointsEarned + amount } : null);
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, points: u.points + amount, totalPointsEarned: u.totalPointsEarned + amount } : u));
  };

  const addPointsToUser = (userId: string, amount: number) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, points: u.points + amount, totalPointsEarned: u.totalPointsEarned + amount } : u));
    if (currentUser && currentUser.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, points: prev.points + amount, totalPointsEarned: prev.totalPointsEarned + amount } : null);
    }
  };
  
  const spendPoints = (amount: number) => {
    if (currentUser && currentUser.points >= amount) {
        setCurrentUser(prev => prev ? { ...prev, points: prev.points - amount } : null);
        setAllUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, points: u.points - amount } : u));
        return true;
    }
    return false;
  };

  const login = (password: string): boolean => {
    if (password === settings.adminPass) {
      setIsAdmin(true);
      sessionStorage.setItem('isAdmin', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('isAdmin');
  };

  const updateSettings = (newSettings: Partial<AdminSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addPaymentOption = () => {
    const newOption: PaymentOption = {
      id: crypto.randomUUID(),
      points: 50000,
      price: 5,
      isSpecialOffer: false,
      payPalId: '',
      clickBankId: ''
    };
    setSettings(prev => ({ ...prev, paymentOptions: [...prev.paymentOptions, newOption] }));
  };

  const updatePaymentOption = (id: string, updatedOption: PaymentOption) => {
    setSettings(prev => ({
      ...prev,
      paymentOptions: prev.paymentOptions.map(opt => (opt.id === id ? updatedOption : opt)),
    }));
  };

  const deletePaymentOption = (id: string) => {
    setSettings(prev => ({
      ...prev,
      paymentOptions: prev.paymentOptions.filter(opt => opt.id !== id),
    }));
  };
  
  const generatePurchaseCode = (points: number): PurchaseCode => {
    const newCode: PurchaseCode = {
      code: `BUY-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
      points,
      isRedeemed: false,
      redeemedBy: null,
    };
    setPurchaseCodes(prev => [...prev, newCode]);
    return newCode;
  };

  const redeemPurchaseCode = (code: string): boolean => {
    if (!currentUser) return false;
    const codeToRedeem = purchaseCodes.find(pc => pc.code.toUpperCase() === code.trim().toUpperCase() && !pc.isRedeemed);
    if (codeToRedeem) {
        addPoints(codeToRedeem.points);
        setPurchaseCodes(prev => prev.map(pc => pc.code === codeToRedeem.code ? { ...pc, isRedeemed: true, redeemedBy: currentUser.id } : pc));
        return true;
    }
    return false;
  };
  
  const deletePurchaseCode = (code: string) => {
    setPurchaseCodes(prev => prev.filter(pc => pc.code !== code));
  };


  const incrementViewCount = (id: string) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, views: v.views + 1 } : v));
  };

  const markVideoAsWatched = (videoId: string) => {
    if (!currentUser) return;
    
    const userHasWatched = currentUser.watchedVideoIds?.includes(videoId);
    if (userHasWatched) return;

    const updatedWatchedIds = [...(currentUser.watchedVideoIds || []), videoId];
    
    setCurrentUser(prev => prev ? { ...prev, watchedVideoIds: updatedWatchedIds } : null);
    
    setAllUsers(prevUsers => prevUsers.map(u => 
        u.id === currentUser.id 
        ? { ...u, watchedVideoIds: updatedWatchedIds } 
        : u
    ));
};

  const updateUserDisplayName = (newName: string) => {
    if (!currentUser) return;
    const trimmedName = newName.trim();
    if (trimmedName.length === 0) return;

    setCurrentUser(prev => prev ? { ...prev, displayName: trimmedName } : null);
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, displayName: trimmedName } : u));
  };


  const generateFairPlaylist = useCallback((allVideos: Video[], user: User | null, videoIdToExclude?: string): Video[] => {
    const unwatchedVideos = allVideos.filter(v => {
        // Exclude the video that was just watched/skipped
        if (v.id === videoIdToExclude) {
            return false;
        }
        // Exclude videos that are in the user's watched list
        if (user && (user.watchedVideoIds || []).includes(v.id)) {
            return false;
        }
        return true;
    });

    const adminVideos = unwatchedVideos.filter(v => v.isDefault).sort((a, b) => a.views - b.views);
    const userVideos = unwatchedVideos.filter(v => !v.isDefault).sort((a, b) => a.views - b.views);
    const playlist: Video[] = [];
    let i = 0, j = 0;
    while (i < adminVideos.length || j < userVideos.length) {
      if (i < adminVideos.length) playlist.push(adminVideos[i++]);
      if (j < userVideos.length) playlist.push(userVideos[j++]);
    }
    return playlist;
  }, []);

  const selectNextVideo = useCallback((videoIdToExclude?: string) => {
    if (videos.length === 0) { setCurrentVideo(null); return; }
    const playlist = generateFairPlaylist(videos, currentUser, videoIdToExclude);
    if (playlist.length === 0) { setCurrentVideo(null); return; }

    const currentIndex = currentVideo ? playlist.findIndex(v => v.id === currentVideo.id) : -1;
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentVideo(playlist[nextIndex]);
  }, [videos, currentVideo, currentUser, generateFairPlaylist]);

  useEffect(() => {
    if (!isLoading && !currentVideo && videos.length > 0) {
      const playlist = generateFairPlaylist(videos, currentUser);
      if (playlist.length > 0) setCurrentVideo(playlist[0]);
    }
  }, [isLoading, videos, currentVideo, currentUser, generateFairPlaylist]);

  useEffect(() => {
    if (videos.length === 0 || !currentVideo) { setVideoQueue([]); return; }
    const playlist = generateFairPlaylist(videos, currentUser);
    const currentIndex = playlist.findIndex(v => v.id === currentVideo.id);
    if (currentIndex === -1) { 
        // This can happen if the current video was the last one watched
        if(playlist.length > 0) {
            setCurrentVideo(playlist[0]);
        } else {
            setCurrentVideo(null);
        }
        return;
    }
    const upcomingVideos: Video[] = [];
    const maxQueueSize = Math.min(4, playlist.length - 1);
    for (let i = 1; i <= maxQueueSize; i++) {
      const nextIndex = (currentIndex + i) % playlist.length;
      upcomingVideos.push(playlist[nextIndex]);
    }
    setVideoQueue(upcomingVideos);
  }, [videos, currentVideo, currentUser, generateFairPlaylist]);

  const contextValue: AppContextType = {
    videos,
    currentUser,
    allUsers,
    settings,
    isAdmin,
    currentVideo,
    videoQueue,
    purchaseCodes,
    videoProgress,
    addVideo,
    updateVideo,
    deleteVideo,
    addPoints,
    spendPoints,
    addPointsToUser,
    login,
    logout,
    updateSettings,
    incrementViewCount,
    selectNextVideo,
    isLoading,
    addPaymentOption,
    updatePaymentOption,
    deletePaymentOption,
    generatePurchaseCode,
    redeemPurchaseCode,
    deletePurchaseCode,
    markVideoAsWatched,
    updateUserDisplayName,
    setVideoProgress,
    isWatching,
    setIsWatching,
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      <HashRouter>
        <div className="min-h-screen font-sans">
          <Header />
          <main className="p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;