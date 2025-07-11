import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { IncomingForm, File, Fields, Files } from 'formidable';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Disable default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

type UploadResponse = {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm({
      uploadDir: path.join(process.cwd(), 'uploads'),
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
    });

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const parsePromise = new Promise<{ files: Files; fields: Fields }>((resolve, reject) => {
      form.parse(req, (err: any, fields: Fields, files: Files) => {
        if (err) reject(err);
        else resolve({ files, fields });
      });
    });

    const { files } = await parsePromise;
    const volumeFile = Array.isArray(files.volumeFile) ? files.volumeFile[0] : files.volumeFile;

    if (!volumeFile) {
      return res.status(400).json({ success: false, message: 'No volume file uploaded' });
    }

    // Process Excel file with Python script
    const volumeData = await processExcelFile((volumeFile as File).filepath);

    // Clean up uploaded file
    fs.unlinkSync((volumeFile as File).filepath);

    return res.status(200).json({
      success: true,
      message: 'Volume data processed successfully',
      data: volumeData
    });

  } catch (error) {
    console.error('Error processing volume data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process volume data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function processExcelFile(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Create a Python script to process the Excel file
    const pythonScript = `
import pandas as pd
import json
import sys

def process_volume_data(excel_path):
    try:
        # Read the Excel file
        df = pd.read_excel(excel_path)
        
        # Process the data (adjust column names based on actual Excel structure)
        volume_data = {}
        
        for index, row in df.iterrows():
            # Adjust these column names based on your actual Excel file structure
            object_code = row.get('ObjectCode') or row.get('Code') or row.get('Label')
            volume = row.get('Volume') or row.get('Volumen') or 0
            area = row.get('Area') or row.get('Fläche') or 0
            count = row.get('Count') or row.get('Anzahl') or 1
            
            if object_code:
                volume_data[str(object_code)] = {
                    'volume': float(volume) if volume else 0,
                    'area': float(area) if area else 0,
                    'count': int(count) if count else 1
                }
        
        # Output as JSON
        print(json.dumps(volume_data))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        process_volume_data(sys.argv[1])
    else:
        print(json.dumps({'error': 'No file path provided'}))
        sys.exit(1)
`;

    // Write temporary Python script
    const tempScriptPath = path.join(process.cwd(), 'temp_excel_processor.py');
    fs.writeFileSync(tempScriptPath, pythonScript);

    const pythonProcess = spawn('python', [tempScriptPath, filePath]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      // Clean up temp script
      try {
        fs.unlinkSync(tempScriptPath);
      } catch (e) {
        console.warn('Could not delete temp script:', e);
      }

      if (code !== 0) {
        reject(new Error(`Excel processing failed: ${errorOutput}`));
        return;
      }

      try {
        const result = JSON.parse(output);
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(new Error('Failed to parse Excel processing output'));
      }
    });
  });
} 