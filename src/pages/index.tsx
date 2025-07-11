import React, { useState } from 'react';
import { Container, Typography, Box, Tabs, Tab, Paper, Grid, TextField, Button, IconButton, Alert } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { SchedulePlanner } from '../components/SchedulePlanner';
import { BIMSchedulePlanner } from '../components/BIMSchedulePlanner';
import DHtmlxGanttChart from '../components/DHtmlxGanttChart';
import { Task } from '../types/schedule';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface CustomTask {
  id: string;
  name: string;
  duration: number;
  startDate: string;
}

interface ConstructionPhaseData {
  buildingType: string;
  siteEstablishment: any;
  demolition: any;
  excavation: any;
  substructure: any;
  structure: any;
  superstructure: any;
  facade: any;
  fitout: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function Home() {
  const [schedule, setSchedule] = useState<Task[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [projectStartDate, setProjectStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);
  const [constructionPhaseData, setConstructionPhaseData] = useState<ConstructionPhaseData | null>(null);

  const handleScheduleGenerated = (newSchedule: Task[]) => {
    console.log('Parent component received schedule:', newSchedule);
    
    // Merge with custom tasks
    const mergedSchedule = [...newSchedule];
    
    // Add custom tasks to the schedule
    customTasks.forEach((customTask, index) => {
      const startDate = new Date(customTask.startDate || projectStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + customTask.duration);
      
      mergedSchedule.push({
        id: `custom-${customTask.id}`,
        name: customTask.name,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        duration: customTask.duration,
        phase: 'Custom',
        object_code: `CUSTOM-${index + 1}`,
        object_count: 1,
        sequence: 1000 + index, // High sequence number for custom tasks
        dependencies: []
      });
    });
    
    setSchedule(mergedSchedule);
  };

  const handleConstructionPhaseChange = (data: ConstructionPhaseData) => {
    setConstructionPhaseData(data);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const addCustomTask = () => {
    const newTask: CustomTask = {
      id: `task-${Date.now()}`,
      name: 'New Custom Task',
      duration: 1,
      startDate: projectStartDate
    };
    setCustomTasks([...customTasks, newTask]);
  };

  const updateCustomTask = (index: number, field: keyof CustomTask, value: string | number) => {
    const updatedTasks = [...customTasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    setCustomTasks(updatedTasks);
  };

  const deleteCustomTask = (index: number) => {
    const updatedTasks = customTasks.filter((_, i) => i !== index);
    setCustomTasks(updatedTasks);
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
          
          {/* Tab Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="schedule planner tabs">
              <Tab label="Construction Phases" {...a11yProps(0)} />
              <Tab label="BIM Objects & Tasks" {...a11yProps(1)} />
            </Tabs>
          </Box>

          {/* Global Project Settings */}
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              📅 Global Project Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Project Start Date"
                  value={projectStartDate}
                  onChange={(e) => setProjectStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="This date will be used across all planners"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Alert severity="info" sx={{ height: 'fit-content' }}>
                  Set your project start date here. Both construction phases and BIM tasks will use this date.
                </Alert>
              </Grid>
            </Grid>
          </Paper>

          {/* Custom Tasks Section */}
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                🛠️ Custom Tasks
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addCustomTask}
                size="small"
              >
                Add Custom Task
              </Button>
            </Box>
            
            {customTasks.length === 0 ? (
              <Alert severity="info">
                No custom tasks added yet. Click "Add Custom Task" to create tasks that will appear in your schedule.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {customTasks.map((task, index) => (
                  <Grid item xs={12} key={task.id}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Task Name"
                            value={task.name}
                            onChange={(e) => updateCustomTask(index, 'name', e.target.value)}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6} md={2}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Duration (days)"
                            value={task.duration}
                            onChange={(e) => updateCustomTask(index, 'duration', parseInt(e.target.value) || 1)}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <TextField
                            fullWidth
                            type="date"
                            label="Start Date"
                            value={task.startDate}
                            onChange={(e) => updateCustomTask(index, 'startDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <IconButton 
                              onClick={() => deleteCustomTask(index)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            <SchedulePlanner 
              projectStartDate={projectStartDate}
              onConstructionPhaseChange={handleConstructionPhaseChange}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <BIMSchedulePlanner 
              onScheduleGenerated={handleScheduleGenerated}
              projectStartDate={projectStartDate}
              constructionPhaseData={constructionPhaseData}
            />
          </TabPanel>
          
          {/* Unified Gantt Chart Display */}
          {schedule.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  📊 Unified Project Schedule
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  This schedule combines construction phases, BIM tasks, and custom tasks into a single view.
                </Typography>
            <DHtmlxGanttChart tasks={schedule} />
              </Paper>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
} 