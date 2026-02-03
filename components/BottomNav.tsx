import React from 'react';
import { LayoutDashboard, BarChart2 } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'board' | 'analytics';
  onTabChange: (tab: 'board' | 'analytics') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 flex justify-around items-center h-16">
      <button
        onClick={() => onTabChange('board')}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
          activeTab === 'board' 
            ? 'text-indigo-600 bg-indigo-50' 
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
        }`}
      >
        <LayoutDashboard size={24} />
        <span className="text-[10px] font-medium">Board</span>
      </button>

      <button
        onClick={() => onTabChange('analytics')}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
          activeTab === 'analytics' 
            ? 'text-indigo-600 bg-indigo-50' 
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
        }`}
      >
        <BarChart2 size={24} />
        <span className="text-[10px] font-medium">Analytics</span>
      </button>
    </div>
  );
};