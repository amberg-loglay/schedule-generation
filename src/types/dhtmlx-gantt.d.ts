declare module 'dhtmlx-gantt' {
  export interface GanttTask {
    id: string | number;
    text: string;
    start_date: string | Date;
    duration: number;
    progress?: number;
    parent?: string | number;
    [key: string]: any;
  }

  export interface GanttLink {
    id: string | number;
    source: string | number;
    target: string | number;
    type: string;
  }

  export interface GanttData {
    data: GanttTask[];
    links: GanttLink[];
  }

  export interface GanttConfig {
    date_format: string;
    scale_unit: string;
    date_scale: string;
    subscales?: Array<{
      unit: string;
      step: number;
      date: string;
    }>;
    columns?: Array<{
      name: string;
      label: string;
      width: number;
      tree?: boolean;
    }>;
    [key: string]: any;
  }

  export interface GanttTemplates {
    task_class: (start: Date, end: Date, task: GanttTask) => string;
    [key: string]: any;
  }

  export interface GanttExt {
    zoom: {
      init: (config: any) => void;
      setLevel: (level: string) => void;
    };
  }

  export interface Gantt {
    config: GanttConfig;
    templates: GanttTemplates;
    ext: GanttExt;
    init: (container: HTMLElement) => void;
    parse: (data: GanttData) => void;
    clearAll: () => void;
  }

  export const gantt: Gantt;
} 