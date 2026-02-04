import React, { useState } from 'react';
import { EisenhowerQuadrant } from '../types';
import { QUADRANTS } from '../constants';
import { Button } from './Button';
import { Bell, X } from 'lucide-react';

interface TaskInputProps {
  onAddTask: (content: string, quadrant: EisenhowerQuadrant, reminder?: number) => void;
  onCancel: () => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask, onCancel }) => {
  const [content, setContent] = useState('');
  const [selectedQuadrant, setSelectedQuadrant] = useState<EisenhowerQuadrant | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedQuadrant) return;

    const reminderTimestamp = reminderDate ? new Date(reminderDate).getTime() : undefined;
    onAddTask(content, selectedQuadrant, reminderTimestamp);
    
    // Reset form
    setContent('');
    setSelectedQuadrant(null);
    setReminderDate('');
    setShowReminder(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="task-content" className="block text-sm font-medium text-mindful-text dark:text-mindful-dark-text mb-1">
          What needs to be done?
        </label>
        <textarea
          id="task-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe your task..."
          className="w-full p-3 bg-white text-mindful-text border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-mindful-dark-text rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none min-h-[100px] transition-colors placeholder:text-slate-400"
          autoFocus
        />
        <div className="flex justify-between items-center mt-2">
          {!showReminder ? (
            <button
              type="button"
              onClick={() => setShowReminder(true)}
              className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Bell size={14} />
              Set Reminder
            </button>
          ) : (
             <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                <input 
                  type="datetime-local"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="text-xs p-1.5 bg-white text-slate-600 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 rounded focus:border-indigo-500 outline-none"
                />
                <button 
                  type="button"
                  onClick={() => {
                    setShowReminder(false);
                    setReminderDate('');
                  }}
                  className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
                >
                  <X size={14} />
                </button>
             </div>
          )}

          <span className={`text-xs ${content.length > 200 ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
            {content.length} chars
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-mindful-text dark:text-mindful-dark-text mb-2">
          How urgent & important is this?
        </label>
        <div className="grid grid-cols-1 gap-3">
          {(Object.values(QUADRANTS) as typeof QUADRANTS[keyof typeof QUADRANTS][]).map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setSelectedQuadrant(q.id)}
              className={`p-3 rounded-lg text-left border transition-all relative flex items-center gap-3 ${
                selectedQuadrant === q.id
                  ? `${q.bgColor} dark:bg-opacity-20 ${q.borderColor} dark:border-opacity-50 ring-2 ring-offset-1 dark:ring-offset-slate-900 ${q.ringColor}`
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <div className={`w-3 h-3 rounded-full shrink-0 ${q.color.replace('text-', 'bg-')}`} />
              <div>
                <div className={`font-semibold text-sm ${q.color} dark:brightness-110`}>{q.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{q.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!content.trim() || !selectedQuadrant}
        >
          Add Task
        </Button>
      </div>
    </form>
  );
};