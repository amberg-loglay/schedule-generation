import React, { useEffect, useRef } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { Task } from '../types/schedule';

interface DHtmlxGanttChartProps {
  tasks: Task[];
}

const DHtmlxGanttChart: React.FC<DHtmlxGanttChartProps> = ({ tasks }) => {
  const ganttContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ganttContainer.current) return;

    // Configure Gantt
    gantt.config.date_format = "%Y-%m-%d";
    gantt.config.scale_unit = "week";
    gantt.config.date_scale = "%M %d";
    gantt.config.subscales = [
      { unit: "day", step: 1, date: "%j" }
    ];
    
    // Fix row height and text visibility
    gantt.config.row_height = 40;
    gantt.config.task_height = 30;
    gantt.config.bar_height = 24;
    gantt.config.grid_width = 420;
    gantt.config.font_width_ratio = 7;
    gantt.config.autosize = "y";
    gantt.config.autofit = true;
    
    // Enable zoom functionality
    gantt.ext.zoom.init({
      levels: [
        {
          name: "day",
          scale_height: 60,
          min_column_width: 30,
          scales: [
            { unit: "week", step: 1, format: "%d %M" },
            { unit: "day", step: 1, format: "%j" }
          ]
        },
        {
          name: "week",
          scale_height: 60,
          min_column_width: 50,
          scales: [
            { unit: "month", step: 1, format: "%F, %Y" },
            { unit: "week", step: 1, format: "Week #%W" }
          ]
        },
        {
          name: "month",
          scale_height: 60,
          min_column_width: 120,
          scales: [
            { unit: "month", step: 1, format: "%F, %Y" }
          ]
        }
      ]
    });

    // Set initial zoom level
    gantt.ext.zoom.setLevel("week");

    // Configure columns with better widths
    gantt.config.columns = [
      { name: "text", label: "Task Name", width: 250, tree: true },
      { name: "start_date", label: "Start Date", width: 90 },
      { name: "duration", label: "Duration", width: 70 },
      { name: "phase", label: "Phase", width: 110 }
    ];

    // Configure task colors based on phase and object type
    gantt.templates.task_class = function(start: any, end: any, task: any) {
      const phase = task.phase?.toLowerCase() || '';
      const objectCode = task.object_code || '';
      
      // Color by object type first
      if (objectCode.startsWith('KO.01')) return 'gantt-task-foundation';
      if (objectCode.startsWith('KO.02')) return 'gantt-task-basement';
      if (objectCode.startsWith('KO.03')) return 'gantt-task-columns';
      if (objectCode.startsWith('KO.04')) return 'gantt-task-beams';
      if (objectCode.startsWith('KO.05')) return 'gantt-task-slabs';
      if (objectCode.startsWith('FI')) return 'gantt-task-fitout';
      if (objectCode.startsWith('DA')) return 'gantt-task-roof';
      
      // Fallback to phase-based coloring
      if (phase.includes('excavation')) return 'gantt-task-excavation';
      if (phase.includes('structure')) return 'gantt-task-structure';
      if (phase.includes('facade')) return 'gantt-task-facade';
      if (phase.includes('fitout')) return 'gantt-task-fitout';
      return 'gantt-task-default';
    };

    // Configure row colors for the grid
    gantt.templates.grid_row_class = function(start: any, end: any, task: any) {
      const objectCode = task.object_code || '';
      
      if (objectCode.startsWith('KO.01')) return 'gantt-row-foundation';
      if (objectCode.startsWith('KO.02')) return 'gantt-row-basement';
      if (objectCode.startsWith('KO.03')) return 'gantt-row-columns';
      if (objectCode.startsWith('KO.04')) return 'gantt-row-beams';
      if (objectCode.startsWith('KO.05')) return 'gantt-row-slabs';
      if (objectCode.startsWith('FI')) return 'gantt-row-fitout';
      if (objectCode.startsWith('DA')) return 'gantt-row-roof';
      
      return 'gantt-row-default';
    };

    // Configure task text color
    gantt.templates.task_text = function(start: any, end: any, task: any) {
      return `<span style="color: white; font-weight: bold; text-shadow: 1px 1px 1px rgba(0,0,0,0.5);">${task.text}</span>`;
    };

    // Initialize Gantt
    gantt.init(ganttContainer.current);

    // Transform and load data
    const transformedData = transformTasksForDHtmlx(tasks);
    gantt.parse(transformedData);

    // Cleanup function
    return () => {
      if (gantt) {
        gantt.clearAll();
      }
    };
  }, [tasks]);

  const transformTasksForDHtmlx = (tasks: Task[]) => {
    const data = {
      data: tasks.map((task, index) => ({
        id: task.id || `task-${index}`,
        text: task.name || `Task ${index + 1}`,
        start_date: task.start_date || new Date().toISOString().split('T')[0],
        duration: task.duration || 7,
        progress: 0,
        phase: task.phase || 'Construction',
        parent: task.parent_id || 0
      })),
      links: [] // Add dependencies here if needed
    };
    return data;
  };



  if (!tasks || tasks.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: '600px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3>No Schedule Data Available</h3>
          <p>Please generate a schedule first to view the Gantt chart.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', marginTop: '20px' }}>
      <div style={{ 
        marginBottom: '10px', 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '5px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, color: '#333' }}>Construction Schedule - Interactive Gantt Chart</h3>
        <div>
          <button 
            onClick={() => gantt.ext.zoom.setLevel("day")}
            style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer' }}
          >
            Day View
          </button>
          <button 
            onClick={() => gantt.ext.zoom.setLevel("week")}
            style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer' }}
          >
            Week View
          </button>
          <button 
            onClick={() => gantt.ext.zoom.setLevel("month")}
            style={{ padding: '5px 10px', cursor: 'pointer' }}
          >
            Month View
          </button>
        </div>
      </div>
      
      <div 
        ref={ganttContainer}
        style={{ 
          width: '100%', 
          height: '600px',
          border: '1px solid #ccc',
          borderRadius: '5px'
        }}
      />
      
      <style jsx global>{`
        /* Task Bar Colors */
        .gantt-task-foundation .gantt_task_line {
          background: linear-gradient(135deg, #8B4513, #A0522D) !important;
          border: 2px solid #654321 !important;
        }
        .gantt-task-basement .gantt_task_line {
          background: linear-gradient(135deg, #696969, #808080) !important;
          border: 2px solid #4A4A4A !important;
        }
        .gantt-task-columns .gantt_task_line {
          background: linear-gradient(135deg, #4CAF50, #66BB6A) !important;
          border: 2px solid #388E3C !important;
        }
        .gantt-task-beams .gantt_task_line {
          background: linear-gradient(135deg, #2196F3, #42A5F5) !important;
          border: 2px solid #1976D2 !important;
        }
        .gantt-task-slabs .gantt_task_line {
          background: linear-gradient(135deg, #9C27B0, #BA68C8) !important;
          border: 2px solid #7B1FA2 !important;
        }
        .gantt-task-fitout .gantt_task_line {
          background: linear-gradient(135deg, #FF9800, #FFB74D) !important;
          border: 2px solid #F57C00 !important;
        }
        .gantt-task-roof .gantt_task_line {
          background: linear-gradient(135deg, #F44336, #EF5350) !important;
          border: 2px solid #D32F2F !important;
        }
        .gantt-task-excavation .gantt_task_line {
          background: linear-gradient(135deg, #795548, #8D6E63) !important;
          border: 2px solid #5D4037 !important;
        }
        .gantt-task-structure .gantt_task_line {
          background: linear-gradient(135deg, #607D8B, #78909C) !important;
          border: 2px solid #455A64 !important;
        }
        .gantt-task-facade .gantt_task_line {
          background: linear-gradient(135deg, #00BCD4, #26C6DA) !important;
          border: 2px solid #0097A7 !important;
        }
        .gantt-task-default .gantt_task_line {
          background: linear-gradient(135deg, #9E9E9E, #BDBDBD) !important;
          border: 2px solid #757575 !important;
        }

        /* Row Background Colors */
        .gantt-row-foundation {
          background-color: rgba(139, 69, 19, 0.1) !important;
        }
        .gantt-row-basement {
          background-color: rgba(105, 105, 105, 0.1) !important;
        }
        .gantt-row-columns {
          background-color: rgba(76, 175, 80, 0.1) !important;
        }
        .gantt-row-beams {
          background-color: rgba(33, 150, 243, 0.1) !important;
        }
        .gantt-row-slabs {
          background-color: rgba(156, 39, 176, 0.1) !important;
        }
        .gantt-row-fitout {
          background-color: rgba(255, 152, 0, 0.1) !important;
        }
        .gantt-row-roof {
          background-color: rgba(244, 67, 54, 0.1) !important;
        }
        .gantt-row-default {
          background-color: rgba(158, 158, 158, 0.05) !important;
        }

        /* Column Header Colors */
        .gantt_grid_head_cell {
          background: linear-gradient(135deg, #37474F, #455A64) !important;
          color: white !important;
          font-weight: bold !important;
          border-right: 1px solid #263238 !important;
        }

        /* Grid Cell Colors */
        .gantt_cell {
          border-right: 1px solid #E0E0E0 !important;
          padding: 8px 6px !important;
          vertical-align: middle !important;
          line-height: 1.4 !important;
          font-size: 13px !important;
          overflow: visible !important;
          white-space: nowrap !important;
          text-overflow: ellipsis !important;
        }

        /* Task name cell specific styling */
        .gantt_tree_content {
          line-height: 1.4 !important;
          padding: 4px 0 !important;
          font-size: 13px !important;
          font-weight: 500 !important;
        }

        /* Grid row styling */
        .gantt_row {
          height: 40px !important;
          line-height: 40px !important;
        }

        /* Alternating row colors */
        .gantt_row:nth-child(even) {
          background-color: rgba(240, 240, 240, 0.3) !important;
        }

        /* Grid area styling */
        .gantt_grid {
          border-right: 2px solid #ddd !important;
        }

        /* Grid data area */
        .gantt_grid_data {
          overflow-x: hidden !important;
        }

        /* Text alignment in cells */
        .gantt_cell div {
          line-height: 1.4 !important;
          padding: 2px 0 !important;
          display: flex !important;
          align-items: center !important;
          height: 100% !important;
        }

        /* Task text styling */
        .gantt_task_line {
          border-radius: 4px !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
        }

        /* Scale styling */
        .gantt_scale_line {
          background: linear-gradient(135deg, #263238, #37474F) !important;
          color: white !important;
          font-weight: bold !important;
          border-bottom: 2px solid #1A252F !important;
        }

        /* Today line */
        .gantt_today {
          background-color: rgba(255, 193, 7, 0.3) !important;
        }
      `}</style>
    </div>
  );
};

export default DHtmlxGanttChart; 