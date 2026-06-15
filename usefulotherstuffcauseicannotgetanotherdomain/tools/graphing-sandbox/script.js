const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');

// Inputs Configuration Handles
const eqInput = document.getElementById('eqInput');
const mA = document.getElementById('m-a');
const mB = document.getElementById('m-b');
const mC = document.getElementById('m-c');
const mD = document.getElementById('m-d');
const resetBtn = document.getElementById('resetBtn');

// Workspace Grid State variables
let scale = 40; // Pixels per math coordinate step unit
let offsetX = 0; // Relative offsets from center view
let offsetY = 0;
let isDragging = false;
let startX, startY;

// Sync view frame boundaries smoothly to device windows
function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    if (offsetX === 0 && offsetY === 0) {
        offsetX = canvas.width / 2;
        offsetY = canvas.height / 2;
    }
    render();
}

/**
 * Pre-processes natural student math input into safe JavaScript logic strings.
 * This makes it "understand anything" automatically.
 */
function preprocessExpression(str) {
    let expr = str.toLowerCase();

    // 1. Convert spaces out
    expr = expr.replace(/\s+/g, '');

    // 2. Fix implicit multiplication (e.g., 2x -> 2*x)
    expr = expr.replace(/(\d+)(x)/g, '$1*$2');
    expr = expr.replace(/(\))(x|\()/g, '$1*$2');
    expr = expr.replace(/(x|\))(\()/g, '$1*$2');

    // 3. Convert caret power notation (e.g., x^2 -> Math.pow(x,2))
    while (expr.includes('^')) {
        expr = expr.replace(/([x\d\.\)]+)\^([x\d\.\)]+)/g, 'Math.pow($1,$2)');
    }

    // 4. Map standard friendly trig/math functions to native JavaScript Math methods
    const mathFunctions = ['sin', 'cos', 'tan', 'abs', 'sqrt', 'log', 'exp', 'pi', 'e'];
    mathFunctions.forEach(f => {
        const regex = new RegExp(`\\b${f}\\b`, 'g');
        if (f === 'pi') {
            expr = expr.replace(regex, 'Math.PI');
        } else if (f === 'e') {
            expr = expr.replace(regex, 'Math.E');
        } else {
            expr = expr.replace(regex, `Math.${f}`);
        }
    });

    return expr;
}

// Standard Safe Evaluation Wrapper Function Block
function evaluateY(x) {
    try {
        const cleanExpression = preprocessExpression(eqInput.value);
        const safeEval = new Function('x', `return ${cleanExpression};`);
        const y = safeEval(x);
        return isNaN(y) || !isFinite(y) ? null : y;
    } catch (e) {
        return null; // Prevents crashing while typing equations
    }
}

// Function to handle the clickable macro menu matrix transformations instantly
window.applyPreset = function(a, b, c, d, defaultFormula) {
    mA.value = a;
    mB.value = b;
    mC.value = c;
    mD.value = d;
    eqInput.value = defaultFormula;
    render();
}

// Central Graph Engine Plot Engine Render Frame Update
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fetch current transformation parameters configuration array
    const a = parseFloat(mA.value) || 0;
    const b = parseFloat(mB.value) || 0;
    const c = parseFloat(mC.value) || 0;
    const d = parseFloat(mD.value) || 0;

    // --- 1. Background Cartesian Grid Graph Mesh Mapping ---
    ctx.strokeStyle = '#21262d';
    ctx.lineWidth = 1;

    // Draw vertical dynamic coordinates array paths
    const startGridX = Math.floor((-offsetX) / scale);
    const endGridX = Math.ceil((canvas.width - offsetX) / scale);
    for (let x = startGridX - 10; x <= endGridX + 10; x++) {
        ctx.beginPath();
        let topX = x * scale + offsetX;
        let topY = 0;
        let botX = x * scale + offsetX;
        let botY = canvas.height;
        
        ctx.moveTo(topX, topY);
        ctx.lineTo(botX, botY);
        ctx.stroke();
    }

    // Draw horizontal dynamic coordinates array paths
    const startGridY = Math.floor((-offsetY) / scale);
    const endGridY = Math.ceil((canvas.height - offsetY) / scale);
    for (let y = startGridY - 10; y <= endGridY + 10; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * scale + offsetY);
        ctx.lineTo(canvas.width, y * scale + offsetY);
        ctx.stroke();
    }

    // --- 2. Main Axis Lines ---
    ctx.strokeStyle = '#8b949e';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, offsetY); ctx.lineTo(canvas.width, offsetY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(offsetX, 0); ctx.lineTo(offsetX, canvas.height); ctx.stroke();

    // --- 3. Dynamic Function Mapping Transformation Engine ---
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let firstPoint = true;
    
    // Loop step iteration spans individual pixel values horizontally
    for (let pixelX = 0; pixelX < canvas.width; pixelX += 2) {
        let mathX = (pixelX - offsetX) / scale;
        let mathY = evaluateY(mathX);

        if (mathY !== null) {
            // Matix math transformation formula
            let transformedX = a * mathX + b * mathY;
            let transformedY = c * mathX + d * mathY;

            let screenX = transformedX * scale + offsetX;
            let screenY = -transformedY * scale + offsetY;

            if (firstPoint) {
                ctx.moveTo(screenX, screenY);
                firstPoint = false;
            } else {
                ctx.lineTo(screenX, screenY);
            }
        } else {
            firstPoint = true; 
        }
    }
    ctx.stroke();
}

// --- 4. Interactive Navigation Listeners ---
container.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;
    render();
});

window.addEventListener('mouseup', () => isDragging = false);

container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
        scale *= zoomFactor; // Zoom in
    } else {
        scale /= zoomFactor; // Zoom out
    }
    render();
}, { passive: false });

// Event triggers syncing inputs dynamically to view frames
[eqInput, mA, mB, mC, mD].forEach(element => {
    element.addEventListener('input', render);
});

resetBtn.addEventListener('click', () => {
    scale = 40;
    offsetX = canvas.width / 2;
    offsetY = canvas.height / 2;
    eqInput.value = ""; // Updated clean initial default string
    mA.value = 1; mB.value = 0; mC.value = 0; mD.value = 1;
    render();
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
