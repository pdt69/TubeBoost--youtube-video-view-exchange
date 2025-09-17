import React, { useContext, useState, FormEvent, useEffect, useMemo, useRef } from 'react';
import { AppContext } from '../contexts/AppContext';
import type { Video, AdminSettings, User, PaymentOption, PurchaseCode, ReferralTier } from '../types';

const AdminPage: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;

    if (!context.isAdmin) {
        return <AdminLogin />;
    }

    return <AdminDashboard />;
};

const AdminLogin: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const context = useContext(AppContext);

    const handleLogin = (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (context && context.login(password)) {
            // successful login handled by context
        } else {
            setError('Incorrect password.');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-[--color-bg-secondary] p-8 rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold text-center text-[--color-text-primary] mb-6">Admin Login</h2>
            <form onSubmit={handleLogin}>
                <div className="mb-4">
                    <label className="block text-[--color-text-secondary] mb-2" htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary] placeholder-[--color-text-muted] focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
                    />
                </div>
                {error && <p className="text-[--color-danger] text-sm mb-4">{error}</p>}
                <button type="submit" className="w-full bg-[--color-accent] hover:bg-[--color-accent-hover] text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                    Login
                </button>
            </form>
        </div>
    );
};

interface PasswordStrength {
    score: number; // 0-4
    label: string;
    color: string;
    width: string;
}

type SortableColumn = 'title' | 'views' | 'submittedAt' | 'duration';
type SortOrder = 'asc' | 'desc';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SaveStatusIndicator: React.FC<{ status: SaveStatus; message?: string }> = ({ status, message }) => {
    if (status === 'idle') return null;

    const statusConfig = {
        saving: { text: 'Saving...', color: 'text-[--color-text-muted]' },
        saved: { text: 'All changes saved', color: 'text-[--color-success]' },
        error: { text: message || 'Error saving.', color: 'text-[--color-danger]' },
    };
    
    // Because of the `if (status === 'idle')` check above, TypeScript correctly infers
    // that `status` is a valid key for `statusConfig`, so no type assertion is needed.
    const { text, color } = statusConfig[status];

    return (
        // Fix: The comparison `status === 'idle'` caused a TypeScript error because the type of `status`
        // is narrowed by the check above, and it can never be 'idle' at this point. Since the
        // component is always visible when rendered, `opacity-100` is used directly.
        <div className="flex items-center gap-2 text-sm transition-opacity duration-300 opacity-100">
            <p className={color}>{text}</p>
        </div>
    );
};

const EditVideoModal: React.FC<{ video: Video, onClose: () => void, onSave: (id: string, title: string, description: string, isDefault: boolean, duration: number) => void }> = ({ video, onClose, onSave }) => {
    const [title, setTitle] = useState(video.title);
    const [description, setDescription] = useState(video.description);
    const [isDefault, setIsDefault] = useState(video.isDefault);
    const [duration, setDuration] = useState(video.duration);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(video.id, title, description, isDefault, duration);
        onClose();
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-[--color-bg-secondary] rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4 text-[--color-text-primary]">Edit Video</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[--color-text-secondary] mb-1">Title</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[--color-text-secondary] mb-1">Description</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-[--color-text-secondary] mb-1">Duration (seconds)</label>
                                    <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                                </div>
                                <div className="flex items-end pb-2">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id={`is-default-${video.id}`} checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="h-4 w-4 rounded border-[--color-border] bg-[--color-bg-primary] text-[--color-accent] focus:ring-[--color-accent]"/>
                                        <label htmlFor={`is-default-${video.id}`} className="text-sm text-[--color-text-secondary]">Admin Video</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[--color-bg-tertiary] px-6 py-4 flex justify-end items-center space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-[--color-bg-quaternary] text-[--color-text-primary] rounded-md hover:opacity-80 transition">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-[--color-accent] text-white font-semibold rounded-md hover:bg-[--color-accent-hover] transition">Save Changes</button>
                    </div>
                </form>
            </div>
         </div>
    );
};


const AdminDashboard: React.FC = () => {
    const { 
        videos, settings, allUsers, logout, updateVideo, deleteVideo, addPointsToUser, 
        updateSettings,
        purchaseCodes, deletePurchaseCode
    } = useContext(AppContext)!;
    
    // General Settings State
    const [newAdminPass, setNewAdminPass] = useState('');
    const [pointsPerWatch, setPointsPerWatch] = useState(settings.pointsPerWatch);
    const [costPerSubmission, setCostPerSubmission] = useState(settings.costPerSubmission);
    const [referralPoints, setReferralPoints] = useState(settings.referralPoints);
    const [watchDuration, setWatchDuration] = useState(settings.watchDuration || 30);
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
    const [settingsSaveStatus, setSettingsSaveStatus] = useState<SaveStatus>('idle');
    const [settingsStatusMessage, setSettingsStatusMessage] = useState('');

    // Payment Options State
    const [localPaymentOptions, setLocalPaymentOptions] = useState<PaymentOption[]>(settings.paymentOptions);
    const [paymentOptionsSaveStatus, setPaymentOptionsSaveStatus] = useState<SaveStatus>('idle');
    const [paymentOptionsStatusMessage, setPaymentOptionsStatusMessage] = useState('');

    // Referral Tiers State
    const [localReferralTiers, setLocalReferralTiers] = useState<ReferralTier[]>(settings.referralTiers);
    const [referralTiersSaveStatus, setReferralTiersSaveStatus] = useState<SaveStatus>('idle');
    const [referralTiersStatusMessage, setReferralTiersStatusMessage] = useState('');

    // Video Management State
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState<SortableColumn>('submittedAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // User Management State
    const [userSearchTerm, setUserSearchTerm] = useState('');
    
    const debounceTimeout = useRef<number | null>(null);

    const debounce = (func: () => void, delay: number) => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = window.setTimeout(func, delay);
    };

    // --- Autosave for General Settings ---
    useEffect(() => {
        // This effect runs only when these specific state values change.
        // It avoids running on the initial render if the values match the context settings.
        const hasChanges = newAdminPass ||
            pointsPerWatch !== settings.pointsPerWatch ||
            costPerSubmission !== settings.costPerSubmission ||
            referralPoints !== settings.referralPoints ||
            watchDuration !== (settings.watchDuration || 30);

        if (!hasChanges) {
            return;
        }

        setSettingsSaveStatus('saving');
        debounce(() => {
            try {
                const settingsUpdate: Partial<AdminSettings> = {
                    pointsPerWatch,
                    costPerSubmission,
                    referralPoints,
                    watchDuration,
                };
                if (newAdminPass.trim() && passwordStrength && passwordStrength.score >= 2) {
                    settingsUpdate.adminPass = newAdminPass.trim();
                }
                updateSettings(settingsUpdate);
                setSettingsSaveStatus('saved');
                if (newAdminPass.trim()) {
                    setNewAdminPass('');
                    setPasswordStrength(null);
                }
            } catch (e) {
                setSettingsSaveStatus('error');
                setSettingsStatusMessage('Failed to save general settings.');
            }
            setTimeout(() => setSettingsSaveStatus('idle'), 3000);
        }, 1500);
    }, [newAdminPass, pointsPerWatch, costPerSubmission, referralPoints, watchDuration]);

    // --- Autosave for Payment Options ---
    useEffect(() => {
        if (JSON.stringify(localPaymentOptions) !== JSON.stringify(settings.paymentOptions)) {
            setPaymentOptionsSaveStatus('saving');
            debounce(() => {
                try {
                    updateSettings({ paymentOptions: localPaymentOptions });
                    setPaymentOptionsSaveStatus('saved');
                } catch (e) {
                    setPaymentOptionsSaveStatus('error');
                    setPaymentOptionsStatusMessage('Failed to save payment options.');
                }
                setTimeout(() => setPaymentOptionsSaveStatus('idle'), 3000);
            }, 1500);
        }
    }, [localPaymentOptions, settings.paymentOptions, updateSettings]);
    
    // --- Autosave for Referral Tiers ---
    useEffect(() => {
        if (JSON.stringify(localReferralTiers) !== JSON.stringify(settings.referralTiers)) {
            setReferralTiersSaveStatus('saving');
            debounce(() => {
                try {
                    updateSettings({ referralTiers: localReferralTiers });
                    setReferralTiersSaveStatus('saved');
                } catch (e) {
                    setReferralTiersSaveStatus('error');
                    setReferralTiersStatusMessage('Failed to save referral tiers.');
                }
                setTimeout(() => setReferralTiersSaveStatus('idle'), 3000);
            }, 1500);
        }
    }, [localReferralTiers, settings.referralTiers, updateSettings]);

    useEffect(() => {
        if (!newAdminPass) {
            setPasswordStrength(null);
            return;
        }
        let score = 0;
        if (newAdminPass.length >= 8) score++;
        if (/[A-Z]/.test(newAdminPass)) score++;
        if (/[a-z]/.test(newAdminPass)) score++;
        if (/[0-9]/.test(newAdminPass)) score++;
        if (/[^A-Za-z0-9]/.test(newAdminPass)) score++;
        score = Math.min(score, 4);
        
        const labels = ['Very Weak', 'Weak', 'Okay', 'Good', 'Strong'];
        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
        const widths = ['w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-full'];

        setPasswordStrength({ score, label: labels[score], color: colors[score], width: widths[score] });
    }, [newAdminPass]);
    
    const handleSort = (column: SortableColumn) => {
        const newSortOrder = (sortColumn === column && sortOrder === 'asc') ? 'desc' : 'asc';
        setSortColumn(column);
        setSortOrder(newSortOrder);
    };

    const filteredVideos = useMemo(() => {
        return videos
            .filter(video => video.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];
                if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
    }, [videos, searchTerm, sortColumn, sortOrder]);

    const filteredUsers = useMemo(() => {
        return allUsers
            .filter(user => user.id.toLowerCase().includes(userSearchTerm.toLowerCase()) || user.displayName.toLowerCase().includes(userSearchTerm.toLowerCase()));
    }, [allUsers, userSearchTerm]);

    const handlePaymentOptionChange = (id: string, field: keyof PaymentOption, value: any) => {
        setLocalPaymentOptions(prev => 
            prev.map(opt => opt.id === id ? { ...opt, [field]: value } : opt)
        );
    };
    
    const handleAddPaymentOption = () => {
         const newOption: PaymentOption = {
            id: crypto.randomUUID(),
            points: 50000,
            price: 5,
            isSpecialOffer: false,
        };
        setLocalPaymentOptions(prev => [...prev, newOption]);
    }
    
    const handleDeletePaymentOption = (id: string) => {
        setLocalPaymentOptions(prev => prev.filter(opt => opt.id !== id));
    }
    
    const handleReferralTierChange = (id: string, field: keyof ReferralTier, value: any) => {
        setLocalReferralTiers(prev => 
            prev.map(tier => tier.id === id ? { ...tier, [field]: value } : tier)
        );
    };
    
    const handleAddReferralTier = () => {
        const newTier: ReferralTier = {
            id: crypto.randomUUID(),
            referralCount: 0,
            bonusPoints: 0,
        };
        setLocalReferralTiers(prev => [...prev, newTier]);
    };
    
    const handleDeleteReferralTier = (id: string) => {
        setLocalReferralTiers(prev => prev.filter(tier => tier.id !== id));
    };

    return (
        <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-[--color-text-primary]">Admin Panel</h1>
                <button onClick={logout} className="px-4 py-2 bg-[--color-bg-quaternary] text-[--color-text-primary] rounded-md hover:opacity-80 transition">
                    Logout
                </button>
            </div>

            {/* General Settings */}
            <div className="bg-[--color-bg-secondary] p-6 rounded-lg shadow-lg mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[--color-text-primary]">General Settings</h2>
                    <SaveStatusIndicator status={settingsSaveStatus} message={settingsStatusMessage} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-[--color-text-secondary] mb-1">Points per Watch</label>
                        <input type="number" value={pointsPerWatch} onChange={e => setPointsPerWatch(Number(e.target.value))} className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[--color-text-secondary] mb-1">Cost per Submission</label>
                        <input type="number" value={costPerSubmission} onChange={e => setCostPerSubmission(Number(e.target.value))} className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[--color-text-secondary] mb-1">Referral Points</label>
                        <input type="number" value={referralPoints} onChange={e => setReferralPoints(Number(e.target.value))} className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[--color-text-secondary] mb-1">Watch Duration (sec)</label>
                        <input type="number" value={watchDuration} onChange={e => setWatchDuration(Number(e.target.value))} className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[--color-text-secondary] mb-1">New Admin Password</label>
                        <input type="password" value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]" placeholder="Leave blank to keep current"/>
                        {passwordStrength && (
                            <div className="mt-2">
                                <div className="h-2 bg-[--color-bg-tertiary] rounded-full">
                                    <div className={`h-2 rounded-full transition-all ${passwordStrength.color} ${passwordStrength.width}`}></div>
                                </div>
                                <p className={`text-xs mt-1 ${passwordStrength.score < 2 ? 'text-red-400' : 'text-green-400'}`}>{passwordStrength.label}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Options */}
            <div className="bg-[--color-bg-secondary] p-6 rounded-lg shadow-lg mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[--color-text-primary]">Payment Options</h2>
                    <SaveStatusIndicator status={paymentOptionsSaveStatus} message={paymentOptionsStatusMessage} />
                </div>
                <div className="space-y-4">
                    {localPaymentOptions.map((opt) => (
                        <div key={opt.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center p-3 bg-[--color-bg-tertiary] rounded-md">
                            <input type="number" placeholder="Points" value={opt.points} onChange={e => handlePaymentOptionChange(opt.id, 'points', Number(e.target.value))} className="md:col-span-1 bg-[--color-bg-quaternary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                            <input type="number" placeholder="Price ($)" value={opt.price} onChange={e => handlePaymentOptionChange(opt.id, 'price', Number(e.target.value))} className="md:col-span-1 bg-[--color-bg-quaternary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                            <input type="text" placeholder="PayPal ID" value={opt.payPalId || ''} onChange={e => handlePaymentOptionChange(opt.id, 'payPalId', e.target.value)} className="md:col-span-1 bg-[--color-bg-quaternary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                            <input type="text" placeholder="ClickBank ID" value={opt.clickBankId || ''} onChange={e => handlePaymentOptionChange(opt.id, 'clickBankId', e.target.value)} className="md:col-span-1 bg-[--color-bg-quaternary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                            <div className="md:col-span-1 flex items-center gap-2">
                                <input type="checkbox" id={`special-${opt.id}`} checked={opt.isSpecialOffer} onChange={e => handlePaymentOptionChange(opt.id, 'isSpecialOffer', e.target.checked)} className="h-4 w-4 rounded border-[--color-border] bg-[--color-bg-primary] text-[--color-accent] focus:ring-[--color-accent]"/>
                                <label htmlFor={`special-${opt.id}`} className="text-sm text-[--color-text-secondary]">Special</label>
                            </div>
                            <button onClick={() => handleDeletePaymentOption(opt.id)} className="md:col-span-1 bg-[--color-danger] text-white font-bold py-2 px-2 rounded-md hover:opacity-80 transition text-sm">Delete</button>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddPaymentOption} className="mt-4 bg-[--color-success] text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition">Add Option</button>
            </div>
            
            {/* Referral Tiers */}
            <div className="bg-[--color-bg-secondary] p-6 rounded-lg shadow-lg mb-8">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[--color-text-primary]">Referral Tiers</h2>
                    <SaveStatusIndicator status={referralTiersSaveStatus} message={referralTiersStatusMessage} />
                 </div>
                 <div className="space-y-4">
                    {localReferralTiers.sort((a,b) => a.referralCount - b.referralCount).map(tier => (
                         <div key={tier.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center p-3 bg-[--color-bg-tertiary] rounded-md">
                            <input type="number" placeholder="Referral Count" value={tier.referralCount} onChange={e => handleReferralTierChange(tier.id, 'referralCount', Number(e.target.value))} className="md:col-span-1 bg-[--color-bg-quaternary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]" />
                            <input type="number" placeholder="Bonus Points" value={tier.bonusPoints} onChange={e => handleReferralTierChange(tier.id, 'bonusPoints', Number(e.target.value))} className="md:col-span-2 bg-[--color-bg-quaternary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]" />
                            <button onClick={() => handleDeleteReferralTier(tier.id)} className="md:col-span-1 bg-[--color-danger] text-white font-bold py-2 px-2 rounded-md hover:opacity-80 transition text-sm">Delete</button>
                         </div>
                    ))}
                 </div>
                 <button onClick={handleAddReferralTier} className="mt-4 bg-[--color-success] text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition">Add Tier</button>
            </div>


            {/* Video Management */}
            <div className="bg-[--color-bg-secondary] p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-2xl font-bold text-[--color-text-primary] mb-4">Video Management</h2>
                <input type="text" placeholder="Search videos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 mb-4 text-[--color-text-primary]"/>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-[--color-text-secondary]">
                        <thead className="text-xs text-[--color-text-primary] uppercase bg-[--color-bg-tertiary]">
                            <tr>
                                <th scope="col" className="px-6 py-3">Video</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('views')}>Views</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('submittedAt')}>Submitted</th>
                                <th scope="col" className="px-6 py-3">Submitted By</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVideos.map(video => (
                                <tr key={video.id} className="bg-[--color-bg-secondary] border-b border-[--color-border] hover:bg-[--color-bg-tertiary]">
                                    <th scope="row" className="px-6 py-4 font-medium text-[--color-text-primary] whitespace-nowrap">{video.title}</th>
                                    <td className="px-6 py-4">{video.views}</td>
                                    <td className="px-6 py-4">{new Date(video.submittedAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{video.submittedBy}</td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button onClick={() => setEditingVideo(video)} className="text-[--color-accent] hover:underline">Edit</button>
                                        <button onClick={() => deleteVideo(video.id)} className="text-[--color-danger] hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {editingVideo && <EditVideoModal video={editingVideo} onClose={() => setEditingVideo(null)} onSave={updateVideo} />}

            {/* User Management */}
            <div className="bg-[--color-bg-secondary] p-6 rounded-lg shadow-lg mb-8">
                 <h2 className="text-2xl font-bold text-[--color-text-primary] mb-4">User Management</h2>
                 <input type="text" placeholder="Search users by ID or display name..." value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 mb-4 text-[--color-text-primary]"/>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-[--color-text-secondary]">
                        <thead className="text-xs text-[--color-text-primary] uppercase bg-[--color-bg-tertiary]">
                            <tr>
                                <th scope="col" className="px-6 py-3">User ID / Display Name</th>
                                <th scope="col" className="px-6 py-3">Points</th>
                                <th scope="col" className="px-6 py-3">Total Earned</th>
                                <th scope="col" className="px-6 py-3">Referred By</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="bg-[--color-bg-secondary] border-b border-[--color-border] hover:bg-[--color-bg-tertiary]">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-[--color-text-primary]">{user.displayName}</div>
                                        <div className="font-mono text-xs">{user.id}</div>
                                    </td>
                                    <td className="px-6 py-4">{user.points}</td>
                                    <td className="px-6 py-4">{user.totalPointsEarned}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{user.referredBy || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => { const amount = prompt('Enter points to add:'); if (amount) addPointsToUser(user.id, parseInt(amount, 10)); }} className="text-[--color-accent] hover:underline">Add Points</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>

            {/* Purchase Codes */}
            <div className="bg-[--color-bg-secondary] p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-[--color-text-primary] mb-4">Purchase Codes</h2>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-[--color-text-secondary]">
                        <thead className="text-xs text-[--color-text-primary] uppercase bg-[--color-bg-tertiary]">
                            <tr>
                                <th scope="col" className="px-6 py-3">Code</th>
                                <th scope="col" className="px-6 py-3">Points</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Redeemed By</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                         <tbody>
                            {purchaseCodes.map(code => (
                                <tr key={code.code} className="bg-[--color-bg-secondary] border-b border-[--color-border] hover:bg-[--color-bg-tertiary]">
                                    <td className="px-6 py-4 font-mono text-[--color-text-primary]">{code.code}</td>
                                    <td className="px-6 py-4">{code.points}</td>
                                    <td className="px-6 py-4">
                                        {code.isRedeemed ? <span className="text-[--color-success]">Redeemed</span> : <span className="text-[--color-text-muted]">Available</span>}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{code.redeemedBy || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        {!code.isRedeemed && <button onClick={() => deletePurchaseCode(code.code)} className="text-[--color-danger] hover:underline">Delete</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;