import React from 'react';
import { LayoutDashboard, BarChart2, Home } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'board' | 'analytics';
  onTabChange: (tab: 'home' | 'board' | 'analytics') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-mindful-dark-card border-t border-slate-200 dark:border-slate-800 px-6 py-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-none z-40 flex justify-around items-center h-16 transition-colors duration-300">
      <button
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
          activeTab === 'home' 
            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' 
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <Home size={24} />
        <span className="text-[10px] font-medium">Focus</span>
      </button>

      <button
        onClick={() => onTabChange('board')}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
          activeTab === 'board' 
            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' 
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <LayoutDashboard size={24} />
        <span className="text-[10px] font-medium">Board</span>
      </button>

      <button
        onClick={() => onTabChange('analytics')}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
          activeTab === 'analytics' 
            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' 
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <BarChart2 size={24} />
        <span className="text-[10px] font-medium">Analytics</span>
      </button>
    </div>
  );
};