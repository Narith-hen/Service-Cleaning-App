import React from 'react';
import { Bell, MessageSquare, ChevronRight } from 'lucide-react';
export const Header = ({ currentView, onProfileClick }) => {
  const viewLabels = {
    login: 'Login',
    dashboard: 'Dashboard',
    'job-requests': 'Job Requests',
    management: 'Management',
    customers: 'Customer Management',
    cleaners: 'Cleaner Management',
    earnings: 'Earnings',
    reviews: 'Reviews',
    settings: 'Profile',
  };

  return (
    <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between py-6 mb-10 -mx-10 px-10 border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
        <span>Pages</span>
        <ChevronRight size={16} />
        <span className="text-slate-900 dark:text-slate-100 font-medium">{viewLabels[currentView]}</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-full relative transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          </button>
          <button className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors">
            <MessageSquare size={20} />
          </button>
        </div>

        <button 
          onClick={onProfileClick}
          className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-800 hover:opacity-80 transition-opacity"
        >
          <div className="text-right">
            <p className="text-sm font-bold leading-tight">Alex Johnson</p>
            <p className="text-[11px] text-[#00D362] font-bold">Premium Cleaner</p>
          </div>
          <div className="relative">
            <img 
              alt="Alex Johnson Profile" 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#00D362]/20" 
              src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100" 
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00D362] border-2 border-white dark:border-slate-900 rounded-full"></div>
          </div>
        </button>
      </div>
    </header>
  );
};
