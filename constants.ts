import { EisenhowerQuadrant, QuadrantMeta } from './types';

export const QUADRANTS: Record<EisenhowerQuadrant, QuadrantMeta> = {
  [EisenhowerQuadrant.DO_FIRST]: {
    id: EisenhowerQuadrant.DO_FIRST,
    label: 'Do First',
    description: 'Urgent & Important',
    color: 'text-green-700',
    borderColor: 'border-green-200',
    bgColor: 'bg-green-50',
    ringColor: 'ring-green-500',
  },
  [EisenhowerQuadrant.SCHEDULE]: {
    id: EisenhowerQuadrant.SCHEDULE,
    label: 'Schedule',
    description: 'Not Urgent & Important',
    color: 'text-blue-700',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    ringColor: 'ring-blue-500',
  },
  [EisenhowerQuadrant.DELEGATE]: {
    id: EisenhowerQuadrant.DELEGATE,
    label: 'Delegate',
    description: 'Urgent & Not Important',
    color: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    bgColor: 'bg-yellow-50',
    ringColor: 'ring-yellow-500',
  },
  [EisenhowerQuadrant.ELIMINATE]: {
    id: EisenhowerQuadrant.ELIMINATE,
    label: 'Eliminate',
    description: 'Not Urgent & Not Important',
    color: 'text-gray-700',
    borderColor: 'border-gray-200',
    bgColor: 'bg-gray-50',
    ringColor: 'ring-gray-500',
  },
};

export const MAX_VISIBLE_BACKLOG = 5;

// Defined priority order for sorting (Lower number = Higher priority)
export const QUADRANT_PRIORITY: Record<EisenhowerQuadrant, number> = {
  [EisenhowerQuadrant.DO_FIRST]: 1,
  [EisenhowerQuadrant.SCHEDULE]: 2,
  [EisenhowerQuadrant.DELEGATE]: 3,
  [EisenhowerQuadrant.ELIMINATE]: 4,
};