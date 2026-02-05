import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  EisenhowerQuadrant, 
  Task, 
  TaskStatus, 
  EmotionalState 
} from './types';
import { 
  QUADRANTS,
  QUADRANT_PRIORITY, 
  MAX_VISIBLE_BACKLOG 
} from './constants';
import { saveTasks, loadTasks, saveEmotion, loadEmotions } from './services/storage';
import { TaskInput } from './components/TaskInput';
import { TaskCard } from './components/TaskCard';
import { Modal } from './components/Modal';
import { Button } from './components/Button';
import { EmotionalCheckIn } from './components/EmotionalCheckIn';
import { BottomNav } from './components/BottomNav';
import { AnalyticsView } from './components/AnalyticsView';
import { BrainCircuit, ChevronDown, Plus, Play, Sparkles, Moon, Sun, Download, Upload, Trash2, FileText, Database } from 'lucide-react';

const App: React.FC = () => {
  // Load tasks and emotions from storage
  const [tasks, setTasks] = useState<Task[]>([]);
  const [emotions, setEmotions] = useState<EmotionalState[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Theme State - Initialize from storage to prevent flash
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mindful_theme') === 'dark';
    }
    return false;
  });
  
  // Navigation State - Persisted
  const [activeTab, setActiveTab] = useState<'home' | 'board' | 'analytics' | 'settings'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mindful_active_tab');
      if (saved && ['home', 'board', 'analytics', 'settings'].includes(saved)) {
        return saved as 'home' | 'board' | 'analytics' | 'settings';
      }
    }
    return 'home';
  });

  // Task Creation Modal State - Persisted
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mindful_modal_open') === 'true';
    }
    return false;
  });

  // Friction Modal State
  const [frictionModalOpen, setFrictionModalOpen] = useState(false);
  const [pendingTask, setPendingTask] = useState<Task | null>(null);

  // Emotional Check-in State
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInContext, setCheckInContext] = useState<'STARTUP' | 'COMPLETION'>('STARTUP');

  // Backlog View State - Persisted
  const [showFullBacklog, setShowFullBacklog] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mindful_show_backlog') === 'true';
    }
    return false;
  });

  // File Input Ref for Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data on mount
  useEffect(() => {
    let loadedTasks = loadTasks();
    const loadedEmotions = loadEmotions();

    // Migration: Assign order to existing tasks if missing
    if (loadedTasks.some(t => typeof t.order !== 'number')) {
      loadedTasks = loadedTasks
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((t, i) => ({ ...t, order: t.order ?? i }));
      saveTasks(loadedTasks);
    }

    setTasks(loadedTasks);
    setEmotions(loadedEmotions);
    setIsLoaded(true);

    // Trigger initial emotional check-in if tasks exist and it's a fresh session (simple heuristic)
    if (loadedTasks.length > 0 && !sessionStorage.getItem('session_started')) {
      setCheckInContext('STARTUP');
      setCheckInOpen(true);
      sessionStorage.setItem('session_started', 'true');
    }

    // Request Notification Permission
    if ("Notification" in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Persist Theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#1F2A33';
      localStorage.setItem('mindful_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#E6EEF4';
      localStorage.setItem('mindful_theme', 'light');
    }
  }, [darkMode]);

  // Persist Tasks
  useEffect(() => {
    if (isLoaded) {
      saveTasks(tasks);
    }
  }, [tasks, isLoaded]);

  // Persist Navigation Status
  useEffect(() => {
    localStorage.setItem('mindful_active_tab', activeTab);
  }, [activeTab]);

  // Persist UI States
  useEffect(() => {
    localStorage.setItem('mindful_modal_open', String(isCreateModalOpen));
  }, [isCreateModalOpen]);

  useEffect(() => {
    localStorage.setItem('mindful_show_backlog', String(showFullBacklog));
  }, [showFullBacklog]);

  // Check Reminders
  useEffect(() => {
    if (!isLoaded) return;

    const checkReminders = () => {
      const now = Date.now();
      tasks.forEach(task => {
        if (task.reminder && task.status !== TaskStatus.DONE) {
          if (task.reminder <= now && task.reminder > now - 60000) {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("MindfulTask Reminder", {
                body: `Time to focus on: ${task.content}`,
                icon: '/vite.svg'
              });
            }
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [tasks, isLoaded]);

  // Derived state: Sorted Lists
  const { backlogTasks, inProgressTasks, doneTasks } = useMemo(() => {
    const backlog = tasks
      .filter(t => t.status === TaskStatus.BACKLOG)
      .sort((a, b) => {
        const pA = QUADRANT_PRIORITY[a.quadrant];
        const pB = QUADRANT_PRIORITY[b.quadrant];
        if (pA !== pB) return pA - pB;
        return (a.order || 0) - (b.order || 0);
      });

    const inProgress = tasks
      .filter(t => t.status === TaskStatus.IN_PROGRESS)
      .sort((a, b) => a.createdAt - b.createdAt);

    const done = tasks
      .filter(t => t.status === TaskStatus.DONE)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    return { backlogTasks: backlog, inProgressTasks: inProgress, doneTasks: done };
  }, [tasks]);

  const addTask = (content: string, quadrant: EisenhowerQuadrant, reminder?: number) => {
    const existingInQuadrant = tasks.filter(t => t.quadrant === quadrant && t.status === TaskStatus.BACKLOG);
    const maxOrder = existingInQuadrant.length > 0 
      ? Math.max(...existingInQuadrant.map(t => t.order)) 
      : 0;

    const newTask: Task = {
      id: crypto.randomUUID(),
      content,
      quadrant,
      status: TaskStatus.BACKLOG,
      createdAt: Date.now(),
      order: maxOrder + 1,
      reminder
    };
    setTasks(prev => [...prev, newTask]);
    setIsCreateModalOpen(false);
  };

  const handleDeleteTask = (task: Task) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== task.id));
    }
  };

  const handleReorder = (task: Task, direction: 'up' | 'down') => {
    setTasks(prev => {
      const group = prev
        .filter(t => t.quadrant === task.quadrant && t.status === task.status)
        .sort((a, b) => a.order - b.order);

      const currentIndex = group.findIndex(t => t.id === task.id);
      if (currentIndex === -1) return prev;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex < 0 || targetIndex >= group.length) return prev;
      
      const targetTask = group[targetIndex];

      return prev.map(t => {
        if (t.id === task.id) return { ...t, order: targetTask.order };
        if (t.id === targetTask.id) return { ...t, order: task.order };
        return t;
      });
    });
  };

  const handleDragSwap = (sourceId: string, targetId: string) => {
    setTasks(prev => {
      const sourceIndex = prev.findIndex(t => t.id === sourceId);
      const targetIndex = prev.findIndex(t => t.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const newTasks = [...prev];
      const sourceTask = newTasks[sourceIndex];
      const targetTask = newTasks[targetIndex];

      // To visually swap them in the sorted list, we swap their sorting criteria (Order and Quadrant)
      const tempOrder = sourceTask.order;
      const tempQuadrant = sourceTask.quadrant;

      newTasks[sourceIndex] = {
        ...sourceTask,
        order: targetTask.order,
        quadrant: targetTask.quadrant
      };

      newTasks[targetIndex] = {
        ...targetTask,
        order: tempOrder,
        quadrant: tempQuadrant
      };

      return newTasks;
    });
  };

  const attemptStartTask = (task: Task) => {
    if (inProgressTasks.length >= 1) {
      alert("Mindful Focus: Please complete your current task before starting a new one.");
      return;
    }

    const topPriorityTask = backlogTasks[0];
    if (topPriorityTask && topPriorityTask.id !== task.id) {
      setPendingTask(task);
      setFrictionModalOpen(true);
    } else {
      executeMoveToInProgress(task);
    }
  };

  const executeMoveToInProgress = (task: Task) => {
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: TaskStatus.IN_PROGRESS } : t
    ));
    setFrictionModalOpen(false);
    setPendingTask(null);
    setActiveTab('home');
  };

  const completeTask = (task: Task) => {
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: TaskStatus.DONE, completedAt: Date.now() } : t
    ));
    
    if (Math.random() > 0.6) {
      setCheckInContext('COMPLETION');
      setCheckInOpen(true);
    }
  };

  const handleEmotionalLog = (feeling: EmotionalState['feeling']) => {
    const newEmotion: EmotionalState = {
      timestamp: Date.now(),
      feeling,
      context: checkInContext
    };
    saveEmotion(newEmotion);
    setEmotions(prev => [...prev, newEmotion]);
    setCheckInOpen(false);
  };

  // --- Data Management Functions ---

  const escapeCsv = (str: string | number | undefined | null) => {
    if (str === null || str === undefined) return '';
    const stringValue = String(str);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const handleExportCsv = () => {
    const headers = ['Type', 'Id', 'Content', 'Quadrant', 'Status', 'CreatedAt', 'CompletedAt', 'Order', 'Reminder', 'Feeling', 'Context', 'Timestamp'];
    const rows = [headers.join(',')];

    tasks.forEach(t => {
      rows.push([
        'TASK',
        t.id,
        t.content,
        t.quadrant,
        t.status,
        t.createdAt,
        t.completedAt || '',
        t.order,
        t.reminder || '',
        '', '', ''
      ].map(escapeCsv).join(','));
    });

    emotions.forEach(e => {
      rows.push([
        'EMOTION',
        '', '', '', '', '', '', '', '',
        e.feeling,
        e.context,
        e.timestamp
      ].map(escapeCsv).join(','));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindfultask_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split('\n');
        const newTasks: Task[] = [];
        const newEmotions: EmotionalState[] = [];

        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Simple CSV parsing (assuming no commas in content for simplicity, or handle basic quotes)
          // Robust parsing for quoted strings
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(','); 
          // Fallback simple split if regex fails or for unquoted
          const cells = line.split(',').map(c => {
             if (c.startsWith('"') && c.endsWith('"')) return c.slice(1, -1).replace(/""/g, '"');
             return c;
          });

          const type = cells[0];

          if (type === 'TASK') {
            newTasks.push({
              id: cells[1] || crypto.randomUUID(),
              content: cells[2],
              quadrant: cells[3] as EisenhowerQuadrant,
              status: cells[4] as TaskStatus,
              createdAt: Number(cells[5]),
              completedAt: cells[6] ? Number(cells[6]) : undefined,
              order: Number(cells[7]),
              reminder: cells[8] ? Number(cells[8]) : undefined
            });
          } else if (type === 'EMOTION') {
            newEmotions.push({
              feeling: cells[9] as EmotionalState['feeling'],
              context: cells[10] as EmotionalState['context'],
              timestamp: Number(cells[11])
            });
          }
        }

        if (newTasks.length > 0 || newEmotions.length > 0) {
          if (confirm(`Found ${newTasks.length} tasks and ${newEmotions.length} emotional logs. Import and replace current data?`)) {
            setTasks(newTasks);
            setEmotions(newEmotions);
            saveTasks(newTasks);
            // Save emotions manually as we don't have a direct setter for storage here usually, but app saves on state change? 
            // Actually App only saves tasks on state change in useEffect.
            // Emotions need to be saved explicitly or we add an effect.
            // Let's manually save them to be safe.
            localStorage.setItem('mindful_emotions_v1', JSON.stringify(newEmotions));
            alert('Import successful!');
          }
        } else {
          alert('No valid data found in CSV.');
        }

      } catch (err) {
        console.error(err);
        alert('Failed to parse CSV file. Please ensure format is correct.');
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (confirm('DANGER: This will permanently delete all your tasks, emotional history, and settings. This action cannot be undone. Are you sure?')) {
      localStorage.clear();
      setTasks([]);
      setEmotions([]);
      sessionStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm">
              <BrainCircuit size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-mindful-text dark:text-mindful-dark-text">MindfulTask</h1>
              <p className="text-mindful-textLight dark:text-mindful-dark-textLight text-sm">Focus on what matters.</p>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[50vh] max-w-lg mx-auto">
             {inProgressTasks.length > 0 ? (
               <div className="w-full">
                 <div className="flex items-center justify-center gap-2 mb-6 text-mindful-textLight dark:text-mindful-dark-textLight text-sm uppercase tracking-widest font-semibold">
                    <Sparkles size={16} className="text-amber-400" />
                    Current Focus
                 </div>
                 <div className="transform scale-105 transition-transform duration-500">
                    <TaskCard 
                      task={inProgressTasks[0]} 
                      onMove={completeTask}
                      onDelete={handleDeleteTask}
                    />
                 </div>
                 <p className="text-center mt-8 text-mindful-textLight dark:text-mindful-dark-textLight text-sm italic">
                   "Do it now. The future is purchased by the present."
                 </p>
               </div>
             ) : (
               <div className="w-full text-center space-y-8">
                 <div className="space-y-2">
                   <h2 className="text-3xl font-bold text-mindful-text dark:text-mindful-dark-text">Ready to focus?</h2>
                   <p className="text-mindful-textLight dark:text-mindful-dark-textLight">Pick the top task from Backlog</p>
                 </div>
                 
                 {backlogTasks.length > 0 ? (
                   <div className="text-left bg-white dark:bg-mindful-dark-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                          Next Up
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${QUADRANTS[backlogTasks[0].quadrant].bgColor} ${QUADRANTS[backlogTasks[0].quadrant].color}`}>
                          {QUADRANTS[backlogTasks[0].quadrant].label}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-medium text-mindful-text dark:text-mindful-dark-text mb-6 leading-relaxed">
                        {backlogTasks[0].content}
                      </h3>
                      
                      <Button 
                        onClick={() => attemptStartTask(backlogTasks[0])} 
                        className="w-full flex items-center justify-center gap-2 py-3"
                      >
                         <Play size={18} fill="currentColor" /> Start Task
                      </Button>
                   </div>
                 ) : (
                   <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white/50 dark:bg-mindful-dark-card/50">
                      <p className="text-mindful-textLight dark:text-mindful-dark-textLight mb-4">Your backlog is empty. Enjoy the peace or capture a new thought.</p>
                      <Button variant="secondary" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={16} className="mr-2" /> Add Task
                      </Button>
                   </div>
                 )}
               </div>
             )}
          </div>
        )}

        {activeTab === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start animate-in fade-in duration-300">
            {/* Backlog Column */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-mindful-text dark:text-mindful-dark-text flex items-center gap-2">
                  Backlog
                  <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full">
                    {backlogTasks.length}
                  </span>
                </h2>
              </div>
              
              <div className="space-y-3">
                {backlogTasks.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-mindful-dark-card/50">
                    <p className="text-mindful-textLight dark:text-mindful-dark-textLight text-sm">No pending tasks.</p>
                  </div>
                ) : (
                  <>
                    {backlogTasks
                      .slice(0, showFullBacklog ? undefined : MAX_VISIBLE_BACKLOG)
                      .map((task, index) => {
                        const quadrantTasks = backlogTasks.filter(t => t.quadrant === task.quadrant);
                        const qIndex = quadrantTasks.findIndex(t => t.id === task.id);
                        
                        return (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            onMove={attemptStartTask}
                            onDelete={handleDeleteTask}
                            onReorder={handleReorder}
                            onDragSwap={handleDragSwap}
                            canMoveUp={qIndex > 0}
                            canMoveDown={qIndex < quadrantTasks.length - 1}
                            isNextUp={index === 0}
                          />
                        );
                      })}
                    
                    {backlogTasks.length > MAX_VISIBLE_BACKLOG && !showFullBacklog && (
                      <button 
                        onClick={() => setShowFullBacklog(true)}
                        className="w-full py-2 text-sm text-mindful-textLight dark:text-mindful-dark-textLight hover:text-mindful-text hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        Show {backlogTasks.length - MAX_VISIBLE_BACKLOG} more <ChevronDown size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* In Progress Column */}
            <section className="space-y-4">
              <h2 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                In Focus
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                  {inProgressTasks.length}
                </span>
              </h2>
              
              {/* Styled Single Focus Slot */}
              <div className={`
                  relative min-h-[160px] rounded-xl p-3 border-2 border-dashed transition-all duration-300
                  ${inProgressTasks.length > 0 
                    ? 'border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-900/10' 
                    : 'border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center'
                  }
              `}>
                
                {/* Watermark for Single Focus */}
                {inProgressTasks.length === 0 && (
                  <div className="text-center opacity-40 pointer-events-none select-none">
                      <div className="w-12 h-12 rounded-full border-2 border-slate-400 dark:border-slate-500 flex items-center justify-center mx-auto mb-2 text-slate-400 dark:text-slate-500">
                          <span className="text-xl font-bold">1</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">One At A Time</p>
                  </div>
                )}

                {inProgressTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onMove={completeTask}
                      onDelete={handleDeleteTask}
                    />
                ))}
              </div>
              
              {inProgressTasks.length === 0 && (
                <p className="text-center text-xs text-mindful-textLight dark:text-mindful-dark-textLight">
                  To start, pick the top card from your Backlog.
                </p>
              )}
            </section>

            {/* Done Column */}
            <section className="space-y-4">
              <h2 className="font-semibold text-mindful-secondaryText dark:text-mindful-dark-secondary flex items-center gap-2">
                Completed
                <span className="bg-mindful-secondaryDim dark:bg-mindful-secondaryText/20 text-mindful-secondaryText dark:text-mindful-dark-secondary text-xs px-2 py-0.5 rounded-full">
                  {doneTasks.length}
                </span>
              </h2>
              
              <div className="space-y-3 opacity-80">
                {doneTasks.length === 0 ? (
                  <div className="text-center py-10">
                     <p className="text-mindful-textLight dark:text-mindful-dark-textLight text-sm italic">Small steps lead to big progress.</p>
                  </div>
                ) : (
                  doneTasks.slice(0, 5).map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onMove={() => {}} 
                      onDelete={handleDeleteTask}
                    />
                  ))
                )}
                {doneTasks.length > 5 && (
                  <p className="text-center text-xs text-mindful-textLight dark:text-mindful-dark-textLight mt-2">
                    + {doneTasks.length - 5} older tasks hidden
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView tasks={tasks} emotions={emotions} />
        )}

        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-300 max-w-lg mx-auto space-y-6">
             <div className="bg-white dark:bg-mindful-dark-card p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-mindful-text dark:text-mindful-dark-text mb-6">Preferences</h2>
                
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                        {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                      </div>
                      <div>
                        <p className="font-medium text-mindful-text dark:text-mindful-dark-text">Dark Mode</p>
                        <p className="text-xs text-mindful-textLight dark:text-mindful-dark-textLight">Adjust for eye comfort</p>
                      </div>
                   </div>
                   
                   <button 
                     onClick={() => setDarkMode(!darkMode)}
                     className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${darkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
                   >
                     <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                   </button>
                </div>
             </div>

             <div className="bg-white dark:bg-mindful-dark-card p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-mindful-text dark:text-mindful-dark-text mb-6 flex items-center gap-2">
                  <Database size={20} className="text-indigo-500" />
                  Data Management
                </h2>
                
                <div className="space-y-4">
                  
                  {/* Export */}
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                          <Download size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-mindful-text dark:text-mindful-dark-text text-sm">Export Data</p>
                          <p className="text-xs text-mindful-textLight dark:text-mindful-dark-textLight">Download as CSV file</p>
                        </div>
                     </div>
                     <Button size="sm" variant="secondary" onClick={handleExportCsv}>
                       Export
                     </Button>
                  </div>

                  {/* Import */}
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                          <Upload size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-mindful-text dark:text-mindful-dark-text text-sm">Import Data</p>
                          <p className="text-xs text-mindful-textLight dark:text-mindful-dark-textLight">Restore from CSV backup</p>
                        </div>
                     </div>
                     <input 
                       type="file" 
                       accept=".csv" 
                       ref={fileInputRef}
                       onChange={handleImportCsv}
                       className="hidden" 
                     />
                     <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                       Import
                     </Button>
                  </div>

                  {/* Clear Data */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                     <div className="flex items-center justify-between p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors cursor-pointer group" onClick={handleClearAllData}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg group-hover:bg-rose-200 dark:group-hover:bg-rose-900/50 transition-colors">
                              <Trash2 size={18} />
                            </div>
                            <div>
                              <p className="font-medium text-rose-700 dark:text-rose-400 text-sm">Clear All Data</p>
                              <p className="text-xs text-rose-500/80 dark:text-rose-500/80">Reset app to fresh state</p>
                            </div>
                        </div>
                     </div>
                  </div>

                </div>
             </div>
             
             <div className="mt-8 text-center text-xs text-slate-400">
                <p>MindfulTask v1.1</p>
                <p className="mt-1">Designed for peace of mind.</p>
             </div>
          </div>
        )}

        {/* Floating Action Button */}
        {activeTab !== 'settings' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="fixed bottom-24 right-6 bg-mindful-cta dark:bg-mindful-dark-cta text-white w-14 h-14 rounded-full shadow-lg shadow-slate-900/30 flex items-center justify-center hover:bg-mindful-ctaHover hover:scale-105 transition-all z-40 active:scale-95"
            aria-label="Create new task"
          >
            <Plus size={28} />
          </button>
        )}

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Create Task Modal */}
        <Modal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Task"
        >
          <TaskInput 
            onAddTask={addTask} 
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </Modal>

        {/* Friction Modal - Confirm Priority Skip */}
        <Modal 
          isOpen={frictionModalOpen} 
          onClose={() => {
            setFrictionModalOpen(false);
            setPendingTask(null);
          }}
          title="Mindful Pause"
        >
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
              This is not your highest priority task based on the Eisenhower Matrix.
            </div>
            <p className="text-mindful-textLight dark:text-mindful-dark-textLight">
              Your top task is waiting. Skipping priorities can sometimes lead to anxiety about unfinished urgent work.
            </p>
            <p className="text-mindful-text dark:text-mindful-dark-text font-medium">
              Are you sure you want to start this one instead?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setFrictionModalOpen(false);
                  setPendingTask(null);
                }}
              >
                No, I'll stick to the plan
              </Button>
              <Button 
                variant="primary" 
                onClick={() => pendingTask && executeMoveToInProgress(pendingTask)}
              >
                Yes, I choose this consciously
              </Button>
            </div>
          </div>
        </Modal>

        {/* Emotional Check-in Modal */}
        <EmotionalCheckIn 
          isOpen={checkInOpen} 
          onSelect={handleEmotionalLog}
          context={checkInContext}
        />
      </div>
    </div>
  );
};

export default App;