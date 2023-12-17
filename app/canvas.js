const gridSize = 20;
const gridScale = 1; // Adjust this value to scale the grid

export function plotCoordinates(dataPoints) {
  const canvas = document.getElementById('coordinateCanvas');
  const context = canvas.getContext('2d');

  // Update grid size if necessary
  updateGridSize(dataPoints);

  // Plot new coordinates
  context.fillStyle = 'blue';
  context.font = '12px Arial';
  for (const dataPoint of dataPoints) {
    const coord = dataPoint.coordinates || [0, 0];
    const label = dataPoint.label || '';
    const x = coord[0] * gridSize * gridScale + canvas.width / 2;
    const y = -coord[1] * gridSize * gridScale + canvas.height / 2;

    // Draw point
    context.beginPath();
    context.arc(x, y, 5, 0, 2 * Math.PI);
    context.fill();

    // Draw label
    context.fillText(label, x + 10, y - 10);
  }
}

function updateGridSize(dataPoints) {
  const canvas = document.getElementById('coordinateCanvas');
  const context = canvas.getContext('2d');

  // Calculate min and max coordinates
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const dataPoint of dataPoints) {
    const coord = dataPoint.coordinates || [0, 0];
    minX = Math.min(minX, coord[0]);
    minY = Math.min(minY, coord[1]);
    maxX = Math.max(maxX, coord[0]);
    maxY = Math.max(maxY, coord[1]);
  }

  // Calculate grid size
  const padding = 20;
  const newCanvasWidth = Math.ceil((maxX - minX + 2 * padding) * gridSize * gridScale);
  const newCanvasHeight = Math.ceil((maxY - minY + 2 * padding) * gridSize * gridScale);

  // Update canvas size
  if (newCanvasWidth > canvas.width || newCanvasHeight > canvas.height) {
    canvas.width = newCanvasWidth;
    canvas.height = newCanvasHeight;

    // Redraw grid
    drawGrid();
  }
}

export function drawGrid() {
  const canvas = document.getElementById('coordinateCanvas');
  const context = canvas.getContext('2d');

  // Draw grid lines
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.beginPath();
  for (let i = 0; i <= canvas.width; i += gridSize * gridScale) {
    context.moveTo(i, 0);
    context.lineTo(i, canvas.height);
  }
  for (let i = 0; i <= canvas.height; i += gridSize * gridScale) {
    context.moveTo(0, i);
    context.lineTo(canvas.width, i);
  }
  context.strokeStyle = '#ddd';
  context.stroke();
}