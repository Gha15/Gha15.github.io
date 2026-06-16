const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');

// Elements Configuration UI Handles
const eqInputX = document.getElementById('eqInputX');
const eqInputY = document.getElementById('eqInputY');
const mA = document.getElementById('m-a');
const mB = document.getElementById('m-b');
const mC = document.getElementById('m-c');
const mD = document.getElementById('m-d');
const resetBtn = document.getElementById('resetBtn');
const detDisplay = document.getElementById('det-display');
const cursorCoords = document.getElementById('cursor-coords');
const pointsListContainer = document.getElementById('points-list');
const addPointRowBtn = document.getElementById('addPointRowBtn');
const pointModeBtn = document.getElementById('pointModeBtn');
const sidebarToggle = document.getElementById('sidebar-toggle');
const controlPanel = document.getElementById('control-panel');
const welcomeModal = document.getElementById('welcome-modal');
const closeModalBtn = document.getElementById('closeModalBtn');

// Newly Added UI Element Connections
const connectPointsBtn = document.getElementById('connectPointsBtn');
const lineColorIn = document.getElementById('lineColorIn');
const explanationDisplay = document.getElementById('matrix-explanation');

// Laboratory Core State Variables
let scale = 40; 
let offsetX = 0; 
let offsetY = 0;
let isDragging = false;
let startX, startY;

// Dynamic Point Plotting States
let pointsArray = [
    { x: 2.0, y: 2.0, color: '#ff4757' },
    { x: -3.0, y: 1.0, color: '#2ed573' }
];
let canvasClickMode = 'pan'; // 'pan', 'plot', or 'connect'
let touchStartDist = 0; 

// Connection Path Vectors Array Mapping (Stores indices pairs: [idx1, idx2])
let connectedLines = [[0, 1]]; 
let selectedPointForConnection = null;

// Compiled Function Caches
let compiledFnX = null, compiledFnY = null;
let isImplicitX = false, isImplicitY = false;

// --- Modal & Responsive Side Panels View Controls ---
closeModalBtn.addEventListener('click', () => welcomeModal.style.display = 'none');
sidebarToggle.addEventListener('click', () => controlPanel.classList.toggle('active-mobile'));

// --- Floating Toast Notification Alert Banner ---
function showFloatingToast(message) {
    let oldToast = document.getElementById('canvas-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'canvas-toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// --- Live Transformation Matrix Interpretation Writer ---
function updateMatrixExplanation(a, b, c, d, det) {
    let analysis = `The vector $\\hat{i}$ lands at $(${a}, ${c})$ and $\\hat{j}$ lands at $(${b}, ${d})$. `;
    
    if (det === 0) {
        analysis += "The matrix squashes all space down onto a single linear line or single coordinate point, compressing the area scaling factor to absolute zero.";
    } else {
        analysis += `This matrix scales all geometric space area grid sizes by a factor of $${Math.abs(det).toFixed(2)}$. `;
        if (det < 0) {
            analysis += "Because the determinant value is negative, spatial orientation has flipped (inverted reflection).";
        } else {
            analysis += "Spatial orientation remains normal.";
        }
    }
    
    explanationDisplay.innerHTML = analysis;
}

// --- Math Parser Pipeline Helpers ---
function preprocessExpression(str) {
    let expr = str.toLowerCase().replace(/\s+/g, '');
    expr = expr.replace(/(\d+)([xy])/g, '$1*$2');
    expr = expr.replace(/([xy])([xy])/g, '$1*$2');
    expr = expr.replace(/(\))([xy]|\()/g, '$1*$2');
    expr = expr.replace(/([xy]|\))(\()/g, '$1*$2');
    while (expr.includes('^')) {
        expr = expr.replace(/([xy\d\.\)]+)\^([xy\d\.\)]+)/g, 'Math.pow($1,$2)');
    }
    const mathFunctions = ['sin', 'cos', 'tan', 'abs', 'sqrt', 'log', 'exp', 'pi', 'e'];
    mathFunctions.forEach(f => {
        const regex = new RegExp(`\\b${f}\\b`, 'g');
        if (f === 'pi') expr = expr.replace(regex, 'Math.PI');
        else if (f === 'e') expr = expr.replace(regex, 'Math.E');
        else expr = expr.replace(regex, `Math.${f}`);
    });
    return expr;
}

function compileEquations() {
    compiledFnX = null; compiledFnY = null;
    let rawX = eqInputX.value.trim(), rawY = eqInputY.value.trim();
    try {
        if (rawX) {
            if (rawX.includes('=')) {
                let parts = rawX.split('=');
                compiledFnX = new Function('x', 'y', `return (${preprocessExpression(parts[0])}) - (${preprocessExpression(parts[1])});`);
                isImplicitX = true;
            } else {
                compiledFnX = new Function('x', `return ${preprocessExpression(rawX)};`);
                isImplicitX = false;
            }
        }
    } catch(e) { compiledFnX = null; }
    try {
        if (rawY) {
            if (rawY.includes('=')) {
                let parts = rawY.split('=');
                compiledFnY = new Function('x', 'y', `return (${preprocessExpression(parts[0])}) - (${preprocessExpression(parts[1])});`);
                isImplicitY = true;
            } else {
                compiledFnY = new Function('x', `return ${preprocessExpression(rawY)};`);
                isImplicitY = false;
            }
        }
    } catch(e) { compiledFnY = null; }
}

// --- Dynamic Point Interface Sync Management ---
function syncPointsUI() {
    pointsListContainer.innerHTML = '';
    pointsArray.forEach((pt, idx) => {
        const row = document.createElement('div');
        row.className = 'point-row';
        row.innerHTML = `
            <span class="point-indicator-dot" style="background:${pt.color}"></span>
            <input type="number" step="0.1" class="pt-coord-in" value="${pt.x.toFixed(1)}" data-idx="${idx}" data-coord="x">
            <input type="number" step="0.1" class="pt-coord-in" value="${pt.y.toFixed(1)}" data-idx="${idx}" data-coord="y">
            <button class="btn-del-pt" data-idx="${idx}">×</button>
        `;
        pointsListContainer.appendChild(row);
    });
    
    document.querySelectorAll('.pt-coord-in').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            const coord = e.target.dataset.coord;
            // Round manual user variations to nearest 0.1 bounds
            pointsArray[idx][coord] = Math.round((parseFloat(e.target.value) || 0) * 10) / 10;
            render();
        });
    });

    document.querySelectorAll('.btn-del-pt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.idx);
            pointsArray.splice(idx, 1);
            
            // Re-index point lines vectors array links mapping
            connectedLines = connectedLines.filter(line => line[0] !== idx && line[1] !== idx)
                .map(line => {
                    let p1 = line[0] > idx ? line[0] - 1 : line[0];
                    let p2 = line[1] > idx ? line[1] - 1 : line[1];
                    return [p1, p2];
                });

            if (selectedPointForConnection === idx) selectedPointForConnection = null;
            else if (selectedPointForConnection > idx) selectedPointForConnection--;

            syncPointsUI();
            render();
        });
    });
}

addPointRowBtn.addEventListener('click', () => {
    const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#eccc68'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    pointsArray.push({ x: 1.0, y: 1.0, color: randomColor });
    syncPointsUI();
    render();
});

pointModeBtn.addEventListener('click', () => {
    selectedPointForConnection = null;
    if (canvasClickMode !== 'plot') {
        canvasClickMode = 'plot';
        pointModeBtn.className = 'active-mode';
        connectPointsBtn.className = '';
        pointModeBtn.textContent = "Mode: Plotting Points (0.1) 📍";
    } else {
        canvasClickMode = 'pan';
        pointModeBtn.className = '';
        pointModeBtn.textContent = "Plot Points (0.1)";
    }
});

connectPointsBtn.addEventListener('click', () => {
    selectedPointForConnection = null;
    if (pointsArray.length === 0) {
        showFloatingToast("Add points to your grid map before building vectors!");
        return;
    }
    if (pointsArray.length === 1) {
        showFloatingToast("You only have 1 point! Add 1 more to connect.");
        return;
    }

    if (canvasClickMode !== 'connect') {
        canvasClickMode = 'connect';
        connectPointsBtn.className = 'active-mode';
        pointModeBtn.className = '';
        connectPointsBtn.textContent = "Select 2 Nodes... 🔗";
    } else {
        canvasClickMode = 'pan';
        connectPointsBtn.className = '';
        connectPointsBtn.textContent = "Connect Nodes Linker";
    }
});

// --- Central Render Processing Blueprint Engine ---
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const a = parseFloat(mA.value) || 0;
    const b = parseFloat(mB.value) || 0;
    const c = parseFloat(mC.value) || 0;
    const d = parseFloat(mD.value) || 0;

    const determinant = (a * d) - (b * c);
    detDisplay.textContent = determinant.toFixed(2);
    updateMatrixExplanation(a, b, c, d, determinant);

    // 1. Dynamic Mesh Background Grid Elements Array Mapping
    ctx.strokeStyle = '#161f30';
    ctx.lineWidth = 1;

    const startGridX = Math.floor((-offsetX) / scale);
    const endGridX = Math.ceil((canvas.width - offsetX) / scale);
    for (let x = startGridX - 10; x <= endGridX + 10; x++) {
        ctx.beginPath();
        let currentX = x * scale + offsetX;
        ctx.moveTo(currentX, 0); ctx.lineTo(currentX, canvas.height);
        ctx.stroke();
    }

    const startGridY = Math.floor((-offsetY) / scale);
    const endGridY = Math.ceil((canvas.height - offsetY) / scale);
    for (let y = startGridY - 10; y <= endGridY + 10; y++) {
        ctx.beginPath();
        let currentY = y * scale + offsetY;
        ctx.moveTo(0, currentY); ctx.lineTo(canvas.width, currentY);
        ctx.stroke();
    }

    // 2. Central Fixed Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, offsetY); ctx.lineTo(canvas.width, offsetY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(offsetX, 0); ctx.lineTo(offsetX, canvas.height); ctx.stroke();

    // 3. Render Node Vector Link Path Connections
    ctx.lineWidth = 2;
    ctx.strokeStyle = lineColorIn.value || '#00f2fe';
    connectedLines.forEach(line => {
        const pt1 = pointsArray[line[0]];
        const pt2 = pointsArray[line[1]];
        if(pt1 && pt2) {
            let tx1 = a * pt1.x + b * pt1.y;
            let ty1 = c * pt1.x + d * pt1.y;
            let tx2 = a * pt2.x + b * pt2.y;
            let ty2 = c * pt2.x + d * pt2.y;

            ctx.beginPath();
            ctx.moveTo(tx1 * scale + offsetX, -ty1 * scale + offsetY);
            ctx.lineTo(tx2 * scale + offsetX, -ty2 * scale + offsetY);
            ctx.stroke();
        }
    });

    // 4. Linear Transformation Basis Vectors (i hat, j hat)
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ff4757'; 
    ctx.beginPath(); ctx.moveTo(offsetX, offsetY);
    ctx.lineTo((a * scale) + offsetX, -(c * scale) + offsetY); ctx.stroke();

    ctx.strokeStyle = '#2ed573'; 
    ctx.beginPath(); ctx.moveTo(offsetX, offsetY);
    ctx.lineTo((b * scale) + offsetX, -(d * scale) + offsetY); ctx.stroke();

    // 5. Transform Equation System Curves Matrix Render
    if (compiledFnX || compiledFnY) {
        ctx.fillStyle = 'rgba(0, 242, 254, 0.85)';
        const step = 2; 
        const tolerance = 1.8 / scale;

        for (let pX = 0; pX < canvas.width; pX += step) {
            for (let pY = 0; pY < canvas.height; pY += step) {
                let mathX = (pX - offsetX) / scale;
                let mathY = -(pY - offsetY) / scale; 
                let matchX = false, matchY = false;

                try {
                    if (compiledFnX) {
                        matchX = isImplicitX ? (Math.abs(compiledFnX(mathX, mathY)) < tolerance) : (Math.abs(mathY - compiledFnX(mathX)) < tolerance);
                    }
                    if (compiledFnY) {
                        matchY = isImplicitY ? (Math.abs(compiledFnY(mathX, mathY)) < tolerance) : (Math.abs(mathY - compiledFnY(mathX)) < tolerance);
                    }
                } catch(e) { continue; }

                if (matchX || matchY) {
                    let tx = a * mathX + b * mathY;
                    let ty = c * mathX + d * mathY;
                    ctx.fillRect(tx * scale + offsetX, -ty * scale + offsetY, 2.5, 2.5);
                }
            }
        }
    }

    // 6. Render Points Target Vector Blocks Matrix Array
    pointsArray.forEach((pt, idx) => {
        let tx = a * pt.x + b * pt.y;
        let ty = c * pt.x + d * pt.y;
        let screenX = tx * scale + offsetX;
        let screenY = -ty * scale + offsetY;

        ctx.fillStyle = pt.color;
        // Highlight a nodes structure element selected inside target loops
        if (selectedPointForConnection === idx) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffffff';
        } else {
            ctx.shadowBlur = 10;
            ctx.shadowColor = pt.color;
        }
        ctx.beginPath();
        ctx.arc(screenX, screenY, selectedPointForConnection === idx ? 8 : 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.strokeStyle = selectedPointForConnection === idx ? '#00f2fe' : '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(screenX, screenY, selectedPointForConnection === idx ? 9 : 7, 0, Math.PI * 2); ctx.stroke();
    });
}

// --- Tracking Coordinates Tracking Actions Hooks ---
function updateCoordsReadout(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const pX = clientX - rect.left;
    const pY = clientY - rect.top;
    let mX = (pX - offsetX) / scale;
    let mY = -(pY - offsetY) / scale;
    cursorCoords.textContent = `X: ${mX.toFixed(1)}, Y: ${mY.toFixed(1)}`;
    cursorCoords.style.left = `${pX + 15}px`;
    cursorCoords.style.top = `${pY + 15}px`;
}

// Check if user clicked close to an existing plotted coordinate point node
function findClickedPoint(pX, pY) {
    const a = parseFloat(mA.value) || 0;
    const b = parseFloat(mB.value) || 0;
    const c = parseFloat(mC.value) || 0;
    const d = parseFloat(mD.value) || 0;

    for (let i = 0; i < pointsArray.length; i++) {
        let pt = pointsArray[i];
        let tx = a * pt.x + b * pt.y;
        let ty = c * pt.x + d * pt.y;
        let sX = tx * scale + offsetX;
        let sY = -ty * scale + offsetY;
        
        if (Math.hypot(pX - sX, pY - sY) < 18) {
            return i;
        }
    }
    return null;
}

function handleCanvasClickAction(pX, pY) {
    if (canvasClickMode === 'plot') {
        // Enforce snapping to steps of 0.1 instead of 0.5 integers
        let exactX = Math.round(((pX - offsetX) / scale) * 10) / 10;
        let exactY = Math.round((-(pY - offsetY) / scale) * 10) / 10;
        const targetColors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502'];
        pointsArray.push({ x: exactX, y: exactY, color: targetColors[Math.floor(Math.random() * targetColors.length)] });
        
        if (pointsArray.length === 2 && canvasClickMode === 'connect') {
            connectPointsBtn.textContent = "Connect Nodes Linker";
        }
        syncPointsUI();
        render();
    } else if (canvasClickMode === 'connect') {
        const clickedIdx = findClickedPoint(pX, pY);
        if (clickedIdx !== null) {
            if (selectedPointForConnection === null) {
                selectedPointForConnection = clickedIdx;
                connectPointsBtn.textContent = "Select Match Node... 🔗";
                render();
            } else {
                if (selectedPointForConnection !== clickedIdx) {
                    // Prevent pushing clone configurations to matrix
                    const alreadyConnected = connectedLines.some(line => 
                        (line[0] === selectedPointForConnection && line[1] === clickedIdx) ||
                        (line[0] === clickedIdx && line[1] === selectedPointForConnection)
                    );
                    if (!alreadyConnected) {
                        connectedLines.push([selectedPointForConnection, clickedIdx]);
                    }
                }
                selectedPointForConnection = null;
                canvasClickMode = 'pan';
                connectPointsBtn.className = '';
                connectPointsBtn.textContent = "Connect Nodes Linker";
                render();
            }
        } else {
            showFloatingToast("Click directly onto a point node circle to connect it!");
        }
    }
}

// --- Universal Input Mouse & Desktop Handlers Navigation ---
canvas.addEventListener('mousemove', (e) => {
    updateCoordsReadout(e.clientX, e.clientY);
    if (!isDragging || canvasClickMode !== 'pan') return;
    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;
    render();
});

container.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const pX = e.clientX - rect.left;
    const pY = e.clientY - rect.top;

    if (canvasClickMode !== 'pan') {
        handleCanvasClickAction(pX, pY);
    } else {
        isDragging = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
    }
});

window.addEventListener('mouseup', () => isDragging = false);
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    scale = e.deltaY < 0 ? scale * 1.1 : scale / 1.1;
    if(scale < 5) scale = 5;
    render();
}, { passive: false });

// --- Comprehensive Mobile Touch Interaction Navigation ---
container.addEventListener('touchstart', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches.length === 1) {
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;
        const pX = clientX - rect.left;
        const pY = clientY - rect.top;

        if (canvasClickMode !== 'pan') {
            handleCanvasClickAction(pX, pY);
        } else {
            isDragging = true;
            startX = clientX - offsetX;
            startY = clientY - offsetY;
        }
    } else if (e.touches.length === 2) {
        isDragging = false;
        touchStartDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
}, { passive: true });

container.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isDragging && canvasClickMode === 'pan') {
        offsetX = e.touches[0].clientX - startX;
        offsetY = e.touches[0].clientY - startY;
        render();
    } else if (e.touches.length === 2) {
        const currentDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        const factor = currentDist / touchStartDist;
        if(Math.abs(factor - 1) > 0.02) {
            scale = factor > 1 ? scale * 1.05 : scale / 1.05;
            touchStartDist = currentDist;
            render();
        }
    }
}, { passive: true });

container.addEventListener('touchend', () => { isDragging = false; touchStartDist = 0; });

[eqInputX, eqInputY].forEach(el => el.addEventListener('input', () => { compileEquations(); render(); }));
[mA, mB, mC, mD].forEach(el => el.addEventListener('input', render));

resetBtn.addEventListener('click', () => {
    scale = 40; offsetX = canvas.width / 2; offsetY = canvas.height / 2;
    eqInputX.value = ""; eqInputY.value = "";
    mA.value = 1; mB.value = 0; mC.value = 0; mD.value = 1;
    pointsArray = [{ x: 2.0, y: 2.0, color: '#ff4757' }, { x: -3.0, y: 1.0, color: '#2ed573' }];
    connectedLines = [[0, 1]];
    selectedPointForConnection = null;
    canvasClickMode = 'pan';
    pointModeBtn.className = '';
    connectPointsBtn.className = '';
    pointModeBtn.textContent = "Plot Points (0.1)";
    connectPointsBtn.textContent = "Connect Nodes Linker";
    compileEquations(); syncPointsUI(); render();
});

function resizeCanvas() {
    canvas.width = container.clientWidth; canvas.height = container.clientHeight;
    if (offsetX === 0 && offsetY === 0) { offsetX = canvas.width / 2; offsetY = canvas.height / 2; }
    render();
}

window.addEventListener('resize', resizeCanvas);
compileEquations();
syncPointsUI();
resizeCanvas();