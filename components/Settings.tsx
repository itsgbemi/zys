
import React, { useRef } from 'react';
import { User, Bell, Shield, CreditCard, ExternalLink, Menu, LogOut, ChevronRight, CheckCircle, Save, FileText, Mail, Phone, MapPin, Linkedin } from 'lucide-react';
import { Theme, UserProfile } from '../types';

interface SettingsProps {
  onToggleMobile?: () => void;
  theme: Theme;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const Settings: React.FC<SettingsProps> = ({ onToggleMobile, theme, userProfile, setUserProfile }) => {
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const cardBg = theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-slate-200 shadow-sm';
  const sectionTitle = `text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-[#555]' : 'text-slate-400'}`;
  const inputBg = theme === 'dark' ? 'bg-[#191919] border-white/5' : 'bg-slate-50 border-slate-200';

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = (field: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        handleUpdate('baseResumeText', ev.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#191919]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={textPrimary}>
              <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Settings</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="space-y-12 pb-24">
          {/* Profile Section */}
          <section>
            <h2 className={sectionTitle}><User size={14} /> Professional Identity</h2>
            <div className={`p-8 rounded-[32px] border ${cardBg}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-50 ml-1">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                    <input 
                      value={userProfile.fullName}
                      onChange={(e) => handleUpdate('fullName', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 rounded-2xl border text-sm outline-none transition-all focus:border-indigo-500 ${inputBg} ${textPrimary}`}
                      placeholder="e.g. Alex Johnson"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-50 ml-1">Professional Title</label>
                  <input 
                    value={userProfile.title}
                    onChange={(e) => handleUpdate('title', e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none transition-all focus:border-indigo-500 ${inputBg} ${textPrimary}`}
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-50 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                    <input 
                      value={userProfile.email}
                      onChange={(e) => handleUpdate('email', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 rounded-2xl border text-sm outline-none transition-all focus:border-indigo-500 ${inputBg} ${textPrimary}`}
                      placeholder="alex@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-50 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                    <input 
                      value={userProfile.phone}
                      onChange={(e) => handleUpdate('phone', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 rounded-2xl border text-sm outline-none transition-all focus:border-indigo-500 ${inputBg} ${textPrimary}`}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-50 ml-1">Location</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                    <input 
                      value={userProfile.location}
                      onChange={(e) => handleUpdate('location', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 rounded-2xl border text-sm outline-none transition-all focus:border-indigo-500 ${inputBg} ${textPrimary}`}
                      placeholder="City, Country"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-50 ml-1">LinkedIn URL</label>
                  <div className="relative">
                    <Linkedin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                    <input 
                      value={userProfile.linkedIn}
                      onChange={(e) => handleUpdate('linkedIn', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 rounded-2xl border text-sm outline-none transition-all focus:border-indigo-500 ${inputBg} ${textPrimary}`}
                      placeholder="linkedin.com/in/alexj"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Base Resume Section */}
          <section>
            <h2 className={sectionTitle}><FileText size={14} /> Career DNA (Base Resume)</h2>
            <div className={`p-8 rounded-[32px] border ${cardBg}`}>
              <p className={`text-sm mb-6 ${textSecondary}`}>
                Your base resume acts as the primary knowledge base for the AI. Uploading it here ensures Zysculpt knows your full history without you having to explain it in every chat.
              </p>
              
              <div className="flex flex-col gap-4">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".txt,.pdf,.docx" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center justify-center gap-3 p-8 border-2 border-dashed rounded-3xl transition-all ${
                    userProfile.baseResumeText ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-indigo-500/20 hover:border-indigo-500 bg-indigo-500/5'
                  }`}
                >
                  {userProfile.baseResumeText ? <CheckCircle className="text-emerald-500" /> : <FileText size={32} className="text-indigo-500" />}
                  <span className={`font-bold ${textPrimary}`}>
                    {userProfile.baseResumeText ? 'Base Resume Loaded' : 'Click to upload your Master CV'}
                  </span>
                </button>
                
                {userProfile.baseResumeText && (
                  <div className={`p-4 rounded-2xl text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto border ${inputBg} opacity-50`}>
                    {userProfile.baseResumeText}
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="flex items-center justify-center pt-8 border-t border-white/5">
             <div className="text-center">
                <p className={`text-xs font-bold opacity-30 mb-2`}>All changes saved locally</p>
                <div className="flex items-center gap-2 text-indigo-500 font-bold"><CheckCircle size={16} /> Identity Fully Sculpted</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
