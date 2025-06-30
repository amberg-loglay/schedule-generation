# Construction Schedule Planner

A modern web interface for generating and visualizing construction project schedules. This tool combines BIM-based scheduling with traditional construction phase planning to create comprehensive project timelines.

## Features

- Interactive UI for configuring construction phases:
  - Site Establishment
  - Demolition
  - Excavation
  - Structure
  - Superstructure
  - Facade
  - Fitout
- Integration with BIM object schedules
- Dynamic Gantt chart visualization
- Task dependencies and relationships
- Phase overlap configuration
- Resource-based duration calculations

## Prerequisites

- Node.js 14.x or higher
- Python 3.7 or higher
- BIM data processing scripts (create_schedule_from_objects.py)
- Construction schedule generator (create_construction_schedule.py)

## Setup

1. Clone the repository
2. Navigate to the project directory
3. Run the setup script:
   ```bash
   ./setup.sh
   ```
   This will:
   - Install Node.js dependencies
   - Create necessary configuration files
   - Set up the development environment

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Configure Project Details:
   - Set project start date
   - Select building type
   - Enable/disable construction phases

2. For each enabled phase, configure:
   - Duration parameters
   - Resource requirements
   - Dependencies and overlaps
   - Phase-specific settings

3. Click "Generate Schedule" to:
   - Create the construction schedule
   - Process BIM object data
   - Combine both schedules
   - Generate the Gantt chart visualization

## Integration

The schedule planner can be integrated into existing sites as a new page:

1. Copy the components:
   - `SchedulePlanner.tsx`
   - `GanttChart.tsx`
   - `types/schedule.ts`

2. Add the API endpoint:
   - `pages/api/generate-schedule.ts`

3. Install dependencies:
   ```json
   {
     "@emotion/react": "^11.11.0",
     "@emotion/styled": "^11.11.0",
     "@mui/material": "^5.13.0"
   }
   ```

4. Import and use the SchedulePlanner component:
   ```tsx
   import { SchedulePlanner } from './components/SchedulePlanner';

   export default function YourPage() {
     return <SchedulePlanner />;
   }
   ```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 