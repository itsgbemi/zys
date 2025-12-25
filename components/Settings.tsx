
import React from 'react';
import { User, Bell, Shield, CreditCard, ExternalLink, Menu, LogOut, ChevronRight, CheckCircle } from 'lucide-react';
import { Theme } from '../types';

interface SettingsProps {
  onToggleMobile?: () => void;
  theme: Theme;
}

const CustomMenuIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const Settings: React.FC<SettingsProps> = ({ onToggleMobile, theme }) => {
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const cardBg = theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-slate-200 shadow-sm';
  const sectionTitle = `text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-[#555]' : 'text-slate-400'}`;

  return (
    <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#191919]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden">
            <CustomMenuIcon className={textPrimary} />
          </button>
          <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Settings</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="space-y-10 pb-12">
          {/* User Profile Section */}
          <section>
            <h2 className={sectionTitle}>Personal Information</h2>
            <div className={`p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${cardBg}`}>
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center border-2 transition-all ${
                  theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/20 text-white' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                }`}>
                  <User size={40} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className={`text-xl md:text-2xl font-bold ${textPrimary}`}>Demo User</h3>
                  <p className={`${textSecondary} mb-2`}>Senior Professional</p>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    <CheckCircle size={12} /> Account Active
                  </div>
                </div>
              </div>
              <button className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                theme === 'dark' ? 'bg-white text-black hover:bg-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}>
                Edit Profile
              </button>
            </div>
          </section>

          {/* Subscription Section */}
          <section>
            <h2 className={sectionTitle}>Billing & Plan</h2>
            <div className={`p-8 rounded-3xl border-2 border-dashed relative overflow-hidden transition-all ${
              theme === 'dark' ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-white border-indigo-100'
            }`}>
              <div className="absolute top-0 right-0 p-4">
                 <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg rotate-12">PRO PLAN</div>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                <div>
                  <h3 className={`text-xl font-bold mb-2 ${textPrimary}`}>Zysculpt Pro</h3>
                  <p className={`text-sm max-w-md ${textSecondary}`}>Unlimited access to resume generation, cover letters, and job matching tools.</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <span className={`text-3xl font-extrabold ${textPrimary}`}>$19<span className="text-sm font-normal opacity-50">/mo</span></span>
                  <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
                    Manage Billing
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Account Preferences */}
          <section>
            <h2 className={sectionTitle}>Account Preferences</h2>
            <div className={`rounded-3xl overflow-hidden ${cardBg}`}>
              {[
                { icon: <Bell size={20} />, label: 'Email Notifications', desc: 'Alerts for job matches and resume updates', toggle: true },
                { icon: <Shield size={20} />, label: 'Privacy Settings', desc: 'Control your profile visibility and data sharing', link: true },
                { icon: <CreditCard size={20} />, label: 'Payment Methods', desc: 'Manage your saved credit cards', link: true },
                { icon: <ExternalLink size={20} />, label: 'Connected Apps', desc: 'Sync Zysculpt with LinkedIn or your ATS', link: true }
              ].map((item, i) => (
                <button 
                  key={i} 
                  className={`w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-all text-left group ${
                    i !== 0 ? 'border-t' : ''
                  } ${theme === 'dark' ? 'hover:bg-white/5 border-white/5' : 'border-slate-100 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                      {item.icon}
                    </div>
                    <div>
                      <div className={`font-bold text-sm md:text-base ${textPrimary}`}>{item.label}</div>
                      <div className={`text-xs ${textSecondary}`}>{item.desc}</div>
                    </div>
                  </div>
                  {item.toggle ? (
                    <div className={`w-12 h-6 rounded-full p-1 transition-all ${theme === 'dark' ? 'bg-indigo-600' : 'bg-indigo-500'}`}>
                      <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div>
                    </div>
                  ) : (
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-1" />
                  )}
                </button>
              ))}
            </div>
          </section>

          <div className={`p-8 rounded-3xl text-center border transition-all ${
            theme === 'dark' ? 'bg-red-500/5 border-red-500/10' : 'bg-red-50 border-red-100'
          }`}>
            <h3 className={`font-bold mb-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Danger Zone</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">Once deleted, your documents and profile data cannot be recovered.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/10">
                 <LogOut size={18} /> Logout
               </button>
               <button className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors">Delete Account</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
