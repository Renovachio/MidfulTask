import React from 'react';
import { CheckCircle2, Play, AlertCircle, Trash2, ArrowUp, ArrowDown, Bell } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { QUADRANTS } from '../constants';

interface TaskCardProps {
  task: Task;
  onMove: (task: Task) => void;
  onDelete: (task: Task) => void;
  onReorder?: (task: Task, direction: 'up' | 'down') => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  isNextUp?: boolean; // Is this the top priority backlog item?
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onMove, 
  onDelete, 
  onReorder,
  canMoveUp,
  canMoveDown,
  isNextUp 
}) => {
  const quadrantInfo = QUADRANTS[task.quadrant];

  // Helper to determine button action and style
  const renderActionButton = () => {
    if (task.status === TaskStatus.BACKLOG) {
      return (
        <button
          onClick={() => onMove(task)}
          className={`p-2 rounded-full transition-colors ${
            isNextUp 
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300' 
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700'
          }`}
          title="Start Task"
        >
          <Play size={16} fill={isNextUp ? "currentColor" : "none"} />
        </button>
      );
    }
    
    if (task.status === TaskStatus.IN_PROGRESS) {
      return (
        <button
          onClick={() => onMove(task)}
          className="p-2 rounded-full bg-mindful-secondaryDim text-mindful-secondaryText hover:bg-mindful-secondary/20 transition-colors dark:bg-mindful-dark-secondary/20 dark:text-mindful-dark-secondary"
          title="Complete Task"
        >
          <CheckCircle2 size={18} />
        </button>
      );
    }

    return null; // Done state has no action usually
  };

  const formatReminder = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    return isToday ? `Today, ${timeStr}` : `${dateStr}, ${timeStr}`;
  };

  return (
    <div className={`
      relative group bg-white dark:bg-mindful-dark-card p-4 rounded-xl border transition-all duration-300
      ${task.status === TaskStatus.IN_PROGRESS ? `shadow-md ring-2 ring-blue-200 dark:ring-blue-800 border-transparent` : `${quadrantInfo.borderColor} dark:border-slate-700 hover:shadow-md`}
      ${task.status === TaskStatus.DONE ? 'opacity-70 bg-mindful-secondaryDim/30 dark:bg-slate-800 border-mindful-secondary/20 dark:border-slate-700' : ''}
    `}>
      {/* Colored Left Border for visual identification (unless Done) */}
      {task.status !== TaskStatus.DONE && (
        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${quadrantInfo.color.replace('text-', 'bg-')}`} />
      )}

      {/* Header Row: Badge & Delete */}
      <div className="flex items-start justify-between mb-2 pl-3">
        <div className="flex gap-2">
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${quadrantInfo.bgColor} ${quadrantInfo.color} dark:bg-opacity-20`}>
            {quadrantInfo.label}
          </span>
          
          {/* Priority Indicator for Backlog */}
          {task.status === TaskStatus.BACKLOG && isNextUp && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">
              <AlertCircle size={10} />
              Next Up
            </span>
          )}
        </div>

        <button 
          onClick={() => onDelete(task)}
          className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-1"
          title="Delete Task"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <p className={`text-sm text-mindful-text dark:text-mindful-dark-text leading-relaxed mb-4 pl-3 ${task.status === TaskStatus.DONE ? 'line-through text-mindful-textLight dark:text-slate-500' : ''}`}>
        {task.content}
      </p>

      {/* Footer Row: Date & Actions */}
      <div className="flex items-center justify-between pl-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-mindful-textLight dark:text-mindful-dark-textLight">
             {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          
          {task.reminder && task.status !== TaskStatus.DONE && (
            <span className={`flex items-center gap-1 text-[10px] ${task.reminder < Date.now() ? 'text-rose-500 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
               <Bell size={10} />
               {formatReminder(task.reminder)}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Reorder Controls */}
          {task.status === TaskStatus.BACKLOG && onReorder && (
            <div className="flex flex-col gap-0.5 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onReorder(task, 'up')}
                disabled={!canMoveUp}
                className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-20 disabled:hover:text-slate-400"
                title="Move Up"
              >
                <ArrowUp size={14} />
              </button>
              <button 
                onClick={() => onReorder(task, 'down')}
                disabled={!canMoveDown}
                className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-20 disabled:hover:text-slate-400"
                title="Move Down"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          )}

          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};