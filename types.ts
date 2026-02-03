export enum EisenhowerQuadrant {
  DO_FIRST = 'DO_FIRST',       // Urgent & Important
  SCHEDULE = 'SCHEDULE',       // Not Urgent & Important
  DELEGATE = 'DELEGATE',       // Urgent & Not Important
  ELIMINATE = 'ELIMINATE'      // Not Urgent & Not Important
}

export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export interface Task {
  id: string;
  content: string;
  quadrant: EisenhowerQuadrant;
  status: TaskStatus;
  createdAt: number;
  completedAt?: number;
  order: number;
}

export interface EmotionalState {
  timestamp: number;
  feeling: 'OVERWHELMED' | 'ANXIOUS' | 'NEUTRAL' | 'CALM' | 'CONTROL';
  context: 'STARTUP' | 'COMPLETION';
}

export type QuadrantMeta = {
  id: EisenhowerQuadrant;
  label: string;
  description: string;
  color: string;
  borderColor: string;
  bgColor: string;
  ringColor: string;
};