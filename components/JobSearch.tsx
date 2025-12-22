
import React from 'react';
import { Search, MapPin, Briefcase, Filter, ArrowUpRight } from 'lucide-react';

const JobSearch: React.FC = () => {
  const jobs = [
    { id: 1, title: 'Senior Frontend Engineer', company: 'TechFlow', location: 'Remote', salary: '$140k - $180k', match: '98%' },
    { id: 2, title: 'Product Designer', company: 'Nexus AI', location: 'San Francisco, CA', salary: '$120k - $160k', match: '92%' },
    { id: 3, title: 'Full Stack Developer', company: 'CloudScale', location: 'New York, NY', salary: '$130k - $170k', match: '85%' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Find your next role</h1>
        <p className="text-[#a0a0a0]">Powered by your freshly sculpted resume.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" size={20} />
          <input 
            type="text" 
            placeholder="Job title, keywords, or company"
            className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-white transition-colors"
          />
        </div>
        <div className="w-full md:w-64 relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" size={20} />
          <input 
            type="text" 
            placeholder="Location"
            className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-white transition-colors"
          />
        </div>
        <button className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-[#e0e0e0] transition-colors flex items-center gap-2">
          <Search size={20} />
          Search
        </button>
      </div>

      <div className="flex gap-4 mb-8">
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] rounded-lg text-sm border border-[#333]">
          <Filter size={16} /> Filters
        </button>
        <button className="px-4 py-2 bg-[#2a2a2a] rounded-lg text-sm border border-[#333]">Salary</button>
        <button className="px-4 py-2 bg-[#2a2a2a] rounded-lg text-sm border border-[#333]">Job Type</button>
      </div>

      <div className="space-y-4">
        {jobs.map(job => (
          <div key={job.id} className="p-6 bg-[#121212] border border-[#2a2a2a] rounded-2xl hover:border-white transition-all cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xl">
                  {job.company[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold group-hover:text-indigo-400 transition-colors">{job.title}</h3>
                  <p className="text-[#a0a0a0] flex items-center gap-2 mt-1">
                    <Briefcase size={14} /> {job.company} • <MapPin size={14} /> {job.location}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-green-400">{job.match} Match</div>
                <div className="text-sm text-[#a0a0a0] mt-1">{job.salary}</div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between pt-6 border-t border-[#1f1f1f]">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-[#1f1f1f] rounded-full text-[10px] text-[#888] uppercase tracking-wider">Full-time</span>
                <span className="px-3 py-1 bg-[#1f1f1f] rounded-full text-[10px] text-[#888] uppercase tracking-wider">React</span>
                <span className="px-3 py-1 bg-[#1f1f1f] rounded-full text-[10px] text-[#888] uppercase tracking-wider">Node.js</span>
              </div>
              <button className="flex items-center gap-1 text-sm font-bold text-white group-hover:translate-x-1 transition-transform">
                Apply with Zysculpt <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobSearch;
