import React, { useState } from 'react';
import { EisenhowerQuadrant } from '../types';
import { QUADRANTS } from '../constants';
import { Button } from './Button';

interface TaskInputProps {
  onAddTask: (content: string, quadrant: EisenhowerQuadrant) => void;
  onCancel: () => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask, onCancel }) => {
  const [content, setContent] = useState('');
  const [selectedQuadrant, setSelectedQuadrant] = useState<EisenhowerQuadrant | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedQuadrant) return;

    onAddTask(content, selectedQuadrant);
    setContent('');
    setSelectedQuadrant(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="task-content" className="block text-sm font-medium text-slate-700 mb-1">
          What needs to be done?
        </label>
        <textarea
          id="task-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe your task..."
          className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none min-h-[100px]"
          autoFocus
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${content.length > 200 ? 'text-green-600' : 'text-slate-400'}`}>
            {content.length} chars
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
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
                  ? `${q.bgColor} ${q.borderColor} ring-2 ring-offset-1 ${q.ringColor}`
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className={`w-3 h-3 rounded-full shrink-0 ${q.color.replace('text-', 'bg-')}`} />
              <div>
                <div className={`font-semibold text-sm ${q.color}`}>{q.label}</div>
                <div className="text-xs text-slate-500">{q.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
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