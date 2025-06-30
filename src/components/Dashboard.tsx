'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Filter, Box, Truck, Package, Trash2, MapPin, BarChart3 } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface StorageArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}

const Dashboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [storageAreas, setStorageAreas] = useState<StorageArea[]>([]);
  const [totalArea, setTotalArea] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  
  // Calculate pallets based on storage area (2.5 pallets per m²)
  const calculatePallets = (area: number) => {
    const palletsPerSquareMeter = 2.5;
    return Math.round(area * palletsPerSquareMeter);
  };
  
  const currentPallets = totalArea > 0 ? calculatePallets(totalArea) : 856;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setBackgroundImage(img);
      setImageLoaded(true);
      drawCanvas();
    };
    img.src = '/Biel_general.png';
  }, []);

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [storageAreas, imageLoaded]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !backgroundImage) return;

    // Set high resolution
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Enable high-quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Calculate aspect ratio and draw image maintaining original proportions
    const imageAspectRatio = backgroundImage.naturalWidth / backgroundImage.naturalHeight;
    const canvasAspectRatio = rect.width / rect.height;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imageAspectRatio > canvasAspectRatio) {
      // Image is wider than canvas - fit to width
      drawWidth = rect.width;
      drawHeight = rect.width / imageAspectRatio;
      offsetX = 0;
      offsetY = (rect.height - drawHeight) / 2;
    } else {
      // Image is taller than canvas - fit to height
      drawHeight = rect.height;
      drawWidth = rect.height * imageAspectRatio;
      offsetX = (rect.width - drawWidth) / 2;
      offsetY = 0;
    }

    // Fill background with dark color
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw background image with correct aspect ratio
    ctx.drawImage(backgroundImage, offsetX, offsetY, drawWidth, drawHeight);

    // Draw storage areas
    storageAreas.forEach((area, index) => {
      // Use consistent blue color scheme
      const blueShades = ['#3498db', '#2980b9', '#1abc9c', '#16a085', '#2c3e50'];
      ctx.fillStyle = blueShades[index % blueShades.length] + '80'; // 50% opacity
      ctx.strokeStyle = blueShades[index % blueShades.length];
      ctx.lineWidth = 2;
      
      ctx.fillRect(area.x, area.y, area.width, area.height);
      ctx.strokeRect(area.x, area.y, area.width, area.height);
      
      // Add label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('LAGER', area.x + area.width/2, area.y + area.height/2 + 4);
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Redraw everything
    drawCanvas();

    // Draw current rectangle being drawn
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      startPos.x,
      startPos.y,
      currentX - startPos.x,
      currentY - startPos.y
    );
    ctx.setLineDash([]);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const width = Math.abs(endX - startPos.x);
    const height = Math.abs(endY - startPos.y);

    if (width > 10 && height > 10) {
      const area = width * height * 0.01; // 0.01 m² per square pixel
      const newArea: StorageArea = {
        id: Date.now().toString(),
        x: Math.min(startPos.x, endX),
        y: Math.min(startPos.y, endY),
        width,
        height,
        area
      };

      setStorageAreas(prev => [...prev, newArea]);
      setTotalArea(prev => prev + area);
    }

    setIsDrawing(false);
  };

  const clearAreas = () => {
    setStorageAreas([]);
    setTotalArea(0);
  };

  // Chart data for stacked horizontal bar
  const lagerflacheData = {
    labels: ['Lagerfläche'],
    datasets: [
      {
        label: 'Baumaterial',
        data: [450],
        backgroundColor: '#3498db',
        borderColor: '#2980b9',
        borderWidth: 1
      },
      {
        label: 'Maschinen',
        data: [320],
        backgroundColor: '#2980b9',
        borderColor: '#1f5f99',
        borderWidth: 1
      },
      {
        label: 'Werkzeuge',
        data: [180],
        backgroundColor: '#1abc9c',
        borderColor: '#17a2b8',
        borderWidth: 1
      },
      {
        label: 'Abfall',
        data: [120],
        backgroundColor: '#16a085',
        borderColor: '#138496',
        borderWidth: 1
      },
      {
        label: 'Bürocontainer',
        data: [80],
        backgroundColor: '#34495e',
        borderColor: '#2c3e50',
        borderWidth: 1
      },
      {
        label: 'Freifläche',
        data: [330],
        backgroundColor: '#95a5a6',
        borderColor: '#7f8c8d',
        borderWidth: 1
      }
    ]
  };

  const bauablaufData = {
    labels: ['Woche 1', 'Woche 2', 'Woche 3', 'Woche 4', 'Woche 5', 'Woche 6'],
    datasets: [{
      label: 'Geplant',
      data: [20, 35, 50, 65, 80, 95],
      borderColor: '#3498db',
      backgroundColor: 'transparent',
      tension: 0.4
    }, {
      label: 'Ist',
      data: [18, 32, 45, 58, 72, 85],
      borderColor: '#e74c3c',
      backgroundColor: 'transparent',
      tension: 0.4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#bdc3c7'
        },
        grid: {
          color: '#34495e'
        }
      },
      y: {
        ticks: {
          color: '#bdc3c7'
        },
        grid: {
          color: '#34495e'
        }
      }
    }
  };

  const horizontalChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: '#ecf0f1',
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: '#bdc3c7'
        },
        grid: {
          color: '#34495e'
        }
      },
      y: {
        stacked: true,
        ticks: {
          color: '#bdc3c7'
        },
        grid: {
          color: '#34495e'
        }
      }
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#2c3e50', 
      color: '#ecf0f1',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#34495e',
        padding: '1rem 2rem',
        borderBottom: '1px solid #4a5568',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Box size={32} color="#3498db" />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            Construction Logistics Dashboard
          </h1>
          <button style={{
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginLeft: '2rem'
          }}>
            Import IFC Model
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Calendar size={20} />
          <select style={{
            backgroundColor: '#2c3e50',
            color: '#ecf0f1',
            border: '1px solid #4a5568',
            padding: '0.5rem',
            borderRadius: '4px'
          }}>
            <option>Date</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
          <select style={{
            backgroundColor: '#2c3e50',
            color: '#ecf0f1',
            border: '1px solid #4a5568',
            padding: '0.5rem',
            borderRadius: '4px'
          }}>
            <option>Phase</option>
            <option>Phase 1 - Fundament</option>
            <option>Phase 2 - Rohbau</option>
            <option>Phase 3 - Ausbau</option>
            <option>Phase 4 - Fertigstellung</option>
          </select>
          <select style={{
            backgroundColor: '#2c3e50',
            color: '#ecf0f1',
            border: '1px solid #4a5568',
            padding: '0.5rem',
            borderRadius: '4px'
          }}>
            <option>Gewerk</option>
            <option>Beton</option>
            <option>Stahl</option>
            <option>Holz</option>
            <option>Elektro</option>
            <option>Sanitär</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '2rem' }}>
        {/* Single Grid Container for all rows */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 2fr',
          gridTemplateRows: 'auto auto auto auto',
          gap: '1rem'
        }}>
          {/* Row 1, Col 1: Filters */}
          <div style={{
            backgroundColor: '#34495e',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #4a5568',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Filter size={32} color="#ecf0f1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Filters</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              <select style={{
                backgroundColor: '#2c3e50',
                color: '#ecf0f1',
                border: '1px solid #4a5568',
                padding: '0.5rem',
                borderRadius: '4px'
              }}>
                <option>All Projects</option>
                <option>Biel Construction</option>
                <option>Zurich Office</option>
              </select>
              <select style={{
                backgroundColor: '#2c3e50',
                color: '#ecf0f1',
                border: '1px solid #4a5568',
                padding: '0.5rem',
                borderRadius: '4px'
              }}>
                <option>All Materials</option>
                <option>Concrete</option>
                <option>Steel</option>
                <option>Wood</option>
              </select>
            </div>
          </div>

          {/* Row 1, Col 2: 3D Model */}
          <div style={{
            backgroundColor: '#34495e',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #4a5568',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Box size={32} color="#ecf0f1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>3D Model</h3>
            <div style={{
              width: '100%',
              height: '120px',
              backgroundColor: '#2c3e50',
              border: '1px solid #4a5568',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#bdc3c7'
            }}>
              3D Model Viewer
            </div>
          </div>

          {/* Row 1-2, Col 3: 2D Floorplan - spans 2 rows */}
          <div style={{
            backgroundColor: '#34495e',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #4a5568',
            gridRow: 'span 2'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>2D Floorplan - Interactive Storage Planning</h3>
              <button
                onClick={clearAreas}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Clear Areas
              </button>
            </div>
            <div style={{ position: 'relative', width: '100%', height: '300px' }}>
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{
                  width: '100%',
                  height: '100%',
                  border: '1px solid #4a5568',
                  borderRadius: '4px',
                  cursor: 'crosshair',
                  backgroundColor: '#2c3e50'
                }}
              />
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#bdc3c7' }}>
              Click and drag to define storage areas. Current total: {totalArea.toFixed(2)} m²
            </p>
          </div>

          {/* Row 2, Col 1: Ladezone */}
          <div style={{
            backgroundColor: '#34495e',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #4a5568',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MapPin size={32} color="#ecf0f1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Ladezone</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ecf0f1' }}>
              12
            </div>
            <div style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>Active Loading Zones</div>
          </div>

          {/* Row 2, Col 2: Lagerfläche */}
          <div style={{
            backgroundColor: '#34495e',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #4a5568',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={32} color="#ecf0f1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Lagerfläche</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ecf0f1' }}>
              {totalArea > 0 ? totalArea.toFixed(0) : '1,480'}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>m² Storage Area</div>
          </div>

          {/* Row 3, Col 1: LKW */}
          <div style={{
            backgroundColor: '#34495e',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #4a5568',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Truck size={32} color="#ecf0f1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>LKW</h3>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>Betonmischer</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ecf0f1' }}>8</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>Kran-LKW</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ecf0f1' }}>5</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>Lieferwagen</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ecf0f1' }}>7</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>Mulden-LKW</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ecf0f1' }}>3</span>
              </div>
              <div style={{ borderTop: '1px solid #4a5568', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#ecf0f1' }}>Total</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3498db' }}>23</span>
              </div>
            </div>
          </div>

          {/* Row 3, Col 2: Palletts */}
          <div style={{
            backgroundColor: '#34495e',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #4a5568',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={32} color="#ecf0f1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Palletts</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: totalArea > 0 ? '#3498db' : '#ecf0f1' }}>
              {currentPallets.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#bdc3c7', textAlign: 'center' }}>
              {totalArea > 0 ? (
                <>
                  Based on {totalArea.toFixed(0)}m²<br/>
                  (2.5 pallets/m²)
                </>
              ) : (
                'Total Pallets'
              )}
            </div>
          </div>

          {/* Row 3, Col 3: Lagerfläche Chart */}
          <div style={{
            backgroundColor: '#34495e',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #4a5568'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Lagerfläche by Category</h3>
            <div style={{ height: '200px' }}>
              <Bar data={lagerflacheData} options={horizontalChartOptions} />
            </div>
          </div>

          {/* Row 4, Col 1: Abfall */}
          <div style={{
            backgroundColor: '#34495e',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #4a5568',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Trash2 size={32} color="#ecf0f1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Abfall</h3>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>Bauschutt</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ecf0f1' }}>1.8t</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>Holzabfall</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ecf0f1' }}>0.7t</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>Metallschrott</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ecf0f1' }}>0.4t</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>Restmüll</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ecf0f1' }}>0.3t</span>
              </div>
              <div style={{ borderTop: '1px solid #4a5568', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#ecf0f1' }}>Total</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>3.2t</span>
              </div>
            </div>
          </div>

          {/* Row 4, Col 2: Others */}
          <div style={{
            backgroundColor: '#34495e',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #4a5568',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BarChart3 size={32} color="#ecf0f1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Others</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ecf0f1' }}>
              127
            </div>
            <div style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>Misc Items</div>
          </div>

          {/* Row 4, Col 3: Bauablauf */}
          <div style={{
            backgroundColor: '#34495e',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #4a5568'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Bauablauf</h3>
            <div style={{ height: '200px' }}>
              <Line data={bauablaufData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 