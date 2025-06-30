import React, { useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import { SchedulePlanner } from '../components/SchedulePlanner';
import DHtmlxGanttChart from '../components/DHtmlxGanttChart';
import { Task } from '../types/schedule';

export default function Home() {
  const [schedule, setSchedule] = useState<Task[]>([]);

  const handleScheduleGenerated = (newSchedule: Task[]) => {
    console.log('Parent component received schedule:', newSchedule);
    setSchedule(newSchedule);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      py: 4
    }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            align="center"
            sx={{ 
              color: 'text.primary',
              fontWeight: 600
            }}
          >
            Construction Schedule Planner
          </Typography>
          <Typography 
            variant="subtitle1" 
            align="center" 
            sx={{ 
              color: 'text.secondary',
              mb: 4
            }}
          >
            Combine BIM-based scheduling with construction phase planning
          </Typography>
          
          <SchedulePlanner onScheduleGenerated={handleScheduleGenerated} />
          
          {schedule.length > 0 && (
            <DHtmlxGanttChart tasks={schedule} />
          )}
        </Box>
      </Container>
    </Box>
  );
} 