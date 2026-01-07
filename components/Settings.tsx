import React, { useRef, useState } from 'react';
import { 
  User, 
  CreditCard, 
  ChevronRight, 
  CheckCircle, 
  FileText, 
  Linkedin, 
  Github,
  Globe,
  Loader2, 
  Clock, 
  Zap, 
  LogOut, 
  ChevronLeft,
  Shield,
  Activity,
  Menu,
  AlertTriangle,
  BarChart3,
  Camera,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Check,
  CloudCheck
} from 'lucide-react';
import { Theme, UserProfile } from '../types';

interface SettingsProps {
  onToggleMobile?: () => void;
  theme: Theme;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  isSaving: boolean;
}

type SettingsTab = 'profile' | 'master-resume' | 'goals' | 'billing' | 'security';

const Settings: React.FC<SettingsProps> = ({ onToggleMobile, theme, userProfile, setUserProfile, isSaving }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const cardBg = theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-slate-200 shadow-sm';
  const inputBg = theme === 'dark' ? 'bg-[#191919] border-white/5' : 'bg-slate-50 border-slate-200';

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = (field: keyof UserProfile, value: any) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadProgress(10);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadProgress(100);
        setTimeout(() => {
          handleUpdate('baseResumeText', ev.target?.result as string);
          setUploadProgress(null);
        }, 400);
      };
      reader.readAsText(file);
    }
  };

  const navItems = [
    { id: 'profile', label: 'Personal Information', icon: <User size={18} />, desc: 'Name, contact details, and social links' },
    { id: 'master-resume', label: 'Master Resume', icon: <FileText size={18} />, desc: 'The source document for all tailored AI documents' },
    { id: 'goals', label: 'Daily Goals', icon: <Clock size={18} />, desc: 'Set your target availability for roadmaps' },
    { id: 'billing', label: 'Billing & Usage', icon: <CreditCard size={18} />, desc: 'Track your credits and subscription status' },
    { id: 'security', label: 'Privacy & Data', icon: <Shield size={18} />, desc: 'Manage session security and account erasure' },
  ];

  const renderBackHeader = (title: string) => (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setActiveTab(null)} 
          className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-white' : 'hover:bg-slate-100 text-slate-900'}`}
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className={`text-xl font-bold ${textPrimary}`}>{title}</h3>
      </div>
      
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1918f0]/5 border border-[#1918f0]/10">
         {isSaving ? (
           <>
             <Loader2 size={12} className="animate-spin text-[#1918f0]" />
             <span className="text-[10px] font-bold text-[#1918f0] uppercase tracking-widest">Autosaving...</span>
           </>
         ) : (
           <>
             <Check size={12} className="text-emerald-500" />
             <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Saved to Cloud</span>
           </>
         )}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-[#1918f0] transition-colors">
            <Menu size={24} />
          </button>
          <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Settings</h2>
        </div>
        {isSaving && (
          <div className="flex items-center gap-2 opacity-50">
             <Loader2 size={16} className="animate-spin text-[#1918f0]" />
             <span className="text-xs font-bold text-[#1918f0]">Syncing...</span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {activeTab === null ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className={`p-6 md:p-8 rounded-[40px] border shadow-2xl relative overflow-hidden ${cardBg}`}>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-[32px] bg-[#1918f0] text-white flex items-center justify-center font-bold text-2xl md:text-4xl shadow-xl shadow-[#1918f0]/30 overflow-hidden">
                    {userProfile.avatarUrl ? (
                      <img src={userProfile.avatarUrl} alt={userProfile.fullName} className="w-full h-full object-cover" />
                    ) : (
                      userProfile.fullName?.[0] || 'Z'
                    )}
                  </div>
                  <div>
                    <h3 className={`text-xl md:text-2xl font-black ${textPrimary}`}>{userProfile.fullName || 'Zysculpt Pilot'}</h3>
                    <p className={`text-sm ${textSecondary}`}>{userProfile.email || 'Sign in to sync your data'}</p>
                    <div className="mt-2 flex gap-2">
                       <span className="px-3 py-1 bg-[#1918f0]/10 text-[#1918f0] rounded-full text-[10px] font-bold uppercase border border-[#1918f0]/20">Member</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    className={`flex items-center gap-4 p-4 md:p-5 rounded-3xl border transition-all text-left group ${cardBg} hover:border-[#1918f0] hover:translate-x-1`}
                  >
                    <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5 text-[#1918f0]' : 'bg-slate-100 text-[#1918f0]'}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-bold ${textPrimary}`}>{item.label}</h4>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-[#1918f0] transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4">
              {activeTab === 'profile' && (
                <div className="space-y-8 pb-12">
                  {renderBackHeader('Personal Information')}
                  
                  <div className={`p-6 md:p-8 rounded-[32px] border ${cardBg} space-y-8`}>
                    <div>
                      <h4 className={`text-sm font-black mb-6 uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`}>Contact Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${textSecondary}`}>Full Name</label>
                          <input value={userProfile.fullName} onChange={e => handleUpdate('fullName', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#1918f0] transition-all ${inputBg} ${textPrimary}`} placeholder="Jane Doe" />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${textSecondary}`}>Current Title</label>
                          <input value={userProfile.title} onChange={e => handleUpdate('title', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#1918f0] transition-all ${inputBg} ${textPrimary}`} placeholder="Software Engineer" />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${textSecondary}`}>Phone Number</label>
                          <input value={userProfile.phone} onChange={e => handleUpdate('phone', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#1918f0] transition-all ${inputBg} ${textPrimary}`} placeholder="+1 (555) 000-0000" />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${textSecondary}`}>Location</label>
                          <input value={userProfile.location} onChange={e => handleUpdate('location', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#1918f0] transition-all ${inputBg} ${textPrimary}`} placeholder="New York, USA" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <h4 className={`text-sm font-black mb-6 uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`}>Professional Links</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${textSecondary}`}>LinkedIn URL</label>
                          <input value={userProfile.linkedIn} onChange={e => handleUpdate('linkedIn', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#1918f0] transition-all ${inputBg} ${textPrimary}`} placeholder="https://linkedin.com/in/username" />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${textSecondary}`}>GitHub URL</label>
                          <input value={userProfile.github} onChange={e => handleUpdate('github', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#1918f0] transition-all ${inputBg} ${textPrimary}`} placeholder="https://github.com/username" />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${textSecondary}`}>Portfolio Website</label>
                          <input value={userProfile.portfolio} onChange={e => handleUpdate('portfolio', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#1918f0] transition-all ${inputBg} ${textPrimary}`} placeholder="https://yourportfolio.com" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'master-resume' && (
                <div className="space-y-8">
                  {renderBackHeader('Master Resume')}
                  <p className={`text-sm ${textSecondary}`}>This is your source material. We use it to ensure every tailored document is accurate.</p>
                  <div className={`p-6 md:p-8 rounded-[32px] border ${cardBg}`}>
                    <textarea 
                      value={userProfile.baseResumeText} 
                      onChange={e => handleUpdate('baseResumeText', e.target.value)}
                      className={`w-full h-96 p-6 rounded-2xl border outline-none transition-all focus:border-[#1918f0] resize-none text-sm leading-relaxed ${inputBg} ${textPrimary}`}
                      placeholder="Paste your master resume here..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'goals' && (
                <div className="space-y-8">
                  {renderBackHeader('Daily Goals')}
                  <div className={`p-8 rounded-[32px] border ${cardBg}`}>
                     <div className="flex items-center justify-between mb-8">
                        <h4 className={`font-bold ${textPrimary}`}>Learning Intensity</h4>
                        <span className="text-2xl font-black text-[#1918f0]">{userProfile.dailyAvailability}h / Day</span>
                     </div>
                     <input 
                       type="range" min="1" max="12" step="1"
                       value={userProfile.dailyAvailability}
                       onChange={e => handleUpdate('dailyAvailability', parseInt(e.target.value))}
                       className="w-full accent-[#1918f0]"
                     />
                     <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Casual</span>
                        <span>Dedicated</span>
                        <span>Expert</span>
                     </div>
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