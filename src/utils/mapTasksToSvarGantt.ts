import { Task } from '../types/schedule';

export interface SvarGanttTask {
  id: string;
  text: string;
  start: Date;
  end: Date;
  progress?: number;
  parent?: string | number;
  type?: 'task' | 'summary' | 'milestone';
  open?: boolean;
  details?: string;
}

// Helper to parse German date format like 'Mon 01.01.24'
function parseGermanDate(dateStr: string): Date {
  if (!dateStr || dateStr === 'null' || dateStr === 'undefined') {
    return new Date();
  }
  try {
    const parts = dateStr.split(' ');
    const datePart = parts[parts.length - 1];
    const [day, month, year] = datePart.split('.');
    const fullYear = `20${year}`;
    return new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day));
  } catch (error) {
    console.warn('Failed to parse date:', dateStr, error);
    return new Date();
  }
}

export function mapTasksToSvarGantt(tasks: Task[]): SvarGanttTask[] {
  if (!tasks || !Array.isArray(tasks)) {
    console.warn('Invalid tasks data provided to mapTasksToSvarGantt:', tasks);
    return [];
  }

  return tasks
    .filter(task => task && task.id) // Filter out null/undefined tasks
    .map((task, index) => {
      const startDate = parseGermanDate(task.start_date);
      const endDate = parseGermanDate(task.end_date);
      
      // Ensure end date is after start date
      if (endDate <= startDate) {
        endDate.setDate(startDate.getDate() + 1);
      }

      return {
        id: String(task.id || `task-${index}`),
        text: task.name || `Task ${index + 1}`,
        start: startDate,
        end: endDate,
        progress: 0,
        parent: task.parent_id ? String(task.parent_id) : '0',
        type: 'task' as const,
        open: true,
        details: task.phase || '',
      };
    });
} 