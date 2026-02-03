import { Task, EmotionalState } from '../types';

const TASKS_KEY = 'mindful_tasks_v1';
const EMOTIONS_KEY = 'mindful_emotions_v1';

export const saveTasks = (tasks: Task[]): void => {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks', error);
  }
};

export const loadTasks = (): Task[] => {
  try {
    const data = localStorage.getItem(TASKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load tasks', error);
    return [];
  }
};

export const saveEmotion = (emotion: EmotionalState): void => {
  try {
    const current = loadEmotions();
    const updated = [...current, emotion];
    localStorage.setItem(EMOTIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save emotion', error);
  }
};

export const loadEmotions = (): EmotionalState[] => {
  try {
    const data = localStorage.getItem(EMOTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};