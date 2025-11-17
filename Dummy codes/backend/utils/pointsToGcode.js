/**
 * Converts coordinate arrays to G-code commands for a pen plotter
 * @param {Array<Array<{x: number, y: number}>>} paths - Array of paths, each containing coordinate points
 * @returns {string} - Generated G-code text
 */
export function pointsToGcode(paths) {
  const gcode = [];
  
  // Initialize G-code with standard pen plotter settings
  gcode.push('; G-code generated for pen plotter');
  gcode.push('; Generated on: ' + new Date().toISOString());
  gcode.push('G21 ; Set units to millimeters');
  gcode.push('G90 ; Use absolute positioning');
  gcode.push('G1 Z5 F1500 ; Pen up');
  gcode.push('G28 ; Home all axes');
  gcode.push('');

  let pathCount = 0;

  for (const path of paths) {
    if (path.length === 0) continue;

    pathCount++;
    gcode.push(`; Path ${pathCount} - ${path.length} points`);
    
    // Ensure pen is up before moving to new path
    gcode.push('G1 Z5 F1500 ; Pen up');

    // Move to the starting point of the path with pen up
    const startPoint = path[0];
    gcode.push(`G0 X${startPoint.x.toFixed(2)} Y${startPoint.y.toFixed(2)} ; Move to start`);
    
    // Lower pen to draw
    gcode.push('G1 Z-2 F1500 ; Pen down');

    // Draw each point in the path
    for (let i = 1; i < path.length; i++) {
      const point = path[i];
      gcode.push(`G1 X${point.x.toFixed(2)} Y${point.y.toFixed(2)} F1500`);
    }

    // Lift pen after completing the path
    gcode.push('G1 Z5 F1500 ; Pen up');
    gcode.push('');
  }

  // End program
  gcode.push('; End of program');
  gcode.push('G1 Z5 ; Ensure pen is up');
  gcode.push('G28 X0 Y0 ; Return to home');
  gcode.push('M2 ; End program');

  return gcode.join('\n');
}

/**
 * Optimizes G-code by removing redundant commands and optimizing path order
 * @param {string} gcode - Raw G-code string
 * @returns {string} - Optimized G-code
 */
export function optimizeGcode(gcode) {
  const lines = gcode.split('\n');
  const optimized = [];
  let lastCommand = '';
  let lastZ = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines in the middle (keep them for readability at section breaks)
    if (trimmed === '' && lastCommand !== '') {
      optimized.push(line);
      lastCommand = '';
      continue;
    }

    // Keep comments
    if (trimmed.startsWith(';')) {
      optimized.push(line);
      continue;
    }

    // Extract the command part (before any comment)
    const commandPart = trimmed.split(';')[0].trim();
    
    // Track Z movements separately - never remove pen up/down commands
    if (commandPart.includes(' Z')) {
      const zMatch = commandPart.match(/Z(-?\d+\.?\d*)/);
      if (zMatch) {
        const currentZ = zMatch[1];
        // Only skip if it's the exact same Z command consecutively
        if (currentZ !== lastZ || !commandPart.startsWith('G1 Z')) {
          optimized.push(line);
          lastZ = currentZ;
        }
        lastCommand = commandPart;
        continue;
      }
    }

    // Remove duplicate consecutive XY movement commands only
    if (commandPart !== lastCommand) {
      optimized.push(line);
      lastCommand = commandPart;
    }
  }

  return optimized.join('\n');
}
