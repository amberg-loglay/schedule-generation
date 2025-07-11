interface BIMObjectWithVolume {
  GlobalId?: string;
  text?: string;
  volume?: number;
  area?: number;
  [key: string]: any;
}

interface ChunkManifest {
  total_chunks: number;
  chunk_files: string[];
  total_objects: number;
}

export async function loadBIMObjects(): Promise<BIMObjectWithVolume[]> {
  try {
    const manifestResponse = await fetch('/chunks/chunks_manifest.json');
    if (!manifestResponse.ok) {
      throw new Error('Failed to load manifest');
    }
    
    const manifest: ChunkManifest = await manifestResponse.json();
    console.log('Found chunks:', manifest.total_chunks);
    
    const chunkPromises = manifest.chunk_files.map(async (chunkFile) => {
      const response = await fetch('/chunks/' + chunkFile);
      if (!response.ok) {
        throw new Error('Failed to load chunk: ' + chunkFile);
      }
      return await response.json();
    });
    
    const allChunks = await Promise.all(chunkPromises);
    const allObjects = allChunks.flat();
    
    console.log('Loaded objects:', allObjects.length);
    return allObjects;
    
  } catch (error) {
    console.warn('Failed to load from chunks, falling back to single file:', error);
    
    const response = await fetch('/bim_objects_with_volumes.json');
    if (!response.ok) {
      throw new Error('Failed to load BIM objects from single file');
    }
    
    const data: BIMObjectWithVolume[] = await response.json();
    console.log('Loaded from single file:', data.length);
    return data;
  }
}
