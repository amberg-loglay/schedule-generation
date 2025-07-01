import json
from datetime import datetime, timedelta
import pandas as pd
import os

def load_label_sequences():
    """Load the label sequence mapping file"""
    try:
        # Try local file first, then fallback to relative path
        if os.path.exists('label_object_sequenced.json'):
            with open('label_object_sequenced.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            with open('../label_object_sequenced.json', 'r', encoding='utf-8') as f:
                return json.load(f)
    except FileNotFoundError:
        print("Error: label_object_sequenced.json not found")
        return None

def load_classification_results():
    """Load the classification results file"""
    try:
        # Try multiple possible locations for the classification file
        possible_paths = [
            'classification_results_bim_gemini_20250612_095607.json',
            '../classification_results_bim_gemini_20250612_095607.json',
            '../input-output/classification_results_bim_gemini_20250612_095607.json'
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        
        print("Error: classification_results_bim_gemini_20250612_095607.json not found in any expected location")
        return None
    except Exception as e:
        print(f"Error loading classification results: {e}")
        return None

def create_schedule():
    """Create a schedule based on object codes and sequences"""
    print("Loading data files...")
    
    # Load the sequence mapping
    label_sequences = load_label_sequences()
    if not label_sequences:
        return
    
    # Load the classification results
    classification_results = load_classification_results()
    if not classification_results:
        return
    
    print(f"Found {len(label_sequences)} sequence mappings")
    print(f"Found {len(classification_results)} classified objects")
    
    # Create a mapping of codes to their full information
    code_mapping = {}
    for code, info in label_sequences.items():
        code_mapping[code] = {
            'description': info['description'],
            'sequence': info['sequence']
        }
    
    # Collect all unique object codes from classification results
    unique_codes = set()
    for result in classification_results:
        if 'label' in result:
            unique_codes.add(result['label'])
    
    print(f"Found {len(unique_codes)} unique object codes")
    
    # Create schedule tasks
    schedule_tasks = []
    base_date = datetime(2024, 1, 1)  # Starting date
    days_per_sequence = 7  # Each sequence number represents a week
    
    # Sort codes by their sequence number
    sorted_codes = sorted(unique_codes, 
                         key=lambda x: code_mapping.get(x, {}).get('sequence', 999))
    
    for code in sorted_codes:
        if code in code_mapping:
            sequence = code_mapping[code]['sequence']
            description = code_mapping[code]['description']
            
            # Calculate start and end dates based on sequence
            start_date = base_date + timedelta(days=(sequence - 1) * days_per_sequence)
            end_date = start_date + timedelta(days=days_per_sequence - 1)
            
            # Count objects with this code
            object_count = sum(1 for result in classification_results 
                             if result.get('label') == code)
            
            schedule_tasks.append({
                'task_id': code,
                'object_description': description,
                'object_code': code,
                'floor': 'N/A',
                'sequence': sequence,
                'start_date': start_date.strftime('%a %d.%m.%y'),
                'end_date': end_date.strftime('%a %d.%m.%y'),
                'object_count': object_count,
                'is_child': True
            })
    
    # Sort tasks by sequence
    schedule_tasks.sort(key=lambda x: x['sequence'])
    
    # Save the schedule in the format expected by the Gantt chart script
    output_file = 'detailed_schedule_with_child_tasks.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(schedule_tasks, f, indent=2, ensure_ascii=False)
    
    print(f"\nSchedule generated with {len(schedule_tasks)} tasks")
    print(f"Saved to: {output_file}")
    print(f"This file can now be used by the Gantt chart script!")
    
    # Create a summary DataFrame
    df = pd.DataFrame(schedule_tasks)
    print("\nSchedule Summary:")
    print("=" * 80)
    print(f"Total number of tasks: {len(schedule_tasks)}")
    print(f"Date range: {schedule_tasks[0]['start_date']} to {schedule_tasks[-1]['end_date']}")
    print(f"Total objects: {df['object_count'].sum()}")
    print("\nTasks by sequence:")
    print(df[['task_id', 'object_description', 'sequence', 'object_count', 'start_date', 'end_date']].to_string(index=False))
    
    return schedule_tasks

if __name__ == "__main__":
    create_schedule() 