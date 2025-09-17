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

type SortableColumn = 'title' | 'views' | 'submittedAt' | 'duration' | 'status';
type SortOrder = 'asc' | 'desc';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SaveStatusIndicator: React.FC<{ status: SaveStatus; message?: string }> = ({ status, message }) => {
    if (status === 'idle') return null;

    const statusConfig = {
        saving: { text: 'Saving...', color: 'text-[--color-text-muted]' },
        saved: { text: 'All changes saved', color: 'text-[--color-success]' },
        error: { text: message || 'Error saving.', color: 'text-[--color-danger]' },
    };
    
    const { text, color } = statusConfig[status];

    return (
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
        updateSettings, updateVideoStatus,
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
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
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
    }, [newAdminPass, pointsPerWatch, costPerSubmission, referralPoints, watchDuration, passwordStrength, updateSettings, settings]);
    
    // --- Autosave for Payment Options ---
    useEffect(() => {
        // Prevent saving on initial render
        if (JSON.stringify(localPaymentOptions) === JSON.stringify(settings.paymentOptions)) {
            return;
        }
        setPaymentOptionsSaveStatus('saving');
        debounce(() => {
            try {
                updateSettings({ paymentOptions: localPaymentOptions });
                setPaymentOptionsSaveStatus('saved');
            } catch(e) {
                setPaymentOptionsSaveStatus('error');
                setPaymentOptionsStatusMessage('Failed to save payment options.');
            }
            setTimeout(() => setPaymentOptionsSaveStatus('idle'), 3000);
        }, 1500);
    }, [localPaymentOptions, updateSettings, settings.paymentOptions]);
    
    // --- Autosave for Referral Tiers ---
    useEffect(() => {
        if (JSON.stringify(localReferralTiers) === JSON.stringify(settings.referralTiers)) {
            return;
        }
        setReferralTiersSaveStatus('saving');
        debounce(() => {
            try {
                updateSettings({ referralTiers: localReferralTiers });
                setReferralTiersSaveStatus('saved');
            } catch(e) {
                setReferralTiersSaveStatus('error');
                setReferralTiersStatusMessage('Failed to save referral tiers.');
            }
            setTimeout(() => setReferralTiersSaveStatus('idle'), 3000);
        }, 1500);
    }, [localReferralTiers, updateSettings, settings.referralTiers]);

    const checkPasswordStrength = (pass: string): PasswordStrength => {
        let score = 0;
        if (pass.length > 8) score++;
        if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) score++;
        if (pass.match(/[0-9]/)) score++;
        if (pass.match(/[^A-Za-z0-9]/)) score++;

        const strengths: Omit<PasswordStrength, 'score'>[] = [
            { label: 'Very Weak', color: 'bg-red-500', width: '25%' },
            { label: 'Weak', color: 'bg-orange-500', width: '50%' },
            { label: 'Good', color: 'bg-yellow-500', width: '75%' },
            { label: 'Strong', color: 'bg-green-500', width: '100%' },
            { label: 'Very Strong', color: 'bg-green-500', width: '100%' }
        ];

        return { score, ...strengths[score] };
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPass = e.target.value;
        setNewAdminPass(newPass);
        if (newPass) {
            setPasswordStrength(checkPasswordStrength(newPass));
        } else {
            setPasswordStrength(null);
        }
    };
    
    const handleRejectVideo = (id: string) => {
        const reason = prompt("Please provide a reason for rejecting this video:");
        if (reason !== null) { // User clicked OK, even if the reason is empty
            updateVideoStatus(id, 'rejected', reason);
        }
    };

    const handleSort = (column: SortableColumn) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortOrder('asc');
        }
    };
    
    const sortedVideos = useMemo(() => {
        const filtered = videos.filter(video => {
            const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) || video.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || video.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        return [...filtered].sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return 0;
        });
    }, [videos, searchTerm, sortColumn, sortOrder, statusFilter]);

    const sortedUsers = useMemo(() => {
        return [...allUsers]
            .filter(user => user.displayName.toLowerCase().includes(userSearchTerm.toLowerCase()) || user.id.toLowerCase().includes(userSearchTerm.toLowerCase()))
            .sort((a, b) => b.totalPointsEarned - a.totalPointsEarned);
    }, [allUsers, userSearchTerm]);

    const statusColors: { [key in Video['status']]: string } = {
        pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        approved: 'bg-green-500/20 text-green-300 border-green-500/30',
        rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
    };

    return (
        <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-[--color-text-primary]">Admin Dashboard</h1>
                <button onClick={logout} className="px-4 py-2 bg-[--color-bg-quaternary] text-[--color-text-primary] rounded-md hover:bg-[--color-danger] transition">
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
                        <label className="block text-sm font-medium text-[--color-text-secondary] mb-1">New Admin Password</label>
                        <input type="password" value={newAdminPass} onChange={handlePasswordChange} className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                        {passwordStrength && (
                            <div className="mt-2">
                                <div className="w-full bg-gray-600 rounded-full h-2">
                                    <div className={`h-2 rounded-full ${passwordStrength.color}`} style={{ width: passwordStrength.width }}></div>
                                </div>
                                <p className={`text-xs mt-1 ${passwordStrength.color.replace('bg-','text-')}`}>{passwordStrength.label}</p>
                            </div>
                        )}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-[--color-text-secondary] mb-1">Points per Watch</label>
                        <input type="number" value={pointsPerWatch} onChange={e => setPointsPerWatch(Number(e.target.value))} className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-[--color-text-secondary] mb-1">Cost per Video Submission</label>
                        <input type="number" value={costPerSubmission} onChange={e => setCostPerSubmission(Number(e.target.value))} className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[--color-text-secondary] mb-1">Referral Signup Points</label>
                        <input type="number" value={referralPoints} onChange={e => setReferralPoints(Number(e.target.value))} className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[--color-text-secondary] mb-1">Watch Duration (seconds)</label>
                        <input type="number" value={watchDuration} onChange={e => setWatchDuration(Number(e.target.value))} className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"/>
                    </div>
                </div>
            </div>

            {/* Video Management */}
            <div className="bg-[--color-bg-secondary] p-6 rounded-lg shadow-lg mb-8">
                 <h2 className="text-2xl font-bold text-[--color-text-primary] mb-4">Video Management ({videos.length})</h2>
                 <div className="flex flex-col sm:flex-row gap-4 mb-4">
                     <input 
                         type="text" 
                         placeholder="Search by title or ID..."
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                         className="flex-grow bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary] placeholder-[--color-text-muted]"
                     />
                     <select 
                         value={statusFilter}
                         onChange={e => setStatusFilter(e.target.value as any)}
                         className="bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 text-[--color-text-primary]"
                     >
                         <option value="all">All Statuses</option>
                         <option value="pending">Pending</option>
                         <option value="approved">Approved</option>
                         <option value="rejected">Rejected</option>
                     </select>
                 </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left text-[--color-text-secondary]">
                         <thead className="text-xs uppercase bg-[--color-bg-tertiary] text-[--color-text-muted]">
                             <tr>
                                 {Object.entries({ title: 'Title', status: 'Status', views: 'Views', submittedAt: 'Date', duration: 'Duration' }).map(([key, value]) => (
                                     <th key={key} scope="col" className="px-6 py-3" onClick={() => handleSort(key as SortableColumn)}>
                                         <div className="flex items-center">
                                             {value}
                                             {sortColumn === key && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                                         </div>
                                     </th>
                                 ))}
                                 <th scope="col" className="px-6 py-3">Actions</th>
                             </tr>
                         </thead>
                         <tbody>
                             {sortedVideos.map(video => (
                                 <tr key={video.id} className="border-b border-[--color-border] hover:bg-[--color-bg-tertiary]">
                                     <td className="px-6 py-4 font-medium text-[--color-text-primary] whitespace-nowrap max-w-xs truncate">{video.title}</td>
                                     <td className="px-6 py-4">
                                         <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[video.status]}`}>{video.status}</span>
                                     </td>
                                     <td className="px-6 py-4">{video.views}</td>
                                     <td className="px-6 py-4">{new Date(video.submittedAt).toLocaleDateString()}</td>
                                     <td className="px-6 py-4">{video.duration}s</td>
                                     <td className="px-6 py-4 flex items-center space-x-2">
                                        {video.status === 'pending' && (
                                            <>
                                                <button onClick={() => updateVideoStatus(video.id, 'approved')} className="text-[--color-success] hover:underline" title="Approve">Approve</button>
                                                <button onClick={() => handleRejectVideo(video.id)} className="text-[--color-danger] hover:underline" title="Reject">Reject</button>
                                            </>
                                        )}
                                        <button onClick={() => setEditingVideo(video)} className="text-[--color-accent] hover:underline" title="Edit">Edit</button>
                                        <button onClick={() => deleteVideo(video.id)} className="text-[--color-danger] hover:underline" title="Delete">Delete</button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
            </div>

            {editingVideo && <EditVideoModal video={editingVideo} onClose={() => setEditingVideo(null)} onSave={updateVideo} />}
            
            {/* User, Payment, Tier Management in a grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* User Management */}
                <div className="bg-[--color-bg-secondary] p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-[--color-text-primary] mb-4">User Management ({allUsers.length})</h2>
                    <input 
                         type="text" 
                         placeholder="Search users..."
                         value={userSearchTerm}
                         onChange={e => setUserSearchTerm(e.target.value)}
                         className="w-full bg-[--color-bg-tertiary] border border-[--color-border] rounded-md px-3 py-2 mb-4 text-[--color-text-primary] placeholder-[--color-text-muted]"
                     />
                    <div className="max-h-96 overflow-y-auto pr-2">
                        <ul className="space-y-2">
                            {sortedUsers.map(user => (
                                <li key={user.id} className="flex justify-between items-center p-3 bg-[--color-bg-tertiary] rounded">
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-semibold truncate text-[--color-text-primary]" title={user.displayName}>{user.displayName}</p>
                                        <p className="text-xs text-[--color-text-muted] font-mono">{user.id}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className="text-sm font-bold text-[--color-accent]">{user.points.toLocaleString()} Points</p>
                                        <p className="text-xs text-[--color-text-muted]">Total: {user.totalPointsEarned.toLocaleString()}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Purchase Codes Management */}
                    <div className="bg-[--color-bg-secondary] p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-[--color-text-primary] mb-4">Purchase Codes</h2>
                        <div className="max-h-96 overflow-y-auto pr-2">
                             <ul className="space-y-2">
                                {purchaseCodes.map(code => (
                                    <li key={code.code} className="flex justify-between items-center p-3 bg-[--color-bg-tertiary] rounded">
                                        <div>
                                            <p className="text-sm font-mono text-[--color-text-primary]">{code.code} ({code.points.toLocaleString()} pts)</p>
                                            <p className={`text-xs ${code.isRedeemed ? 'text-[--color-success]' : 'text-[--color-text-muted]'}`}>
                                                {code.isRedeemed ? `Redeemed by ${allUsers.find(u => u.id === code.redeemedBy)?.displayName || 'N/A'}` : 'Not redeemed'}
                                            </p>
                                        </div>
                                        <button onClick={() => deletePurchaseCode(code.code)} className="text-xs text-[--color-danger] hover:underline">Delete</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
