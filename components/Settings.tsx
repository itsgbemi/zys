
import React, { useRef, useState } from 'react';
import { 
  User, 
  Shield, 
  CreditCard, 
  ChevronRight, 
  CheckCircle, 
  FileText, 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Loader2, 
  Clock, 
  Zap, 
  LogOut, 
  Trash2, 
  Activity, 
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  Briefcase
} from 'lucide-react';
import { Theme, UserProfile } from '../types';

interface SettingsProps {
  onToggleMobile?: () => void;
  theme: Theme;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

type SettingsTab = 'overview' | 'profile' | 'career-dna' | 'commitment' | 'billing' | 'security';

const Settings: React.FC<SettingsProps> = ({ onToggleMobile, theme, userProfile, setUserProfile }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const cardBg = theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-slate-200 shadow-sm';
  const inputBg = theme === 'dark' ? 'bg-[#191919] border-white/5' : 'bg-slate-50 border-slate-200';

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = (field: keyof UserProfile, value: any) => {
    setIsSaving(true);
    setUserProfile(prev => ({ ...prev, [field]: value }));
    // Simulate save debounce
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadProgress(0);
      const reader = new FileReader();
      reader.onprogress = (data) => {
        if (data.lengthComputable) setUploadProgress(Math.round((data.loaded / data.total) * 100));
      };
      reader.onload = (ev) => {
        setUploadProgress(100);
        setTimeout(() => {
          handleUpdate('baseResumeText', ev.target?.result as string);
          setUploadProgress(null);
        }, 500);
      };
      reader.readAsText(file);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      window.location.reload();
    }
  };

  const handleDeleteAccount = () => {
    if (confirm("CRITICAL: This will permanently delete your local career history and data. Proceed?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const navItems = [
    { id: 'profile', label: 'Identity & Professional Info', icon: <User size={18} />, desc: 'Name, title, email, and social links' },
    { id: 'career-dna', label: 'Career DNA (Master CV)', icon: <FileText size={18} />, desc: 'Manage the core source for AI document tailoring' },
    { id: 'commitment', label: 'Daily Growth Commitment', icon: <Clock size={18} />, desc: 'Configure daily availability for roadmaps' },
    { id: 'billing', label: 'Plans & Usage Tracker', icon: <CreditCard size={18} />, desc: 'View subscription status and document limits' },
    { id: 'security', label: 'Access & Security', icon: <Shield size={18} />, desc: 'Logout, account deletion, and data privacy' },
  ];

  const renderHeader = (title: string) => (
    <div className="flex items-center gap-4 mb-8">
      <button 
        onClick={() => setActiveTab(null)} 
        className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-white' : 'hover:bg-slate-100 text-slate-900'}`}
      >
        <ChevronLeft size={20} />
      </button>
      <div>
        <h3 className={`text-xl font-bold ${textPrimary}`}>{title}</h3>
        <div className="flex items-center gap-2">
          {isSaving ? (
             <span className="text-[10px] font-bold text-indigo-500 animate-pulse flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Saving...</span>
          ) : (
             <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><CheckCircle size={10} /> Saved to Local Cloud</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#191919]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden text-indigo-500"><User size={24} /></button>
          <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Account & Settings</h2>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><LogOut size={20}/></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
        <div className="max-w-2xl mx-auto">
          {activeTab === null ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className={`p-8 rounded-[40px] border shadow-2xl relative overflow-hidden ${cardBg}`}>
                <div className="absolute top-0 right-0 p-8 opacity-10"><User size={120} /></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-bold text-3xl shadow-xl shadow-indigo-600/30">
                    {userProfile.fullName?.[0] || 'Z'}
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black ${textPrimary}`}>{userProfile.fullName || 'New User'}</h3>
                    <p className={textSecondary}>{userProfile.title || 'Pilot'}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="px-3 py-1 bg-indigo-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">Standard Tier</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    className={`flex items-center gap-4 p-5 rounded-3xl border transition-all text-left group ${cardBg} hover:border-indigo-500/50 hover:translate-x-1`}
                  >
                    <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-bold ${textPrimary}`}>{item.label}</h4>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4">
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  {renderHeader('Identity & Professional Info')}
                  <div className={`p-8 rounded-[32px] border ${cardBg} space-y-6`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold opacity-50 ml-1">Full Name</label>
                        <input value={userProfile.fullName} onChange={e => handleUpdate('fullName', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm ${inputBg} ${textPrimary}`} placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold opacity-50 ml-1">Current Job Title</label>
                        <input value={userProfile.title} onChange={e => handleUpdate('title', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm ${inputBg} ${textPrimary}`} placeholder="Senior Software Engineer" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold opacity-50 ml-1">Email Address</label>
                        <input value={userProfile.email} onChange={e => handleUpdate('email', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm ${inputBg} ${textPrimary}`} placeholder="john@example.com" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold opacity-50 ml-1">Phone Number</label>
                        <input value={userProfile.phone} onChange={e => handleUpdate('phone', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm ${inputBg} ${textPrimary}`} placeholder="+1 123 456 7890" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold opacity-50 ml-1">Location</label>
                      <input value={userProfile.location} onChange={e => handleUpdate('location', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm ${inputBg} ${textPrimary}`} placeholder="San Francisco, CA" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold opacity-50 ml-1">LinkedIn URL</label>
                      <div className="flex gap-2">
                        <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}><Linkedin size={16} /></div>
                        <input value={userProfile.linkedIn} onChange={e => handleUpdate('linkedIn', e.target.value)} className={`flex-1 px-4 py-3 rounded-2xl border text-sm ${inputBg} ${textPrimary}`} placeholder="linkedin.com/in/johndoe" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'career-dna' && (
                <div className="space-y-8">
                  {renderHeader('Career DNA (Master CV)')}
                  <p className={`text-sm ${textSecondary} leading-relaxed`}>Upload your most comprehensive resume. Zysculpt uses this as the "Base Source" to sculpt every other document. Keep this updated for the best AI results.</p>
                  
                  <div className={`p-8 rounded-[32px] border ${cardBg}`}>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".txt,.pdf,.docx" />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full py-16 border-2 border-dashed rounded-[40px] transition-all relative flex flex-col items-center justify-center ${
                        userProfile.baseResumeText ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-indigo-500/20 hover:border-indigo-500 bg-indigo-500/5'
                      }`}
                    >
                      {uploadProgress !== null && (
                        <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center rounded-[40px]">
                           <div className="w-1/2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                           </div>
                        </div>
                      )}
                      <FileText size={48} className={userProfile.baseResumeText ? "text-emerald-500 mb-4" : "text-indigo-500 mb-4"} />
                      <span className={`text-lg font-bold ${textPrimary}`}>{userProfile.baseResumeText ? 'Source DNA Loaded' : 'Click to Upload DNA'}</span>
                      <p className="text-xs mt-2 opacity-40">Supports PDF, Word, or TXT formats</p>
                    </button>
                    
                    <div className="mt-8">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3 block">DNA Manual Override</label>
                      <textarea 
                        value={userProfile.baseResumeText}
                        onChange={e => handleUpdate('baseResumeText', e.target.value)}
                        placeholder="Paste your professional experience here..."
                        className={`w-full p-6 rounded-3xl border text-xs font-mono min-h-[200px] outline-none transition-all focus:border-indigo-500 ${inputBg} ${textPrimary}`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'commitment' && (
                <div className="space-y-8">
                  {renderHeader('Daily Growth Commitment')}
                  <div className={`p-8 rounded-[32px] border ${cardBg}`}>
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><Clock size={20} /></div>
                         <span className={`font-bold ${textPrimary}`}>Intensity Level</span>
                       </div>
                       <span className="text-2xl font-black text-indigo-500">{userProfile.dailyAvailability}h/day</span>
                    </div>
                    <input 
                      type="range" min="1" max="12" 
                      value={userProfile.dailyAvailability} 
                      onChange={e => handleUpdate('dailyAvailability', parseInt(e.target.value))} 
                      className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-white/10 rounded-full cursor-pointer" 
                    />
                    <div className="flex justify-between mt-3 text-[10px] font-bold opacity-30 uppercase tracking-widest">
                       <span>Casual Growth</span>
                       <span>Career Obsessed</span>
                    </div>
                    <p className="mt-8 text-xs text-slate-500 leading-relaxed italic text-center">
                      "Zysculpt uses your intensity score to break down complex goals into manageable daily tasks. Higher commitment enables more aggressive roadmaps."
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-8">
                  {renderHeader('Plans & Usage')}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-8 rounded-[32px] border ${cardBg}`}>
                      <h4 className="font-bold text-sm mb-1">Standard (Active)</h4>
                      <p className="text-[10px] text-slate-500 mb-6 uppercase font-bold tracking-widest">Free Plan</p>
                      <ul className="space-y-3 mb-10">
                        <li className="flex items-center gap-2 text-xs opacity-60"><CheckCircle size={14} className="text-emerald-500" /> 5 AI Tailoring sessions</li>
                        <li className="flex items-center gap-2 text-xs opacity-60"><CheckCircle size={14} className="text-emerald-500" /> Basic roadmap access</li>
                      </ul>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-indigo-500 w-1/5"></div>
                      </div>
                      <p className="text-[10px] font-bold opacity-40 uppercase">Usage: 1 of 5 used</p>
                    </div>

                    <div className={`p-8 rounded-[32px] border border-indigo-500/30 bg-indigo-600/5 relative overflow-hidden group`}>
                      <div className="absolute top-2 right-2"><Zap className="text-indigo-500 animate-pulse" size={16} /></div>
                      <h4 className="font-bold text-sm mb-1">Zysculpt Pro</h4>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-3xl font-black text-indigo-500">$12</span>
                        <span className="text-[10px] font-bold opacity-40">/mo</span>
                      </div>
                      <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/20 group-hover:scale-105 transition-all">Go Pro</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8">
                  {renderHeader('Access & Security')}
                  <div className={`p-8 rounded-[32px] border ${cardBg} space-y-6`}>
                    <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group">
                       <div className="flex items-center gap-4 text-slate-400">
                          <LogOut size={20} />
                          <span className={`text-sm font-bold ${textPrimary}`}>Sign out of session</span>
                       </div>
                       <ChevronRight size={18} className="opacity-30 group-hover:translate-x-1 transition-all" />
                    </button>
                    <button onClick={handleDeleteAccount} className="w-full py-4 text-red-500 font-bold text-sm border-2 border-red-500/10 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5">
                      Delete My Account & Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
