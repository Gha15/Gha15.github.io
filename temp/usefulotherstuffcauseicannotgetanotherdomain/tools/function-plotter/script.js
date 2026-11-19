const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const modeSelect = document.getElementById('mode');
const eqInputs = document.getElementById('equation-inputs');
const ptSlopeInputs = document.getElementById('point-slope-inputs');
const plotBtn = document.getElementById('plot-btn');
const equationOutput = document.getElementById('equation-output');

// Grid Configuration
const width = canvas.width;
const height = canvas.height;
const scale = 25; // 25 pixels = 1 grid unit
const originX = width / 2;
const originY = height / 2;

// Toggle between modes
modeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'equation') {
        eqInputs.classList.remove('hidden');
        ptSlopeInputs.classList.add('hidden');
    } else {
        eqInputs.classList.add('hidden');
        ptSlopeInputs.classList.remove('hidden');
    }
    calculateAndPlot();
});

// Setup Action Button
plotBtn.addEventListener('click', calculateAndPlot);

function drawGrid() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let x = originX % scale; x < width; x += scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    // Horizontal grid lines
    for (let y = originY % scale; y < height; y += scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Draw X and Y Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();
}

function drawLine(m, b) {
    ctx.strokeStyle = '#ef4444'; // Red line for visibility
    ctx.lineWidth = 3;
    ctx.beginPath();

    // Map Cartesian domain to Canvas screen boundaries
    const xStart = -originX / scale;
    const xEnd = originX / scale;

    const yStart = m * xStart + b;
    const yEnd = m * xEnd + b;

    // Convert Cartesian coordinates to Canvas pixels
    const canvasXStart = originX + xStart * scale;
    const canvasYStart = originY - yStart * scale;
    const canvasXEnd = originX + xEnd * scale;
    const canvasYEnd = originY - yEnd * scale;

    ctx.moveTo(canvasXStart, canvasYStart);
    ctx.lineTo(canvasXEnd, canvasYEnd);
    ctx.stroke();
}

function calculateAndPlot() {
    let m = 0;
    let b = 0;
    const mode = modeSelect.value;

    if (mode === 'equation') {
        m = parseFloat(document.getElementById('eq-m').value) || 0;
        b = parseFloat(document.getElementById('eq-b').value) || 0;
    } else {
        const psM = parseFloat(document.getElementById('ps-m').value) || 0;
        const psX = parseFloat(document.getElementById('ps-x').value) || 0;
        const psY = parseFloat(document.getElementById('ps-y').value) || 0;
        
        // Point-slope arithmetic: y - y1 = m(x - x1) -> y = mx - mx1 + y1
        m = psM;
        b = -psM * psX + psY;
    }

    // Redraw interface
    drawGrid();
    drawLine(m, b);

    // Format output display string elegantly
    let bSign = b >= 0 ? "+ " + b : "- " + Math.abs(b);
    if (b === 0) bSign = ""; 
    equationOutput.textContent = `y = ${m}x ${bSign}`;
}

// Initial Run to display blank/starting graph on page load
calculateAndPlot();
