import React from 'react';
import { CheckCircle2, Play, AlertCircle } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { QUADRANTS } from '../constants';

interface TaskCardProps {
  task: Task;
  onMove: (task: Task) => void;
  isNextUp?: boolean; // Is this the top priority backlog item?
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onMove, isNextUp }) => {
  const quadrantInfo = QUADRANTS[task.quadrant];

  // Helper to determine button action and style
  const renderActionButton = () => {
    if (task.status === TaskStatus.BACKLOG) {
      return (
        <button
          onClick={() => onMove(task)}
          className={`p-2 rounded-full transition-colors ${
            isNextUp 
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
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
          className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
          title="Complete Task"
        >
          <CheckCircle2 size={18} />
        </button>
      );
    }

    return null; // Done state has no action usually, or maybe archive
  };

  return (
    <div className={`
      relative group bg-white p-4 rounded-xl border transition-all duration-200
      ${task.status === TaskStatus.IN_PROGRESS ? `shadow-md ring-2 ${quadrantInfo.ringColor} border-transparent` : `${quadrantInfo.borderColor} hover:shadow-md`}
      ${task.status === TaskStatus.DONE ? 'opacity-60 bg-slate-50 border-slate-200' : ''}
    `}>
      {/* Colored Left Border for visual identification (unless Done) */}
      {task.status !== TaskStatus.DONE && (
        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${quadrantInfo.color.replace('text-', 'bg-')}`} />
      )}

      {/* Quadrant Badge */}
      <div className="flex items-start justify-between mb-2 pl-3">
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${quadrantInfo.bgColor} ${quadrantInfo.color}`}>
          {quadrantInfo.label}
        </span>
        
        {/* Priority Indicator for Backlog */}
        {task.status === TaskStatus.BACKLOG && isNextUp && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            <AlertCircle size={10} />
            Next Up
          </span>
        )}
      </div>

      <p className={`text-sm text-slate-800 leading-relaxed mb-4 pl-3 ${task.status === TaskStatus.DONE ? 'line-through text-slate-500' : ''}`}>
        {task.content}
      </p>

      <div className="flex items-center justify-between pl-3">
        <span className="text-xs text-slate-400">
           {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
        {renderActionButton()}
      </div>
    </div>
  );
};