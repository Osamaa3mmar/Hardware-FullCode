import svgPathParser from 'svg-path-parser';
const { parseSVG, makeAbsolute } = svgPathParser;

/**
 * Extracts path data from SVG and converts to coordinate arrays
 * @param {string} svgString - The SVG string from Potrace
 * @returns {Array<Array<{x: number, y: number}>>} - Array of paths, each path is an array of points
 */
export function svgToPoints(svgString) {
  try {
    const paths = [];
    
    // Extract all path elements from SVG
    const pathRegex = /<path[^>]*\sd="([^"]*)"/g;
    let match;

    while ((match = pathRegex.exec(svgString)) !== null) {
      const pathData = match[1];
      
      if (pathData && pathData.trim()) {
        const points = parsePathToPoints(pathData);
        if (points.length > 0) {
          paths.push(points);
        }
      }
    }

    return paths;
  } catch (error) {
    console.error('Error in svgToPoints:', error);
    throw new Error(`Failed to parse SVG paths: ${error.message}`);
  }
}

/**
 * Parses a single SVG path string into an array of points
 * @param {string} pathData - The 'd' attribute value from an SVG path
 * @returns {Array<{x: number, y: number}>} - Array of coordinate points
 */
function parsePathToPoints(pathData) {
  const points = [];
  
  try {
    // Parse the path and make all commands absolute
    const commands = makeAbsolute(parseSVG(pathData));
    
    let currentX = 0;
    let currentY = 0;

    for (const cmd of commands) {
      switch (cmd.command) {
        case 'moveto':
          currentX = cmd.x;
          currentY = cmd.y;
          points.push({ x: currentX, y: currentY });
          break;

        case 'lineto':
          currentX = cmd.x;
          currentY = cmd.y;
          points.push({ x: currentX, y: currentY });
          break;

        case 'horizontal lineto':
          currentX = cmd.x;
          points.push({ x: currentX, y: currentY });
          break;

        case 'vertical lineto':
          currentY = cmd.y;
          points.push({ x: currentX, y: currentY });
          break;

        case 'curveto':
          // Cubic Bezier curve - sample multiple points along the curve
          const cubicPoints = sampleCubicBezier(
            currentX, currentY,
            cmd.x1, cmd.y1,
            cmd.x2, cmd.y2,
            cmd.x, cmd.y,
            20 // Sample 20 points for smooth curves
          );
          points.push(...cubicPoints);
          currentX = cmd.x;
          currentY = cmd.y;
          break;

        case 'smooth curveto':
          // Smooth cubic Bezier
          const smoothCubicPoints = sampleCubicBezier(
            currentX, currentY,
            cmd.x2, cmd.y2,
            cmd.x2, cmd.y2,
            cmd.x, cmd.y,
            20
          );
          points.push(...smoothCubicPoints);
          currentX = cmd.x;
          currentY = cmd.y;
          break;

        case 'quadratic curveto':
          // Quadratic Bezier curve
          const quadPoints = sampleQuadraticBezier(
            currentX, currentY,
            cmd.x1, cmd.y1,
            cmd.x, cmd.y,
            15 // Sample 15 points
          );
          points.push(...quadPoints);
          currentX = cmd.x;
          currentY = cmd.y;
          break;

        case 'smooth quadratic curveto':
          // Smooth quadratic Bezier
          const smoothQuadPoints = sampleQuadraticBezier(
            currentX, currentY,
            currentX, currentY,
            cmd.x, cmd.y,
            15
          );
          points.push(...smoothQuadPoints);
          currentX = cmd.x;
          currentY = cmd.y;
          break;

        case 'closepath':
          // Close the path by returning to the first point
          if (points.length > 0) {
            points.push({ x: points[0].x, y: points[0].y });
          }
          break;

        case 'arc':
          // Approximate arc with line segments
          const arcPoints = sampleArc(
            currentX, currentY,
            cmd.rx, cmd.ry,
            cmd.xAxisRotation,
            cmd.largeArc,
            cmd.sweep,
            cmd.x, cmd.y,
            20
          );
          points.push(...arcPoints);
          currentX = cmd.x;
          currentY = cmd.y;
          break;
      }
    }
  } catch (error) {
    console.error('Error parsing path data:', error);
  }

  return points;
}

/**
 * Sample points along a cubic Bezier curve
 */
function sampleCubicBezier(x0, y0, x1, y1, x2, y2, x3, y3, numPoints) {
  const points = [];
  
  for (let i = 1; i <= numPoints; i++) {
    const t = i / numPoints;
    const mt = 1 - t;
    
    const x = mt * mt * mt * x0 +
              3 * mt * mt * t * x1 +
              3 * mt * t * t * x2 +
              t * t * t * x3;
              
    const y = mt * mt * mt * y0 +
              3 * mt * mt * t * y1 +
              3 * mt * t * t * y2 +
              t * t * t * y3;
    
    points.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  }
  
  return points;
}

/**
 * Sample points along a quadratic Bezier curve
 */
function sampleQuadraticBezier(x0, y0, x1, y1, x2, y2, numPoints) {
  const points = [];
  
  for (let i = 1; i <= numPoints; i++) {
    const t = i / numPoints;
    const mt = 1 - t;
    
    const x = mt * mt * x0 + 2 * mt * t * x1 + t * t * x2;
    const y = mt * mt * y0 + 2 * mt * t * y1 + t * t * y2;
    
    points.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  }
  
  return points;
}

/**
 * Sample points along an arc
 * Simplified arc approximation using line segments
 */
function sampleArc(x0, y0, rx, ry, rotation, largeArc, sweep, x, y, numPoints) {
  const points = [];
  
  // Simple linear interpolation for arc approximation
  for (let i = 1; i <= numPoints; i++) {
    const t = i / numPoints;
    const px = x0 + (x - x0) * t;
    const py = y0 + (y - y0) * t;
    points.push({ x: Math.round(px * 100) / 100, y: Math.round(py * 100) / 100 });
  }
  
  return points;
}
