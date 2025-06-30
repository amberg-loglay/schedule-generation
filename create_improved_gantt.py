import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime, timedelta
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import sys

def load_schedule_data():
    """Load the detailed schedule data"""
    try:
        with open('detailed_schedule_with_child_tasks.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Error: detailed_schedule_with_child_tasks.json not found")
        return None

def load_label_mapping():
    """Load the object code to label name mapping"""
    try:
        with open('../label_object.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: label_object.json not found, using codes as labels")
        return {}

def parse_german_date(date_str):
    """Parse German date format like 'Mon 01.09.25' to datetime"""
    if not date_str or date_str == 'null':
        return None
    
    try:
        # Remove day name if present
        date_part = date_str.split(' ')[-1]  # Get 'DD.MM.YY'
        day, month, year = date_part.split('.')
        # Assume 20XX for years
        full_year = f"20{year}"
        return datetime.strptime(f"{day}.{month}.{full_year}", "%d.%m.%Y")
    except Exception as e:
        print(f"Warning: Could not parse date: {date_str} - {e}")
        return None

def create_interactive_scrollable_gantt(schedule_data, label_mapping, max_tasks=40):
    """Create an interactive, scrollable Gantt chart with proper labels"""
    print("Creating interactive scrollable Gantt chart...")
    
    # Filter for child tasks with valid dates
    child_tasks = [task for task in schedule_data if task.get('is_child', False)]
    
    valid_tasks = []
    for task in child_tasks:
        start_date = parse_german_date(task.get('start_date'))
        end_date = parse_german_date(task.get('end_date'))
        
        if start_date and end_date:
            task['parsed_start'] = start_date
            task['parsed_end'] = end_date
            task['duration_calc'] = (end_date - start_date).days + 1
            valid_tasks.append(task)
    
    print(f"Found {len(valid_tasks)} tasks with valid dates")
    
    # Sort by sequence and take sample
    valid_tasks.sort(key=lambda x: (x.get('sequence', 999), x.get('task_id', '')))
    sample_tasks = valid_tasks[:max_tasks]
    
    if not sample_tasks:
        print("No valid tasks found for Gantt chart")
        return
    
    # Prepare data for Plotly
    gantt_data = []
    
    for i, task in enumerate(sample_tasks):
        # Create readable task name
        task_id = task.get('task_id', '')
        object_desc = task.get('object_description', '')
        floor = task.get('floor', 'N/A')
        object_count = task.get('object_count', 1)
        
        # Truncate long descriptions
        short_desc = object_desc[:30] + "..." if len(object_desc) > 30 else object_desc
        task_name = f"{task_id}: {short_desc}"
        
        # Get object type for coloring
        obj_code = task.get('object_code', '')
        obj_type = obj_code.split('.')[0] if '.' in obj_code else obj_code
        
        gantt_data.append({
            'Task': task_name,
            'Start': task['parsed_start'],
            'Finish': task['parsed_end'],
            'Resource': obj_type,  # For coloring
            'Floor': floor,
            'Object_Code': obj_code,
            'Object_Description': object_desc,
            'Object_Count': object_count,
            'Duration': task['duration_calc'],
            'Y_Position': i
        })
    
    # Convert to DataFrame
    df = pd.DataFrame(gantt_data)
    
    # Create the Plotly figure
    fig = go.Figure()
    
    # Color mapping
    unique_types = df['Resource'].unique()
    colors = px.colors.qualitative.Set3[:len(unique_types)]
    color_map = dict(zip(unique_types, colors))
    
    # Add traces for each task
    for _, row in df.iterrows():
        fig.add_trace(go.Scatter(
            x=[row['Start'], row['Finish']],
            y=[row['Y_Position'], row['Y_Position']],
            mode='lines',
            line=dict(
                color=color_map.get(row['Resource'], 'gray'),
                width=25  # Much thicker lines
            ),
            name=row['Resource'],
            showlegend=False,
            hovertemplate=(
                f"<b>{row['Task']}</b><br>" +
                f"Floor: {row['Floor']}<br>" +
                f"Object: {row['Object_Code']}<br>" +
                f"Description: {row['Object_Description']}<br>" +
                f"Count: {row['Object_Count']} objects<br>" +
                f"Duration: {row['Duration']} days<br>" +
                f"Start: {row['Start'].strftime('%d.%m.%Y')}<br>" +
                f"End: {row['Finish'].strftime('%d.%m.%Y')}<br>" +
                "<extra></extra>"
            )
        ))
        
        # Add text labels on the bars - use label names instead of codes
        mid_date = row['Start'] + (row['Finish'] - row['Start']) / 2
        obj_code = row['Object_Code']
        label_name = label_mapping.get(obj_code, obj_code)  # Use label name or fallback to code
        
        fig.add_annotation(
            x=mid_date,
            y=row['Y_Position'],
            text=f"{label_name[:20]} ({row['Object_Count']})",
            showarrow=False,
            font=dict(size=10, color='black'),
            bgcolor='rgba(255,255,255,0.8)',
            bordercolor='black',
            borderwidth=1
        )
    
    # Create legend manually
    legend_traces = []
    for obj_type in sorted(unique_types):
        legend_traces.append(
            go.Scatter(
                x=[None], y=[None],
                mode='markers',
                marker=dict(size=15, color=color_map[obj_type]),
                name=obj_type,
                showlegend=True
            )
        )
    
    for trace in legend_traces:
        fig.add_trace(trace)
    
    # Update layout for better visibility and scrolling
    fig.update_layout(
        title={
            'text': "Construction Schedule - BIM Object Tasks (Scrollable Timeline)",
            'x': 0.5,
            'font': {'size': 20}
        },
        xaxis=dict(
            title="Timeline",
            type='date',
            tickformat='%d.%m.%Y',
            tickangle=45,
            rangeslider=dict(visible=True),  # Enable range slider for scrolling
            rangeselector=dict(
                buttons=list([
                    dict(count=1, label="1m", step="month", stepmode="backward"),
                    dict(count=3, label="3m", step="month", stepmode="backward"),
                    dict(count=6, label="6m", step="month", stepmode="backward"),
                    dict(step="all")
                ])
            )
        ),
        yaxis=dict(
            title="Tasks",
            tickmode='array',
            tickvals=list(range(len(df))),
            ticktext=[f"{row['Floor']} | {label_mapping.get(row['Object_Code'], row['Object_Code'])[:25]}" for _, row in df.iterrows()],
            tickfont=dict(size=9),  # Smaller font size
            automargin=True  # Auto-adjust margins for long labels
        ),
        height=max(800, len(df) * 30),  # Taller chart for more tasks
        width=1400,  # Wider chart
        hovermode='closest',
        legend=dict(
            orientation="v",
            yanchor="top",
            y=1,
            xanchor="left",
            x=1.02
        ),
        margin=dict(l=300, r=150, t=80, b=100)  # More space for labels
    )
    
    # Save as HTML
    fig.write_html('interactive_scrollable_gantt.html')
    print(f"Interactive Gantt chart saved as: interactive_scrollable_gantt.html")
    
    return fig

def create_matplotlib_gantt_improved(schedule_data, label_mapping, max_tasks=30):
    """Create an improved matplotlib Gantt chart with better visibility"""
    print("Creating improved matplotlib Gantt chart...")
    
    # Filter for child tasks with valid dates
    child_tasks = [task for task in schedule_data if task.get('is_child', False)]
    
    valid_tasks = []
    for task in child_tasks:
        start_date = parse_german_date(task.get('start_date'))
        end_date = parse_german_date(task.get('end_date'))
        
        if start_date and end_date:
            task['parsed_start'] = start_date
            task['parsed_end'] = end_date
            task['duration_calc'] = (end_date - start_date).days + 1
            valid_tasks.append(task)
    
    # Sort by sequence and take sample
    valid_tasks.sort(key=lambda x: (x.get('sequence', 999), x.get('task_id', '')))
    sample_tasks = valid_tasks[:max_tasks]
    
    if not sample_tasks:
        print("No valid tasks found for Gantt chart")
        return
    
    # Set up the plot with large size
    fig, ax = plt.subplots(figsize=(24, max(16, len(sample_tasks) * 1.0)))
    
    # Color mapping by object type
    object_types = list(set([task.get('object_code', '').split('.')[0] for task in sample_tasks]))
    colors = plt.cm.Set3(np.linspace(0, 1, len(object_types)))
    color_map = dict(zip(object_types, colors))
    
    # Create the Gantt bars
    y_positions = range(len(sample_tasks))
    bar_height = 0.8  # Much thicker bars
    
    for i, task in enumerate(sample_tasks):
        start_date = task['parsed_start']
        end_date = task['parsed_end']
        duration = task['duration_calc']
        
        # Get color based on object type
        obj_type = task.get('object_code', '').split('.')[0]
        color = color_map.get(obj_type, 'gray')
        
        # Create the bar
        ax.barh(i, duration, left=start_date, height=bar_height, 
                color=color, alpha=0.8, edgecolor='black', linewidth=1)
        
        # Add task info on the bar
        task_id = task.get('task_id', '')
        object_code = task.get('object_code', '')
        object_count = task.get('object_count', 1)
        
        # Text on the bar - use label name instead of code
        label_name = label_mapping.get(object_code, object_code)
        bar_text = f"{task_id}: {label_name[:20]} ({object_count})"
        
        # Position text in the middle of the bar
        text_x = start_date + timedelta(days=duration/2)
        
        # Add text with background for readability
        ax.text(text_x, i, bar_text, ha='center', va='center', 
                fontsize=9, fontweight='bold', 
                bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.9))
    
    # Customize the plot
    ax.set_ylim(-0.5, len(sample_tasks) - 0.5)
    ax.set_yticks(y_positions)
    
    # Create detailed y-axis labels with smaller font
    y_labels = []
    for task in sample_tasks:
        floor = task.get('floor', 'N/A')
        object_code = task.get('object_code', '')
        label_name = label_mapping.get(object_code, object_code)[:35]  # Use label name
        task_id = task.get('task_id', '')
        label = f"{task_id} | {floor} | {label_name}"
        y_labels.append(label)
    
    ax.set_yticklabels(y_labels, fontsize=8)  # Smaller font
    ax.invert_yaxis()  # Top to bottom
    
    # Format x-axis (dates) for better scrolling
    ax.xaxis.set_major_locator(mdates.WeekdayLocator(interval=2))
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%d.%m'))
    ax.xaxis.set_minor_locator(mdates.DayLocator())
    
    # Rotate date labels
    plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right', fontsize=10)
    
    # Add grid
    ax.grid(True, alpha=0.3, axis='x')
    ax.grid(True, alpha=0.1, axis='y')
    
    # Labels and title
    ax.set_xlabel('Timeline (Weeks)', fontsize=14, fontweight='bold')
    ax.set_ylabel('Tasks (ID | Floor | Description)', fontsize=14, fontweight='bold')
    ax.set_title('Construction Schedule - BIM Object Tasks (Detailed View)', 
                fontsize=18, fontweight='bold', pad=20)
    
    # Add legend for object types
    legend_elements = [plt.Rectangle((0,0),1,1, facecolor=color_map[obj_type], alpha=0.8, label=obj_type) 
                      for obj_type in sorted(object_types)]
    ax.legend(handles=legend_elements, loc='upper left', bbox_to_anchor=(1.02, 1), fontsize=10)
    
    # Adjust layout to prevent cutting
    plt.subplots_adjust(left=0.25, right=0.85, top=0.95, bottom=0.15)
    
    # Save the plot
    plt.savefig('improved_gantt_chart.png', dpi=300, bbox_inches='tight')
    plt.savefig('improved_gantt_chart.pdf', bbox_inches='tight')
    
    print(f"Improved Gantt chart saved as:")
    print(f"   • improved_gantt_chart.png (high resolution)")
    print(f"   • improved_gantt_chart.pdf (vector format)")
    
    plt.close()
    return fig

def create_timeline_focused_charts(schedule_data, label_mapping):
    """Create multiple charts focused on different time periods"""
    print("\nCreating timeline-focused charts...")
    
    # Filter for child tasks with valid dates
    child_tasks = [task for task in schedule_data if task.get('is_child', False)]
    
    valid_tasks = []
    for task in child_tasks:
        start_date = parse_german_date(task.get('start_date'))
        end_date = parse_german_date(task.get('end_date'))
        
        if start_date and end_date:
            task['parsed_start'] = start_date
            task['parsed_end'] = end_date
            task['duration_calc'] = (end_date - start_date).days + 1
            valid_tasks.append(task)
    
    if not valid_tasks:
        return
    
    # Sort by start date
    valid_tasks.sort(key=lambda x: x['parsed_start'])
    
    # Find date range
    min_date = min(task['parsed_start'] for task in valid_tasks)
    max_date = max(task['parsed_end'] for task in valid_tasks)
    
    # Create 3-month periods
    current_date = min_date
    period_num = 1
    
    while current_date < max_date:
        period_end = current_date + timedelta(days=90)  # 3 months
        
        # Filter tasks for this period
        period_tasks = [
            task for task in valid_tasks 
            if (task['parsed_start'] <= period_end and task['parsed_end'] >= current_date)
        ]
        
        if len(period_tasks) < 3:
            current_date = period_end
            continue
        
        # Take up to 20 tasks for this period
        period_tasks = period_tasks[:20]
        
        # Create chart for this period
        fig, ax = plt.subplots(figsize=(18, max(12, len(period_tasks) * 0.8)))
        
        # Color mapping
        object_types = list(set([task.get('object_code', '').split('.')[0] for task in period_tasks]))
        colors = plt.cm.Set2(np.linspace(0, 1, len(object_types)))
        color_map = dict(zip(object_types, colors))
        
        y_positions = range(len(period_tasks))
        bar_height = 0.7
        
        for i, task in enumerate(period_tasks):
            start_date = max(task['parsed_start'], current_date)
            end_date = min(task['parsed_end'], period_end)
            duration = (end_date - start_date).days + 1
            
            obj_type = task.get('object_code', '').split('.')[0]
            color = color_map.get(obj_type, 'gray')
            
            # Create bar
            ax.barh(i, duration, left=start_date, height=bar_height, 
                    color=color, alpha=0.8, edgecolor='black', linewidth=0.5)
            
            # Add text
            task_id = task.get('task_id', '')
            object_code = task.get('object_code', '')
            object_count = task.get('object_count', 1)
            
            # Use label name instead of description
            label_name = label_mapping.get(object_code, object_code)
            bar_text = f"{task_id}: {label_name[:15]} ({object_count})"
            text_x = start_date + timedelta(days=duration/2)
            
            ax.text(text_x, i, bar_text, ha='center', va='center', 
                    fontsize=9, fontweight='bold',
                    bbox=dict(boxstyle='round,pad=0.2', facecolor='white', alpha=0.9))
        
        # Customize plot
        ax.set_ylim(-0.5, len(period_tasks) - 0.5)
        ax.set_yticks(y_positions)
        
        y_labels = [f"{task.get('task_id', '')} | {task.get('floor', 'N/A')} | {label_mapping.get(task.get('object_code', ''), task.get('object_code', ''))[:25]}" 
                   for task in period_tasks]
        ax.set_yticklabels(y_labels, fontsize=8)
        ax.invert_yaxis()
        
        # Format dates for this period
        ax.set_xlim(current_date, period_end)
        ax.xaxis.set_major_locator(mdates.WeekdayLocator())
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%d.%m'))
        plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')
        
        ax.grid(True, alpha=0.3, axis='x')
        ax.set_xlabel('Timeline (Days)', fontsize=12, fontweight='bold')
        ax.set_ylabel('Tasks', fontsize=12, fontweight='bold')
        ax.set_title(f'Construction Schedule - Period {period_num} ({current_date.strftime("%d.%m.%Y")} - {period_end.strftime("%d.%m.%Y")})', 
                    fontsize=14, fontweight='bold')
        
        plt.tight_layout()
        
        # Save
        filename = f'gantt_period_{period_num}.png'
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        print(f"   • {filename}")
        
        plt.close()
        
        current_date = period_end
        period_num += 1
        
        if period_num > 6:  # Limit to 6 periods
            break

def main():
    # Check if parameters were passed
    if len(sys.argv) < 2:
        print("Error: No parameters provided")
        sys.exit(1)
    
    try:
        # Parse JSON parameters from command line
        schedule_data = json.loads(sys.argv[1])
        print(f"Loaded {len(schedule_data)} tasks from command line input")
        
        # Load label mapping
        print("Loading label mapping...")
        label_mapping = load_label_mapping()
        print(f"Loaded {len(label_mapping)} label mappings")
        
        # Create interactive scrollable Gantt chart
        create_interactive_scrollable_gantt(schedule_data, label_mapping, max_tasks=35)
        
        # Create improved matplotlib chart
        create_matplotlib_gantt_improved(schedule_data, label_mapping, max_tasks=25)
        
        # Create timeline-focused charts
        create_timeline_focused_charts(schedule_data, label_mapping)
        
        print(f"\n{'='*60}")
        print("IMPROVED GANTT CHARTS CREATED")
        print("="*60)
        print("Files created:")
        print("   • interactive_scrollable_gantt.html - Interactive chart with timeline scrolling")
        print("   • improved_gantt_chart.png - High-resolution static chart")
        print("   • improved_gantt_chart.pdf - Vector format")
        print("   • gantt_period_*.png - Timeline-focused period charts")
        print("\nKey improvements:")
        print("   • Smaller font sizes for better fit")
        print("   • Object descriptions instead of codes")
        print("   • Scrollable timeline in interactive version")
        print("   • Larger, more visible task bars")
        print("   • Better label positioning to prevent cutting")
        
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON parameters: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 