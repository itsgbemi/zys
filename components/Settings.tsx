
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
  BarChart3
} from 'lucide-react';
import { Theme, UserProfile } from '../types';
import { simulateError, simulateHighLatency, simulateCostSpike } from '../services/datadog';

interface SettingsProps {
  onToggleMobile?: () => void;
  theme: Theme;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

type SettingsTab = 'profile' | 'master-resume' | 'goals' | 'billing' | 'security' | 'observability';

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
    setTimeout(() => setIsSaving(false), 600);
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
    { id: 'observability', label: 'App Health & Monitoring', icon: <Activity size={18} />, desc: 'Test Datadog signals and detection rules' },
  ];

  const renderBackHeader = (title: string) => (
    <div className="flex items-center gap-4 mb-8">
      <button 
        onClick={() => setActiveTab(null)} 
        className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-white' : 'hover:bg-slate-100 text-slate-900'}`}
      >
        <ChevronLeft size={20} />
      </button>
      <div>
        <h3 className={`text-xl font-bold ${textPrimary}`}>{title}</h3>
        {isSaving && <span className="text-[10px] font-bold text-indigo-500 animate-pulse">Syncing...</span>}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#191919]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-indigo-500 transition-colors">
            <Menu size={24} />
          </button>
          <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Settings</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {activeTab === null ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className={`p-6 md:p-8 rounded-[32px] md:rounded-[40px] border shadow-2xl relative overflow-hidden ${cardBg}`}>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl md:text-3xl shadow-xl shadow-indigo-600/30">
                    {userProfile.fullName?.[0] || 'Z'}
                  </div>
                  <div>
                    <h3 className={`text-xl md:text-2xl font-black ${textPrimary}`}>{userProfile.fullName || 'Zysculpt Pilot'}</h3>
                    <p className={`text-sm ${textSecondary}`}>{userProfile.email || 'Complete your profile info'}</p>
                    <div className="mt-2">
                       <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-[10px] font-bold uppercase border border-indigo-500/20">Free Member</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    className={`flex items-center gap-4 p-4 md:p-5 rounded-3xl border transition-all text-left group ${cardBg} hover:border-indigo-500/50 hover:translate-x-1`}
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
                  {renderBackHeader('Personal Information')}
                  <div className={`p-6 md:p-8 rounded-[32px] border ${cardBg} space-y-6`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold opacity-50 ml-1 uppercase tracking-widest">Full Name</label>
                        <input value={userProfile.fullName} onChange={e => handleUpdate('fullName', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm ${inputBg} ${textPrimary}`} placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold opacity-50 ml-1 uppercase tracking-widest">Current Title</label>
                        <input value={userProfile.title} onChange={e => handleUpdate('title', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm ${inputBg} ${textPrimary}`} placeholder="Software Engineer" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold opacity-50 ml-1 uppercase tracking-widest">Email</label>
                        <input value={userProfile.email} onChange={e => handleUpdate('email', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm ${inputBg} ${textPrimary}`} placeholder="email@example.com" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold opacity-50 ml-1 uppercase tracking-widest">Phone</label>
                        <input value={userProfile.phone} onChange={e => handleUpdate('phone', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm ${inputBg} ${textPrimary}`} placeholder="+1 (555) 000-0000" />
                      </div>
                      <div className="space-y-2 md:col-span-2 border-t border-slate-200 dark:border-white/5 pt-4 mt-2">
                        <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-4 block">Professional Links</label>
                      </div>
                      <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <label className="text-xs font-bold opacity-50 ml-1 uppercase tracking-widest">LinkedIn Profile</label>
                            <Linkedin size={12} className="opacity-50" />
                         </div>
                         <input value={userProfile.linkedIn} onChange={e => handleUpdate('linkedIn', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm ${inputBg} ${textPrimary}`} placeholder="linkedin.com/in/username" />
                      </div>
                      <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <label className="text-xs font-bold opacity-50 ml-1 uppercase tracking-widest">GitHub / GitLab</label>
                            <Github size={12} className="opacity-50" />
                         </div>
                         <input value={userProfile.github || ''} onChange={e => handleUpdate('github', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm ${inputBg} ${textPrimary}`} placeholder="github.com/username" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                         <div className="flex items-center justify-between">
                            <label className="text-xs font-bold opacity-50 ml-1 uppercase tracking-widest">Portfolio / Website</label>
                            <Globe size={12} className="opacity-50" />
                         </div>
                         <input value={userProfile.portfolio || ''} onChange={e => handleUpdate('portfolio', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border text-sm ${inputBg} ${textPrimary}`} placeholder="www.myportfolio.com" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'master-resume' && (
                <div className="space-y-8">
                  {renderBackHeader('Master Resume')}
                  <p className={`text-sm ${textSecondary}`}>Upload your most comprehensive resume here. Zysculpt uses this as the base information to create perfectly tailored documents for every job you apply to.</p>
                  
                  <div className={`p-6 md:p-8 rounded-[32px] border ${cardBg}`}>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".txt,.pdf,.docx" />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full py-12 md:py-16 border-2 border-dashed rounded-[32px] md:rounded-[40px] transition-all relative flex flex-col items-center justify-center ${
                        userProfile.baseResumeText ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-indigo-500/20 hover:border-indigo-500 bg-indigo-500/5'
                      }`}
                    >
                      {uploadProgress !== null && (
                        <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center rounded-[32px] md:rounded-[40px]">
                           <Loader2 className="animate-spin text-indigo-500" />
                        </div>
                      )}
                      <FileText size={48} className={userProfile.baseResumeText ? "text-emerald-500 mb-4" : "text-indigo-500 mb-4"} />
                      <span className={`text-lg font-bold ${textPrimary}`}>{userProfile.baseResumeText ? 'Master Resume Active' : 'Click to Upload Resume'}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'goals' && (
                <div className="space-y-8">
                  {renderBackHeader('Daily Goals')}
                  <div className={`p-6 md:p-8 rounded-[32px] border ${cardBg}`}>
                    <div className="flex items-center justify-between mb-8">
                       <span className={`font-bold ${textPrimary}`}>Intensity (Hours/Day)</span>
                       <span className="text-3xl font-black text-indigo-500">{userProfile.dailyAvailability}h</span>
                    </div>
                    <input 
                      type="range" min="1" max="12" 
                      value={userProfile.dailyAvailability} 
                      onChange={e => handleUpdate('dailyAvailability', parseInt(e.target.value))} 
                      className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-white/10 rounded-full cursor-pointer appearance-none" 
                    />
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-8">
                  {renderBackHeader('Billing & Usage')}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-6 md:p-8 rounded-[32px] border ${cardBg}`}>
                      <h4 className="font-bold text-sm mb-1">Current Usage</h4>
                      <p className="text-[10px] text-slate-500 mb-6 uppercase font-bold tracking-widest">Free Plan</p>
                      <div className="space-y-4">
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 w-1/5"></div>
                        </div>
                        <p className="text-[10px] font-bold opacity-40 uppercase">1 of 5 tailored resumes used</p>
                      </div>
                    </div>

                    <div className={`p-6 md:p-8 rounded-[32px] border border-indigo-500/30 bg-indigo-600/5 group relative overflow-hidden`}>
                       <Zap className="text-indigo-500 mb-4" size={24} />
                       <h4 className="font-bold text-sm mb-1">Zysculpt Pro</h4>
                       <p className="text-xs text-slate-500 mb-6">Unlimited AI document sculpting & roadmaps.</p>
                       <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm group-hover:scale-105 transition-all">Go Pro - $12/mo</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8">
                  {renderBackHeader('Privacy & Data')}
                  <div className={`p-6 md:p-8 rounded-[32px] border ${cardBg} space-y-4`}>
                    <button onClick={() => window.location.reload()} className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group">
                       <div className="flex items-center gap-4 text-slate-400 text-left">
                          <LogOut size={20} className="flex-shrink-0" />
                          <span className={`text-sm font-bold ${textPrimary}`}>Sign out and Clear Session</span>
                       </div>
                       <ChevronRight size={18} className="opacity-30 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'observability' && (
                <div className="space-y-8">
                  {renderBackHeader('App Health & Monitoring')}
                  <p className={`text-sm ${textSecondary}`}>Use these tools to verify that your Datadog Detection Rules and Monitors are working correctly.</p>
                  
                  <div className={`p-6 md:p-8 rounded-[32px] border ${cardBg} space-y-4`}>
                    <div className="flex items-center gap-3 mb-4">
                       <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500"><BarChart3 size={20} /></div>
                       <h4 className={`font-bold ${textPrimary}`}>Signal Generation</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <button 
                        onClick={simulateError}
                        className="w-full p-4 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-bold text-sm flex items-center justify-between group transition-all"
                      >
                        <span className="flex items-center gap-2"><AlertTriangle size={18} /> Simulate API Error</span>
                        <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button 
                        onClick={simulateHighLatency}
                        className="w-full p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 text-orange-500 font-bold text-sm flex items-center justify-between group transition-all"
                      >
                        <span className="flex items-center gap-2"><Clock size={18} /> Simulate High Latency (15s)</span>
                        <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button 
                        onClick={simulateCostSpike}
                        className="w-full p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500 font-bold text-sm flex items-center justify-between group transition-all"
                      >
                        <span className="flex items-center gap-2"><CreditCard size={18} /> Simulate Cost Spike ($6.00)</span>
                        <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    <p className="text-[10px] opacity-40 mt-4 text-center">These actions send real signals to your Datadog Monitors.</p>
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
