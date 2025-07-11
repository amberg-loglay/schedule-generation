import json
import os
from typing import List, Dict, Any

def split_json_file(input_file: str, output_dir: str, max_size_mb: int = 50) -> List[str]:
    """
    Split a large JSON file into smaller chunks.
    
    Args:
        input_file: Path to the input JSON file
        output_dir: Directory to save the chunks
        max_size_mb: Maximum size of each chunk in MB
    
    Returns:
        List of output file paths
    """
    max_size_bytes = max_size_mb * 1024 * 1024  # Convert MB to bytes
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Read the entire JSON file
    print(f"Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Total objects: {len(data)}")
    
    # Split the data into chunks
    chunk_files = []
    current_chunk = []
    current_size = 0
    chunk_number = 1
    
    for i, item in enumerate(data):
        # Convert item to JSON string to estimate size
        item_json = json.dumps(item, ensure_ascii=False)
        item_size = len(item_json.encode('utf-8'))
        
        # If adding this item would exceed the max size, save current chunk
        if current_size + item_size > max_size_bytes and current_chunk:
            chunk_filename = f"bim_objects_chunk_{chunk_number:03d}.json"
            chunk_path = os.path.join(output_dir, chunk_filename)
            
            print(f"Saving chunk {chunk_number} with {len(current_chunk)} objects ({current_size / (1024*1024):.2f} MB)")
            
            with open(chunk_path, 'w', encoding='utf-8') as f:
                json.dump(current_chunk, f, ensure_ascii=False, indent=2)
            
            chunk_files.append(chunk_filename)
            current_chunk = []
            current_size = 0
            chunk_number += 1
        
        current_chunk.append(item)
        current_size += item_size
        
        # Progress indicator
        if (i + 1) % 1000 == 0:
            print(f"Processed {i + 1} objects...")
    
    # Save the last chunk
    if current_chunk:
        chunk_filename = f"bim_objects_chunk_{chunk_number:03d}.json"
        chunk_path = os.path.join(output_dir, chunk_filename)
        
        print(f"Saving final chunk {chunk_number} with {len(current_chunk)} objects ({current_size / (1024*1024):.2f} MB)")
        
        with open(chunk_path, 'w', encoding='utf-8') as f:
            json.dump(current_chunk, f, ensure_ascii=False, indent=2)
        
        chunk_files.append(chunk_filename)
    
    # Create a manifest file that lists all chunks
    manifest = {
        "total_chunks": len(chunk_files),
        "chunk_files": chunk_files,
        "total_objects": len(data)
    }
    
    manifest_path = os.path.join(output_dir, "chunks_manifest.json")
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    
    print(f"\nSplitting complete!")
    print(f"Created {len(chunk_files)} chunks")
    print(f"Manifest saved to: {manifest_path}")
    
    return chunk_files

if __name__ == "__main__":
    input_file = "public/bim_objects_with_volumes.json"
    output_dir = "public/chunks"
    
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found")
        exit(1)
    
    try:
        chunk_files = split_json_file(input_file, output_dir, max_size_mb=50)
        print(f"\nSuccess! Created {len(chunk_files)} chunk files in '{output_dir}'")
    except Exception as e:
        print(f"Error: {e}")
        exit(1) 