import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Mail, Briefcase, Calendar, Settings, Edit3, Grid, ShoppingBag,
    MapPin, X, Loader2, User, Hash, Trophy, BookOpen, Bell, Lock,
    Shield, LogOut, ChevronRight, Camera, Eye, EyeOff, Check,
    AlertTriangle, Users, Star, Award, Clock, Sun, Moon, MessageSquare
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { useUserPosts, useUserLostFound, useUserMarketplace, useProfile } from '../hooks/useData';
import { ProfileService, MessageService } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Mock events the user participated in
const PARTICIPATED_EVENTS = [
    {
        id: '1',
        title: 'Tech Talk: AI & Machine Learning',
        club: 'Computer Science Club',
        date: '2026-01-28',
        category: 'Technology',
        role: 'Attendee',
        badge: '🎤',
        color: 'blue',
    },
    {
        id: '2',
        title: 'Annual Sports Festival',
        club: 'Sports & Athletics Club',
        date: '2026-02-10',
        category: 'Sports',
        role: 'Participant',
        badge: '🏆',
        color: 'green',
    },
    {
        id: '3',
        title: 'Cultural Night 2025',
        club: 'Cultural Committee',
        date: '2025-11-05',
        category: 'Culture',
        role: 'Volunteer',
        badge: '🌟',
        color: 'purple',
    },
    {
        id: '4',
        title: 'Entrepreneurship Workshop',
        club: 'E-Cell',
        date: '2025-09-18',
        category: 'Workshop',
        role: 'Participant',
        badge: '💡',
        color: 'orange',
    },
];

const categoryColors: Record<string, string> = {
    Technology: 'bg-blue-100 text-blue-700',
    Sports: 'bg-green-100 text-green-700',
    Culture: 'bg-purple-100 text-purple-700',
    Workshop: 'bg-orange-100 text-orange-700',
    Music: 'bg-pink-100 text-pink-700',
    Career: 'bg-indigo-100 text-indigo-700',
};

// ─── Edit Profile Modal ────────────────────────────────────────────────────────
interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onSave: (name: string, department: string, bio: string, year: number, avatar_url?: string, reg_number?: string) => Promise<void>;
}

const EditProfileModal = ({ isOpen, onClose, user, onSave }: EditProfileModalProps) => {
    const [name, setName] = useState(user?.name || '');
    const [department, setDepartment] = useState(user?.department || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [year, setYear] = useState<number>(user?.year || 1);
    const [regNumber, setRegNumber] = useState(user?.reg_number || '');
    const [isSaving, setIsSaving] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Convert selected image file → base64 and set preview
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate type
        if (!file.type.startsWith('image/')) {
            setAvatarError('Please select an image file (JPG, PNG, GIF, WebP).');
            return;
        }
        // Validate size (5 MB)
        if (file.size > 5 * 1024 * 1024) {
            setAvatarError('Image must be smaller than 5 MB.');
            return;
        }

        setAvatarError(null);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setAvatarPreview(result);   // show live preview
            setAvatarBase64(result);    // keep for upload
        };
        reader.readAsDataURL(file);
        // Reset so the same file can be re-selected if needed
        e.target.value = '';
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(name, department, bio, year, avatarBase64 ?? undefined, regNumber || undefined);
            onClose();
        } catch {
            alert('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-fadeIn">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Edit Profile</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Update your personal details</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Avatar Upload */}
                <div className="px-6 pt-6 flex items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-200">
                            <img
                                src={
                                    avatarPreview ||
                                    user?.avatar_url ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`
                                }
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-5 h-5 text-white" />
                        </div>
                        {/* Ring to indicate a new photo was chosen */}
                        {avatarPreview && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">Profile Photo</p>
                        <p className="text-xs text-gray-400 mt-0.5">Click the photo to upload a new image</p>
                        <p className="text-xs text-gray-400">JPG, PNG or GIF · Max 5 MB</p>
                        {avatarPreview && (
                            <p className="text-xs text-green-600 font-medium mt-1">✓ New photo selected — save to apply</p>
                        )}
                        {avatarError && (
                            <p className="text-xs text-red-500 font-medium mt-1">{avatarError}</p>
                        )}
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />

                    {/* Registration Number */}
                    <div>
                        <Input
                            label="Registration Number"
                            value={regNumber}
                            onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                            placeholder="e.g. 22BCS001"
                        />
                        <p className="text-xs text-gray-400 mt-1">Enter your college-issued registration / roll number</p>
                    </div>

                    <Input label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />

                    {/* Year of Study */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Year of Study</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map((y) => (
                                <button
                                    key={y}
                                    onClick={() => setYear(y)}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${year === y
                                        ? 'bg-brand text-white border-brand shadow-sm'
                                        : 'border-gray-200 text-gray-600 hover:border-brand/40'
                                        }`}
                                >
                                    {y === 1 ? '1st' : y === 2 ? '2nd' : y === 3 ? '3rd' : '4th'} Yr
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            maxLength={200}
                            placeholder="Tell us a bit about yourself..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm resize-none"
                        />
                        <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/200</p>
                    </div>

                    <Button className="w-full" onClick={handleSave} isLoading={isSaving}>
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ─── Settings Modal ────────────────────────────────────────────────────────────
interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

const SettingsModal = ({ isOpen, onClose, onLogout }: SettingsModalProps) => {
    const [activeSection, setActiveSection] = useState<'main' | 'notifications' | 'privacy' | 'password' | 'appearance' | 'danger'>('main');
    const [notifSettings, setNotifSettings] = useState({
        likes: true,
        comments: true,
        messages: true,
        events: true,
        announcements: false,
    });
    const [privacySettings, setPrivacySettings] = useState({
        showEmail: false,
        showRegNumber: false,
        publicProfile: true,
    });
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [pwdSaved, setPwdSaved] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');

    const toggle = (obj: any, setter: any, key: string) => setter({ ...obj, [key]: !obj[key] });

    const handleSavePassword = () => {
        if (newPwd && newPwd === confirmPwd) {
            setPwdSaved(true);
            setTimeout(() => setPwdSaved(false), 2500);
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        }
    };

    if (!isOpen) return null;

    const navItems = [
        { key: 'notifications', icon: Bell, label: 'Notifications' },
        { key: 'privacy', icon: Eye, label: 'Privacy' },
        { key: 'password', icon: Lock, label: 'Change Password' },
        { key: 'appearance', icon: Sun, label: 'Appearance' },
        { key: 'danger', icon: AlertTriangle, label: 'Account' },
    ] as const;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col animate-fadeIn">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        {activeSection !== 'main' && (
                            <button onClick={() => setActiveSection('main')} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                <ChevronRight className="w-4 h-4 rotate-180" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-xl font-bold">
                                {activeSection === 'main' ? 'Settings' :
                                    navItems.find(n => n.key === activeSection)?.label}
                            </h2>
                            {activeSection === 'main' && <p className="text-sm text-gray-500 mt-0.5">Manage your account preferences</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                    {/* ── Main Menu ── */}
                    {activeSection === 'main' && (
                        <div className="space-y-2">
                            {navItems.map(({ key, icon: Icon, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveSection(key)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all group ${key === 'danger' ? 'hover:bg-red-50' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${key === 'danger' ? 'bg-red-100' : 'bg-gray-100 group-hover:bg-brand/10'}`}>
                                            <Icon className={`w-5 h-5 ${key === 'danger' ? 'text-red-500' : 'text-gray-600 group-hover:text-brand'}`} />
                                        </div>
                                        <span className={`font-semibold ${key === 'danger' ? 'text-red-600' : ''}`}>{label}</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                            ))}

                            {/* Logout */}
                            <div className="pt-4 border-t border-gray-100 mt-4">
                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-red-50 text-red-600 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                        <LogOut className="w-5 h-5 text-red-500" />
                                    </div>
                                    <span className="font-semibold">Sign Out</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Notifications ── */}
                    {activeSection === 'notifications' && (
                        <div className="space-y-3">
                            {Object.entries(notifSettings).map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <div>
                                        <p className="font-semibold capitalize">{key === 'likes' ? 'Likes on your posts' : key === 'comments' ? 'Comments' : key === 'messages' ? 'Direct Messages' : key === 'events' ? 'Event Reminders' : 'Announcements'}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {key === 'likes' ? 'Get notified when someone likes your post' :
                                                key === 'comments' ? 'Notifications for new comments' :
                                                    key === 'messages' ? 'Alert for new direct messages' :
                                                        key === 'events' ? 'Reminders before events you registered for' :
                                                            'Campus-wide announcements'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => toggle(notifSettings, setNotifSettings, key)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${val ? 'bg-brand' : 'bg-gray-200'}`}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${val ? 'left-6' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Privacy ── */}
                    {activeSection === 'privacy' && (
                        <div className="space-y-3">
                            {[
                                { key: 'publicProfile', label: 'Public Profile', desc: 'Allow other students to view your profile' },
                                { key: 'showEmail', label: 'Show Email', desc: 'Display your email on your public profile' },
                                { key: 'showRegNumber', label: 'Show Registration Number', desc: 'Make your registration number visible' },
                            ].map(({ key, label, desc }) => (
                                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <div>
                                        <p className="font-semibold">{label}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                                    </div>
                                    <button
                                        onClick={() => toggle(privacySettings, setPrivacySettings, key)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${(privacySettings as any)[key] ? 'bg-brand' : 'bg-gray-200'}`}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${(privacySettings as any)[key] ? 'left-6' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            ))}
                            <div className="p-4 bg-blue-50 rounded-2xl flex gap-3">
                                <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Your data is protected under our campus privacy policy. We never share your information with third parties without your consent.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Change Password ── */}
                    {activeSection === 'password' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Input label="Current Password" type={showCurrentPwd ? 'text' : 'password'} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
                                <button onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                                    {showCurrentPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="relative">
                                <Input label="New Password" type={showNewPwd ? 'text' : 'password'} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
                                <button onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                                    {showNewPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <Input label="Confirm New Password" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />

                            {newPwd && confirmPwd && newPwd !== confirmPwd && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <X className="w-3 h-3" /> Passwords do not match
                                </p>
                            )}

                            {/* Password strength indicator */}
                            {newPwd && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Password strength</p>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${newPwd.length >= i * 3 ? (newPwd.length >= 12 ? 'bg-green-500' : newPwd.length >= 8 ? 'bg-yellow-400' : 'bg-red-400') : 'bg-gray-200'}`} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Button className="w-full" onClick={handleSavePassword} disabled={!currentPwd || !newPwd || newPwd !== confirmPwd}>
                                {pwdSaved ? (
                                    <span className="flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Password Updated!
                                    </span>
                                ) : 'Update Password'}
                            </Button>
                        </div>
                    )}

                    {/* ── Appearance ── */}
                    {activeSection === 'appearance' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">Choose your preferred theme for Campus Connect.</p>
                            <div className="grid grid-cols-3 gap-3">
                                {(['light', 'dark', 'system'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTheme(t)}
                                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${theme === t ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        {t === 'light' ? <Sun className={`w-6 h-6 ${theme === t ? 'text-brand' : 'text-gray-500'}`} /> :
                                            t === 'dark' ? <Moon className={`w-6 h-6 ${theme === t ? 'text-brand' : 'text-gray-500'}`} /> :
                                                <div className={`w-6 h-6 rounded-full border-2 ${theme === t ? 'border-brand' : 'border-gray-400'} overflow-hidden flex`}>
                                                    <div className="w-1/2 bg-white" /><div className="w-1/2 bg-gray-800" />
                                                </div>}
                                        <span className={`text-xs font-semibold capitalize ${theme === t ? 'text-brand' : 'text-gray-600'}`}>{t}</span>
                                        {theme === t && <span className="w-2 h-2 bg-brand rounded-full" />}
                                    </button>
                                ))}
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-2xl flex gap-3">
                                <Sun className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-yellow-700">Dark mode is coming soon! Theme changes will be applied in the next update.</p>
                            </div>
                        </div>
                    )}

                    {/* ── Danger Zone ── */}
                    {activeSection === 'danger' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                    <h3 className="font-bold text-red-700">Delete Account</h3>
                                </div>
                                <p className="text-sm text-red-600 mb-4 leading-relaxed">
                                    This will permanently delete your account and all associated data — posts, messages, listings, and profile information. This action cannot be undone.
                                </p>
                                <Input
                                    label="Type DELETE to confirm"
                                    value={deleteConfirm}
                                    onChange={(e) => setDeleteConfirm(e.target.value)}
                                    placeholder="DELETE"
                                />
                                <button
                                    disabled={deleteConfirm !== 'DELETE'}
                                    className={`mt-3 w-full py-3 rounded-xl font-semibold text-sm transition-all ${deleteConfirm === 'DELETE' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                >
                                    Permanently Delete Account
                                </button>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <h3 className="font-bold text-sm mb-2">Export Your Data</h3>
                                <p className="text-xs text-gray-500 mb-3">Download a copy of all your Campus Connect data before leaving.</p>
                                <button className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-100 transition-all">
                                    Request Data Export
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Profile Page ──────────────────────────────────────────────────────────────
export const ProfilePage = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user: currentUser, updateProfile, logout } = useAuthStore();
    const navigate = useNavigate();
    
    // Fallback to current user if no userId in URL or it matches current user
    const targetUserId = userId || currentUser?.id;
    const isOwnProfile = !userId || userId === currentUser?.id;

    const { data: profileData, isLoading: loadingProfile } = useProfile(targetUserId);
    const user = isOwnProfile ? currentUser : profileData;

    const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'lost-found' | 'listings'>('posts');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isStartingChat, setIsStartingChat] = useState(false);

    const { data: posts, isLoading: loadingPosts } = useUserPosts(targetUserId);
    const { data: lostFoundItems, isLoading: loadingLostFound } = useUserLostFound(targetUserId);
    const { data: listings, isLoading: loadingListings } = useUserMarketplace(targetUserId);

    const handleMessage = async () => {
        if (!user || user.id === currentUser?.id) return;
        setIsStartingChat(true);
        try {
            const conversation = await MessageService.getOrCreateConversation(user.id);
            navigate(`/messages?conversationId=${conversation.id}`);
        } catch (error) {
            console.error('Failed to start conversation:', error);
            alert('Could not start a conversation at this time.');
        } finally {
            setIsStartingChat(false);
        }
    };

    const handleUpdateProfile = async (name: string, department: string, bio: string, year: number, avatar_url?: string, reg_number?: string) => {
        if (!currentUser) return;
        const updates: Record<string, any> = { name, department, bio, year };
        if (avatar_url) updates.avatar_url = avatar_url;
        if (reg_number !== undefined) updates.reg_number = reg_number;
        await ProfileService.update(updates);
        updateProfile({ name, department, bio, year, ...(avatar_url ? { avatar_url } : {}), ...(reg_number !== undefined ? { reg_number } : {}) });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loadingProfile) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
                <div className="text-center">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">User not found</h2>
                    <p className="text-text-secondary">The profile you are looking for does not exist.</p>
                </div>
            </div>
        );
    }

    const avatarUrl = user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`;
    const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const displayRegNumber = user.reg_number || null;
    const yearLabel = user.year ? `${user.year}${user.year === 1 ? 'st' : user.year === 2 ? 'nd' : user.year === 3 ? 'rd' : 'th'} Year` : '2nd Year';

    const tabs = [
        { key: 'posts', icon: Grid, label: 'Posts', count: posts?.length || 0 },
        { key: 'events', icon: Trophy, label: 'Events', count: PARTICIPATED_EVENTS.length },
        { key: 'lost-found', icon: MapPin, label: 'Lost & Found', count: lostFoundItems?.length || 0 },
        { key: 'listings', icon: ShoppingBag, label: 'Listings', count: listings?.length || 0 },
    ] as const;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* ── Profile Header Card ── */}
            <div className="card relative overflow-visible mt-16 shadow-lg">
                {/* Cover Banner */}
                <div className="h-36 rounded-t-3xl bg-linear-to-r from-brand/80 via-brand to-indigo-500 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
                        backgroundSize: '30px 30px',
                    }} />
                </div>

                <div className="px-8 pb-8">
                    {/* Avatar */}
                    <div className="absolute -top-14 left-8 w-28 h-28 rounded-3xl bg-white p-1.5 shadow-xl border-2 border-white">
                        <div className="w-full h-full rounded-[1.4rem] overflow-hidden">
                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    <div className="pt-16 flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold">{user.name}</h1>
                                {/* Role badge */}
                                {user.is_admin ? (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-full">Admin</span>
                                ) : user.role === 'club_admin' ? (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase rounded-full">Club Admin</span>
                                ) : (
                                    <span className="px-2 py-0.5 bg-brand/10 text-brand text-[10px] font-bold uppercase rounded-full">Student</span>
                                )}
                            </div>

                            {/* Bio */}
                            {user.bio && (
                                <p className="text-sm text-gray-600 mt-1 mb-3 max-w-md leading-relaxed">{user.bio}</p>
                            )}

                            {/* Info Chips */}
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2 text-sm text-text-secondary">
                                <div className="flex items-center gap-1.5">
                                    <Mail className="w-4 h-4 text-brand" />
                                    <span className="font-medium">
                                        {isOwnProfile ? user.email : user.email.replace(/(.{3})(.*)(?=@)/, "$1***")}
                                    </span>
                                    {isOwnProfile && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] uppercase font-bold rounded">Verified</span>}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Briefcase className="w-4 h-4 text-brand" />
                                    <span>{user.department}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-brand" />
                                    <span>{yearLabel}</span>
                                </div>
                                {isOwnProfile || displayRegNumber ? (
                                    <div className="flex items-center gap-1.5">
                                        <Hash className="w-4 h-4 text-brand" />
                                        {displayRegNumber ? (
                                            <span className="font-mono text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded">
                                                {isOwnProfile ? displayRegNumber : '••••••••'}
                                            </span>
                                        ) : isOwnProfile && (
                                            <button
                                                onClick={() => setIsEditModalOpen(true)}
                                                className="text-xs text-brand/70 font-medium underline underline-offset-2 hover:text-brand transition-colors"
                                            >
                                                + Add registration number
                                            </button>
                                        )}
                                    </div>
                                ) : null}
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-brand" />
                                    <span>Joined {joinedDate}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 shrink-0">
                            {isOwnProfile ? (
                                <>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        leftIcon={Settings}
                                        onClick={() => setIsSettingsOpen(true)}
                                    >
                                        Settings
                                    </Button>
                                    <Button size="sm" leftIcon={Edit3} onClick={() => setIsEditModalOpen(true)}>
                                        Edit Profile
                                    </Button>
                                </>
                            ) : (
                                <Button 
                                    size="sm" 
                                    leftIcon={MessageSquare} 
                                    onClick={handleMessage}
                                    isLoading={isStartingChat}
                                >
                                    Message
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* ── Stats Row ── */}
                    <div className="mt-6 grid grid-cols-4 gap-3">
                        {[
                            { label: 'Posts', value: posts?.length || 0, icon: Grid, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Events', value: PARTICIPATED_EVENTS.length, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Listings', value: listings?.length || 0, icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-50' },
                            { label: 'Lost & Found', value: lostFoundItems?.length || 0, icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50' },
                        ].map(({ label, value, icon: Icon, color, bg }) => (
                            <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                                    <Icon className={`w-4.5 h-4.5 ${color}`} />
                                </div>
                                <span className="text-xl font-bold leading-none">{value}</span>
                                <span className="text-[11px] text-gray-500 font-medium">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Tabs / Content ── */}
            <div className="space-y-6">
                {/* Tab bar */}
                <div className="flex border-b border-border gap-2 overflow-x-auto">
                    {tabs.map(({ key, icon: Icon, label, count }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`px-4 py-4 border-b-2 font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === key
                                ? 'border-brand text-brand'
                                : 'border-transparent text-text-secondary hover:text-brand'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === key ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── Posts Tab ── */}
                {activeTab === 'posts' && (
                    loadingPosts ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-brand" />
                        </div>
                    ) : posts && posts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {posts.map(post => (
                                <div key={post.id} className="card p-6 hover:shadow-md transition-shadow">
                                    <div className="text-xs text-text-secondary mb-2">
                                        {new Date(post.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                    <p className="text-sm text-text-secondary mb-4 leading-relaxed line-clamp-3">{post.content}</p>
                                    <div className="flex items-center gap-4 text-xs font-medium text-text-secondary pt-3 border-t border-gray-100">
                                        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400" /> {post.likes_count} Likes</span>
                                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-brand" /> {post.comments_count} Comments</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-14 bg-gray-50 rounded-3xl border border-border border-dashed">
                            <Grid className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="font-semibold text-gray-500">No posts yet</p>
                            <p className="text-sm text-gray-400 mt-1">Your posts will appear here once you start sharing.</p>
                        </div>
                    )
                )}

                {/* ── Events Participated Tab ── */}
                {activeTab === 'events' && (
                    <div className="space-y-4">
                        {/* Header banner */}
                        <div className="flex items-center gap-3 p-4 bg-linear-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                            <Award className="w-8 h-8 text-amber-500 shrink-0" />
                            <div>
                                <p className="font-bold text-amber-800">Event History</p>
                                <p className="text-xs text-amber-600">You've participated in {PARTICIPATED_EVENTS.length} campus events</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {PARTICIPATED_EVENTS.map((event) => (
                                <div key={event.id} className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                                    <div className="flex items-start gap-4">
                                        {/* Emoji badge */}
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                                            {event.badge}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-bold text-sm leading-tight">{event.title}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${categoryColors[event.category] || 'bg-gray-100 text-gray-700'}`}>
                                                    {event.category}
                                                </span>
                                            </div>
                                            <p className="text-xs text-brand font-semibold mt-1">{event.club}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    <span className={`font-semibold ${event.role === 'Volunteer' ? 'text-purple-600' : event.role === 'Participant' ? 'text-green-600' : 'text-blue-600'}`}>
                                                        {event.role}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Achievements row */}
                        <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                            <p className="font-bold text-sm text-indigo-700 mb-3 flex items-center gap-2">
                                <Star className="w-4 h-4" /> Achievements Unlocked
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {['🎯 First Event', '🏃 Active Participant', '🤝 Volunteer Spirit', '🌟 Campus Star'].map((badge) => (
                                    <span key={badge} className="px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-xs font-semibold text-indigo-700 shadow-sm">
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Lost & Found Tab ── */}
                {activeTab === 'lost-found' && (
                    loadingLostFound ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-brand" />
                        </div>
                    ) : lostFoundItems && lostFoundItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {lostFoundItems.map(item => (
                                <div key={item.id} className="card p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.type === 'found' ? 'bg-green-100 text-green-700' : item.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {item.type}
                                        </span>
                                        <span className="text-xs text-text-secondary flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="font-bold mb-2">{item.title}</h3>
                                    <p className="text-sm text-text-secondary line-clamp-2">{item.description}</p>
                                    <div className="flex items-center gap-2 mt-3 text-xs text-text-secondary">
                                        <MapPin className="w-3 h-3 text-brand" /> {item.location}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-14 bg-gray-50 rounded-3xl border border-border border-dashed">
                            <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="font-semibold text-gray-500">No lost & found items</p>
                            <p className="text-sm text-gray-400 mt-1">Items you report will appear here.</p>
                        </div>
                    )
                )}

                {/* ── Listings Tab ── */}
                {activeTab === 'listings' && (
                    loadingListings ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-brand" />
                        </div>
                    ) : listings && listings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {listings.map(item => (
                                <div key={item.id} className="card p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {item.status}
                                        </span>
                                        <span className="font-bold text-brand text-lg">₹{item.price}</span>
                                    </div>
                                    <h3 className="font-bold mb-2">{item.title}</h3>
                                    <p className="text-sm text-text-secondary line-clamp-2">{item.description}</p>
                                    <div className="flex items-center gap-2 mt-3 text-xs text-text-secondary">
                                        <span className="bg-gray-100 px-2 py-1 rounded font-medium">{item.category}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-14 bg-gray-50 rounded-3xl border border-border border-dashed">
                            <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="font-semibold text-gray-500">No marketplace listings</p>
                            <p className="text-sm text-gray-400 mt-1">Items you list for sale will appear here.</p>
                        </div>
                    )
                )}
            </div>

            {/* ── Modals ── */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={user}
                onSave={handleUpdateProfile}
            />
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onLogout={handleLogout}
            />
        </div>
    );
};
