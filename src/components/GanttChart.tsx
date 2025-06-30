import React from 'react';
import { Task } from '../types/schedule';
import { mapTasksToSvarGantt } from '../utils/mapTasksToSvarGantt';
import dynamic from 'next/dynamic';

const Gantt = dynamic(() => import('wx-react-gantt').then(mod => mod.Gantt), { ssr: false }) as any;

interface GanttChartProps {
  tasks: Task[];
}

const GanttChart: React.FC<GanttChartProps> = ({ tasks }) => {
  // Map your tasks to SVAR Gantt format
  const svarTasks = mapTasksToSvarGantt(tasks);
  // No dependencies/links for now, but you can add them if needed
  const links: any[] = [];
  // Optionally, you can define scales for zooming/time granularity
  // const scales = [
  //   { unit: 'month', step: 1, format: 'MMMM yyyy' },
  //   { unit: 'day', step: 1, format: 'd' },
  // ];

  return (
    <div style={{ width: '100%', minHeight: 500 }}>
      <Gantt tasks={svarTasks} links={links} />
    </div>
  );
};

export default GanttChart; 