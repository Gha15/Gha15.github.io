/**
 * ============================================================================
 * MATIX LAB CORE RUNTIME SIMULATION MATRIX
 * ============================================================================
 * Graphing Sandbox Engine Framework - matixthemathclub.com Tool Suite
 * * Features:
 * - Dynamic Link Color Assignment Memory Buffers
 * - Universal Mouse Grid Vector Traversal & Dual Touch Pincers Scale
 * - Robust Equation Compiler (Implicit Curves and Explicit Maps)
 * - Topological Transformation State Matrix Descriptive Generators
 */

// --- SECTION 1: GLOBAL DEVICE AND COMPONENT LAYER HANDLES ---
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');

// Sidebar Value Configurations UI Elements
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

// Multi-Color Pathway Segment Configuration Nodes
const connectPointsBtn = document.getElementById('connectPointsBtn');
const lineColorIn = document.getElementById('lineColorIn');
const explanationDisplay = document.getElementById('matrix-explanation');

// --- SECTION 2: GLOBAL WORKSPACE CALCULATOR ENVIRONMENT CORES ---
let scale = 40; 
let offsetX = 0; 
let offsetY = 0;
let isDragging = false;
let startX, startY;

// Plotted Vector Node Struct Array Configurations
let pointsArray = [
    { x: 2.0, y: 2.0, color: '#ff4757' },
    { x: -3.0, y: 1.0, color: '#2ed573' }
];

let canvasClickMode = 'pan'; // System operations: 'pan', 'plot', or 'connect'
let touchStartDist = 0; 

// Track linkages containing individual custom hexadecimal path overrides
let connectedLines = [
    { from: 0, to: 1, pathColor: '#00f2fe' }
]; 
let selectedPointForConnection = null;

// Mathematical Compiled Token Evaluation Blocks
let compiledFnX = null;
let compiledFnY = null;
let isImplicitX = false;
let isImplicitY = false;

// --- SECTION 3: SYSTEM NOTIFICATION & TOAST MODAL PIPELINES ---
document.addEventListener("DOMContentLoaded", () => {
    const modalScrollTextContainer = document.querySelector("#welcome-modal .modal-scroll-text");
    if (modalScrollTextContainer) {
        modalScrollTextContainer.innerHTML = `
            <p style="margin-bottom: 14px; font-weight: 700; color: #00f2fe; letter-spacing: 0.5px; text-transform: uppercase;">🌌 Welcome to the Matix Graphic Laboratory</p>

            <p style="margin-bottom: 14px; color: #cbd5e1; line-height: 1.6; font-size: 0.85rem;">
                This interactive sandbox maps the visual behavior of a 2D vector space undergoing 
                a <strong>Linear Transformation</strong>. Instead of just solving abstract numerical equations on paper, 
                this environment lets you directly alter the coordinate system grid to see how geometric dimensions deform.
            </p>

            <p style="text-align: center; font-family: monospace; background: #060913; padding: 10px; border-radius: 6px; margin-bottom: 16px; color: #ffb86c; border: 1px solid #1e293b; font-size: 0.95rem;">
                M = [ [ a, b ], [ c, d ] ]
            </p>

            <p style="margin-bottom: 4px; font-weight: 700; color: #ff4757; font-size: 0.85rem;">Compass Tracking the Unit Basis Vectors:</p>
            <p style="margin-bottom: 14px; color: #cbd5e1; line-height: 1.6; font-size: 0.85rem;">
                The easiest way to understand any linear transformation is to watch where the standard unit vectors land. 
                By tracking these two lines, you can predict where <em>any</em> other point on the canvas will move:
                <br>• <strong style="color: #ff4757;">Vector i-hat (Red Line):</strong> Originally resting at (1, 0), its new coordinates correspond exactly to the <strong>first column</strong> of your matrix: <strong>(a, c)</strong>.
                <br>• <strong style="color: #2ed573;">Vector j-hat (Green Line):</strong> Originally resting at (0, 1), its new coordinates correspond exactly to the <strong>second column</strong> of your matrix: <strong>(b, d)</strong>.
            </p>

            <p style="margin-bottom: 4px; font-weight: 700; color: #ffb86c; font-size: 0.85rem;">📐 Crucial Concepts to Observe:</p>
            <ul style="margin-left: 18px; margin-bottom: 16px; list-style-type: square; line-height: 1.6; color: #cbd5e1; font-size: 0.85rem;">
                <li style="margin-bottom: 6px;">
                    <strong>The Determinant (ad - bc):</strong> This scalar value measures the <strong>area scaling factor</strong> of the grid cells. If a square has an area of 1 before transforming, its area becomes equal to the absolute value of the determinant afterward.
                </li>
                <li style="margin-bottom: 6px;">
                    <strong>Dimensional Collapse (Det = 0):</strong> When the determinant hits zero, the 2D plane completely squashes into a stagnant 1D line or a single point. This means information is permanently lost, making the operation mathematically <em>non-invertible</em>.
                </li>
                <li style="margin-bottom: 6px;">
                    <strong>Spatial Inversion (Det &lt; 0):</strong> A negative determinant indicates that the grid has been flipped or mirrored. Left-handed orientations switch places with right-handed ones.
                </li>
            </ul>

            <p style="margin-bottom: 8px; font-weight: 700; color: #4facfe; font-size: 0.85rem;">🕹️ Quick Sandbox Navigation Controls:</p>
            <p style="margin-bottom: 6px; color: #cbd5e1; font-size: 0.85rem;">• <strong>Canvas Navigation:</strong> Click and drag the background grid to pan. Use your mouse scroll wheel (or pinch-to-zoom on your mobile screen) to adjust the scale factor.</p>
            <p style="margin-bottom: 6px; color: #cbd5e1; font-size: 0.85rem;">• <strong>Plot Mode (0.1):</strong> Click to switch into Plot Mode and drop tracking nodes onto the canvas. Coordinates dynamically snap to precise 0.1 increments.</p>
            <p style="margin-bottom: 6px; color: #cbd5e1; font-size: 0.85rem;">• <strong>Connect Nodes Linker:</strong> Activate this tool, pick a custom color from the palette window, and select two distinct dots sequentially to stitch vector pathways together.</p>
        `;

        // Mobile Scroll Fix: Prevent background touch events from blocking modal div scrolling
        modalScrollTextContainer.style.maxHeight = "280px";
        modalScrollTextContainer.style.overflowY = "auto";
        modalScrollTextContainer.style.webkitOverflowScrolling = "touch"; // Fluid iOS momentum scrolling
        
        modalScrollTextContainer.addEventListener('touchmove', (e) => {
            e.stopPropagation(); // Stops background canvas from handling swipe actions
        }, { passive: true });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            welcomeModal.style.opacity = '0';
            setTimeout(() => welcomeModal.style.display = 'none', 300);
        });
    }
});

sidebarToggle.addEventListener('click', () => {
    if (controlPanel) {
        controlPanel.classList.toggle('active-mobile');
    }
});

/**
 * Pushes interactive error warning notifications to the core view layout frame overlay.
 * @param {string} message - Text notification context string.
 */
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
    }, 2800);
}

// --- SECTION 4: REALTIME ADVANCED MATRIX MECHANICS DESCRIPTOR ---
/**
 * Evaluates the current scalar transformation coordinate matrices to generate topological profiles.
 */
function updateAdvancedTransformationTextExplanation(a, b, c, d, det) {
    let analysisText = `Basis matrix i-hat maps to (${a.toFixed(1)}, ${c.toFixed(1)}) and j-hat maps to (${b.toFixed(1)}, ${d.toFixed(1)}). `;
    
    if (Math.abs(det) < 0.0001) {
        analysisText += "CRITICAL COLLAPSE: Your matrix determinant evaluates to zero. Space has completely flattened into a lower-dimensional 1D line tracking zone or 0D origin point. This linear modification is strictly non-invertible; spatial data inside the system collapses, causing overlapping vector equations across boundaries.";
    } else {
        analysisText += `GEOMETRIC DILATION RATIO: Area matrices across grid cells expand or contract by a spatial scalar absolute ratio factor of ${Math.abs(det).toFixed(2)}. `;
        
        if (det < 0) {
            analysisText += "SPACE INVERTED: The transformation maps your vectors into an inverted configuration. Clockwise coordinates transform into a counter-clockwise orientation field—reversing spatial flow similarly to geometric reflections across coordinate axes.";
        } else {
            analysisText += "SPACE STABLE: Normal clockwise/counter-clockwise hand-rule coordinate paths are structurally preserved across all grid coordinates.";
        }
        
        // Match specialized geometrical structures
        if (Math.abs(a * d - b * c - 1) < 0.01 && a === d && b === -c && b !== 0) {
            let degrees = Math.round(Math.atan2(c, a) * (180 / Math.PI));
            analysisText += ` STATE ANALYSIS: Actively processing an orthogonal transformation matrix, generating a rigid rotation of approximately ${degrees}° around the system origin point.`;
        } else if (b === 0 && c !== 0 && a === 1 && d === 1) {
            analysisText += " STATE ANALYSIS: System is handling a pure horizontal shear mapping. Vector levels distort horizontally relative to their height thresholds.";
        } else if (c === 0 && b !== 0 && a === 1 && d === 1) {
            analysisText += " STATE ANALYSIS: System is handling a pure vertical shear mapping. Structural vectors displace vertically proportional to their current horizontal position.";
        }
    }
    explanationDisplay.textContent = analysisText;
}

// --- SECTION 5: MATHEMATICAL STRING LEXER & TOKEN ENGINE ---
/**
 * Filters, conditions, and transforms raw functional strings into executable execution arrays.
 */
function preprocessExpression(str) {
    let expr = str.toLowerCase().replace(/\s+/g, '');
    
    expr = expr.replace(/(\d+)([xy])/g, '$1*$2');
    expr = expr.replace(/([xy])([xy])/g, '$1*$2');
    expr = expr.replace(/(\))([xy]|\()/g, '$1*$2');
    expr = expr.replace(/([xy]|\))(\()/g, '$1*$2');
    
    while (expr.includes('^')) {
        expr = expr.replace(/([xy\d\.\)]+)\^([xy\d\.\)]+)/g, 'Math.pow($1,$2)');
    }
    
    const mathematicalFunctionsList = ['sin', 'cos', 'tan', 'abs', 'sqrt', 'log', 'exp', 'pi', 'e'];
    mathematicalFunctionsList.forEach(funcKey => {
        const regexPattern = new RegExp(`\\b${funcKey}\\b`, 'g');
        if (funcKey === 'pi') {
            expr = expr.replace(regexPattern, 'Math.PI');
        } else if (funcKey === 'e') {
            expr = expr.replace(regexPattern, 'Math.E');
        } else {
            expr = expr.replace(regexPattern, `Math.${funcKey}`);
        }
    });
    
    return expr;
}

/**
 * Instantiates fresh operational mathematical curve equations cleanly inside local workspace scopes.
 */
function compileEquations() {
    compiledFnX = null; 
    compiledFnY = null;
    
    let rawX = eqInputX.value.trim();
    let rawY = eqInputY.value.trim();
    
    try {
        if (rawX) {
            if (rawX.includes('=')) {
                let formulaSplits = rawX.split('=');
                let processedString = `return (${preprocessExpression(formulaSplits[0])}) - (${preprocessExpression(formulaSplits[1])});`;
                compiledFnX = new Function('x', 'y', processedString);
                isImplicitX = true;
            } else {
                let processedString = `return ${preprocessExpression(rawX)};`;
                compiledFnX = new Function('x', processedString);
                isImplicitX = false;
            }
        }
    } catch (err) { compiledFnX = null; }
    
    try {
        if (rawY) {
            if (rawY.includes('=')) {
                let formulaSplits = rawY.split('=');
                let processedString = `return (${preprocessExpression(formulaSplits[0])}) - (${preprocessExpression(formulaSplits[1])});`;
                compiledFnY = new Function('x', 'y', processedString);
                isImplicitY = true;
            } else {
                let processedString = `return ${preprocessExpression(rawY)};`;
                compiledFnY = new Function('x', processedString);
                isImplicitY = false;
            }
        }
    } catch (err) { compiledFnY = null; }
}

// --- SECTION 6: DYNAMIC NODE ROW DOM TREE GENERATION MAPPERS ---
/**
 * Refreshes configuration field inputs inside the active sidebar layout framework components.
 */
function syncPointsUI() {
    if (!pointsListContainer) return;
    pointsListContainer.innerHTML = '';
    
    pointsArray.forEach((pointItem, index) => {
        const pointRowElement = document.createElement('div');
        pointRowElement.className = 'point-row';
        
        let roundedXValue = Math.round(pointItem.x * 10) / 10;
        let roundedYValue = Math.round(pointItem.y * 10) / 10;
        
        pointRowElement.innerHTML = `
            <span class="point-indicator-dot" style="color:${pointItem.color}; background-color:${pointItem.color}"></span>
            <input type="number" step="0.1" class="pt-coord-in" value="${roundedXValue}" data-idx="${index}" data-coord="x" aria-label="Node ${index} Coordinate X">
            <input type="number" step="0.1" class="pt-coord-in" value="${roundedYValue}" data-idx="${index}" data-coord="y" aria-label="Node ${index} Coordinate Y">
            <button class="btn-del-pt" data-idx="${index}" aria-label="Delete Node ${index}">\u00D7</button>
        `;
        pointsListContainer.appendChild(pointRowElement);
    });
    
    // Bind change detection loops on runtime numerical entry blocks
    document.querySelectorAll('.pt-coord-in').forEach(coordInputField => {
        coordInputField.addEventListener('input', (event) => {
            const indexKey = parseInt(event.target.dataset.idx);
            const targetCoordAxis = event.target.dataset.coord;
            let rawParsedFloat = parseFloat(event.target.value);
            
            pointsArray[indexKey][targetCoordAxis] = Math.round((rawParsedFloat || 0) * 10) / 10;
            render();
        });
    });

    // Handle structural deletion updates safely across connected path nodes arrays
    document.querySelectorAll('.btn-del-pt').forEach(deleteRowButton => {
        deleteRowButton.addEventListener('click', () => {
            const targetIndexKey = parseInt(deleteRowButton.dataset.idx);
            pointsArray.splice(targetIndexKey, 1);
            
            // Clean out dead linkages and adjust indices to prevent path drift
            connectedLines = connectedLines.filter(lineSegment => {
                return lineSegment.from !== targetIndexKey && lineSegment.to !== targetIndexKey;
            }).map(lineSegment => {
                let adjustedFrom = lineSegment.from > targetIndexKey ? lineSegment.from - 1 : lineSegment.from;
                let adjustedTo = lineSegment.to > targetIndexKey ? lineSegment.to - 1 : lineSegment.to;
                return { from: adjustedFrom, to: adjustedTo, pathColor: lineSegment.pathColor };
            });

            if (selectedPointForConnection === targetIndexKey) {
                selectedPointForConnection = null;
            } else if (selectedPointForConnection > targetIndexKey) {
                selectedPointForConnection--;
            }

            syncPointsUI();
            render();
        });
    });
}

// --- SECTION 7: INTERACTIVE SELECTION MODE OPERATIONAL HANDLERS ---
addPointRowBtn.addEventListener('click', () => {
    const vectorColorPalettesList = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#eccc68', '#9b59b6'];
    const assignedRandomColor = vectorColorPalettesList[Math.floor(Math.random() * vectorColorPalettesList.length)];
    
    pointsArray.push({ x: 1.0, y: 1.0, color: assignedRandomColor });
    syncPointsUI();
    render();
});

pointModeBtn.addEventListener('click', () => {
    selectedPointForConnection = null;
    if (canvasClickMode !== 'plot') {
        canvasClickMode = 'plot';
        pointModeBtn.className = 'active-mode';
        connectPointsBtn.className = '';
        pointModeBtn.textContent = "Mode: Plotting (0.1) 📍";
        connectPointsBtn.textContent = "Connect Nodes Linker";
    } else {
        canvasClickMode = 'pan';
        pointModeBtn.className = '';
        pointModeBtn.textContent = "Plot Mode (0.1)";
    }
    render();
});

connectPointsBtn.addEventListener('click', () => {
    selectedPointForConnection = null;
    
    if (pointsArray.length === 0) {
        showFloatingToast("Plot vector nodes on your coordinate map canvas first.");
        return;
    }
    if (pointsArray.length === 1) {
        showFloatingToast("You need at least 2 plotted nodes to establish an interface connection link path.");
        return;
    }

    if (canvasClickMode !== 'connect') {
        canvasClickMode = 'connect';
        connectPointsBtn.className = 'active-mode';
        pointModeBtn.className = '';
        pointModeBtn.textContent = "Plot Mode (0.1)";
        connectPointsBtn.textContent = "Select 2 Nodes... 🔗";
    } else {
        canvasClickMode = 'pan';
        connectPointsBtn.className = '';
        connectPointsBtn.textContent = "Connect Nodes Linker";
    }
    render();
});

// --- SECTION 8: GRAPHICS CORE CORE DATA FRAME RENDERING PROCESS ---
function render() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const aVal = parseFloat(mA.value) || 0;
    const bVal = parseFloat(mB.value) || 0;
    const cVal = parseFloat(mC.value) || 0;
    const dVal = parseFloat(mD.value) || 0;

    const calculatedDeterminant = (aVal * dVal) - (bVal * cVal);
    detDisplay.textContent = calculatedDeterminant.toFixed(2);
    updateAdvancedTransformationTextExplanation(aVal, bVal, cVal, dVal, calculatedDeterminant);

    // 1. RENDER BACKGROUND MATRIX COORD MESH LINES
    ctx.strokeStyle = 'rgba(208, 208, 208, 0.4)';
    ctx.lineWidth = 1;

    const startBoundaryGridX = Math.floor((-offsetX) / scale);
    const endBoundaryGridX = Math.ceil((canvas.width - offsetX) / scale);
    for (let xCoordIdx = startBoundaryGridX - 10; xCoordIdx <= endBoundaryGridX + 10; xCoordIdx++) {
        ctx.beginPath();
        let computedCanvasPositionX = xCoordIdx * scale + offsetX;
        ctx.moveTo(computedCanvasPositionX, 0);
        ctx.lineTo(computedCanvasPositionX, canvas.height);
        ctx.stroke();
    }

    const startBoundaryGridY = Math.floor((-offsetY) / scale);
    const endBoundaryGridY = Math.ceil((canvas.height - offsetY) / scale);
    for (let yCoordIdx = startBoundaryGridY - 10; yCoordIdx <= endBoundaryGridY + 10; yCoordIdx++) {
        ctx.beginPath();
        let computedCanvasPositionY = yCoordIdx * scale + offsetY;
        ctx.moveTo(0, computedCanvasPositionY);
        ctx.lineTo(canvas.width, computedCanvasPositionY);
        ctx.stroke();
    }

    // 2. DRAW MAIN ORIGIN AXIS SPLINE BOUNDARIES
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, offsetY);
    ctx.lineTo(canvas.width, offsetY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(offsetX, 0);
    ctx.lineTo(offsetX, canvas.height);
    ctx.stroke();

    // 3. DRAW UNIQUE USER-DEFINED INTER-CONNECTED SCALAR SEPARATED LINES
    ctx.lineWidth = 2.5;
    connectedLines.forEach(lineSegment => {
        const sourcePointNode = pointsArray[lineSegment.from];
        const destinationPointNode = pointsArray[lineSegment.to];
        
        if (sourcePointNode && destinationPointNode) {
            let transformedSourceX = aVal * sourcePointNode.x + bVal * sourcePointNode.y;
            let transformedSourceY = cVal * sourcePointNode.x + dVal * sourcePointNode.y;
            let transformedDestX = aVal * destinationPointNode.x + bVal * destinationPointNode.y;
            let transformedDestY = cVal * destinationPointNode.x + dVal * destinationPointNode.y;
            
            ctx.strokeStyle = lineSegment.pathColor || '#00f2fe';
            ctx.beginPath();
            ctx.moveTo(transformedSourceX * scale + offsetX, -transformedSourceY * scale + offsetY);
            ctx.lineTo(transformedDestX * scale + offsetX, -transformedDestY * scale + offsetY);
            ctx.stroke();
        }
    });

    // 4. GENERATE RED / GREEN TRANSFORMATION HARDWARE UNIT VECTORS
    ctx.lineWidth = 3.5;
    
    // Render transformed i-hat target vector direction
    ctx.strokeStyle = '#ff4757'; 
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo((aVal * scale) + offsetX, -(cVal * scale) + offsetY);
    ctx.stroke();

    // Render transformed j-hat target vector direction
    ctx.strokeStyle = '#2ed573'; 
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo((bVal * scale) + offsetX, -(dVal * scale) + offsetY);
    ctx.stroke();

    // 5. EVALUATE COMPILING EQUATION PATTERNS WITHIN CANVAS MAPS
    if (compiledFnX || compiledFnY) {
        ctx.fillStyle = 'rgba(0, 242, 254, 0.75)';
        const pixelStepResolution = 2; 
        const proximityTolerance = 1.8 / scale;

        for (let canvasPixelX = 0; canvasPixelX < canvas.width; canvasPixelX += pixelStepResolution) {
            for (let canvasPixelY = 0; canvasPixelY < canvas.height; canvasPixelY += pixelStepResolution) {
                let initialMathX = (canvasPixelX - offsetX) / scale;
                let initialMathY = -(canvasPixelY - offsetY) / scale;
                
                let evaluationMatchX = false;
                let evaluationMatchY = false;
                
                try {
                    if (compiledFnX) {
                        evaluationMatchX = isImplicitX ? 
                            (Math.abs(compiledFnX(initialMathX, initialMathY)) < proximityTolerance) : 
                            (Math.abs(initialMathY - compiledFnX(initialMathX)) < proximityTolerance);
                    }
                    if (compiledFnY) {
                        evaluationMatchY = isImplicitY ? 
                            (Math.abs(compiledFnY(initialMathX, initialMathY)) < proximityTolerance) : 
                            (Math.abs(initialMathY - compiledFnY(initialMathX)) < proximityTolerance);
                    }
                } catch (calcError) { continue; }

                if (evaluationMatchX || evaluationMatchY) {
                    let dynamicRenderX = aVal * initialMathX + bVal * initialMathY;
                    let dynamicRenderY = cVal * initialMathX + dVal * initialMathY;
                    
                    ctx.fillRect(
                        dynamicRenderX * scale + offsetX, 
                        -dynamicRenderY * scale + offsetY, 
                        2.5, 2.5
                    );
                }
            }
        }
    }

    // 6. DRAW VECTOR SPACE PLOTTED NODE INTERACTION BUBBLES
    pointsArray.forEach((pointInstance, idx) => {
        let matrixShiftedX = aVal * pointInstance.x + bVal * pointInstance.y;
        let matrixShiftedY = cVal * pointInstance.x + dVal * pointInstance.y;
        
        let screenCoordinatesX = matrixShiftedX * scale + offsetX;
        let screenCoordinatesY = -matrixShiftedY * scale + offsetY;

        ctx.fillStyle = pointInstance.color;
        
        if (selectedPointForConnection === idx) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffffff';
        } else {
            ctx.shadowBlur = 12;
            ctx.shadowColor = pointInstance.color;
        }
        
        ctx.beginPath();
        ctx.arc(screenCoordinatesX, screenCoordinatesY, selectedPointForConnection === idx ? 9 : 6.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.strokeStyle = selectedPointForConnection === idx ? '#00f2fe' : '#ffffff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(screenCoordinatesX, screenCoordinatesY, selectedPointForConnection === idx ? 10 : 7.5, 0, Math.PI * 2);
        ctx.stroke();
    });
}

// --- SECTION 9: DESKTOP MOUSE HANDLERS & NAVIGATION PIPES ---
function updateCoordsReadout(clientX, clientY) {
    const boundingRectangle = canvas.getBoundingClientRect();
    const currentCursorX = clientX - boundingRectangle.left;
    const currentCursorY = clientY - boundingRectangle.top;
    
    let rawMathSpaceCoordX = (currentCursorX - offsetX) / scale;
    let rawMathSpaceCoordY = -(currentCursorY - offsetY) / scale;
    
    cursorCoords.textContent = `X: ${rawMathSpaceCoordX.toFixed(1)}, Y: ${rawMathSpaceCoordY.toFixed(1)}`;
    cursorCoords.style.left = `${currentCursorX + 15}px`;
    cursorCoords.style.top = `${currentCursorY + 15}px`;
}

function findClickedPoint(pX, pY) {
    const aFactor = parseFloat(mA.value) || 0;
    const bFactor = parseFloat(mB.value) || 0;
    const cFactor = parseFloat(mC.value) || 0;
    const dFactor = parseFloat(mD.value) || 0;

    for (let pointIndex = 0; pointIndex < pointsArray.length; pointIndex++) {
        let nodeInstance = pointsArray[pointIndex];
        let transformedPositionX = aFactor * nodeInstance.x + bFactor * nodeInstance.y;
        let transformedPositionY = cFactor * nodeInstance.x + dFactor * nodeInstance.y;
        
        let screenTargetX = transformedPositionX * scale + offsetX;
        let screenTargetY = -transformedPositionY * scale + offsetY;
        
        if (Math.hypot(pX - screenTargetX, pY - screenTargetY) < 20) {
            return pointIndex;
        }
    }
    return null;
}

function handleCanvasClickAction(pX, pY) {
    if (canvasClickMode === 'plot') {
        let snappedMathCoordinateX = Math.round(((pX - offsetX) / scale) * 10) / 10;
        let snappedMathCoordinateY = Math.round((-(pY - offsetY) / scale) * 10) / 10;
        
        const randomPaletteList = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#00f2fe', '#eccc68'];
        let chosenColorSeed = randomPaletteList[Math.floor(Math.random() * randomPaletteList.length)];
        
        pointsArray.push({ x: snappedMathCoordinateX, y: snappedMathCoordinateY, color: chosenColorSeed });
        syncPointsUI();
        render();
    } else if (canvasClickMode === 'connect') {
        const clickedPointTargetIdx = findClickedPoint(pX, pY);
        
        if (clickedPointTargetIdx !== null) {
            if (selectedPointForConnection === null) {
                selectedPointForConnection = clickedPointTargetIdx;
                connectPointsBtn.textContent = "Select Target Node... 🔗";
                render();
            } else {
                if (selectedPointForConnection !== clickedPointTargetIdx) {
                    const isAlreadyInterconnected = connectedLines.some(line => {
                        return (line.from === selectedPointForConnection && line.to === clickedPointTargetIdx) ||
                               (line.from === clickedPointTargetIdx && line.to === selectedPointForConnection);
                    });
                    
                    if (!isAlreadyInterconnected) {
                        connectedLines.push({ 
                            from: selectedPointForConnection, 
                            to: clickedPointTargetIdx, 
                            pathColor: lineColorIn.value 
                        });
                    }
                }
                selectedPointForConnection = null;
                canvasClickMode = 'pan';
                connectPointsBtn.className = '';
                connectPointsBtn.textContent = "Connect Nodes Linker";
                render();
            }
        } else {
            showFloatingToast("Tap directly on an active plotted node connection hub target.");
        }
    }
}

canvas.addEventListener('mousemove', (event) => {
    updateCoordsReadout(event.clientX, event.clientY);
    if (!isDragging || canvasClickMode !== 'pan') return;
    
    offsetX = event.clientX - startX;
    offsetY = event.clientY - startY;
    render();
});

container.addEventListener('mousedown', (event) => {
    const trackingBoxRect = canvas.getBoundingClientRect();
    const positionClickCanvasX = event.clientX - trackingBoxRect.left;
    const positionClickCanvasY = event.clientY - trackingBoxRect.top;

    if (canvasClickMode !== 'pan') {
        handleCanvasClickAction(positionClickCanvasX, positionClickCanvasY);
    } else {
        isDragging = true;
        startX = event.clientX - offsetX;
        startY = event.clientY - offsetY;
    }
});

window.addEventListener('mouseup', () => { isDragging = false; });

container.addEventListener('wheel', (event) => {
    event.preventDefault();
    scale = event.deltaY < 0 ? scale * 1.15 : scale / 1.15;
    if (scale < 6) scale = 6;
    if (scale > 350) scale = 350;
    render();
}, { passive: false });

// --- SECTION 10: MOBILE MULTI-TOUCH GESTURE ENGINES ---
container.addEventListener('touchstart', (event) => {
    const spatialRectBound = canvas.getBoundingClientRect();
    
    if (event.touches.length === 1) {
        const primaryTouchPointX = event.touches[0].clientX;
        const primaryTouchPointY = event.touches[0].clientY;
        const relativeCanvasTouchX = primaryTouchPointX - spatialRectBound.left;
        const relativeCanvasTouchY = primaryTouchPointY - spatialRectBound.top;
        
        updateCoordsReadout(primaryTouchPointX, primaryTouchPointY);

        if (canvasClickMode !== 'pan') {
            handleCanvasClickAction(relativeCanvasTouchX, relativeCanvasTouchY);
        } else {
            isDragging = true;
            startX = primaryTouchPointX - offsetX;
            startY = primaryTouchPointY - offsetY;
        }
    } else if (event.touches.length === 2) {
        isDragging = false;
        touchStartDist = Math.hypot(
            event.touches[0].clientX - event.touches[1].clientX,
            event.touches[0].clientY - event.touches[1].clientY
        );
    }
}, { passive: true });

container.addEventListener('touchmove', (event) => {
    if (event.touches.length === 1 && isDragging && canvasClickMode === 'pan') {
        offsetX = event.touches[0].clientX - startX;
        offsetY = event.touches[0].clientY - startY;
        updateCoordsReadout(event.touches[0].clientX, event.touches[0].clientY);
        render();
    } else if (event.touches.length === 2) {
        const activeTouchDistanceSpan = Math.hypot(
            event.touches[0].clientX - event.touches[1].clientX,
            event.touches[0].clientY - event.touches[1].clientY
        );
        
        const velocityScalingFactor = activeTouchDistanceSpan / touchStartDist;
        if (Math.abs(velocityScalingFactor - 1) > 0.005) {
            scale = velocityScalingFactor > 1 ? scale * 1.05 : scale / 1.05;
            if (scale < 6) scale = 6;
            if (scale > 350) scale = 350;
            
            touchStartDist = activeTouchDistanceSpan;
            render();
        }
    }
}, { passive: true });

container.addEventListener('touchend', () => {
    isDragging = false;
    touchStartDist = 0;
});

// --- SECTION 11: SYSTEM SYSTEM TRIGGER HANDLERS ---
[eqInputX, eqInputY].forEach(inputNodeElement => {
    inputNodeElement.addEventListener('input', () => {
        compileEquations();
        render();
    });
});

[mA, mB, mC, mD].forEach(matrixInputElement => {
    matrixInputElement.addEventListener('input', () => { render(); });
});

lineColorIn.addEventListener('input', () => { render(); });

resetBtn.addEventListener('click', () => {
    scale = 40;
    offsetX = canvas.width / 2;
    offsetY = canvas.height / 2;
    
    eqInputX.value = "";
    eqInputY.value = "";
    mA.value = 1; mB.value = 0; mC.value = 0; mD.value = 1;
    
    pointsArray = [
        { x: 2.0, y: 2.0, color: '#ff4757' },
        { x: -3.0, y: 1.0, color: '#2ed573' }
    ];
    
    connectedLines = [{ from: 0, to: 1, pathColor: '#00f2fe' }];
    selectedPointForConnection = null;
    canvasClickMode = 'pan';
    
    pointModeBtn.className = '';
    connectPointsBtn.className = '';
    pointModeBtn.textContent = "Plot Mode (0.1)";
    connectPointsBtn.textContent = "Connect Nodes Linker";
    
    compileEquations();
    syncPointsUI();
    render();
});

function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    if (offsetX === 0 && offsetY === 0) {
        offsetX = canvas.width / 2;
        offsetY = canvas.height / 2;
    }
    render();
}

window.addEventListener('resize', resizeCanvas);
compileEquations();
syncPointsUI();
resizeCanvas();