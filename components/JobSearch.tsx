import React, { useState } from 'react';
import { Search, MapPin, Building2, ChevronLeft, DollarSign, Sparkles, Mail, Menu, ArrowUpRight } from 'lucide-react';
import { Theme, AppView } from '../types';

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

const JobSearch: React.FC<JobSearchProps> = ({ onToggleMobile, theme, onSculptResume, onSculptLetter }) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const jobs: Job[] = [
    { 
      id: 1, 
      title: 'Digital Marketing Manager', 
      company: 'VibeMedia', 
      location: 'London / Remote', 
      salary: '£65k - £85k', 
      match: '96%', 
      tags: ['Growth', 'SEO', 'Paid Social'],
      type: 'Full-time',
      posted: '4 hours ago',
      description: `VibeMedia is looking for a data-driven Digital Marketing Manager to lead our growth efforts. You will be responsible for scaling user acquisition across multiple paid and organic channels.\n\nKey Responsibilities:\n- Manage annual performance marketing budget\n- Lead SEO and content strategy\n- Analyze campaign metrics to optimize CAC and LTV.`
    },
    { 
      id: 2, 
      title: 'Creative Director', 
      company: 'Loom Studio', 
      location: 'New York, NY', 
      salary: '$150k - $200k', 
      match: '91%', 
      tags: ['Branding', 'Leadership', 'Concept'],
      type: 'Full-time',
      posted: '1 day ago',
      description: `Loom Studio is a premium branding agency. We need a visionary Creative Director to lead our design team and oversee high-impact campaigns for global fashion brands.\n\nQualifications:\n- 10+ years in agency environments\n- Strong portfolio in identity and spatial design\n- Proven leadership of multi-disciplinary teams.`
    },
    { 
      id: 3, 
      title: 'Head of Sales', 
      company: 'SaaSFlow', 
      location: 'Chicago, IL', 
      salary: '$140k + OTE', 
      match: '88%', 
      tags: ['Salesforce', 'Negotiation', 'B2B'],
      type: 'Full-time',
      posted: '2 days ago',
      description: `SaaSFlow provides workflow automation for HR teams. We are seeking an aggressive Head of Sales to build our enterprise sales motion from the ground up.\n\nFocus:\n- Hiring and mentoring a team of 5 AEs\n- Managing high-value pipeline in Salesforce\n- Closing deals with Fortune 500 stakeholders.`
    },
    { 
      id: 4, 
      title: 'HR Specialist', 
      company: 'EcoGreen Global', 
      location: 'Remote', 
      salary: '$80k - $100k', 
      match: '94%', 
      tags: ['Compliance', 'Culture', 'Remote'],
      type: 'Full-time',
      posted: 'Just now',
      description: `EcoGreen is a sustainable energy startup. We need an HR Specialist to manage our global remote culture, ensure compliance across 10+ countries, and lead employee engagement initiatives.`
    },
    { 
      id: 5, 
      title: 'Senior Frontend Engineer', 
      company: 'TechFlow', 
      location: 'Remote', 
      salary: '$140k - $180k', 
      match: '82%', 
      tags: ['React', 'Next.js', 'Typescript'],
      type: 'Full-time',
      posted: '2 days ago',
      description: `Build high-performance web applications using React and Next.js. We are looking for someone with at least 5 years of experience in modern JavaScript frameworks.`
    },
  ];

  const headerBg = theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]';
  const cardBg = theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a] hover:border-[#1918f0]' : 'bg-white border-slate-200 hover:border-[#1918f0] hover:shadow-xl hover:shadow-indigo-500/5';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const textSecondary = theme === 'dark' ? 'text-[#a0a0a0]' : 'text-slate-500';

  if (selectedJob) {
    return (
      <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#F8FAFC]'}`}>
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
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs font-bold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-white/10' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
            >
              <Mail size={16} /> <span className="hidden sm:inline">Cover Letter</span>
            </button>
            <button 
              onClick={() => onSculptResume({ title: selectedJob.title, company: selectedJob.company, description: selectedJob.description })}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#1918f0] text-white rounded-xl text-xs font-bold hover:bg-[#1413c7] shadow-lg shadow-indigo-500/20"
            >
              <Sparkles size={16} /> <span className="hidden sm:inline">Sculpt Resume</span>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
          <div className="mb-8 flex items-start gap-4 md:gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#1918f0] to-indigo-800 flex items-center justify-center font-bold text-2xl md:text-4xl text-white shadow-xl">
              {selectedJob.company[0]}
            </div>
            <div>
              <h1 className={`text-2xl md:text-3xl font-extrabold mb-1 ${textPrimary}`}>{selectedJob.title}</h1>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                <span className={`flex items-center gap-1.5 text-sm font-medium ${textSecondary}`}><Building2 size={16} /> {selectedJob.company}</span>
                <span className={`flex items-center gap-1.5 text-sm font-medium ${textSecondary}`}><MapPin size={16} /> {selectedJob.location}</span>
                <span className={`flex items-center gap-1.5 text-sm font-bold text-[#1918f0]`}><DollarSign size={16} /> {selectedJob.salary}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-slate-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Job Type</span>
              <p className={`font-bold mt-1 ${textPrimary}`}>{selectedJob.type}</p>
            </div>
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-slate-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Posted</span>
              <p className={`font-bold mt-1 ${textPrimary}`}>{selectedJob.posted}</p>
            </div>
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#1918f0]/10 border-[#1918f0]/30' : 'bg-indigo-50 border-indigo-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest text-[#1918f0]`}>ATS Match</span>
              <p className={`font-extrabold mt-1 text-xl text-[#1918f0]`}>{selectedJob.match}</p>
            </div>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className={`text-xl font-bold mb-4 ${textPrimary}`}>Role Description</h3>
              <div className={`whitespace-pre-line leading-relaxed text-sm md:text-base ${textSecondary}`}>
                {selectedJob.description}
              </div>
            </section>
            
            <section>
              <h3 className={`text-xl font-bold mb-4 ${textPrimary}`}>Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {selectedJob.tags.map(tag => (
                  <span key={tag} className={`px-3 md:px-4 py-2 rounded-xl text-[11px] md:text-xs font-bold ${theme === 'dark' ? 'bg-white/5 text-slate-400 border border-white/5' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
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
    <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${headerBg}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-[#1918f0] transition-colors">
            <Menu size={24} />
          </button>
          <div>
            <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Job Marketplace</h2>
            <p className={`text-[10px] md:text-xs ${textSecondary}`}>Discover roles that match your background</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className={`text-2xl md:text-3xl font-extrabold mb-2 ${textPrimary}`}>Opportunities for you</h1>
          <p className={textSecondary}>Curated list of jobs optimized for your profile.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-10">
          <div className="flex-1 relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-[#555]' : 'text-slate-400'}`} size={20} />
            <input 
              type="text" 
              placeholder="Search by title or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-2xl py-3.5 pl-12 pr-4 transition-all text-sm md:text-base outline-none ${
                theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a] text-white focus:border-[#1918f0]' : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#1918f0] shadow-sm'
              }`}
            />
          </div>
          <button className="px-8 py-3.5 bg-[#1918f0] text-white rounded-2xl font-bold hover:bg-[#1413c7] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95">
            Search
          </button>
        </div>

        <div className="space-y-4 pb-12">
          {jobs.filter(j => j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.company.toLowerCase().includes(searchQuery.toLowerCase())).map(job => (
            <div key={job.id} onClick={() => setSelectedJob(job)} className={`p-6 border rounded-3xl transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#1918f0] to-indigo-800 flex items-center justify-center font-bold text-xl md:text-2xl text-white shadow-lg shadow-indigo-500/10">
                  {job.company[0]}
                </div>
                <div>
                  <h3 className={`text-lg md:text-xl font-bold mb-1 transition-colors group-hover:text-[#1918f0] ${textPrimary}`}>{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className={`text-xs md:text-sm font-medium ${textSecondary}`}>{job.company}</span>
                    <span className={`text-xs md:text-sm flex items-center gap-1 ${textSecondary}`}>
                      <MapPin size={14} /> {job.location}
                    </span>
                    <span className={`text-xs md:text-sm font-bold text-[#1918f0]`}>{job.salary}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-6 md:border-l md:pl-6 border-slate-200 dark:border-white/5">
                <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${theme === 'dark' ? 'bg-[#1918f0]/10 text-[#1918f0]' : 'bg-indigo-50 text-[#1918f0]'}`}>
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