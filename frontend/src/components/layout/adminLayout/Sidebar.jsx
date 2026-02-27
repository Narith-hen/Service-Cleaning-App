import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Calendar, 
  Wallet, 
  Star, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import logoSomaet from '../../../assets/Logo_somaet.png';

export const Sidebar = ({ 
  currentView, 
  onViewChange, 
  onLogout,
  isCollapsed,
  onToggle
}) => {
  const [isManagementOpen, setIsManagementOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'job-requests', label: 'Job Requests', icon: ClipboardList },
    { 
      id: 'management', 
      label: 'Management', 
      icon: Users,
      subItems: [
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'cleaners', label: 'Cleaning Companies', icon: UserCheck },
      ]
    },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={cn(
      "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed h-full z-30 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div 
        onClick={onToggle}
        className={cn("p-6 flex items-center gap-3 relative cursor-pointer group/header", isCollapsed && "justify-center px-0")}
      >
        <div className="w-10 h-10 bg-white border border-[#00D362]/30 rounded-xl flex items-center justify-center shrink-0 group-hover/header:scale-110 transition-transform p-1">
          <img src={logoSomaet} alt="Somaet logo" className="w-full h-full object-contain" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="font-bold text-lg leading-tight">Somaet Admin</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase">Management Portal</p>
          </div>
        )}
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-[#00D362] shadow-sm z-40 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className={cn("flex-1 px-4 space-y-1 mt-4", isCollapsed && "px-2")}>
        {menuItems.map((item) => {
          const hasSubItems = 'subItems' in item;
          const isActive = currentView === item.id || (hasSubItems && item.subItems.some(sub => sub.id === currentView));

          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => {
                  if (hasSubItems && !isCollapsed) {
                    setIsManagementOpen(!isManagementOpen);
                  } else {
                    onViewChange(item.id);
                  }
                }}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                  isCollapsed && "justify-center px-0",
                  isActive 
                    ? "bg-[#00D362]/10 text-[#00D362]" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <item.icon size={20} className="shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="font-medium flex-1 text-left overflow-hidden whitespace-nowrap">{item.label}</span>
                    {hasSubItems && (
                      <ChevronDown 
                        size={16} 
                        className={cn("transition-transform duration-200", isManagementOpen && "rotate-180")} 
                      />
                    )}
                  </>
                )}
              </button>

              {hasSubItems && isManagementOpen && !isCollapsed && (
                <div className="pl-4 space-y-1 mt-1">
                  {item.subItems.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => onViewChange(sub.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                        currentView === sub.id 
                          ? "text-[#00D362] font-bold" 
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      )}
                    >
                      <sub.icon size={16} />
                      <span className="text-sm font-medium">{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className={cn("p-6 border-t border-slate-100 dark:border-slate-800", isCollapsed && "px-2")}>
        <button 
          onClick={onLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 py-3 rounded-xl font-semibold transition-all",
            isCollapsed && "px-0"
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span className="overflow-hidden whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
