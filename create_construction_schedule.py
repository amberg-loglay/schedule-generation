import json
from datetime import datetime, timedelta
import pandas as pd
import sys

class ConstructionScheduleGenerator:
    def __init__(self):
        self.schedule_tasks = []
        self.project_start_date = None
        self.building_type = None
        
    def set_project_start_date(self, start_date_str):
        """Set the project start date in YYYY-MM-DD format"""
        try:
            self.project_start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
            return True
        except ValueError:
            print("Error: Invalid date format. Please use YYYY-MM-DD")
            return False
    
    def set_building_type(self, building_type):
        """Set the building type"""
        valid_types = ["Highrise Residential", "Commercial", "Industrial", "Other"]
        if building_type in valid_types:
            self.building_type = building_type
            return True
        print(f"Error: Building type must be one of {valid_types}")
        return False

    def add_site_establishment(self, mobilise_duration=5, perimeter_type=None, 
                             site_sheds_duration=None, site_sheds_overlap=0):
        """Add site establishment phase"""
        if not self.project_start_date:
            print("Error: Please set project start date first")
            return
        
        current_date = self.project_start_date
        
        # Mobilisation task
        if mobilise_duration > 0:
            self.schedule_tasks.append({
                'task_id': 'SE.01',
                'object_description': 'Site Mobilisation',
                'start_date': current_date.strftime('%a %d.%m.%y'),
                'end_date': (current_date + timedelta(days=mobilise_duration-1)).strftime('%a %d.%m.%y'),
                'duration': mobilise_duration,
                'phase': 'Site Establishment',
                'sequence': 1,
                'is_child': True
            })
            current_date += timedelta(days=mobilise_duration)
        
        # Perimeter setup if specified
        if perimeter_type and perimeter_type != 'None':
            perimeter_duration = 3  # Default duration
            self.schedule_tasks.append({
                'task_id': 'SE.02',
                'object_description': f'Perimeter Setup - {perimeter_type}',
                'start_date': current_date.strftime('%a %d.%m.%y'),
                'end_date': (current_date + timedelta(days=perimeter_duration-1)).strftime('%a %d.%m.%y'),
                'duration': perimeter_duration,
                'phase': 'Site Establishment',
                'sequence': 2,
                'is_child': True
            })
            current_date += timedelta(days=perimeter_duration)
        
        # Site sheds setup if duration specified
        if site_sheds_duration and site_sheds_duration > 0:
            start_date = current_date - timedelta(days=site_sheds_overlap) if site_sheds_overlap > 0 else current_date
            self.schedule_tasks.append({
                'task_id': 'SE.03',
                'object_description': 'Site Sheds Setup',
                'start_date': start_date.strftime('%a %d.%m.%y'),
                'end_date': (start_date + timedelta(days=site_sheds_duration-1)).strftime('%a %d.%m.%y'),
                'duration': site_sheds_duration,
                'phase': 'Site Establishment',
                'sequence': 3,
                'is_child': True
            })

    def add_demolition_phase(self, main_demolition_duration=None, scaffolding_required=False,
                           scaffolding_erection_duration=None, scaffolding_dismantle_duration=None):
        """Add demolition phase if required"""
        if not self.project_start_date or not main_demolition_duration:
            return
            
        if not self.schedule_tasks:
            current_date = self.project_start_date
        else:
            current_date = max(task['end_date'] for task in self.schedule_tasks)
            current_date = datetime.strptime(current_date, '%a %d.%m.%y') + timedelta(days=1)
        
        if scaffolding_required and scaffolding_erection_duration:
            self.schedule_tasks.append({
                'task_id': 'DM.01',
                'object_description': 'Scaffolding Erection for Demolition',
                'start_date': current_date.strftime('%a %d.%m.%y'),
                'end_date': (current_date + timedelta(days=scaffolding_erection_duration-1)).strftime('%a %d.%m.%y'),
                'duration': scaffolding_erection_duration,
                'phase': 'Demolition',
                'sequence': len(self.schedule_tasks) + 1,
                'is_child': True
            })
            current_date += timedelta(days=scaffolding_erection_duration)
        
        # Main demolition
        self.schedule_tasks.append({
            'task_id': 'DM.02',
            'object_description': 'Main Demolition Works',
            'start_date': current_date.strftime('%a %d.%m.%y'),
            'end_date': (current_date + timedelta(days=main_demolition_duration-1)).strftime('%a %d.%m.%y'),
            'duration': main_demolition_duration,
            'phase': 'Demolition',
            'sequence': len(self.schedule_tasks) + 1,
            'is_child': True
        })
        current_date += timedelta(days=main_demolition_duration)
        
        if scaffolding_required and scaffolding_dismantle_duration:
            self.schedule_tasks.append({
                'task_id': 'DM.03',
                'object_description': 'Scaffolding Dismantling',
                'start_date': current_date.strftime('%a %d.%m.%y'),
                'end_date': (current_date + timedelta(days=scaffolding_dismantle_duration-1)).strftime('%a %d.%m.%y'),
                'duration': scaffolding_dismantle_duration,
                'phase': 'Demolition',
                'sequence': len(self.schedule_tasks) + 1,
                'is_child': True
            })

    def add_excavation_phase(self, soil_type, volume, daily_rate=None):
        """Add excavation phase"""
        if not volume or volume <= 0:
            return
            
        # Calculate duration based on volume and daily rate
        if not daily_rate or daily_rate <= 0:
            daily_rate = 100  # Default m³/day
        
        # Adjust daily rate based on soil type
        soil_type_factors = {
            "Soft/Loose Soils": 1.0,
            "Medium Soils": 0.8,
            "Hard/Dense Soils": 0.6,
            "Rock": 0.3
        }
        adjusted_rate = daily_rate * soil_type_factors.get(soil_type, 1.0)
        duration = max(1, round(volume / adjusted_rate))
        
        # Get last task end date
        if self.schedule_tasks:
            current_date = max(task['end_date'] for task in self.schedule_tasks)
            current_date = datetime.strptime(current_date, '%a %d.%m.%y') + timedelta(days=1)
        else:
            current_date = self.project_start_date
        
        self.schedule_tasks.append({
            'task_id': 'EX.01',
            'object_description': f'Excavation - {soil_type}',
            'start_date': current_date.strftime('%a %d.%m.%y'),
            'end_date': (current_date + timedelta(days=duration-1)).strftime('%a %d.%m.%y'),
            'duration': duration,
            'phase': 'Excavation',
            'sequence': len(self.schedule_tasks) + 1,
            'is_child': True,
            'additional_info': {
                'volume': volume,
                'soil_type': soil_type,
                'daily_rate': adjusted_rate
            }
        })

    def generate_schedule(self):
        """Generate the construction schedule and return as JSON"""
        if not self.schedule_tasks:
            return []
            
        # Sort tasks by sequence
        self.schedule_tasks.sort(key=lambda x: x['sequence'])
        
        return self.schedule_tasks

def main():
    # Check if parameters were passed
    if len(sys.argv) < 2:
        print("Error: No parameters provided")
        sys.exit(1)
    
    try:
        # Parse JSON parameters from command line
        params = json.loads(sys.argv[1])
        
        # Create generator instance
        generator = ConstructionScheduleGenerator()
        
        # Set project details
        if 'projectStartDate' in params and params['projectStartDate']:
            if not generator.set_project_start_date(params['projectStartDate']):
                sys.exit(1)
        else:
            # Default start date if not provided
            generator.set_project_start_date("2024-01-01")
        
        if 'buildingType' in params:
            generator.set_building_type(params['buildingType'])
        
        # Add site establishment phase
        if 'siteEstablishment' in params and params['siteEstablishment'].get('enabled', False):
            site_est = params['siteEstablishment']
            generator.add_site_establishment(
                mobilise_duration=site_est.get('mobiliseDuration', 5),
                perimeter_type=site_est.get('perimeterType', 'None'),
                site_sheds_duration=site_est.get('siteSheds', {}).get('duration', 0) if site_est.get('siteSheds', {}).get('enabled', False) else None,
                site_sheds_overlap=site_est.get('siteSheds', {}).get('overlap', 0)
            )
        
        # Add demolition phase
        if 'demolition' in params and params['demolition'].get('enabled', False):
            demo = params['demolition']
            generator.add_demolition_phase(
                main_demolition_duration=demo.get('duration', 10),
                scaffolding_required=demo.get('scaffolding', {}).get('enabled', False),
                scaffolding_erection_duration=demo.get('scaffolding', {}).get('erectionDuration', 3),
                scaffolding_dismantle_duration=demo.get('scaffolding', {}).get('dismantleDuration', 2)
            )
        
        # Add excavation phase
        if 'excavation' in params and params['excavation'].get('enabled', False):
            excav = params['excavation']
            generator.add_excavation_phase(
                soil_type=excav.get('soilType', 'Soft/Loose Soils'),
                volume=excav.get('volume', 0),
                daily_rate=excav.get('dailyRate', 100)
            )
        
        # Generate schedule
        schedule = generator.generate_schedule()
        
        # Output JSON to stdout
        print(json.dumps(schedule, indent=2))
        
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON parameters: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 