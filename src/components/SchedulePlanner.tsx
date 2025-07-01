import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Switch,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
  InputLabel,
  Button,
  Slider,
  Paper,
  Divider,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Task } from '../types/schedule';

interface ConstructionPhase {
  enabled: boolean;
  duration?: number;
  overlap?: number;
  additionalFields?: { [key: string]: any };
}

interface ScheduleState {
  projectStartDate: string;
  buildingType: string;
  siteEstablishment: ConstructionPhase & {
    mobiliseDuration: number;
    perimeterType: string;
    siteSheds: {
      enabled: boolean;
      duration: number;
      overlap: number;
    };
  };
  demolition: ConstructionPhase & {
    scaffolding: {
      enabled: boolean;
      erectionDuration: number;
      dismantleDuration: number;
    };
  };
  excavation: ConstructionPhase & {
    soilType: string;
    volume: number;
    dailyRate: number;
  };
  substructure: ConstructionPhase & {
    type: string;
    overlapWithPrevious: number;
  };
  structure: ConstructionPhase & {
    concreteCoreIncluded: boolean;
    coreConstructionType: string;
    basementIncluded: boolean;
  };
  superstructure: ConstructionPhase & {
    floorsAboveGround: number;
    floorType: string;
  };
  facade: ConstructionPhase & {
    type: string;
    durationPerLevel: number;
  };
  fitout: ConstructionPhase & {
    baseDuration: number;
  };
}

interface SchedulePlannerProps {
  onScheduleGenerated?: (schedule: Task[]) => void;
}

const initialState: ScheduleState = {
  projectStartDate: '',
  buildingType: 'Highrise Residential',
  siteEstablishment: {
    enabled: false,
    mobiliseDuration: 5,
    perimeterType: 'None',
    siteSheds: {
      enabled: false,
      duration: 3,
      overlap: 0
    }
  },
  demolition: {
    enabled: false,
    duration: 10,
    scaffolding: {
      enabled: false,
      erectionDuration: 3,
      dismantleDuration: 2
    }
  },
  excavation: {
    enabled: false,
    soilType: 'Soft/Loose Soils',
    volume: 0,
    dailyRate: 100
  },
  substructure: {
    enabled: false,
    type: 'None',
    overlapWithPrevious: 0
  },
  structure: {
    enabled: false,
    concreteCoreIncluded: false,
    coreConstructionType: 'None',
    basementIncluded: false
  },
  superstructure: {
    enabled: false,
    floorsAboveGround: 0,
    floorType: 'In-situ Concrete Frame'
  },
  facade: {
    enabled: false,
    type: 'Curtain Wall',
    durationPerLevel: 5
  },
  fitout: {
    enabled: false,
    baseDuration: 20
  }
};

export const SchedulePlanner: React.FC<SchedulePlannerProps> = ({ onScheduleGenerated }) => {
  const [state, setState] = useState<ScheduleState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (section: keyof ScheduleState, field: string, value: any) => {
    setState(prev => {
      // Handle string values directly (like projectStartDate, buildingType)
      if (field === '') {
        return {
          ...prev,
          [section]: value
        };
      }
      
      // Handle object values with nested properties
      const currentSection = prev[section];
      if (typeof currentSection === 'object' && currentSection !== null) {
        return {
          ...prev,
          [section]: {
            ...currentSection,
            [field]: value
          }
        };
      }
      
      // Fallback for edge cases
      return {
        ...prev,
        [section]: {
          [field]: value
        }
      };
    });
  };

  const generateSchedule = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Sending schedule parameters:', state);
      
      const response = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(state),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Schedule generated:', result);
      
      if (result.success && result.schedule) {
        setSuccess('Schedule generated successfully!');
        console.log('Received schedule data:', result.schedule);
        if (onScheduleGenerated) {
          onScheduleGenerated(result.schedule);
        }
      } else {
        throw new Error(result.error || 'Failed to generate schedule');
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Project Schedule Planner
        </Typography>
        
        <Grid container spacing={3}>
          {/* Project Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Project Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Project Start Date"
                  value={state.projectStartDate}
                  onChange={(e) => handleChange('projectStartDate', '', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Building Type</InputLabel>
                  <Select
                    value={state.buildingType}
                    onChange={(e) => handleChange('buildingType', '', e.target.value)}
                    label="Building Type"
                  >
                    <MenuItem value="Highrise Residential">Highrise Residential</MenuItem>
                    <MenuItem value="Commercial">Commercial</MenuItem>
                    <MenuItem value="Industrial">Industrial</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          {/* Site Establishment */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.siteEstablishment.enabled}
                    onChange={(e) => handleChange('siteEstablishment', 'enabled', e.target.checked)}
                  />
                }
                label="Enable Site Establishment"
              />
            </Box>
            {state.siteEstablishment.enabled && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Mobilise Duration (days)"
                    value={state.siteEstablishment.mobiliseDuration}
                    onChange={(e) => handleChange('siteEstablishment', 'mobiliseDuration', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Perimeter Type</InputLabel>
                    <Select
                      value={state.siteEstablishment.perimeterType}
                      onChange={(e) => handleChange('siteEstablishment', 'perimeterType', e.target.value)}
                      label="Perimeter Type"
                    >
                      <MenuItem value="None">None</MenuItem>
                      <MenuItem value="Hoarding">Hoarding</MenuItem>
                      <MenuItem value="Fencing">Fencing</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
          </Grid>

          {/* Demolition */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.demolition.enabled}
                    onChange={(e) => handleChange('demolition', 'enabled', e.target.checked)}
                  />
                }
                label="Enable Demolition"
              />
            </Box>
            {state.demolition.enabled && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Main Demolition Duration (days)"
                    value={state.demolition.duration}
                    onChange={(e) => handleChange('demolition', 'duration', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={state.demolition.scaffolding.enabled}
                        onChange={(e) => handleChange('demolition', 'scaffolding', {
                          ...state.demolition.scaffolding,
                          enabled: e.target.checked
                        })}
                      />
                    }
                    label="Scaffolding Required"
                  />
                </Grid>
                {state.demolition.scaffolding.enabled && (
                  <>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Scaffolding Erection Duration (days)"
                        value={state.demolition.scaffolding.erectionDuration}
                        onChange={(e) => handleChange('demolition', 'scaffolding', {
                          ...state.demolition.scaffolding,
                          erectionDuration: parseInt(e.target.value)
                        })}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Scaffolding Dismantle Duration (days)"
                        value={state.demolition.scaffolding.dismantleDuration}
                        onChange={(e) => handleChange('demolition', 'scaffolding', {
                          ...state.demolition.scaffolding,
                          dismantleDuration: parseInt(e.target.value)
                        })}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            )}
          </Grid>

          {/* Excavation */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.excavation.enabled}
                    onChange={(e) => handleChange('excavation', 'enabled', e.target.checked)}
                  />
                }
                label="Enable Excavation"
              />
            </Box>
            {state.excavation.enabled && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Soil Type</InputLabel>
                    <Select
                      value={state.excavation.soilType}
                      onChange={(e) => handleChange('excavation', 'soilType', e.target.value)}
                      label="Soil Type"
                    >
                      <MenuItem value="Soft/Loose Soils">Soft/Loose Soils</MenuItem>
                      <MenuItem value="Medium Soils">Medium Soils</MenuItem>
                      <MenuItem value="Hard/Dense Soils">Hard/Dense Soils</MenuItem>
                      <MenuItem value="Rock">Rock</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Volume (m³)"
                    value={state.excavation.volume}
                    onChange={(e) => handleChange('excavation', 'volume', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Daily Rate (m³/day)"
                    value={state.excavation.dailyRate}
                    onChange={(e) => handleChange('excavation', 'dailyRate', parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
            )}
          </Grid>

          {/* Structure Phase */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.structure.enabled}
                    onChange={(e) => handleChange('structure', 'enabled', e.target.checked)}
                  />
                }
                label="Enable Structure Phase"
              />
            </Box>
            {state.structure.enabled && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={state.structure.concreteCoreIncluded}
                        onChange={(e) => handleChange('structure', 'concreteCoreIncluded', e.target.checked)}
                      />
                    }
                    label="Concrete Core Included"
                  />
                </Grid>
                {state.structure.concreteCoreIncluded && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Core Construction Type</InputLabel>
                      <Select
                        value={state.structure.coreConstructionType}
                        onChange={(e) => handleChange('structure', 'coreConstructionType', e.target.value)}
                        label="Core Construction Type"
                      >
                        <MenuItem value="None">None</MenuItem>
                        <MenuItem value="Jump Form">Jump Form</MenuItem>
                        <MenuItem value="Slip Form">Slip Form</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={state.structure.basementIncluded}
                        onChange={(e) => handleChange('structure', 'basementIncluded', e.target.checked)}
                      />
                    }
                    label="Basement Included"
                  />
                </Grid>
              </Grid>
            )}
          </Grid>

          {/* Superstructure */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.superstructure.enabled}
                    onChange={(e) => handleChange('superstructure', 'enabled', e.target.checked)}
                  />
                }
                label="Enable Superstructure"
              />
            </Box>
            {state.superstructure.enabled && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Floors Above Ground"
                    value={state.superstructure.floorsAboveGround}
                    onChange={(e) => handleChange('superstructure', 'floorsAboveGround', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Floor Type</InputLabel>
                    <Select
                      value={state.superstructure.floorType}
                      onChange={(e) => handleChange('superstructure', 'floorType', e.target.value)}
                      label="Floor Type"
                    >
                      <MenuItem value="In-situ Concrete Frame">In-situ Concrete Frame</MenuItem>
                      <MenuItem value="Precast Concrete">Precast Concrete</MenuItem>
                      <MenuItem value="Steel Frame">Steel Frame</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
          </Grid>

          {/* Facade */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.facade.enabled}
                    onChange={(e) => handleChange('facade', 'enabled', e.target.checked)}
                  />
                }
                label="Enable Facade"
              />
            </Box>
            {state.facade.enabled && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Facade Type</InputLabel>
                    <Select
                      value={state.facade.type}
                      onChange={(e) => handleChange('facade', 'type', e.target.value)}
                      label="Facade Type"
                    >
                      <MenuItem value="Curtain Wall">Curtain Wall (Glass & Aluminium)</MenuItem>
                      <MenuItem value="Precast Panels">Precast Panels</MenuItem>
                      <MenuItem value="Masonry">Masonry</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Duration per Level (days)"
                    value={state.facade.durationPerLevel}
                    onChange={(e) => handleChange('facade', 'durationPerLevel', parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
            )}
          </Grid>

          {/* Fitout */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.fitout.enabled}
                    onChange={(e) => handleChange('fitout', 'enabled', e.target.checked)}
                  />
                }
                label="Enable Fitout"
              />
            </Box>
            {state.fitout.enabled && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Base Duration per Floor (days)"
                    value={state.fitout.baseDuration}
                    onChange={(e) => handleChange('fitout', 'baseDuration', parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
            )}
          </Grid>

          {/* Generate Button */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={generateSchedule}
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Generate Schedule'}
            </Button>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}

          {success && (
            <Grid item xs={12}>
              <Alert severity="success">{success}</Alert>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Container>
  );
};

export default SchedulePlanner; 