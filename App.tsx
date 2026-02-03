import React, { useState, useEffect, useMemo } from 'react';
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
import { BrainCircuit, ChevronDown, Plus, Play, Sparkles, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [emotions, setEmotions] = useState<EmotionalState[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'board' | 'analytics'>('home');

  // Task Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Friction Modal State
  const [frictionModalOpen, setFrictionModalOpen] = useState(false);
  const [pendingTask, setPendingTask] = useState<Task | null>(null);

  // Emotional Check-in State
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInContext, setCheckInContext] = useState<'STARTUP' | 'COMPLETION'>('STARTUP');

  // Backlog View State
  const [showFullBacklog, setShowFullBacklog] = useState(false);

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

    // Trigger initial emotional check-in if tasks exist
    if (loadedTasks.length > 0) {
      setCheckInContext('STARTUP');
      setCheckInOpen(true);
    }

    // Request Notification Permission
    if ("Notification" in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Persist data
  useEffect(() => {
    if (isLoaded) {
      saveTasks(tasks);
    }
  }, [tasks, isLoaded]);

  // Check Reminders
  useEffect(() => {
    if (!isLoaded) return;

    const checkReminders = () => {
      const now = Date.now();
      tasks.forEach(task => {
        if (task.reminder && task.status !== TaskStatus.DONE) {
          // Check if reminder is within the last minute (to trigger once)
          // We assume check runs often. 
          // Simple logic: If current time is past reminder, and reminder was less than 60s ago
          if (task.reminder <= now && task.reminder > now - 60000) {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("MindfulTask Reminder", {
                body: `Time to focus on: ${task.content}`,
                icon: '/vite.svg' // Fallback icon
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
        // Primary sort: Quadrant Priority
        const pA = QUADRANT_PRIORITY[a.quadrant];
        const pB = QUADRANT_PRIORITY[b.quadrant];
        if (pA !== pB) return pA - pB;
        // Secondary sort: Custom Order
        return (a.order || 0) - (b.order || 0);
      });

    const inProgress = tasks
      .filter(t => t.status === TaskStatus.IN_PROGRESS)
      .sort((a, b) => a.createdAt - b.createdAt);

    const done = tasks
      .filter(t => t.status === TaskStatus.DONE)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)); // Newest done first

    return { backlogTasks: backlog, inProgressTasks: inProgress, doneTasks: done };
  }, [tasks]);

  const addTask = (content: string, quadrant: EisenhowerQuadrant, reminder?: number) => {
    // Find max order in current quadrant to append to bottom
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
      // 1. Isolate the list we are working within (same quadrant, same status)
      const group = prev
        .filter(t => t.quadrant === task.quadrant && t.status === task.status)
        .sort((a, b) => a.order - b.order);

      const currentIndex = group.findIndex(t => t.id === task.id);
      if (currentIndex === -1) return prev;

      // 2. Determine target to swap with
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      // Bounds check
      if (targetIndex < 0 || targetIndex >= group.length) return prev;
      
      const targetTask = group[targetIndex];

      // 3. Swap orders directly
      return prev.map(t => {
        if (t.id === task.id) return { ...t, order: targetTask.order };
        if (t.id === targetTask.id) return { ...t, order: task.order };
        return t;
      });
    });
  };

  const attemptStartTask = (task: Task) => {
    // Rule: Only 1 task in progress
    if (inProgressTasks.length >= 1) {
      alert("Mindful Focus: Please complete your current task before starting a new one.");
      return;
    }

    // Rule: Check if it's the top priority task
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
    // Switch to home tab to focus on the task
    setActiveTab('home');
  };

  const completeTask = (task: Task) => {
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: TaskStatus.DONE, completedAt: Date.now() } : t
    ));
    
    // 1 in 3 chance to ask for emotional check-in after completion
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

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-8 pb-32">
      {/* Header */}
      <header className="mb-8 flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg text-white">
          <BrainCircuit size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">MindfulTask</h1>
          <p className="text-slate-500 text-sm">Focus on what matters.</p>
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === 'home' && (
        <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[50vh] max-w-lg mx-auto">
           {inProgressTasks.length > 0 ? (
             <div className="w-full">
               <div className="flex items-center justify-center gap-2 mb-6 text-slate-500 text-sm uppercase tracking-widest font-semibold">
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
               <p className="text-center mt-8 text-slate-400 text-sm italic">
                 "Do it now. The future is purchased by the present."
               </p>
             </div>
           ) : (
             <div className="w-full text-center space-y-8">
               <div className="space-y-2">
                 <h2 className="text-3xl font-bold text-slate-800">Ready to focus?</h2>
                 <p className="text-slate-500">Pick the top task from Backlog</p>
               </div>
               
               {backlogTasks.length > 0 ? (
                 <div className="text-left bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">
                        Next Up
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${QUADRANTS[backlogTasks[0].quadrant].bgColor} ${QUADRANTS[backlogTasks[0].quadrant].color}`}>
                        {QUADRANTS[backlogTasks[0].quadrant].label}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-slate-800 mb-6 leading-relaxed">
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
                 <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                    <p className="text-slate-500 mb-4">Your backlog is empty. Enjoy the peace or capture a new thought.</p>
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
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                Backlog
                <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                  {backlogTasks.length}
                </span>
              </h2>
            </div>
            
            <div className="space-y-3">
              {backlogTasks.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                  <p className="text-slate-400 text-sm">No pending tasks.</p>
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
                          canMoveUp={qIndex > 0}
                          canMoveDown={qIndex < quadrantTasks.length - 1}
                          isNextUp={index === 0}
                        />
                      );
                    })}
                  
                  {backlogTasks.length > MAX_VISIBLE_BACKLOG && !showFullBacklog && (
                    <button 
                      onClick={() => setShowFullBacklog(true)}
                      className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1"
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
            <h2 className="font-semibold text-blue-700 flex items-center gap-2">
              In Focus
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {inProgressTasks.length}
              </span>
            </h2>
            
            {/* Styled Single Focus Slot */}
            <div className={`
                relative min-h-[160px] rounded-xl p-3 border-2 border-dashed transition-all duration-300
                ${inProgressTasks.length > 0 
                  ? 'border-blue-200 bg-blue-50/20' 
                  : 'border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center'
                }
            `}>
              
              {/* Watermark for Single Focus */}
              {inProgressTasks.length === 0 && (
                <div className="text-center opacity-40 pointer-events-none select-none">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-400 flex items-center justify-center mx-auto mb-2 text-slate-400">
                        <span className="text-xl font-bold">1</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">One At A Time</p>
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
              <p className="text-center text-xs text-slate-400">
                To start, pick the top card from your Backlog.
              </p>
            )}
          </section>

          {/* Done Column */}
          <section className="space-y-4">
            <h2 className="font-semibold text-mindful-secondaryText flex items-center gap-2">
              Completed
              <span className="bg-mindful-secondaryDim text-mindful-secondaryText text-xs px-2 py-0.5 rounded-full">
                {doneTasks.length}
              </span>
            </h2>
            
            <div className="space-y-3 opacity-80">
              {doneTasks.length === 0 ? (
                <div className="text-center py-10">
                   <p className="text-slate-400 text-sm italic">Small steps lead to big progress.</p>
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
                <p className="text-center text-xs text-slate-400 mt-2">
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

      {/* Floating Action Button */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-24 right-6 bg-slate-900 text-white w-14 h-14 rounded-full shadow-lg shadow-slate-900/30 flex items-center justify-center hover:bg-slate-800 hover:scale-105 transition-all z-40 active:scale-95"
        aria-label="Create new task"
      >
        <Plus size={28} />
      </button>

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
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-amber-800 text-sm">
            This is not your highest priority task based on the Eisenhower Matrix.
          </div>
          <p className="text-slate-600">
            Your top task is waiting. Skipping priorities can sometimes lead to anxiety about unfinished urgent work.
          </p>
          <p className="text-slate-800 font-medium">
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
  );
};

export default App;