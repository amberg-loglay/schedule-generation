# Construction Schedule Planner

A Next.js application that combines BIM-based scheduling with construction phase planning.

## Features

### 1. Construction Phases Planner
- Traditional construction phase planning
- Configurable phases: site establishment, demolition, excavation, substructure, structure, superstructure, facade, and fitout
- Interactive parameter configuration
- Gantt chart visualization

### 2. BIM Objects & Tasks Planner ✨ **NEW**
- **Automatic data loading**: BIM data, schedule mappings, and object classifications load automatically
- **Interactive task creation**: Select from potential tasks based on unmapped BIM objects
- **Volume data integration**: Upload Excel files for enhanced duration calculations
- **Sequence-based scheduling**: Tasks are ordered by construction sequence
- **Gantt chart generation**: Visual timeline of selected tasks

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+ (for backend processing)
- Required Python packages: `pandas`, `openpyxl`

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Start the application**:
   ```bash
   npm start
   ```
   
   Or for development:
   ```bash
   npm run dev
   ```

## Usage

### BIM Objects & Tasks Workflow

1. **Open the app** - System data loads automatically
2. **Check status** - Verify that BIM object data is loaded (mapped objects, unmapped objects, potential tasks)
3. **Upload volume data** (optional) - Excel file with object volumes for better duration estimates
4. **Click "Analyze Data"** - System processes unmapped objects and shows potential tasks
5. **Select tasks** - Choose which tasks to include in your schedule
6. **Generate schedule** - Click to create Gantt chart visualization

### File Structure

The app automatically loads these system files from the `public/` directory:
- `label_schedule.json` - Task name mappings
- `schedule_to_object_mapping.json` - Object-to-task mappings  
- `label_object_sequenced.json` - Construction sequence data
- `mapped_objects_simple.json` - Objects already used in schedule
- `unmapped_objects_simple.json` - Available objects for new tasks
- `unmapped_labels_for_schedule.json` - Potential task templates

### Volume Data Format

Upload Excel files with these columns:
- `ObjectCode`/`Code`/`Label` - BIM object code
- `Volume`/`Volumen` - Object volume in m³
- `Area`/`Fläche` - Object area in m²
- `Count`/`Anzahl` - Object count

## API Endpoints

- `POST /api/generate-schedule` - Generates construction phase schedules
- `POST /api/upload-volume-data` - Processes Excel volume data files

## Development

### Project Structure
```
src/
├── components/
│   ├── SchedulePlanner.tsx      # Construction phases planner
│   ├── BIMSchedulePlanner.tsx   # BIM objects & tasks planner
│   └── DHtmlxGanttChart.tsx     # Gantt chart visualization
├── pages/
│   ├── index.tsx                # Main app with tabs
│   └── api/                     # API endpoints
└── types/
    └── schedule.ts              # TypeScript interfaces
```

### Key Components

- **BIMSchedulePlanner**: Main component for BIM-based scheduling
- **Task Analysis**: Processes unmapped objects into potential tasks
- **Interactive Selection**: Checkbox interface for task selection
- **Schedule Generation**: Creates timeline based on construction sequence
- **Gantt Visualization**: DHtmlx Gantt chart integration

## Troubleshooting

### Common Issues

1. **"System data not loaded"**: Wait for automatic loading or check console for errors
2. **"No unmapped labels"**: Ensure `unmapped_labels_for_schedule.json` exists in public/
3. **Excel upload fails**: Check file format and column names
4. **Gantt chart not showing**: Ensure tasks are selected and schedule is generated

### File Dependencies

Make sure these files exist in `public/`:
- All `.json` reference files
- `Biel_general.png` (for dashboard)

## License

This project is private and proprietary. 