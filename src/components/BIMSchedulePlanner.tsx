import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Card,
  CardContent,
  CardActions,
  RadioGroup,
  Radio,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  FormLabel,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CloudUpload, Analytics, Schedule, CheckCircle, Build, Calculate } from '@mui/icons-material';
import { Task } from '../types/schedule';

interface BIMObject {
  GlobalId: string;
  label_code: string;
  label_name: string;
}

interface UnmappedLabel {
  object_code: string;
  description: string;
  sequence: number;
  total_objects: number;
  floors_distribution: { [key: string]: number };
  suggested_task_name: string;
  can_create_schedule_task: boolean;
}

interface VolumeData {
  [key: string]: {
    volume: number;
    area: number;
    count: number;
    total_volume?: number;
    total_area?: number;
  };
}

interface BIMObjectWithVolume {
  GlobalId?: string;
  text?: string;
  volume?: number;
  area?: number;
  [key: string]: any;
}

interface PotentialTask {
  task_code: string;
  task_name: string;
  object_code: string;
  object_description: string;
  sequence: number;
  total_objects: number;
  estimated_duration: number;
  manual_duration?: number;
  volume_data?: any;
  selected: boolean;
}

interface FloorData {
  bim_floors: string[];
  schedule_floors: string[];
  floor_count_bim: number;
  floor_count_schedule: number;
}

interface SystemData {
  labelSchedule: { [key: string]: string };
  mappingData: any;
  sequenceData: { [key: string]: any };
  loaded: boolean;
}

interface BIMSchedulePlannerProps {
  onScheduleGenerated?: (schedule: Task[]) => void;
  projectStartDate: string;
  constructionPhaseData?: any;
}

export const BIMSchedulePlanner: React.FC<BIMSchedulePlannerProps> = ({ onScheduleGenerated, projectStartDate, constructionPhaseData }) => {
  // File data states
  const [mappedObjects, setMappedObjects] = useState<BIMObject[]>([]);
  const [unmappedObjects, setUnmappedObjects] = useState<BIMObject[]>([]);
  const [unmappedLabels, setUnmappedLabels] = useState<UnmappedLabel[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeData>({});
  const [systemData, setSystemData] = useState<SystemData>({
    labelSchedule: {},
    mappingData: {},
    sequenceData: {},
    loaded: false
  });
  const [floorData, setFloorData] = useState<FloorData>({
    bim_floors: [],
    schedule_floors: [],
    floor_count_bim: 0,
    floor_count_schedule: 0
  });
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dataAnalyzed, setDataAnalyzed] = useState(false);
  const [potentialTasks, setPotentialTasks] = useState<PotentialTask[]>([]);
  const [durationMethod, setDurationMethod] = useState<'automatic' | 'manual'>('automatic');
  const [generationMode, setGenerationMode] = useState<'automatic' | 'manual'>('automatic');
  
  // Duration calculation settings - updated with realistic construction productivity
  const [volumeBasedSettings, setVolumeBasedSettings] = useState({
    objectsPerDay: 20,  // Increased from 10 to 20 objects per day
    volumeMultiplier: 0.02,  // Reduced from 1.0 to 0.02 (50 m³/day = 1/50 = 0.02)
    areaMultiplier: 0.04,  // Reduced from 0.5 to 0.04 (25 m²/day = 1/25 = 0.04)
    minimumDays: 1
  });
  
  // Auto-load system files on component mount
  useEffect(() => {
    const loadSystemData = async () => {
      try {
        console.log('Loading system data...');
        
        // Load reference data from system files
        const [labelSchedule, mappingData, sequenceData] = await Promise.all([
          fetch('/label_schedule.json').then(r => r.json()).catch(() => ({})),
          fetch('/schedule_to_object_mapping.json').then(r => r.json()).catch(() => ({})),
          fetch('/label_object_sequenced.json').then(r => r.json()).catch(() => ({}))
        ]);
        
        setSystemData({
          labelSchedule,
          mappingData,
          sequenceData,
          loaded: true
        });
        
        console.log('System data loaded successfully:', {
          labelScheduleKeys: Object.keys(labelSchedule).length,
          mappingDataKeys: Object.keys(mappingData).length,
          sequenceDataKeys: Object.keys(sequenceData).length
        });
        
      } catch (error) {
        console.error('Failed to load system data:', error);
        setError('Failed to load system reference data');
      }
    };
    
    const loadBIMObjectData = async () => {
      try {
        console.log('Loading BIM object data...');
        
        // Load BIM object data from system files
        const [mappedObjectsData, unmappedObjectsData, unmappedLabelsData] = await Promise.all([
          fetch('/mapped_objects_simple.json').then(r => r.json()).catch(() => []),
          fetch('/unmapped_objects_simple.json').then(r => r.json()).catch(() => []),
          fetch('/unmapped_labels_for_schedule.json').then(r => r.json()).catch(() => [])
        ]);
        
        setMappedObjects(mappedObjectsData);
        setUnmappedObjects(unmappedObjectsData);
        setUnmappedLabels(unmappedLabelsData);
        
        console.log('BIM object data loaded successfully:', {
          mappedObjects: mappedObjectsData.length,
          unmappedObjects: unmappedObjectsData.length,
          unmappedLabels: unmappedLabelsData.length
        });
        
      } catch (error) {
        console.error('Failed to load BIM object data:', error);
        setError('Failed to load BIM object data');
      }
    };

    const loadBIMVolumeData = async () => {
      try {
        console.log('Loading BIM volume data...');
        
        // Load BIM objects with volume data
        const bimObjectsWithVolumes: BIMObjectWithVolume[] = await fetch('/bim_objects_with_volumes.json')
          .then(r => r.json())
          .catch(() => []);
        
        console.log('BIM volume data loaded:', bimObjectsWithVolumes.length, 'objects');
        
        // Process and map volume data by object code
        await processBIMVolumeData(bimObjectsWithVolumes);
        
      } catch (error) {
        console.error('Failed to load BIM volume data:', error);
        setError('Failed to load BIM volume data');
      }
    };
    
    loadSystemData();
    loadBIMObjectData();
    loadBIMVolumeData();
  }, []);

  // Process BIM volume data and map to object codes
  const processBIMVolumeData = async (bimObjects: BIMObjectWithVolume[]) => {
    try {
      console.log('Processing BIM volume data...');
      
      // Wait for unmapped objects to be loaded first
      if (unmappedObjects.length === 0) {
        console.log('Waiting for unmapped objects to load...');
        return;
      }

      // Create a mapping from GlobalId to object code using unmapped objects
      const globalIdToObjectCode: { [globalId: string]: string } = {};
      unmappedObjects.forEach(obj => {
        if (obj.GlobalId && obj.label_code) {
          globalIdToObjectCode[obj.GlobalId] = obj.label_code;
        }
      });

      // Function to extract properties from the text field
      const extractPropertiesFromText = (text: string) => {
        const properties: { [key: string]: any } = {};
        
        // Split by semicolons and parse each property
        const parts = text.split(';');
        parts.forEach(part => {
          const trimmed = part.trim();
          if (trimmed.includes(':')) {
            const [key, value] = trimmed.split(':').map(s => s.trim());
            
            // Try to parse as number if possible
            const numValue = parseFloat(value);
            properties[key] = !isNaN(numValue) ? numValue : value;
          }
        });
        
        return properties;
      };

      // Aggregate volumes by object code
      const volumesByObjectCode: { [objectCode: string]: { volumes: number[], areas: number[], count: number } } = {};
      
      bimObjects.forEach(obj => {
        // Extract GlobalId and properties from text field
        const text = obj.text || '';
        const properties = extractPropertiesFromText(text);
        
        // Find GlobalId in the text
        const globalIdMatch = text.match(/ifc\/GlobalId:\s*([^;]+)/);
        const globalId = globalIdMatch ? globalIdMatch[1].trim() : obj.GlobalId;
        
        if (!globalId) return; // Skip if no GlobalId found
        
        const objectCode = globalIdToObjectCode[globalId];
        if (objectCode) {
          if (!volumesByObjectCode[objectCode]) {
            volumesByObjectCode[objectCode] = { volumes: [], areas: [], count: 0 };
          }
          
          // Extract volume and area data from various possible fields
          let volume = 0;
          let area = 0;
          
          // Look for volume in various property names
          const volumeFields = [
            'volume', 'Volume', 'NetVolume', 'GrossVolume',
            'ifc/properties/HLS/Volumen', 'ifc/properties/Volumen'
          ];
          
          // Look for area in various property names (Fläche is German for area)
          const areaFields = [
            'area', 'Area', 'NetArea', 'GrossArea',
            'ifc/properties/HLS/Fläche', 'ifc/properties/HLS/Fl%C3%A4che',
            'ifc/properties/Fläche', 'ifc/properties/Fl%C3%A4che'
          ];
          
          volumeFields.forEach(field => {
            if (properties[field] && typeof properties[field] === 'number') {
              volume = Math.max(volume, properties[field]);
            }
          });
          
          areaFields.forEach(field => {
            if (properties[field] && typeof properties[field] === 'number') {
              area = Math.max(area, properties[field]);
            }
          });
          
          // Also try direct property access for fallback
          volume = volume || obj.volume || obj.Volume || obj.NetVolume || obj.GrossVolume || 0;
          area = area || obj.area || obj.Area || obj.NetArea || obj.GrossArea || 0;
          
          if (volume > 0) volumesByObjectCode[objectCode].volumes.push(volume);
          if (area > 0) volumesByObjectCode[objectCode].areas.push(area);
          volumesByObjectCode[objectCode].count++;
        }
      });

      // Calculate aggregated volume data
      const processedVolumeData: VolumeData = {};
      Object.entries(volumesByObjectCode).forEach(([objectCode, data]) => {
        const totalVolume = data.volumes.reduce((sum, v) => sum + v, 0);
        const totalArea = data.areas.reduce((sum, a) => sum + a, 0);
        const avgVolume = data.volumes.length > 0 ? totalVolume / data.volumes.length : 0;
        const avgArea = data.areas.length > 0 ? totalArea / data.areas.length : 0;
        
        processedVolumeData[objectCode] = {
          volume: avgVolume,
          area: avgArea,
          count: data.count,
          total_volume: totalVolume,
          total_area: totalArea
        };
      });

      setVolumeData(processedVolumeData);
      
      console.log('Volume data processed successfully:', {
        objectCodesWithVolumes: Object.keys(processedVolumeData).length,
        totalBIMObjects: bimObjects.length,
        mappedObjects: Object.keys(globalIdToObjectCode).length,
        sampleProcessedData: Object.keys(processedVolumeData).slice(0, 5)
      });
      
    } catch (error) {
      console.error('Failed to process BIM volume data:', error);
      setError(`Failed to process BIM volume data: ${error}`);
    }
  };

  // Trigger volume data processing when unmapped objects are loaded
  useEffect(() => {
    if (unmappedObjects.length > 0 && Object.keys(volumeData).length === 0) {
      // Re-trigger volume data loading now that we have unmapped objects
      const reloadVolumeData = async () => {
        try {
          const bimObjectsWithVolumes: BIMObjectWithVolume[] = await fetch('/bim_objects_with_volumes.json')
            .then(r => r.json())
            .catch(() => []);
          
          if (bimObjectsWithVolumes.length > 0) {
            await processBIMVolumeData(bimObjectsWithVolumes);
          }
        } catch (error) {
          console.error('Failed to reload volume data:', error);
        }
      };
      
      reloadVolumeData();
    }
  }, [unmappedObjects, volumeData]);
  
  // File upload handlers for user files only (no longer needed for volume data)
  const handleFileUpload = useCallback((fileType: string, file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        switch (fileType) {
          case 'mapped':
            setMappedObjects(data);
            console.log('Mapped objects loaded:', data.length);
            break;
          case 'unmapped':
            setUnmappedObjects(data);
            console.log('Unmapped objects loaded:', data.length);
            break;
          case 'unmappedLabels':
            setUnmappedLabels(data);
            console.log('Unmapped labels loaded:', data.length);
            break;
        }
        
        setError(null);
      } catch (error) {
        setError(`Failed to parse ${fileType} file: ${error}`);
      }
    };
    
    reader.readAsText(file);
  }, []);

  // Analyze data and create potential tasks
  const analyzeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!systemData.loaded) {
        throw new Error('System data not loaded yet. Please wait...');
      }
      
      if (unmappedLabels.length === 0) {
        throw new Error('No unmapped labels found. Please check if the system files are available.');
      }
      
      console.log('Analyzing data with system files:', systemData);
      
      // Extract floor data from BIM objects and schedule
      const bimFloors = new Set<string>();
      const scheduleFloors = new Set<string>();
      
      // Get floors from unmapped objects (BIM data)
      unmappedLabels.forEach(label => {
        if (label.floors_distribution) {
          Object.keys(label.floors_distribution).forEach(floor => {
            if (floor && floor.trim()) {
              bimFloors.add(floor.trim());
            }
          });
        }
      });
      
      // Get floors from system mapping data (schedule data)
      if (systemData.mappingData && typeof systemData.mappingData === 'object') {
        Object.values(systemData.mappingData).forEach((mapping: any) => {
          if (mapping.floor) {
            scheduleFloors.add(mapping.floor);
          }
        });
      }
      
      const floorInfo: FloorData = {
        bim_floors: Array.from(bimFloors).sort(),
        schedule_floors: Array.from(scheduleFloors).sort(),
        floor_count_bim: bimFloors.size,
        floor_count_schedule: scheduleFloors.size
      };
      
      setFloorData(floorInfo);
      
      // Create potential tasks from unmapped labels using system data
      const tasks: PotentialTask[] = unmappedLabels.map(label => {
        // Find corresponding task name from system label_schedule.json
        let taskName = systemData.labelSchedule[label.object_code] || label.suggested_task_name;
        
        // Remove "Construction of" prefix from task names
        if (taskName.startsWith('Construction of ')) {
          taskName = taskName.replace('Construction of ', '');
        }
        
        // Calculate estimated duration using scientifically correct productivity rates
        let estimatedDuration: number;
        
        if (generationMode === 'automatic' && volumeData[label.object_code]) {
          // Automatic generation: Use scientifically correct construction productivity rates
          const volume = volumeData[label.object_code];
          const totalVolume = volume.total_volume || volume.volume || 0;
          const totalArea = volume.total_area || volume.area || 0;
          
                     // Apply scientifically correct productivity rates using German construction codes (Gewerke)
           const taskCode = label.object_code.toUpperCase();
           const taskDescription = label.description.toLowerCase();
           let productivityRate = 0;
           
           if (taskCode.startsWith('EL') || taskDescription.includes('elektro') || taskDescription.includes('electrical')) {
             // Electrical installations: 30-150 m/day (use average 90 m/day)
             productivityRate = Math.max(totalVolume, totalArea) / 90;
           } else if (taskCode.startsWith('SN') || taskDescription.includes('sanitär') || taskDescription.includes('wasserrohr')) {
             // Plumbing: 15-60 m/day (use average 37.5 m/day)
             productivityRate = Math.max(totalVolume, totalArea) / 37.5;
           } else if (taskCode.startsWith('HZ') || taskDescription.includes('heizung') || taskDescription.includes('heizungsrohr')) {
             // Heating: 15-60 m/day (similar to plumbing, use average 37.5 m/day)
             productivityRate = Math.max(totalVolume, totalArea) / 37.5;
           } else if (taskCode.startsWith('LF') || taskDescription.includes('lüftung') || taskDescription.includes('luftkanal')) {
             // Ventilation: 30-150 m/day (use average 90 m/day)
             productivityRate = Math.max(totalVolume, totalArea) / 90;
           } else if (taskCode.startsWith('KT') || taskDescription.includes('kälte') || taskDescription.includes('kaltwasser')) {
             // Cooling: 15-60 m/day (similar to plumbing, use average 37.5 m/day)
             productivityRate = Math.max(totalVolume, totalArea) / 37.5;
           } else if (taskCode.startsWith('SPR') || taskDescription.includes('sprinkler') || taskDescription.includes('brandschutz')) {
             // Fire protection: 15-60 m/day (use average 37.5 m/day)
             productivityRate = Math.max(totalVolume, totalArea) / 37.5;
           } else if (taskDescription.includes('beton') || taskDescription.includes('concrete') || taskDescription.includes('massivbau')) {
             // Concrete work: 20-80 m³/day (use average 50 m³/day)
             productivityRate = totalVolume / 50;
           } else if (taskDescription.includes('mauerwerk') || taskDescription.includes('ziegel') || taskDescription.includes('masonry')) {
             // Masonry work: 5-20 m²/day (use average 12.5 m²/day)
             productivityRate = totalArea / 12.5;
           } else if (taskDescription.includes('gipskarton') || taskDescription.includes('trockenbauwand') || taskDescription.includes('drywall')) {
             // Formwork/Drywall: 20-50 m²/day (use average 35 m²/day)
             productivityRate = totalArea / 35;
           } else if (taskDescription.includes('stahlbau') || taskDescription.includes('metallbau') || taskDescription.includes('steel')) {
             // Steel work: 5-20 tons per day (use average 12.5 tons/day)
             productivityRate = (totalVolume * 7.85) / 12.5; // Assuming steel density 7.85 kg/m³
           } else if (taskDescription.includes('fundament') || taskDescription.includes('unterbau') || taskDescription.includes('bodenplatte') || taskDescription.includes('excavation')) {
             // Excavation: 150-760 m³/day (use average 455 m³/day)
             productivityRate = totalVolume / 455;
           } else {
             // Generic construction: Use moderate productivity rates
             productivityRate = Math.max(totalArea / 25, totalVolume / 100);
           }
          
          // Object-based calculation as fallback
          const objectBasedDays = label.total_objects / volumeBasedSettings.objectsPerDay;
          
          // Take the maximum of scientific calculation and object-based calculation
          estimatedDuration = Math.max(
            productivityRate,
            objectBasedDays,
            volumeBasedSettings.minimumDays
          );
        } else {
          // Manual generation: Use object count-based calculation with complexity multiplier
          const baseDuration = Math.max(1, Math.ceil(label.total_objects / volumeBasedSettings.objectsPerDay));
          const sequenceInfo = systemData.sequenceData[label.object_code] || {};
          const sequenceMultiplier = sequenceInfo.complexity || 1;
          estimatedDuration = baseDuration * sequenceMultiplier;
        }
        
        estimatedDuration = Math.round(estimatedDuration);
        
        return {
          task_code: `TASK_${label.object_code}`,
          task_name: taskName,
          object_code: label.object_code,
          object_description: label.description,
          sequence: label.sequence,
          total_objects: label.total_objects,
          estimated_duration: estimatedDuration,
          manual_duration: estimatedDuration, // Initialize manual duration with estimated
          volume_data: volumeData[label.object_code],
          selected: generationMode === 'automatic' // Auto-select all tasks in automatic mode
        };
      });
      
      // Sort by sequence
      tasks.sort((a, b) => a.sequence - b.sequence);
      
      setPotentialTasks(tasks);
      setDataAnalyzed(true);
      setSuccess(`Analysis complete! Found ${tasks.length} potential tasks from unmapped objects. BIM: ${floorInfo.floor_count_bim} floors, Schedule: ${floorInfo.floor_count_schedule} floors.`);
      
    } catch (error) {
      setError(`Analysis failed: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [unmappedLabels, volumeData, systemData, durationMethod, volumeBasedSettings, generationMode]);

  // Update task duration (manual mode)
  const updateTaskDuration = (taskCode: string, newDuration: number) => {
    setPotentialTasks(prev => 
      prev.map(task => 
        task.task_code === taskCode 
          ? { ...task, manual_duration: Math.max(1, newDuration) }
          : task
      )
    );
  };

  // Recalculate all durations when method or settings change
  const recalculateDurations = useCallback(() => {
    if (!dataAnalyzed) return;
    
    setPotentialTasks(prev => prev.map(task => {
      let newDuration: number;
      
      if (durationMethod === 'automatic' && task.volume_data) {
        // Use scientifically correct construction productivity rates
        const volume = task.volume_data;
        const totalVolume = volume.total_volume || volume.volume || 0;
        const totalArea = volume.total_area || volume.area || 0;
        
                 // Apply scientifically correct productivity rates using German construction codes (Gewerke)
         const taskCode = task.object_code.toUpperCase();
         const taskDescription = task.object_description.toLowerCase();
         let productivityRate = 0;
         
         if (taskCode.startsWith('EL') || taskDescription.includes('elektro') || taskDescription.includes('electrical')) {
           // Electrical installations: 30-150 m/day (use average 90 m/day)
           productivityRate = Math.max(totalVolume, totalArea) / 90;
         } else if (taskCode.startsWith('SN') || taskDescription.includes('sanitär') || taskDescription.includes('wasserrohr')) {
           // Plumbing: 15-60 m/day (use average 37.5 m/day)
           productivityRate = Math.max(totalVolume, totalArea) / 37.5;
         } else if (taskCode.startsWith('HZ') || taskDescription.includes('heizung') || taskDescription.includes('heizungsrohr')) {
           // Heating: 15-60 m/day (similar to plumbing, use average 37.5 m/day)
           productivityRate = Math.max(totalVolume, totalArea) / 37.5;
         } else if (taskCode.startsWith('LF') || taskDescription.includes('lüftung') || taskDescription.includes('luftkanal')) {
           // Ventilation: 30-150 m/day (use average 90 m/day)
           productivityRate = Math.max(totalVolume, totalArea) / 90;
         } else if (taskCode.startsWith('KT') || taskDescription.includes('kälte') || taskDescription.includes('kaltwasser')) {
           // Cooling: 15-60 m/day (similar to plumbing, use average 37.5 m/day)
           productivityRate = Math.max(totalVolume, totalArea) / 37.5;
         } else if (taskCode.startsWith('SPR') || taskDescription.includes('sprinkler') || taskDescription.includes('brandschutz')) {
           // Fire protection: 15-60 m/day (use average 37.5 m/day)
           productivityRate = Math.max(totalVolume, totalArea) / 37.5;
         } else if (taskDescription.includes('beton') || taskDescription.includes('concrete') || taskDescription.includes('massivbau')) {
           // Concrete work: 20-80 m³/day (use average 50 m³/day)
           productivityRate = totalVolume / 50;
         } else if (taskDescription.includes('mauerwerk') || taskDescription.includes('ziegel') || taskDescription.includes('masonry')) {
           // Masonry work: 5-20 m²/day (use average 12.5 m²/day)
           productivityRate = totalArea / 12.5;
         } else if (taskDescription.includes('gipskarton') || taskDescription.includes('trockenbauwand') || taskDescription.includes('drywall')) {
           // Formwork/Drywall: 20-50 m²/day (use average 35 m²/day)
           productivityRate = totalArea / 35;
         } else if (taskDescription.includes('stahlbau') || taskDescription.includes('metallbau') || taskDescription.includes('steel')) {
           // Steel work: 5-20 tons per day (use average 12.5 tons/day)
           productivityRate = (totalVolume * 7.85) / 12.5; // Assuming steel density 7.85 kg/m³
         } else if (taskDescription.includes('fundament') || taskDescription.includes('unterbau') || taskDescription.includes('bodenplatte') || taskDescription.includes('excavation')) {
           // Excavation: 150-760 m³/day (use average 455 m³/day)
           productivityRate = totalVolume / 455;
         } else {
           // Generic construction: Use moderate productivity rates
           productivityRate = Math.max(totalArea / 25, totalVolume / 100);
         }
        
        // Object-based calculation as fallback
        const objectBasedDays = task.total_objects / volumeBasedSettings.objectsPerDay;
        
        newDuration = Math.max(
          productivityRate,
          objectBasedDays,
          volumeBasedSettings.minimumDays
        );
      } else {
        // Keep existing duration for manual mode or fallback
        newDuration = task.estimated_duration;
      }
      
      newDuration = Math.round(newDuration);
      
      return {
        ...task,
        estimated_duration: newDuration,
        manual_duration: durationMethod === 'manual' ? (task.manual_duration || newDuration) : newDuration
      };
    }));
  }, [durationMethod, volumeBasedSettings, dataAnalyzed]);

  // Recalculate durations when method or settings change
  useEffect(() => {
    recalculateDurations();
  }, [recalculateDurations]);

  // Auto-select/deselect all tasks when generation mode changes
  useEffect(() => {
    if (dataAnalyzed && potentialTasks.length > 0) {
      const shouldSelectAll = generationMode === 'automatic';
      setPotentialTasks(prev => 
        prev.map(task => ({ ...task, selected: shouldSelectAll }))
      );
    }
  }, [generationMode, dataAnalyzed]);

  // Toggle task selection
  const toggleTaskSelection = (taskCode: string) => {
    setPotentialTasks(prev => 
      prev.map(task => 
        task.task_code === taskCode 
          ? { ...task, selected: !task.selected }
          : task
      )
    );
  };

  // Generate schedule from selected tasks
  const generateSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const selectedTasks = potentialTasks.filter(task => task.selected);
      
      if (selectedTasks.length === 0) {
        throw new Error('Please select at least one task to generate schedule');
      }
      
      // Create schedule using proper forward-pass CPM algorithm
      const calculateTaskSchedule = () => {
        const projectStartDateObj = projectStartDate ? new Date(projectStartDate) : new Date();
        const taskScheduleMap = new Map();
        
        // Sort tasks by sequence number for processing order
        const sortedTasks = [...selectedTasks].sort((a, b) => a.sequence - b.sequence);
        
        console.log('=== Starting Schedule Calculation ===');
        console.log('Project Start Date:', projectStartDateObj.toISOString().split('T')[0]);
        console.log('Tasks to process:', sortedTasks.map(t => `${t.task_name} (seq: ${t.sequence})`));
        
        // Log unique sequences
        const uniqueSequences = Array.from(new Set(sortedTasks.map(t => t.sequence))).sort((a, b) => a - b);
        console.log('Unique sequence numbers:', uniqueSequences);
        
        // Forward-pass CPM algorithm: Calculate Early Start (ES) and Early Finish (EF)
        // ES = max(EF of all immediate predecessors), EF = ES + Duration
        
        // Initialize all tasks
        sortedTasks.forEach(task => {
          const taskDuration = durationMethod === 'manual' ? 
            (task.manual_duration || task.estimated_duration) : 
            task.estimated_duration;
            
          taskScheduleMap.set(task.object_code, {
            task,
            duration: taskDuration,
            earlyStart: null,
            earlyFinish: null,
            startDate: null,
            endDate: null,
            processed: false
          });
          
          console.log(`Initialized task: ${task.task_name} (seq: ${task.sequence}, duration: ${taskDuration} days)`);
        });
        
        // Process tasks iteratively until all are scheduled
        let iterations = 0;
        const maxIterations = sortedTasks.length * 3; // Increase max iterations
        
        while (iterations < maxIterations) {
          iterations++;
          let processedThisIteration = 0;
          
          console.log(`--- Iteration ${iterations} ---`);
          
          for (const task of sortedTasks) {
            const taskInfo = taskScheduleMap.get(task.object_code);
            
            if (taskInfo.processed) {
              console.log(`Task ${task.task_name} already processed - skipping`);
              continue;
            }
            
            console.log(`Processing task: ${task.task_name} (seq: ${task.sequence})`);
            
            // Get dependency information
            const sequenceInfo = systemData.sequenceData[task.object_code] || {};
            const dependsOn = sequenceInfo.depends_on || [];
            
            console.log(`  Task code: ${task.object_code}`);
            console.log(`  Explicit dependencies: ${dependsOn.length > 0 ? dependsOn.join(', ') : 'None'}`);
            
            // Check if all dependencies are processed
            let canProcess = true;
            let maxPredecessorFinish = new Date(projectStartDateObj);
            
            // Check explicit dependencies
            let hasValidDependencies = false;
            let hasSelectedDependencies = false;
            if (dependsOn.length > 0) {
              console.log(`  Checking explicit dependencies...`);
              for (const depCode of dependsOn) {
                const dependentTask = selectedTasks.find(t => t.object_code === depCode);
                if (dependentTask) {
                  hasSelectedDependencies = true;
                  const depInfo = taskScheduleMap.get(depCode);
                  console.log(`    Dependency ${depCode}: ${depInfo ? (depInfo.processed ? 'processed' : 'not processed') : 'not found'}`);
                  if (!depInfo || !depInfo.processed) {
                    canProcess = false;
                    console.log(`    Cannot process - dependency ${depCode} not ready`);
                    break;
                  } else {
                    // Only set hasValidDependencies = true if dependency is both selected AND processed
                    hasValidDependencies = true;
                    if (depInfo.endDate > maxPredecessorFinish) {
                      maxPredecessorFinish = new Date(depInfo.endDate);
                      console.log(`    Updated maxPredecessorFinish to ${maxPredecessorFinish.toISOString().split('T')[0]}`);
                    }
                  }
                } else {
                  console.log(`    Dependency ${depCode}: not selected - will ignore`);
                }
              }
              
              if (!hasSelectedDependencies) {
                console.log(`  ⚠️  FALLBACK: No dependencies selected - falling back to sequence-based ordering`);
              } else if (!hasValidDependencies) {
                console.log(`  ⚠️  FALLBACK: Dependencies selected but not ready - falling back to sequence-based ordering`);
              } else {
                console.log(`  ✓ Valid dependencies found - using dependency-based scheduling`);
              }
            }
            
            // For tasks without explicit dependencies OR with unselected/unready dependencies, enforce strict sequence-based ordering
            if (dependsOn.length === 0 || !hasSelectedDependencies || !hasValidDependencies) {
              // Reset canProcess for sequence-based scheduling
              canProcess = true;
              maxPredecessorFinish = new Date(projectStartDateObj);
              console.log(`  🔄 SEQUENCE-BASED: Checking sequence-based dependencies for ${task.task_name} (seq: ${task.sequence})...`);
              
              // Task must wait for ALL tasks with lower sequence numbers to complete
              const precedingTasks = selectedTasks.filter(t => 
                t.sequence < task.sequence && t.object_code !== task.object_code
              );
              
              console.log(`  Found ${precedingTasks.length} preceding tasks with lower sequence:`, precedingTasks.map(t => `${t.task_name} (seq: ${t.sequence})`));
              
              let allPredecessorsComplete = true;
              let latestPredecessorFinish = new Date(projectStartDateObj);
              
              for (const precedingTask of precedingTasks) {
                const precedingInfo = taskScheduleMap.get(precedingTask.object_code);
                console.log(`    Preceding task ${precedingTask.task_name} (seq: ${precedingTask.sequence}): ${precedingInfo ? (precedingInfo.processed ? 'processed' : 'not processed') : 'not found'}`);
                if (!precedingInfo || !precedingInfo.processed) {
                  // Cannot process this task yet - must wait for ALL preceding tasks
                  allPredecessorsComplete = false;
                  console.log(`    Cannot process - preceding task ${precedingTask.task_name} not ready`);
                  break;
                }
                if (precedingInfo.endDate > latestPredecessorFinish) {
                  latestPredecessorFinish = new Date(precedingInfo.endDate);
                  console.log(`    Updated latestPredecessorFinish to ${latestPredecessorFinish.toISOString().split('T')[0]}`);
                }
              }
              
              if (!allPredecessorsComplete) {
                canProcess = false;
                console.log(`  Cannot process - not all predecessors complete`);
              } else if (latestPredecessorFinish > maxPredecessorFinish) {
                maxPredecessorFinish = latestPredecessorFinish;
                console.log(`  Updated maxPredecessorFinish to ${latestPredecessorFinish.toISOString().split('T')[0]} from sequence-based dependencies`);
              }
              
              // If this task has sequence 1, it can start immediately
              if (task.sequence === 1) {
                console.log(`  Task has sequence 1 - can start immediately`);
              }
            } else {
              console.log(`  Task has valid explicit dependencies - sequence-based ordering skipped`);
            }
            
            if (canProcess) {
              // Calculate Early Start: max(EF of all predecessors)
              const earlyStart = new Date(maxPredecessorFinish);
              
              // Add buffer day if there are predecessors
              if (maxPredecessorFinish > projectStartDateObj) {
                earlyStart.setDate(earlyStart.getDate() + 1);
                console.log(`  Added 1-day buffer, new start date: ${earlyStart.toISOString().split('T')[0]}`);
              }
              
              // Calculate Early Finish: ES + Duration
              const earlyFinish = new Date(earlyStart);
              earlyFinish.setDate(earlyFinish.getDate() + taskInfo.duration);
              
              // Update task info
              taskInfo.earlyStart = earlyStart;
              taskInfo.earlyFinish = earlyFinish;
              taskInfo.startDate = earlyStart;
              taskInfo.endDate = earlyFinish;
              taskInfo.processed = true;
              
              processedThisIteration++;
              
              console.log(`  ✅ SCHEDULED: ${task.task_name} (seq: ${task.sequence}) - Start: ${earlyStart.toISOString().split('T')[0]}, End: ${earlyFinish.toISOString().split('T')[0]}, Duration: ${taskInfo.duration} days`);
            } else {
              console.log(`  ⏳ WAITING: ${task.task_name} (seq: ${task.sequence}) - dependencies not ready`);
            }
          }
          
          console.log(`Processed ${processedThisIteration} tasks this iteration`);
          
          // If no tasks were processed this iteration, we're done or stuck
          if (processedThisIteration === 0) {
            console.log('No tasks processed this iteration - breaking');
            break;
          }
        }
        
        console.log(`Schedule calculation completed after ${iterations} iterations`);
        
        // Log final status
        const processedCount = Array.from(taskScheduleMap.values()).filter(info => info.processed).length;
        const totalCount = taskScheduleMap.size;
        console.log(`Final status: ${processedCount}/${totalCount} tasks processed`);
        
        // Create final schedule data
        const scheduleData = sortedTasks.map((task) => {
          const taskInfo = taskScheduleMap.get(task.object_code);
          const sequenceInfo = systemData.sequenceData[task.object_code] || {};
          const dependsOn = sequenceInfo.depends_on || [];
          
          // Create dependency list for the schedule (only include selected tasks)
          const taskDependencies = dependsOn
            .map((depCode: string) => selectedTasks.find(t => t.object_code === depCode))
            .filter(Boolean)
            .map((depTask: any) => depTask.task_code);
          
          return {
            id: task.task_code,
            name: task.task_name,
            start_date: taskInfo.startDate ? taskInfo.startDate.toISOString().split('T')[0] : projectStartDateObj.toISOString().split('T')[0],
            end_date: taskInfo.endDate ? taskInfo.endDate.toISOString().split('T')[0] : projectStartDateObj.toISOString().split('T')[0],
            duration: taskInfo.duration,
            phase: 'BIM',
            object_code: task.object_code,
            object_count: task.total_objects,
            sequence: task.sequence,
            dependencies: taskDependencies
          };
        });
        
        // Sort by actual start date for logical display
        scheduleData.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
        
        console.log('=== Final Schedule ===');
        scheduleData.forEach(task => {
          console.log(`${task.name} (seq: ${task.sequence}): ${task.start_date} to ${task.end_date} (${task.duration} days)`);
        });
        
        return scheduleData;
      };
      
      const scheduleData = calculateTaskSchedule();
      
      console.log('Generated schedule:', scheduleData);
      
      // Add construction phase tasks to the schedule if available
      // Ensure all BIM tasks have proper phase property first
      const bimTasksWithPhase: Task[] = scheduleData.map(task => ({
        ...task,
        phase: task.phase || 'BIM'
      }));
      
      let finalSchedule: Task[] = bimTasksWithPhase;
      
      if (constructionPhaseData) {
        console.log('Adding construction phase tasks to schedule...');
        
        // Generate construction phase tasks from the construction phase data
        const projectStartDateObj = projectStartDate ? new Date(projectStartDate) : new Date();
        const constructionTasks = generateConstructionPhaseTasks(constructionPhaseData, projectStartDateObj);
        
        finalSchedule = [...constructionTasks, ...bimTasksWithPhase];
        
        console.log(`Added ${constructionTasks.length} construction phase tasks`);
      }
      
      if (onScheduleGenerated) {
        onScheduleGenerated(finalSchedule);
      }
      
      setSuccess(`Generated schedule with ${selectedTasks.length} BIM tasks${constructionPhaseData ? ' and construction phases' : ''}`);
      
    } catch (error) {
      setError(`Schedule generation failed: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [potentialTasks, onScheduleGenerated, durationMethod, constructionPhaseData]);

  // Helper function to generate construction phase tasks
  const generateConstructionPhaseTasks = (phaseData: any, startDate: Date): Task[] => {
    const tasks: Task[] = [];
    let currentDate = new Date(startDate);
    let sequenceNumber = 1;
    
    // Site Establishment
    if (phaseData.siteEstablishment?.enabled) {
      tasks.push({
        id: 'site-establishment',
        name: 'Site Establishment',
        start_date: currentDate.toISOString().split('T')[0],
        end_date: new Date(currentDate.getTime() + (phaseData.siteEstablishment.mobiliseDuration || 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: phaseData.siteEstablishment.mobiliseDuration || 5,
        phase: 'Construction Phase',
        sequence: sequenceNumber++,
        object_code: 'SITE-EST',
        object_count: 1,
        dependencies: []
      });
      currentDate = new Date(currentDate.getTime() + (phaseData.siteEstablishment.mobiliseDuration || 5) * 24 * 60 * 60 * 1000);
    }
    
    // Demolition
    if (phaseData.demolition?.enabled) {
      tasks.push({
        id: 'demolition',
        name: 'Demolition',
        start_date: currentDate.toISOString().split('T')[0],
        end_date: new Date(currentDate.getTime() + (phaseData.demolition.duration || 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: phaseData.demolition.duration || 10,
        phase: 'Construction Phase',
        sequence: sequenceNumber++,
        object_code: 'DEMO',
        object_count: 1,
        dependencies: phaseData.siteEstablishment?.enabled ? ['site-establishment'] : []
      });
      currentDate = new Date(currentDate.getTime() + (phaseData.demolition.duration || 10) * 24 * 60 * 60 * 1000);
    }
    
    // Excavation
    if (phaseData.excavation?.enabled) {
      const excavationDuration = phaseData.excavation.volume && phaseData.excavation.dailyRate ? 
        Math.ceil(phaseData.excavation.volume / phaseData.excavation.dailyRate) : 5;
      
      tasks.push({
        id: 'excavation',
        name: 'Excavation',
        start_date: currentDate.toISOString().split('T')[0],
        end_date: new Date(currentDate.getTime() + excavationDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: excavationDuration,
        phase: 'Construction Phase',
        sequence: sequenceNumber++,
        object_code: 'EXCAV',
        object_count: 1,
        dependencies: []
      });
      currentDate = new Date(currentDate.getTime() + excavationDuration * 24 * 60 * 60 * 1000);
    }
    
    // Structure
    if (phaseData.structure?.enabled) {
      tasks.push({
        id: 'structure',
        name: 'Structure',
        start_date: currentDate.toISOString().split('T')[0],
        end_date: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 30,
        phase: 'Construction Phase',
        sequence: sequenceNumber++,
        object_code: 'STRUCT',
        object_count: 1,
        dependencies: []
      });
      currentDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    
    // Superstructure
    if (phaseData.superstructure?.enabled) {
      const superstructureDuration = (phaseData.superstructure.floorsAboveGround || 1) * 7; // 7 days per floor
      tasks.push({
        id: 'superstructure',
        name: 'Superstructure',
        start_date: currentDate.toISOString().split('T')[0],
        end_date: new Date(currentDate.getTime() + superstructureDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: superstructureDuration,
        phase: 'Construction Phase',
        sequence: sequenceNumber++,
        object_code: 'SUPER',
        object_count: 1,
        dependencies: []
      });
      currentDate = new Date(currentDate.getTime() + superstructureDuration * 24 * 60 * 60 * 1000);
    }
    
    // Facade
    if (phaseData.facade?.enabled) {
      const facadeDuration = (phaseData.facade.durationPerLevel || 5) * (phaseData.superstructure?.floorsAboveGround || 1);
      tasks.push({
        id: 'facade',
        name: 'Facade',
        start_date: currentDate.toISOString().split('T')[0],
        end_date: new Date(currentDate.getTime() + facadeDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: facadeDuration,
        phase: 'Construction Phase',
        sequence: sequenceNumber++,
        object_code: 'FACADE',
        object_count: 1,
        dependencies: []
      });
      currentDate = new Date(currentDate.getTime() + facadeDuration * 24 * 60 * 60 * 1000);
    }
    
    // Fitout
    if (phaseData.fitout?.enabled) {
      const fitoutDuration = (phaseData.fitout.baseDuration || 20) * (phaseData.superstructure?.floorsAboveGround || 1);
      tasks.push({
        id: 'fitout',
        name: 'Fitout',
        start_date: currentDate.toISOString().split('T')[0],
        end_date: new Date(currentDate.getTime() + fitoutDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: fitoutDuration,
        phase: 'Construction Phase',
        sequence: sequenceNumber++,
        object_code: 'FITOUT',
        object_count: 1,
        dependencies: []
      });
    }
    
    // Add other construction phases as needed...
    
    return tasks;
  };

  const selectedCount = potentialTasks.filter(task => task.selected).length;
  const canAnalyze = systemData.loaded && unmappedLabels.length > 0;

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, my: 4 }}>
        <Typography variant="h4" gutterBottom>
          BIM-Based Schedule Planner
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 3, color: 'text.secondary' }}>
          Upload your BIM object files and create interactive construction schedules
        </Typography>

        {/* System Data Status */}
        <Box sx={{ mb: 3 }}>
          <Alert severity={systemData.loaded ? "success" : "info"} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {systemData.loaded ? <CheckCircle /> : <CircularProgress size={20} />}
              <Typography>
                System Data: {systemData.loaded ? 'Loaded' : 'Loading...'} 
                {systemData.loaded && (
                  <span> • {Object.keys(systemData.labelSchedule).length} label mappings • {Object.keys(systemData.sequenceData).length} sequence definitions</span>
                )}
              </Typography>
            </Box>
          </Alert>
        </Box>

        {/* BIM Object Data Status */}
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography>
              BIM Object Data: Loaded automatically • {mappedObjects.length} mapped objects • {unmappedObjects.length} unmapped objects • {unmappedLabels.length} potential tasks
            </Typography>
          </Alert>
        </Box>

        {/* Volume Data Status */}
        <Box sx={{ mb: 3 }}>
          <Alert severity={Object.keys(volumeData).length > 0 ? "success" : "info"} sx={{ mb: 2 }}>
            <Typography>
              Volume Data: {Object.keys(volumeData).length > 0 ? 'Loaded' : 'Loading...'} • {Object.keys(volumeData).length} object types with volume information
            </Typography>
            {Object.keys(volumeData).length > 0 && (
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Source: Export_attributes_Rhystadt_100625_fast.json (automatically loaded)
              </Typography>
            )}
          </Alert>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Analyze Data Button with Generation Mode Selector */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={analyzeData}
              disabled={loading || !canAnalyze}
              startIcon={loading ? <CircularProgress size={20} /> : <Analytics />}
            >
              {loading ? 'Analyzing...' : 'Analyze Data'}
            </Button>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Generation Mode</InputLabel>
              <Select
                value={generationMode}
                onChange={(e) => setGenerationMode(e.target.value as 'automatic' | 'manual')}
                label="Generation Mode"
              >
                <MenuItem value="automatic">Automatic</MenuItem>
                <MenuItem value="manual">Manual</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {generationMode === 'automatic' && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Automatic generation uses volume distribution from BIM data for accurate duration calculations
            </Typography>
          )}
          
          {!canAnalyze && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {!systemData.loaded ? 'Waiting for system data to load...' : 'No unmapped labels available for analysis'}
            </Typography>
          )}
        </Box>

        {/* Potential Tasks Section */}
        {dataAnalyzed && (
          <>
            <Typography variant="h6" gutterBottom>
              Potential Tasks from Unmapped Objects
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {generationMode === 'automatic' ? 
                `All tasks automatically selected (${selectedCount} of ${potentialTasks.length})` :
                `Select tasks to include in your schedule (${selectedCount} of ${potentialTasks.length} selected)`
              }
            </Typography>

            {/* Floor Comparison */}
            <Box sx={{ mb: 3 }}>
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Floor Analysis
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>BIM Data:</strong> {floorData.floor_count_bim} floors
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {floorData.bim_floors.length > 0 ? floorData.bim_floors.join(', ') : 'No floors detected'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Schedule Data:</strong> {floorData.floor_count_schedule} floors
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {floorData.schedule_floors.length > 0 ? floorData.schedule_floors.join(', ') : 'No floors detected'}
                    </Typography>
                  </Grid>
                </Grid>
                {floorData.floor_count_bim !== floorData.floor_count_schedule && (
                  <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                    ⚠️ Floor count mismatch detected. Review floor mappings.
                  </Typography>
                )}
              </Alert>
            </Box>

            {/* Duration Method Selection */}
            <Box sx={{ mb: 3 }}>
              <FormControl component="fieldset" variant="standard">
                <FormLabel component="legend">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Build />
                    Duration Calculation Method
                  </Box>
                </FormLabel>
                <RadioGroup
                  row
                  value={durationMethod}
                  onChange={(e) => setDurationMethod(e.target.value as 'automatic' | 'manual')}
                  sx={{ mt: 1 }}
                >
                  <FormControlLabel 
                    value="automatic" 
                    control={<Radio />} 
                    label="Automatic (Volume/Area based)" 
                  />
                  <FormControlLabel 
                    value="manual" 
                    control={<Radio />} 
                    label="Manual Override" 
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* Volume Based Settings (only if automatic) */}
            {durationMethod === 'automatic' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calculate />
                    Volume-Based Duration Settings
                  </Box>
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Objects per Day"
                      type="number"
                      value={volumeBasedSettings.objectsPerDay}
                      onChange={(e) => setVolumeBasedSettings(prev => ({ 
                        ...prev, 
                        objectsPerDay: Math.max(1, parseInt(e.target.value, 10) || 10) 
                      }))}
                      fullWidth
                      size="small"
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Volume Multiplier"
                      type="number"
                      value={volumeBasedSettings.volumeMultiplier}
                      onChange={(e) => setVolumeBasedSettings(prev => ({ 
                        ...prev, 
                        volumeMultiplier: Math.max(0.1, parseFloat(e.target.value) || 1.0) 
                      }))}
                      fullWidth
                      size="small"
                      InputProps={{ inputProps: { min: 0.1, step: 0.1 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Area Multiplier"
                      type="number"
                      value={volumeBasedSettings.areaMultiplier}
                      onChange={(e) => setVolumeBasedSettings(prev => ({ 
                        ...prev, 
                        areaMultiplier: Math.max(0.1, parseFloat(e.target.value) || 0.5) 
                      }))}
                      fullWidth
                      size="small"
                      InputProps={{ inputProps: { min: 0.1, step: 0.1 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Minimum Days"
                      type="number"
                      value={volumeBasedSettings.minimumDays}
                      onChange={(e) => setVolumeBasedSettings(prev => ({ 
                        ...prev, 
                        minimumDays: Math.max(1, parseInt(e.target.value, 10) || 1) 
                      }))}
                      fullWidth
                      size="small"
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Duration = max(volume × volume_multiplier, area × area_multiplier, objects ÷ objects_per_day, minimum_days)
                </Typography>
              </Box>
            )}
            
            <List>
              {potentialTasks.map((task) => (
                <ListItem key={task.task_code} divider sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={task.selected}
                          onChange={() => toggleTaskSelection(task.task_code)}
                          disabled={generationMode === 'automatic'}
                        />
                      }
                      label=""
                    />
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {task.task_name}
                          </Typography>
                          <Chip 
                            label={task.object_code} 
                            size="small" 
                            variant="outlined" 
                          />
                          <Chip 
                            label={`Seq: ${task.sequence}`} 
                            size="small" 
                            color="primary" 
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {task.object_description} • {task.total_objects} objects
                            {task.volume_data && ` • Vol: ${(task.volume_data.total_volume || task.volume_data.volume)?.toFixed(1)}m³ • Area: ${(task.volume_data.total_area || task.volume_data.area)?.toFixed(1)}m²`}
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                  
                  {/* Duration Controls */}
                  <Box sx={{ ml: 5, mt: 1, mb: 1 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">
                          Estimated Duration: <strong>{task.estimated_duration} days</strong>
                        </Typography>
                      </Grid>
                      {durationMethod === 'manual' && (
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="Manual Duration (days)"
                            type="number"
                            value={task.manual_duration || task.estimated_duration}
                            onChange={(e) => updateTaskDuration(task.task_code, parseInt(e.target.value, 10) || 1)}
                            size="small"
                            InputProps={{ inputProps: { min: 1 } }}
                            disabled={!task.selected}
                          />
                        </Grid>
                      )}
                      {task.volume_data && (
                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color="text.secondary">
                            Calc: Vol({(task.volume_data.total_volume || task.volume_data.volume).toFixed(1)}) + 
                            Area({(task.volume_data.total_area || task.volume_data.area).toFixed(1)}) + 
                            Obj({(task.total_objects / volumeBasedSettings.objectsPerDay).toFixed(1)})
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 3 }} />

            {/* Generate Schedule Button */}
            <Box>
              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={generateSchedule}
                disabled={loading || selectedCount === 0}
                startIcon={loading ? <CircularProgress size={20} /> : <Schedule />}
              >
                {loading ? 'Generating...' : `Generate Schedule (${selectedCount} tasks)`}
              </Button>
              {selectedCount > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Total estimated duration: {potentialTasks
                    .filter(task => task.selected)
                    .reduce((sum, task) => sum + (durationMethod === 'manual' ? (task.manual_duration || task.estimated_duration) : task.estimated_duration), 0)} days
                </Typography>
              )}
            </Box>
          </>
        )}

        {/* Status Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </Paper>
    </Container>
  );
}; 