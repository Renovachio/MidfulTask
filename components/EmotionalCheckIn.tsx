import React from 'react';
import { Modal } from './Modal';
import { EmotionalState } from '../types';

interface EmotionalCheckInProps {
  isOpen: boolean;
  onSelect: (feeling: EmotionalState['feeling']) => void;
  context: 'STARTUP' | 'COMPLETION';
}

export const EmotionalCheckIn: React.FC<EmotionalCheckInProps> = ({ isOpen, onSelect, context }) => {
  const options: { value: EmotionalState['feeling']; emoji: string; label: string }[] = [
    { value: 'OVERWHELMED', emoji: '😰', label: 'Overwhelmed' },
    { value: 'ANXIOUS', emoji: '😟', label: 'Anxious' },
    { value: 'NEUTRAL', emoji: '😐', label: 'Neutral' },
    { value: 'CALM', emoji: '🙂', label: 'Calm' },
    { value: 'CONTROL', emoji: '😌', label: 'In Control' },
  ];

  const question = context === 'STARTUP' 
    ? "How are you feeling looking at your tasks right now?" 
    : "How do you feel after finishing this task?";

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="Emotional Check-in">
      <div className="space-y-6">
        <p className="text-slate-600 text-center">{question}</p>
        <div className="grid grid-cols-5 gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform duration-200">
                {opt.emoji}
              </span>
              <span className="text-[10px] text-slate-500 font-medium text-center leading-tight">
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};