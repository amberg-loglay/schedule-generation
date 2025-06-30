declare module 'wx-react-gantt' {
  export interface GanttTask {
    id: string;
    text: string;
    start: Date;
    end: Date;
    progress?: number;
    parent?: string | number;
    type?: string;
    open?: boolean;
    details?: string;
  }

  export interface GanttLink {
    id: string;
    source: string;
    target: string;
    type?: string;
  }

  export interface GanttProps {
    tasks: GanttTask[];
    links?: GanttLink[];
    [key: string]: any;
  }

  export const Gantt: React.ComponentType<GanttProps>;
} 