import React from 'react';
import { Task, EmotionalState, TaskStatus } from '../types';
import { QUADRANTS } from '../constants';
import { CheckCircle2, Smile, Activity } from 'lucide-react';

interface AnalyticsViewProps {
  tasks: Task[];
  emotions: EmotionalState[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks, emotions }) => {
  const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE);
  const backlogTasks = tasks.filter(t => t.status === TaskStatus.BACKLOG);
  
  // Calculate Quadrant Distribution
  const quadrantCounts = backlogTasks.reduce((acc, task) => {
    acc[task.quadrant] = (acc[task.quadrant] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalBacklog = backlogTasks.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Activity className="text-indigo-500" size={20} />
          Current Focus Balance
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Understanding your workload helps reduce anxiety. Here is how your pending tasks are distributed.
        </p>
        
        <div className="space-y-3">
          {(Object.values(QUADRANTS) as typeof QUADRANTS[keyof typeof QUADRANTS][]).map((q) => {
            const count = quadrantCounts[q.id] || 0;
            const percentage = totalBacklog > 0 ? (count / totalBacklog) * 100 : 0;
            
            return (
              <div key={q.id} className="relative">
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className={`${q.color}`}>{q.label}</span>
                  <span className="text-slate-400">{count} tasks</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${q.color.replace('text-', 'bg-')}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-800 mb-2">
            <CheckCircle2 size={18} />
            <span className="font-semibold text-sm">Completed</span>
          </div>
          <div className="text-3xl font-bold text-emerald-700">
            {completedTasks.length}
          </div>
          <p className="text-xs text-emerald-600 mt-1">Tasks finished</p>
        </div>

        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
          <div className="flex items-center gap-2 text-indigo-800 mb-2">
            <Smile size={18} />
            <span className="font-semibold text-sm">Check-ins</span>
          </div>
          <div className="text-3xl font-bold text-indigo-700">
            {emotions.length}
          </div>
          <p className="text-xs text-indigo-600 mt-1">Mindful moments</p>
        </div>
      </div>

      {emotions.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Emotional History</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[...emotions].reverse().slice(0, 10).map((e, i) => {
              const emojis: Record<string, string> = {
                'OVERWHELMED': '😰',
                'ANXIOUS': '😟',
                'NEUTRAL': '😐',
                'CALM': '🙂',
                'CONTROL': '😌',
              };
              return (
                <div key={i} className="flex flex-col items-center min-w-[50px] p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-2xl mb-1">{emojis[e.feeling]}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(e.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};