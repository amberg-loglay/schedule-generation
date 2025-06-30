import type { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

type ScheduleResponse = {
  success: boolean;
  message: string;
  schedule?: any;
  error?: string;
};

function transformScheduleData(scheduleData: any[]): any[] {
  return scheduleData.map((task, index) => ({
    id: task.task_id || `task-${index}`,
    name: task.object_description || task.task_name || `Task ${index + 1}`,
    start_date: task.start_date,
    end_date: task.end_date,
    duration: task.duration || 7, // Default 7 days if not specified
    phase: task.phase || 'Construction',
    dependencies: task.dependencies || [],
    object_code: task.object_code,
    level: task.level,
    parent_id: task.parent_id
  }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScheduleResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const scheduleParams = req.body;

    // First, generate the construction schedule
    const constructionSchedule = await generateConstructionSchedule(scheduleParams);

    // Then, generate the BIM-based schedule
    const bimSchedule = await generateBIMSchedule();

    // Combine both schedules
    const combinedSchedule = combineSchedules(constructionSchedule, bimSchedule, scheduleParams);

    // Transform the data to match frontend expectations
    const transformedSchedule = transformScheduleData(combinedSchedule);

    // Try to generate Gantt chart (optional - don't fail if this doesn't work)
    try {
      await generateGanttChart(combinedSchedule);
      console.log('Gantt chart generated successfully');
    } catch (ganttError) {
      console.warn('Gantt chart generation failed, but continuing:', ganttError);
    }

    return res.status(200).json({
      success: true,
      message: 'Schedule generated successfully',
      schedule: transformedSchedule
    });

  } catch (error) {
    console.error('Error generating schedule:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function generateConstructionSchedule(params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    // Use the script in the current directory (schedule-planner)
    const scriptPath = path.join(process.cwd(), 'create_construction_schedule.py');
    
    console.log('Attempting to run:', scriptPath);
    console.log('Script exists:', fs.existsSync(scriptPath));
    
    const pythonProcess = spawn('python', [
      scriptPath,
      JSON.stringify(params)
    ]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      console.log('Construction schedule process closed with code:', code);
      if (errorOutput) console.log('Construction schedule stderr:', errorOutput);
      
      if (code !== 0) {
        reject(new Error(`Construction schedule generation failed: ${errorOutput}`));
        return;
      }

      try {
        const schedule = JSON.parse(output);
        resolve(schedule);
      } catch (error) {
        reject(new Error('Failed to parse construction schedule output'));
      }
    });
  });
}

async function generateBIMSchedule(): Promise<any> {
  return new Promise((resolve, reject) => {
    // Use the script in the current directory (schedule-planner)
    const scriptPath = path.join(process.cwd(), 'create_schedule_from_objects.py');
    
    console.log('Attempting to run BIM schedule:', scriptPath);
    console.log('BIM script exists:', fs.existsSync(scriptPath));
    
    const pythonProcess = spawn('python', [scriptPath]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      console.log('BIM schedule process closed with code:', code);
      if (errorOutput) console.log('BIM schedule stderr:', errorOutput);
      
      if (code !== 0) {
        reject(new Error(`BIM schedule generation failed: ${errorOutput}`));
        return;
      }

      try {
        // Use the JSON file in the current directory (schedule-planner)
        const jsonPath = path.join(process.cwd(), 'detailed_schedule_with_child_tasks.json');
        console.log('Reading BIM schedule from:', jsonPath);
        console.log('JSON file exists:', fs.existsSync(jsonPath));
        
        const scheduleData = fs.readFileSync(jsonPath, 'utf8');
        const schedule = JSON.parse(scheduleData);
        resolve(schedule);
      } catch (error) {
        reject(new Error('Failed to read BIM schedule'));
      }
    });
  });
}

function combineSchedules(constructionSchedule: any, bimSchedule: any, params: any): any {
  // Start with construction phases
  let combinedSchedule = [...constructionSchedule];
  
  // Adjust BIM schedule tasks based on construction phases
  const bimTasks = bimSchedule.map((task: any) => {
    const taskType = task.object_code.split('.')[0];
    
    // Adjust start dates based on construction phases
    if (params.structure.enabled && taskType === 'KO') {
      // Structure tasks start after excavation
      const excavationEnd = findPhaseEndDate(combinedSchedule, 'Excavation');
      if (excavationEnd) {
        task.start_date = adjustDate(excavationEnd, params.structure.overlap || 0);
      }
    }
    
    if (params.fitout.enabled && taskType === 'FI') {
      // Fitout tasks start after structure
      const structureEnd = findPhaseEndDate(combinedSchedule, 'Structure');
      if (structureEnd) {
        task.start_date = adjustDate(structureEnd, params.fitout.overlap || 0);
      }
    }
    
    return task;
  });
  
  // Add adjusted BIM tasks to combined schedule
  combinedSchedule = [...combinedSchedule, ...bimTasks];
  
  // Sort by start date
  combinedSchedule.sort((a: any, b: any) => {
    const dateA = new Date(a.start_date);
    const dateB = new Date(b.start_date);
    return dateA.getTime() - dateB.getTime();
  });
  
  return combinedSchedule;
}

function findPhaseEndDate(schedule: any[], phase: string): string | null {
  const phaseTasks = schedule.filter(task => task.phase === phase);
  if (phaseTasks.length === 0) return null;
  
  return phaseTasks.reduce((latest, task) => {
    const taskEnd = new Date(task.end_date);
    const currentLatest = new Date(latest);
    return taskEnd > currentLatest ? task.end_date : latest;
  }, phaseTasks[0].end_date);
}

function adjustDate(date: string, offsetDays: number): string {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + offsetDays);
  return newDate.toISOString().split('T')[0];
}

async function generateGanttChart(schedule: any): Promise<void> {
  return new Promise((resolve, reject) => {
    // Use the script in the current directory (schedule-planner)
    const scriptPath = path.join(process.cwd(), 'create_improved_gantt.py');
    
    console.log('Attempting to run Gantt chart:', scriptPath);
    console.log('Gantt script exists:', fs.existsSync(scriptPath));
    
    const pythonProcess = spawn('python', [
      scriptPath,
      JSON.stringify(schedule)
    ]);

    let errorOutput = '';

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      console.log('Gantt chart process closed with code:', code);
      if (errorOutput) console.log('Gantt chart stderr:', errorOutput);
      
      if (code !== 0) {
        reject(new Error(`Failed to generate Gantt chart: ${errorOutput}`));
        return;
      }
      resolve();
    });
  });
} 