import React from 'react';

const HeatmapDisplay = () => {
  const heatmapData = [
    { x: 10, y: 15, value: 5 }, { x: 20, y: 25, value: 2 }, { x: 30, y: 35, value: 8 },
    { x: 50, y: 50, value: 4 }, { x: 100, y: 120, value: 1 }, { x: 150, y: 180, value: 6 }
  ];

  const containerStyle = {
    width: '100%',
    height: '230px', // Adjusted height
    marginTop: '40px', // More margin from comments
    border: '1px solid rgb(var(--gray-light))', // Theme border
    borderRadius: '8px',
    backgroundColor: '#fff', // White background
    padding: '15px',
    position: 'relative',
    boxSizing: 'border-box',
    boxShadow: 'var(--box-shadow)'
  };

  const titleStyle = {
    textAlign: 'center',
    color: 'rgb(var(--gray-dark))', // Theme color
    marginBottom: '15px',
    fontSize: '1.25em' // h5 equivalent
  };

  const FallbackHeatmapVisualization = () => (
    <div style={{ width: '100%', height: 'calc(100% - 40px)', position: 'relative', border: '1px dashed rgb(var(--gray-light))', borderRadius: '4px', background: 'rgb(var(--gray-light), 0.2)' }}>
      {heatmapData.map(point => (
        <div
          key={`point-${point.x}-${point.y}`}
          style={{
            position: 'absolute',
            left: `${(point.x / 200) * 100}%`,
            top: `${(point.y / 200) * 100}%`,
            width: `${point.value * 2.5}px`, // Slightly larger dots
            height: `${point.value * 2.5}px`,
            backgroundColor: `rgba(var(--accent-dark), ${point.value / 10})`, // Use accent color
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          title={`Activity: ${point.value}`}
        />
      ))}
      <p style={{textAlign: 'center', color: 'rgb(var(--gray))', fontSize: '0.9em', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}>
        (Mock Heatmap: Dots represent activity intensity)
      </p>
    </div>
  );

  return (
    <div style={containerStyle}>
      <h5 style={titleStyle}>Page Activity Heatmap</h5>
      <FallbackHeatmapVisualization />
    </div>
  );
};

export default HeatmapDisplay;
