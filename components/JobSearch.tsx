
import React, { useState } from 'react';
import { Search, MapPin, Briefcase, Filter, ArrowUpRight, Menu, TrendingUp, ChevronLeft, Building2, Calendar, DollarSign, Sparkles, Mail } from 'lucide-react';
import { Theme } from '../types';

interface JobSearchProps {
  onToggleMobile?: () => void;
  theme: Theme;
  onSculptResume: (job: { title: string, company: string, description: string }) => void;
  onSculptLetter: (job: { title: string, company: string, description: string }) => void;
}

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  match: string;
  tags: string[];
  description: string;
  posted: string;
  type: string;
}

const CustomMenuIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const JobSearch: React.FC<JobSearchProps> = ({ onToggleMobile, theme, onSculptResume, onSculptLetter }) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const jobs: Job[] = [
    { 
      id: 1, 
      title: 'Senior Frontend Engineer', 
      company: 'TechFlow', 
      location: 'Remote', 
      salary: '$140k - $180k', 
      match: '98%', 
      tags: ['React', 'Next.js', 'Typescript'],
      type: 'Full-time',
      posted: '2 days ago',
      description: `As a Senior Frontend Engineer at TechFlow, you'll be responsible for building high-performance web applications using React and Next.js. We are looking for someone with at least 5 years of experience in modern JavaScript frameworks.\n\nKey Responsibilities:\n- Architect scalable frontend systems\n- Mentor junior developers\n- Collaborate with product and design teams to deliver exceptional UX.`
    },
    { 
      id: 2, 
      title: 'Product Designer', 
      company: 'Nexus AI', 
      location: 'San Francisco, CA', 
      salary: '$120k - $160k', 
      match: '92%', 
      tags: ['Figma', 'UI/UX', 'Mobile'],
      type: 'Full-time',
      posted: '1 week ago',
      description: `Nexus AI is seeking a Product Designer to join our core product team. You will lead design efforts for our mobile and web platforms, ensuring a seamless AI-driven user experience.\n\nQualifications:\n- 3+ years in Product Design\n- Strong portfolio demonstrating complex problem solving\n- Proficiency in Figma and prototyping tools.`
    },
    { 
      id: 3, 
      title: 'Full Stack Developer', 
      company: 'CloudScale', 
      location: 'New York, NY', 
      salary: '$130k - $170k', 
      match: '85%', 
      tags: ['Node.js', 'PostgreSQL', 'AWS'],
      type: 'Contract',
      posted: '3 days ago',
      description: `Join CloudScale to help us build the next generation of cloud infrastructure management. We need a versatile developer comfortable across the entire stack.\n\nRequirements:\n- Strong Node.js and TypeScript skills\n- Experience with AWS (Lambda, RDS, S3)\n- Solid understanding of SQL and database optimization.`
    },
    { 
      id: 4, 
      title: 'Engineering Manager', 
      company: 'Horizon Web', 
      location: 'Austin, TX', 
      salary: '$190k - $240k', 
      match: '78%', 
      tags: ['Leadership', 'Strategy', 'Scale'],
      type: 'Full-time',
      posted: 'Just now',
      description: `Horizon Web is scaling fast and we need an experienced Engineering Manager to lead our Core Infrastructure tribe. You'll manage three squads of engineers and report directly to the VP of Engineering.\n\nFocus:\n- Team growth and career development\n- Technical roadmap execution\n- Cross-functional collaboration.`
    },
  ];

  const headerBg = theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]';
  const cardBg = theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a] hover:border-white' : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const textSecondary = theme === 'dark' ? 'text-[#a0a0a0]' : 'text-slate-500';

  if (selectedJob) {
    return (
      <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#191919]' : 'bg-[#F8FAFC]'}`}>
        <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${headerBg}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedJob(null)} className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-white' : 'hover:bg-slate-100 text-slate-800'}`}>
              <ChevronLeft size={24} />
            </button>
            <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Job Details</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onSculptLetter({ title: selectedJob.title, company: selectedJob.company, description: selectedJob.description })}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-white/10' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
            >
              <Mail size={16} /> Cover Letter
            </button>
            <button 
              onClick={() => onSculptResume({ title: selectedJob.title, company: selectedJob.company, description: selectedJob.description })}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
            >
              <Sparkles size={16} /> Sculpt Resume
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
          <div className="mb-8 flex items-start gap-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-bold text-4xl text-white shadow-xl">
              {selectedJob.company[0]}
            </div>
            <div>
              <h1 className={`text-3xl font-extrabold mb-1 ${textPrimary}`}>{selectedJob.title}</h1>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                <span className={`flex items-center gap-1.5 font-medium ${textSecondary}`}><Building2 size={16} /> {selectedJob.company}</span>
                <span className={`flex items-center gap-1.5 font-medium ${textSecondary}`}><MapPin size={16} /> {selectedJob.location}</span>
                <span className={`flex items-center gap-1.5 font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}><DollarSign size={16} /> {selectedJob.salary}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-slate-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Job Type</span>
              <p className={`font-bold mt-1 ${textPrimary}`}>{selectedJob.type}</p>
            </div>
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-slate-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Posted</span>
              <p className={`font-bold mt-1 ${textPrimary}`}>{selectedJob.posted}</p>
            </div>
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#121212] border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>ATS Match</span>
              <p className={`font-extrabold mt-1 text-xl ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{selectedJob.match}</p>
            </div>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className={`text-xl font-bold mb-4 ${textPrimary}`}>Role Description</h3>
              <div className={`whitespace-pre-line leading-relaxed ${textSecondary}`}>
                {selectedJob.description}
              </div>
            </section>
            
            <section>
              <h3 className={`text-xl font-bold mb-4 ${textPrimary}`}>Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {selectedJob.tags.map(tag => (
                  <span key={tag} className={`px-4 py-2 rounded-xl text-xs font-bold ${theme === 'dark' ? 'bg-white/5 text-slate-400 border border-white/5' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#191919]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${headerBg}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden">
            <CustomMenuIcon className={textPrimary} />
          </button>
          <div>
            <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Job Marketplace</h2>
            <p className={`text-[10px] md:text-xs ${textSecondary}`}>Discover roles that match your background</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className={`text-3xl font-extrabold mb-2 ${textPrimary}`}>Opportunities for you</h1>
          <p className={textSecondary}>Curated list of jobs optimized for your profile.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="flex-1 relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-[#555]' : 'text-slate-400'}`} size={20} />
            <input 
              type="text" 
              placeholder="Search by title or skills..."
              className={`w-full border rounded-2xl py-3.5 pl-12 pr-4 transition-all text-sm md:text-base outline-none ${
                theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a] text-white focus:border-white' : 'bg-white border-slate-200 text-[#0F172A] focus:border-indigo-500 shadow-sm'
              }`}
            />
          </div>
          <button className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95">
            Search
          </button>
        </div>

        <div className="space-y-4 pb-12">
          {jobs.map(job => (
            <div key={job.id} onClick={() => setSelectedJob(job)} className={`p-6 border rounded-3xl transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-500/10">
                  {job.company[0]}
                </div>
                <div>
                  <h3 className={`text-xl font-bold mb-1 transition-colors group-hover:text-indigo-500 ${textPrimary}`}>{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className={`text-sm font-medium ${textSecondary}`}>{job.company}</span>
                    <span className={`text-sm flex items-center gap-1 ${textSecondary}`}>
                      <MapPin size={14} /> {job.location}
                    </span>
                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{job.salary}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-6 md:border-l md:pl-6 border-slate-200 dark:border-white/5">
                <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                   {job.match} Match
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-bold transition-all group-hover:gap-2 ${textPrimary}`}>
                  View <ArrowUpRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JobSearch;
