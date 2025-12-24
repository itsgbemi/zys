
import React from 'react';
import { Search, MapPin, Briefcase, Filter, ArrowUpRight, Menu, TrendingUp } from 'lucide-react';
import { Theme } from '../types';

interface JobSearchProps {
  onToggleMobile?: () => void;
  theme: Theme;
}

const JobSearch: React.FC<JobSearchProps> = ({ onToggleMobile, theme }) => {
  const jobs = [
    { id: 1, title: 'Senior Frontend Engineer', company: 'TechFlow', location: 'Remote', salary: '$140k - $180k', match: '98%', tags: ['React', 'Next.js', 'Typescript'] },
    { id: 2, title: 'Product Designer', company: 'Nexus AI', location: 'San Francisco, CA', salary: '$120k - $160k', match: '92%', tags: ['Figma', 'UI/UX', 'Mobile'] },
    { id: 3, title: 'Full Stack Developer', company: 'CloudScale', location: 'New York, NY', salary: '$130k - $170k', match: '85%', tags: ['Node.js', 'PostgreSQL', 'AWS'] },
    { id: 4, title: 'Engineering Manager', company: 'Horizon Web', location: 'Austin, TX', salary: '$190k - $240k', match: '78%', tags: ['Leadership', 'Strategy', 'Scale'] },
  ];

  const headerBg = theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]';
  const cardBg = theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a] hover:border-white' : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const textSecondary = theme === 'dark' ? 'text-[#a0a0a0]' : 'text-slate-500';

  return (
    <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#191919]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${headerBg}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden">
            <Menu size={24} className={textPrimary} />
          </button>
          <div>
            <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Job Matcher</h2>
            <p className={`text-[10px] md:text-xs ${textSecondary}`}>Opportunities tailored to your sculpts</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="mb-8 hidden md:block">
          <h1 className={`text-3xl font-bold mb-2 ${textPrimary}`}>Recommended for you</h1>
          <p className={textSecondary}>Based on your most recent AI-optimized resume profile.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-10">
          <div className="flex-1 relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-[#555]' : 'text-slate-400'}`} size={20} />
            <input 
              type="text" 
              placeholder="Job title, keywords, or company"
              className={`w-full border rounded-2xl py-3.5 pl-12 pr-4 transition-all text-sm md:text-base outline-none ${
                theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a] text-white focus:border-white' : 'bg-white border-slate-200 text-[#0F172A] focus:border-indigo-500 shadow-sm'
              }`}
            />
          </div>
          <div className="w-full lg:w-64 relative">
            <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-[#555]' : 'text-slate-400'}`} size={20} />
            <input 
              type="text" 
              placeholder="Remote or City"
              className={`w-full border rounded-2xl py-3.5 pl-12 pr-4 transition-all text-sm md:text-base outline-none ${
                theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a] text-white focus:border-white' : 'bg-white border-slate-200 text-[#0F172A] focus:border-indigo-500 shadow-sm'
              }`}
            />
          </div>
          <button className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95">
            <Search size={20} /> Search
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map(job => (
            <div key={job.id} className={`p-6 border rounded-3xl transition-all cursor-pointer group flex flex-col justify-between ${cardBg}`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-500/10">
                    {job.company[0]}
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${theme === 'dark' ? 'bg-white/5 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <TrendingUp size={12} /> {job.match} ATS Match
                  </div>
                </div>
                <h3 className={`text-xl font-bold mb-1 transition-colors group-hover:text-indigo-600 ${textPrimary}`}>{job.title}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-sm font-medium ${textSecondary}`}>{job.company}</span>
                  <span className={`w-1 h-1 rounded-full ${theme === 'dark' ? 'bg-[#2a2a2a]' : 'bg-slate-300'}`}></span>
                  <span className={`text-sm flex items-center gap-1 ${textSecondary}`}>
                    <MapPin size={14} /> {job.location}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {job.tags.map(tag => (
                    <span key={tag} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'bg-white/5 text-slate-500 border border-white/5' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className={`pt-6 border-t flex items-center justify-between ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                <div className={`text-sm font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{job.salary}</div>
                <button className={`flex items-center gap-1.5 text-sm font-bold transition-all group-hover:gap-2 ${textPrimary}`}>
                  Sculpt Application <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JobSearch;
