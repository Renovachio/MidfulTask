import React, { useState, useEffect, useMemo } from 'react';
import { 
  EisenhowerQuadrant, 
  Task, 
  TaskStatus, 
  EmotionalState 
} from './types';
import { 
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
import { BrainCircuit, ChevronDown, Plus } from 'lucide-react';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [emotions, setEmotions] = useState<EmotionalState[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'board' | 'analytics'>('board');

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
    const loadedTasks = loadTasks();
    const loadedEmotions = loadEmotions();
    setTasks(loadedTasks);
    setEmotions(loadedEmotions);
    setIsLoaded(true);

    // Trigger initial emotional check-in if tasks exist
    if (loadedTasks.length > 0) {
      setCheckInContext('STARTUP');
      setCheckInOpen(true);
    }
  }, []);

  // Persist data
  useEffect(() => {
    if (isLoaded) {
      saveTasks(tasks);
    }
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
        // Secondary sort: FIFO (Creation time)
        return a.createdAt - b.createdAt;
      });

    const inProgress = tasks
      .filter(t => t.status === TaskStatus.IN_PROGRESS)
      .sort((a, b) => a.createdAt - b.createdAt);

    const done = tasks
      .filter(t => t.status === TaskStatus.DONE)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)); // Newest done first

    return { backlogTasks: backlog, inProgressTasks: inProgress, doneTasks: done };
  }, [tasks]);

  const addTask = (content: string, quadrant: EisenhowerQuadrant) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      content,
      quadrant,
      status: TaskStatus.BACKLOG,
      createdAt: Date.now(),
    };
    setTasks(prev => [...prev, newTask]);
    setIsCreateModalOpen(false);
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
      {activeTab === 'board' ? (
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
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-sm">No pending tasks.</p>
                </div>
              ) : (
                <>
                  {backlogTasks
                    .slice(0, showFullBacklog ? undefined : MAX_VISIBLE_BACKLOG)
                    .map((task, index) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onMove={attemptStartTask} 
                        isNextUp={index === 0}
                      />
                    ))}
                  
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
            
            <div className="space-y-3 min-h-[100px] bg-slate-50/50 rounded-xl p-2 border border-dashed border-slate-200">
              {inProgressTasks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                  <span className="text-sm">Ready to focus?</span>
                  <span className="text-xs opacity-70">Pick the top task from Backlog</span>
                </div>
              ) : (
                inProgressTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onMove={completeTask} 
                  />
                ))
              )}
            </div>
          </section>

          {/* Done Column */}
          <section className="space-y-4">
            <h2 className="font-semibold text-green-700 flex items-center gap-2">
              Completed
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                {doneTasks.length}
              </span>
            </h2>
            
            <div className="space-y-3 opacity-80">
              {doneTasks.length === 0 ? (
                <div className="text-center py-10">
                   <p className="text-slate-300 text-sm italic">Small steps lead to big progress.</p>
                </div>
              ) : (
                doneTasks.slice(0, 5).map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onMove={() => {}} 
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
      ) : (
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