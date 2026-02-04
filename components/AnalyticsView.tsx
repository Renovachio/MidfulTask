import React, { useMemo, useState, useEffect } from 'react';
import { Task, EmotionalState, TaskStatus } from '../types';
import { QUADRANTS } from '../constants';
import { 
  CheckCircle2, 
  Smile, 
  Activity, 
  Heart, 
  Zap, 
  Coffee, 
  Wind,
  Brain,
  ShieldCheck,
  Lightbulb,
  RefreshCw
} from 'lucide-react';

interface AnalyticsViewProps {
  tasks: Task[];
  emotions: EmotionalState[];
}

const PERSPECTIVE_QUOTES = [
  {
    quote: "Anxiety is the dizziness of freedom. It often arises not because you can't handle things, but because you care about the outcome.",
    action: "Try to replace \"I have to\" with \"I choose to\"."
  },
  {
    quote: "You don't have to control your thoughts. You just have to stop letting them control you.",
    action: "Observe your thought, label it 'thinking', and let it float by."
  },
  {
    quote: "Present fear is just the imagination of a future that hasn't happened yet.",
    action: "Ask yourself: Is there a problem right now, in this exact second?"
  },
  {
    quote: "The only way to eat an elephant is one bite at a time.",
    action: "Focus only on the very next physical action you need to take."
  },
  {
    quote: "Productivity is not about doing more. It is about creating more impact with less work.",
    action: "What is the one thing that, if done, makes everything else easier?"
  },
  {
    quote: "Feelings are just visitors, let them come and go.",
    action: "Acknowledge the anxiety, thank it for trying to protect you, and return to the task."
  },
  {
    quote: "Perfectionism is the voice of the oppressor, the enemy of the people.",
    action: "Aim for B+ work. It is usually good enough and gets done faster."
  }
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks, emotions }) => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * PERSPECTIVE_QUOTES.length));
  }, []);

  const handlePerspectiveClick = () => {
    setQuoteIndex(prev => {
      let next = Math.floor(Math.random() * PERSPECTIVE_QUOTES.length);
      while (next === prev && PERSPECTIVE_QUOTES.length > 1) {
        next = Math.floor(Math.random() * PERSPECTIVE_QUOTES.length);
      }
      return next;
    });
  };

  const { completedTasks, backlogTasks } = useMemo(() => {
    return {
      completedTasks: tasks.filter(t => t.status === TaskStatus.DONE),
      backlogTasks: tasks.filter(t => t.status === TaskStatus.BACKLOG)
    };
  }, [tasks]);

  // Calculate Quadrant Distribution
  const quadrantCounts = backlogTasks.reduce((acc, task) => {
    acc[task.quadrant] = (acc[task.quadrant] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalBacklog = backlogTasks.length;

  // Insight Generator Logic
  const getInsight = () => {
    const doFirstCount = quadrantCounts['DO_FIRST'] || 0;
    const recentFeeling = emotions.length > 0 ? emotions[emotions.length - 1].feeling : null;

    if (totalBacklog === 0 && completedTasks.length > 0) {
        return {
            title: "Moment of Clarity",
            message: "Your board is clear. This is a rare moment of empty space—try to enjoy it without rushing to fill it.",
            color: "text-mindful-secondaryText dark:text-emerald-300",
            bg: "bg-mindful-secondaryDim dark:bg-emerald-900/20",
            border: "border-mindful-secondary/30 dark:border-emerald-800",
            icon: <Wind size={20} />
        };
    }

    if (recentFeeling === 'OVERWHELMED' || recentFeeling === 'ANXIOUS') {
        return {
            title: "Signal to Pause",
            message: "Your emotions are signaling high friction. Anxiety often comes from looking at the whole mountain. Look only at the step right in front of you.",
            color: "text-rose-700 dark:text-rose-300",
            bg: "bg-rose-50 dark:bg-rose-900/20",
            border: "border-rose-100 dark:border-rose-800",
            icon: <Heart size={20} />
        };
    }

    if (doFirstCount > 3) {
        return {
            title: "Urgency Overload",
            message: `You have ${doFirstCount} urgent tasks competing for attention. This is a common source of anxiety. Pick just one, and grant yourself permission to ignore the rest for 30 minutes.`,
            color: "text-amber-700 dark:text-amber-300",
            bg: "bg-amber-50 dark:bg-amber-900/20",
            border: "border-amber-100 dark:border-amber-800",
            icon: <Zap size={20} />
        };
    }

    return {
        title: "Steady Flow",
        message: "You are maintaining a healthy balance between urgency and importance. Keep moving steadily.",
        color: "text-mindful-secondaryText dark:text-emerald-300",
        bg: "bg-mindful-secondaryDim dark:bg-emerald-900/20",
        border: "border-mindful-secondary/30 dark:border-emerald-800",
        icon: <ShieldCheck size={20} />
    };
  };

  const insight = getInsight();
  const currentPerspective = PERSPECTIVE_QUOTES[quoteIndex];

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      
      {/* 1. Dynamic Insight Card */}
      <div className={`p-5 rounded-2xl border ${insight.bg} ${insight.border}`}>
        <div className="flex items-start gap-3">
            <div className={`p-2 bg-white dark:bg-mindful-dark-card rounded-xl shadow-sm ${insight.color}`}>
                {insight.icon}
            </div>
            <div>
                <h3 className={`font-bold text-sm uppercase tracking-wide mb-1 ${insight.color}`}>
                    {insight.title}
                </h3>
                <p className="text-mindful-text dark:text-mindful-dark-text text-sm leading-relaxed">
                    {insight.message}
                </p>
            </div>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-mindful-dark-card p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-mindful-textLight dark:text-mindful-dark-textLight mb-2">
            <CheckCircle2 size={16} className="text-mindful-secondary dark:text-mindful-dark-secondary" />
            <span className="font-medium text-xs uppercase">Done</span>
          </div>
          <div className="text-3xl font-bold text-mindful-text dark:text-mindful-dark-text">
            {completedTasks.length}
          </div>
        </div>

        <div className="bg-white dark:bg-mindful-dark-card p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-mindful-textLight dark:text-mindful-dark-textLight mb-2">
            <Smile size={16} />
            <span className="font-medium text-xs uppercase">Moods Logged</span>
          </div>
          <div className="text-3xl font-bold text-mindful-text dark:text-mindful-dark-text">
            {emotions.length}
          </div>
        </div>
      </div>

      {/* 3. Perspective on Anxiety (Clickable) */}
      <button 
        onClick={handlePerspectiveClick}
        className="w-full text-left bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-slate-900/20 p-6 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30 hover:shadow-sm transition-all relative group"
      >
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-50 transition-opacity">
            <RefreshCw size={14} className="text-indigo-400" />
        </div>
        <div className="flex items-center gap-2 mb-3 text-indigo-900/60 dark:text-indigo-300/60">
            <Brain size={18} />
            <h3 className="font-bold text-xs uppercase tracking-wider">Perspective Shift</h3>
        </div>
        <blockquote className="text-lg font-medium text-mindful-text dark:text-mindful-dark-text italic mb-4 relative z-10">
            "{currentPerspective.quote}"
        </blockquote>
        <div className="text-xs text-mindful-textLight dark:text-mindful-dark-textLight bg-white/50 dark:bg-black/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
            {currentPerspective.action}
        </div>
      </button>

      {/* 4. Workload Balance Visualization */}
      <div className="bg-white dark:bg-mindful-dark-card p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-mindful-text dark:text-mindful-dark-text mb-4 flex items-center gap-2">
          <Activity className="text-slate-400" size={16} />
          Current Load Distribution
        </h3>
        
        <div className="space-y-4">
          {(Object.values(QUADRANTS) as typeof QUADRANTS[keyof typeof QUADRANTS][]).map((q) => {
            const count = quadrantCounts[q.id] || 0;
            const percentage = totalBacklog > 0 ? (count / totalBacklog) * 100 : 0;
            
            return (
              <div key={q.id} className="relative">
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className={`${q.color} dark:text-opacity-80 flex items-center gap-1.5`}>
                    <span className={`w-2 h-2 rounded-full ${q.color.replace('text-', 'bg-')}`}></span>
                    {q.label}
                  </span>
                  <span className="text-mindful-textLight dark:text-mindful-dark-textLight">{count}</span>
                </div>
                <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
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

      {/* 5. Coping Tips */}
      <div>
        <h3 className="text-sm font-bold text-mindful-text dark:text-mindful-dark-text mb-3 ml-1 flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-500" />
            Micro-Strategies
        </h3>
        <div className="space-y-3">
            <div className="bg-white dark:bg-mindful-dark-card p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors cursor-pointer group">
                <div className="flex items-start gap-4">
                    <div className="bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 p-2 rounded-lg group-hover:scale-110 transition-transform">
                        <Wind size={20} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-mindful-text dark:text-mindful-dark-text text-sm mb-1">Box Breathing</h4>
                        <p className="text-xs text-mindful-textLight dark:text-mindful-dark-textLight leading-relaxed">
                            Inhale for 4s, hold for 4s, exhale for 4s, hold for 4s. This physically forces your nervous system to calm down.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-mindful-dark-card p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors cursor-pointer group">
                <div className="flex items-start gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg group-hover:scale-110 transition-transform">
                        <Coffee size={20} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-mindful-text dark:text-mindful-dark-text text-sm mb-1">The 5-Minute Start</h4>
                        <p className="text-xs text-mindful-textLight dark:text-mindful-dark-textLight leading-relaxed">
                            Tell yourself you only have to do the task for 5 minutes. If you want to stop after that, you can. (You usually won't).
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 6. Emotional History */}
      {emotions.length > 0 && (
        <div className="bg-white dark:bg-mindful-dark-card p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-mindful-text dark:text-mindful-dark-text mb-4">Emotional Log</h3>
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {[...emotions].reverse().slice(0, 10).map((e, i) => {
              const emojis: Record<string, string> = {
                'OVERWHELMED': '😰',
                'ANXIOUS': '😟',
                'NEUTRAL': '😐',
                'CALM': '🙂',
                'CONTROL': '😌',
              };
              return (
                <div key={i} className="flex flex-col items-center min-w-[60px] p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0">
                  <span className="text-2xl mb-2">{emojis[e.feeling]}</span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    {new Date(e.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  <span className="text-[9px] text-slate-300 dark:text-slate-600 mt-0.5 capitalize">
                      {e.feeling.toLowerCase()}
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