
import React from 'react';
import { User, Bell, Shield, CreditCard, ExternalLink } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
      <h1 className="text-3xl font-bold mb-10">Account Settings</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-sm font-bold text-[#555] uppercase tracking-widest mb-4">Profile</h2>
          <div className="p-6 bg-[#121212] border border-[#2a2a2a] rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <User size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold">John Doe</h3>
                <p className="text-[#a0a0a0]">john.doe@example.com</p>
              </div>
            </div>
            <button className="px-4 py-2 border border-[#2a2a2a] rounded-lg hover:bg-[#1f1f1f] transition-colors">Edit Profile</button>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-[#555] uppercase tracking-widest mb-4">Preferences</h2>
          <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <button className="w-full p-4 flex items-center justify-between hover:bg-[#1f1f1f] transition-colors">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-[#a0a0a0]" />
                <span className="font-medium">Notifications</span>
              </div>
              <div className="w-10 h-5 bg-white rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-black rounded-full"></div>
              </div>
            </button>
            <button className="w-full p-4 border-t border-[#2a2a2a] flex items-center justify-between hover:bg-[#1f1f1f] transition-colors">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-[#a0a0a0]" />
                <span className="font-medium">Privacy & Security</span>
              </div>
              <ExternalLink size={16} className="text-[#555]" />
            </button>
            <button className="w-full p-4 border-t border-[#2a2a2a] flex items-center justify-between hover:bg-[#1f1f1f] transition-colors">
              <div className="flex items-center gap-3">
                <CreditCard size={20} className="text-[#a0a0a0]" />
                <span className="font-medium">Billing & Subscription</span>
              </div>
              <span className="text-xs bg-white/10 px-2 py-1 rounded text-[#a0a0a0]">Pro Plan</span>
            </button>
          </div>
        </section>

        <div className="p-8 border border-white/10 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-dashed">
          <h3 className="text-lg font-bold mb-2">Need help?</h3>
          <p className="text-[#a0a0a0] mb-6">Our support team is available 24/7 to help you with your resume building journey.</p>
          <button className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-[#e0e0e0] transition-colors">Contact Support</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
