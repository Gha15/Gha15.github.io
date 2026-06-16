/**
 * ============================================================================
 * MATRIX LAB - LINEAR TRANSFORMATION GRAPHICS ENGINE
 * ============================================================================
 * Core Sandbox Engineering Script 
 * * Includes:
 * - High-Precision Canvas Matrix Renderer
 * - 0.1 Grid Snapping & Node Spline Connection Subsystems
 * - Custom String Tokenizer and Function Mathematical Parser
 * - Adaptive Realtime Topological Descriptor Engine
 * - Advanced Cross-Platform Mouse & Touch Gesture Controllers
 */

// --- SECTION 1: GLOBAL APPLICATION HARDWARE INTERFACE HANDLES ---
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');

// Element Configuration UI Handles
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

// Interactive Node Connections Handles
const connectPointsBtn = document.getElementById('connectPointsBtn');
const lineColorIn = document.getElementById('lineColorIn');
const explanationDisplay = document.getElementById('matrix-explanation');

// --- SECTION 2: LABORATORY STATE SPACE CONTROL MANAGEMENT ---
let scale = 40; 
let offsetX = 0; 
let offsetY = 0;
let isDragging = false;
let startX, startY;

// Dynamic Point Vector Configurations (Cleanly initialized)
let pointsArray = [
    { x: 2.0, y: 2.0, color: '#ff4757' },
    { x: -3.0, y: 1.0, color: '#2ed573' }
];

let canvasClickMode = 'pan'; // States: 'pan', 'plot', or 'connect'
let touchStartDist = 0; 

// Structural Interconnection Map Arrays
let connectedLines = [[0, 1]]; 
let selectedPointForConnection = null;

// Compiled Functional Analytical Buffers
let compiledFnX = null;
let compiledFnY = null;
let isImplicitX = false;
let isImplicitY = false;

// --- SECTION 3: SYSTEM NOTIFICATION & TOAST MODAL PIPELINES ---

// Inject the comprehensive mathematical explanation into the welcome modal on startup
document.addEventListener("DOMContentLoaded", () => {
    const modalContent = document.querySelector("#welcome-modal .modal-content");
    if (modalContent) {
        modalContent.innerHTML = `
            <h2 style="margin-bottom: 15px; font-size: 1.6rem;">Welcome to <span style="background: linear-gradient(135deg, #00f2fe, #4facfe); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-style: italic; font-weight: 800;">Matix Graphing sandbox</span></h2>
            
            <div class="modal-scroll-text" style="text-align: left; max-height: 320px; overflow-y: auto; padding-right: 10px; margin-bottom: 20px; font-size: 0.85rem; line-height: 1.6; color: #e2e8f0;">
                <p style="margin-bottom: 12px; font-weight: 600; color: #00f2fe;">🌌 LINEAR TRANSFORMATIONS & MATRIX SPACES</p>
                <p style="margin-bottom: 12px;">By manipulating the grid values, you are altering the linear fabric of the Cartesian plane under a 2D transformation matrix $M$:</p>
                <p style="text-align: center; font-family: monospace; background: #080b11; padding: 6px; border-radius: 4px; margin-bottom: 12px; color: #ffb86c;">M = [ [ a, b ], [ c, d ] ]</p>
                
                <p style="margin-bottom: 6px; font-weight: 600; color: #ff4757;">🧭 Basis Vector i-hat (Red Line):</p>
                <p style="margin-bottom: 12px;">Originally at (1, 0), its transformed destination tracks perfectly to the first column of your matrix matrix: <strong>(a, c)</strong>.</p>
                
                <p style="margin-bottom: 6px; font-weight: 600; color: #2ed573;">🧭 Basis Vector j-hat (Green Line):</p>
                <p style="margin-bottom: 12px;">Originally at (0, 1), its transformed destination tracks perfectly to the second column of your matrix: <strong>(b, d)</strong>.</p>
                
                <p style="margin-bottom: 6px; font-weight: 600; color: #ffb86c;">📐 Structural Mechanics to Watch:</p>
                <ul style="margin-left: 15px; margin-bottom: 12px; list-style-type: square;">
                    <li style="margin-bottom: 6px;"><strong>Determinant (ad - bc):</strong> Acts as the absolute area scaling factor of the grid space.</li>
                    <li style="margin-bottom: 6px;"><strong>Spatial Collapse (Det = 0):</strong> The 2D grid flatlines into a 1D vector track. Information is lost, meaning the operation cannot be mathematically inverted.</li>
                    <li style="margin-bottom: 6px;"><strong>Orientation Flip (Det &lt; 0):</strong> The plane mirrors upside down, converting clockwise node tracking setups into counter-clockwise configurations.</li>
                </ul>

                <p style="margin-bottom: 6px; font-weight: 600; color: #4facfe;">🕹️ Quick Sandbox Controls:</p>
                <p style="margin-bottom: 4px;">• <strong>Pan/Zoom:</strong> Click + drag background / Scroll mouse wheel.</p>
                <p style="margin-bottom: 4px;">• <strong>Precision Plotting:</strong> Toggle Plot Mode to map nodes snapping directly to 0.1 increments.</p>
                <p style="margin-bottom: 4px;">• <strong>Node Connector:</strong> Click Linker, then select 2 node dots sequentially to bridge vector paths.</p>
            </div>
            
            <button id="closeModalBtn" style="background: linear-gradient(135deg, #00f2fe, #4facfe); border: none; padding: 12px; width: 100%; border-radius: 6px; font-weight: 700; color: #fff; cursor: pointer; transition: opacity 0.2s;">Enter Sandbox</button>
        `;
        
        // Re-bind the click tracking mechanism to dismantle the modal cleanly on click
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            if (welcomeModal) {
                welcomeModal.style.opacity = '0';
                setTimeout(() => welcomeModal.style.display = 'none', 300);
            }
        });
    }
});
function showFloatingToast(message) {
    let oldToast = document.getElementById('canvas-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'canvas-toast';
    toast.textContent = message;
    container.appendChild(toast);

    // Smooth UI opacity fade out routines
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

// --- SECTION 4: REALTIME ADVANCED MATRIX MECHANICS DESCRIPTOR ---
/**
 * Performs topological structural evaluation on the current spatial transformation matrix.
 * Provides deep contextual mathematical analytics directly to the interface layout viewport.
 */
function updateAdvancedTransformationTextExplanation(a, b, c, d, det) {
    let analysisText = `Basis vector i-hat \u2192 (${a.toFixed(1)}, ${c.toFixed(1)}) and j-hat \u2192 (${b.toFixed(1)}, ${d.toFixed(1)}). `;
    
    // Check for dimensional subspace structural compression criteria
    if (Math.abs(det) < 0.0001) {
        analysisText += "CRITICAL COLLAPSE DETECTED: This linear transformation matrix results in a spatial determinant of zero. The complete 2D coordinate grid has collapsed into a flat 1D single vector track or a 0D origin node point. Consequently, all tracking metrics within the system area dimension values evaluate strictly to zero. This operation is singular and completely non-invertible, meaning previous structural states cannot be recovered mathematically because multiple independent points are mapped onto identical spatial targets.";
    } else {
        analysisText += `GEOMETRIC RATIO ANALYSIS: The altered vector plane shifts structural boundaries outwards or inwards, expanding or compressing area matrices uniformly by an absolute scalar factor of ${Math.abs(det).toFixed(2)}. `;
        
        if (det < 0) {
            analysisText += "SPACE ORIENTATION INVERTED: The transformation matrix has flipped the global grid alignment context entirely. Clockwise coordinate loops transition into counter-clockwise fields. This behaves similarly to a spatial reflection across custom vector thresholds, mirror-imaging the relative node tracking paths while scaling system boundaries safely.";
        } else {
            analysisText += "SPACE ORIENTATION STABLE: The structural mapping preserves the standard hand-rule orientation flow across all calculated outputs. Vector systems twist, skew, or expand cleanly without experiencing reflective coordinate inversions.";
        }
        
        // Append additional geometric mechanics insights based on special configurations
        if (Math.abs(a * d - b * c - 1) < 0.01 && a === d && b === -c && b !== 0) {
            let degrees = Math.round(Math.atan2(c, a) * (180 / Math.PI));
            analysisText += ` SPECIAL STATE: This operation behaves as a clean, rigid, non-destructive orthogonal transformation, rotating the space field by approximately ${degrees}° around the coordinate origin.`;
        } else if (b === 0 && c !== 0 && a === 1 && d === 1) {
            analysisText += " SPECIAL STATE: This matrix represents a horizontal shear transformation mapping variation, where points slide parallel to the horizontal axis by a factor proportional to their vertical height.";
        } else if (c === 0 && b !== 0 && a === 1 && d === 1) {
            analysisText += " SPECIAL STATE: This matrix represents a vertical shear transformation mapping variation, dragging coordinate nodes parallel to the vertical axis vector systems.";
        }
    }
    
    explanationDisplay.textContent = analysisText;
}

// --- SECTION 5: MATHEMATICAL EXPRESSION PARSER & LEXICAL LEXER ---
/**
 * Tokenizes, processes, and sanitizes input mathematical text strings.
 * Safely standardizes explicit vs implicit algebra formats into clean JavaScript Math runtime logic hooks.
 * @param {string} str - Raw text formula input by user.
 * @returns {string} Prepared runnable JavaScript computational script code.
 */
function preprocessExpression(str) {
    let expr = str.toLowerCase().replace(/\s+/g, '');
    
    // Inject syntax correction multipliers safely for algebraic shorthand (e.g. 2x -> 2*x)
    expr = expr.replace(/(\d+)([xy])/g, '$1*$2');
    expr = expr.replace(/([xy])([xy])/g, '$1*$2');
    expr = expr.replace(/(\))([xy]|\()/g, '$1*$2');
    expr = expr.replace(/([xy]|\))(\()/g, '$1*$2');
    
    // Process power caret symbol syntax trees via structured text substitution loops
    while (expr.includes('^')) {
        expr = expr.replace(/([xy\d\.\)]+)\^([xy\d\.\)]+)/g, 'Math.pow($1,$2)');
    }
    
    // Standardize recognized mathematical engine native functional arrays
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
 * Compiles user algebraic string equations into high-speed executable execution functions.
 * Handles explicit tracking and absolute root equations safely.
 */
function compileEquations() {
    compiledFnX = null; 
    compiledFnY = null;
    
    let rawX = eqInputX.value.trim();
    let rawY = eqInputY.value.trim();
    
    // Compile functional pipelines for Equation system X components
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
    } catch (err) {
        compiledFnX = null;
    }
    
    // Compile functional pipelines for Equation system Y components
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
    } catch (err) {
        compiledFnY = null;
    }
}

// --- SECTION 6: DYNAMIC NODE INTERFACE LAYER & DOM CONTEXT SYNC ---
/**
 * Synchronizes local point position arrays out to matching sidebar DOM control components.
 * Reinjects state configuration elements to maintain a reactive data flow pipeline.
 */
function syncPointsUI() {
    if (!pointsListContainer) return;
    pointsListContainer.innerHTML = '';
    
    pointsArray.forEach((pointItem, index) => {
        const pointRowElement = document.createElement('div');
        pointRowElement.className = 'point-row';
        
        // Round values cleanly to exactly 0.1 decimal steps for UI display synchronization
        let roundedXValue = Math.round(pointItem.x * 10) / 10;
        let roundedYValue = Math.round(pointItem.y * 10) / 10;
        
        pointRowElement.innerHTML = `
            <span class="point-indicator-dot" style="background:${pointItem.color}"></span>
            <input type="number" step="0.1" class="pt-coord-in" value="${roundedXValue}" data-idx="${index}" data-coord="x">
            <input type="number" step="0.1" class="pt-coord-in" value="${roundedYValue}" data-idx="${index}" data-coord="y">
            <button class="btn-del-pt" data-idx="${index}">\u00D7</button>
        `;
        pointsListContainer.appendChild(pointRowElement);
    });
    
    // Reattach structural change validation monitoring callbacks onto generated input row blocks
    document.querySelectorAll('.pt-coord-in').forEach(coordInputField => {
        coordInputField.addEventListener('input', (event) => {
            const indexKey = parseInt(event.target.dataset.idx);
            const targetCoordAxis = event.target.dataset.coord;
            let rawParsedFloat = parseFloat(event.target.value);
            
            // Apply high precision decimal stepping limits
            pointsArray[indexKey][targetCoordAxis] = Math.round((rawParsedFloat || 0) * 10) / 10;
            render();
        });
    });

    // Attach deletion tracking loops to clean mutations safely out of local stack arrays
    document.querySelectorAll('.btn-del-pt').forEach(deleteRowButton => {
        deleteRowButton.addEventListener('click', () => {
            const targetIndexKey = parseInt(deleteRowButton.dataset.idx);
            pointsArray.splice(targetIndexKey, 1);
            
            // Perform algorithmic filter sweeps across paths mapping indexes to offset truncation drift
            connectedLines = connectedLines.filter(lineConnectionMap => {
                return lineConnectionMap[0] !== targetIndexKey && lineConnectionMap[1] !== targetIndexKey;
            }).map(lineConnectionMap => {
                let firstNodeIndex = lineConnectionMap[0] > targetIndexKey ? lineConnectionMap[0] - 1 : lineConnectionMap[0];
                let secondNodeIndex = lineConnectionMap[1] > targetIndexKey ? lineConnectionMap[1] - 1 : lineConnectionMap[1];
                return [firstNodeIndex, secondNodeIndex];
            });

            // Adjust edge connection state points
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

// --- SECTION 7: INTERACTIVE WORKSPACE CONTROL SELECTION CLICK LIFECYCLES ---
addPointRowBtn.addEventListener('click', () => {
    const vectorColorPalettesList = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#eccc68', '#9b59b6'];
    const assignedRandomColor = vectorColorPalettesList[Math.floor(Math.random() * vectorColorPalettesList.length)];
    
    // Add point cleanly at standard 1.0 step coordinates
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
        pointModeBtn.textContent = "Mode: Plotting (0.1) \uD83D\uDCCD";
        connectPointsBtn.textContent = "Connect Nodes Linker";
    } else {
        canvasClickMode = 'pan';
        pointModeBtn.className = '';
        pointModeBtn.textContent = "Plot Points (0.1)";
    }
    render();
});

connectPointsBtn.addEventListener('click', () => {
    selectedPointForConnection = null;
    
    // Enforce connection prerequisites via floating toast alerts
    if (pointsArray.length === 0) {
        showFloatingToast("Plot vector nodes on your coordinate map canvas first.");
        return;
    }
    if (pointsArray.length === 1) {
        showFloatingToast("You only have 1 more point left before you can start connecting!");
        return;
    }

    if (canvasClickMode !== 'connect') {
        canvasClickMode = 'connect';
        connectPointsBtn.className = 'active-mode';
        pointModeBtn.className = '';
        pointModeBtn.textContent = "Plot Points (0.1)";
        connectPointsBtn.textContent = "Select 2 Nodes... \uD83D\uDD17";
    } else {
        canvasClickMode = 'pan';
        connectPointsBtn.className = '';
        connectPointsBtn.textContent = "Connect Nodes Linker";
    }
    render();
});

// --- SECTION 8: PRIMARY GEOMETRIC CANVAS RENDERING ENGINE ENGINE ---
/**
 * Executes full refresh sweeps across the primary web viewport context layer.
 * Processes backgrounds, baseline vector grids, mathematical linear curves, and mapped node pathways.
 */
function render() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pull configuration factors directly from user inputs safely
    const aVal = parseFloat(mA.value) || 0;
    const bVal = parseFloat(mB.value) || 0;
    const cVal = parseFloat(mC.value) || 0;
    const dVal = parseFloat(mD.value) || 0;

    // Run structural workspace determinant calculations
    const calculatedDeterminant = (aVal * dVal) - (bVal * cVal);
    detDisplay.textContent = calculatedDeterminant.toFixed(2);
    updateAdvancedTransformationTextExplanation(aVal, bVal, cVal, dVal, calculatedDeterminant);

    // 1. DRAW SUBDUE BACKGROUND MESH GRID LINES
    ctx.strokeStyle = '#161f30';
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

    // 2. DRAW MAIN CENTRAL STATIC GRAPH SPACE AXIS LINES
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, offsetY);
    ctx.lineTo(canvas.width, offsetY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(offsetX, 0);
    ctx.lineTo(offsetX, canvas.height);
    ctx.stroke();

    // 3. DRAW CUSTOM USER INTERCONNECTED VECTOR LINE SPLINE PATHWAYS
    ctx.lineWidth = 2;
    ctx.strokeStyle = lineColorIn.value || '#00f2fe';
    connectedLines.forEach(lineNodeMap => {
        const sourcePointNode = pointsArray[lineNodeMap[0]];
        const destinationPointNode = pointsArray[lineNodeMap[1]];
        
        if (sourcePointNode && destinationPointNode) {
            // Map spatial coordinates through the linear matrix values transformation layers
            let transformedSourceX = aVal * sourcePointNode.x + bVal * sourcePointNode.y;
            let transformedSourceY = cVal * sourcePointNode.x + dVal * sourcePointNode.y;
            let transformedDestX = aVal * destinationPointNode.x + bVal * destinationPointNode.y;
            let transformedDestY = cVal * destinationPointNode.x + dVal * destinationPointNode.y;
            
            ctx.beginPath();
            ctx.moveTo(transformedSourceX * scale + offsetX, -transformedSourceY * scale + offsetY);
            ctx.lineTo(transformedDestX * scale + offsetX, -transformedDestY * scale + offsetY);
            ctx.stroke();
        }
    });

    // 4. DRAW BASIS TRANSFORM VECTOR INDICATORS (i-hat and j-hat arrows)
    ctx.lineWidth = 3;
    
    // Render i-hat transformation vector target line
    ctx.strokeStyle = '#ff4757'; 
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo((aVal * scale) + offsetX, -(cVal * scale) + offsetY);
    ctx.stroke();

    // Render j-hat transformation vector target line
    ctx.strokeStyle = '#2ed573'; 
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo((bVal * scale) + offsetX, -(dVal * scale) + offsetY);
    ctx.stroke();

    // 5. EVALUATE & GRAPH MATHEMATICAL IMPLICIT / EXPLICIT FORMULA PLOTS
    if (compiledFnX || compiledFnY) {
        ctx.fillStyle = 'rgba(0, 242, 254, 0.85)';
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
                } catch (calcError) {
                    continue; 
                }

                if (evaluationMatchX || evaluationMatchY) {
                    // Apply raw coordinates transformation shifts prior to plotting pixels to viewport
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

    // 6. RENDER INTERACTIVE PLOTTED NODE ELEMENTS
    pointsArray.forEach((pointInstance, idx) => {
        let matrixShiftedX = aVal * pointInstance.x + bVal * pointInstance.y;
        let matrixShiftedY = cVal * pointInstance.x + dVal * pointInstance.y;
        
        let screenCoordinatesX = matrixShiftedX * scale + offsetX;
        let screenCoordinatesY = -matrixShiftedY * scale + offsetY;

        ctx.fillStyle = pointInstance.color;
        
        // Add visual emphasis glow configurations around standard elements or selection nodes
        if (selectedPointForConnection === idx) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffffff';
        } else {
            ctx.shadowBlur = 10;
            ctx.shadowColor = pointInstance.color;
        }
        
        ctx.beginPath();
        ctx.arc(
            screenCoordinatesX, 
            screenCoordinatesY, 
            selectedPointForConnection === idx ? 8 : 6, 
            0, Math.PI * 2
        );
        ctx.fill();
        
        // Reset canvas context global drop shadow metrics
        ctx.shadowBlur = 0;
        ctx.strokeStyle = selectedPointForConnection === idx ? '#00f2fe' : '#ffffff';
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.arc(
            screenCoordinatesX, 
            screenCoordinatesY, 
            selectedPointForConnection === idx ? 9 : 7, 
            0, Math.PI * 2
        );
        ctx.stroke();
    });
}

// --- SECTION 9: DESKTOP INPUT TRACKING & COORDINATE UTILITIES ---
/**
 * Computes, transforms, and outputs relative cursor mappings over standard system fields.
 */
function updateCoordsReadout(clientX, clientY) {
    const boundingRectangle = canvas.getBoundingClientRect();
    const currentCursorX = clientX - boundingRectangle.left;
    const currentCursorY = clientY - boundingRectangle.top;
    
    let rawMathSpaceCoordX = (currentCursorX - offsetX) / scale;
    let rawMathSpaceCoordY = -(currentCursorY - offsetY) / scale;
    
    // Outputs precision metrics localized directly alongside mouse positions
    cursorCoords.textContent = `X: ${rawMathSpaceCoordX.toFixed(1)}, Y: ${rawMathSpaceCoordY.toFixed(1)}`;
    cursorCoords.style.left = `${currentCursorX + 15}px`;
    cursorCoords.style.top = `${currentCursorY + 15}px`;
}

/**
 * Sweeps and calculates structural screen distances to detect node selection targets.
 * @returns {number|null} Mapped array index value or null if selection misses bounds thresholds.
 */
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
        
        if (Math.hypot(pX - screenTargetX, pY - screenTargetY) < 18) {
            return pointIndex;
        }
    }
    return null;
}

/**
 * Handles explicit target calculations for canvas space click actions.
 */
function handleCanvasClickAction(pX, pY) {
    if (canvasClickMode === 'plot') {
        // High precision resolution calculation snapping points cleanly to every 0.1 increment request
        let snappedMathCoordinateX = Math.round(((pX - offsetX) / scale) * 10) / 10;
        let snappedMathCoordinateY = Math.round((-(pY - offsetY) / scale) * 10) / 10;
        
        const randomPaletteList = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502'];
        let chosenColorSeed = randomPaletteList[Math.floor(Math.random() * randomPaletteList.length)];
        
        pointsArray.push({ 
            x: snappedMathCoordinateX, 
            y: snappedMathCoordinateY, 
            color: chosenColorSeed 
        });
        
        syncPointsUI();
        render();
    } else if (canvasClickMode === 'connect') {
        const clickedPointTargetIdx = findClickedPoint(pX, pY);
        
        if (clickedPointTargetIdx !== null) {
            if (selectedPointForConnection === null) {
                selectedPointForConnection = clickedPointTargetIdx;
                connectPointsBtn.textContent = "Select Target Node... \uD83D\uDD17";
                render();
            } else {
                if (selectedPointForConnection !== clickedPointTargetIdx) {
                    const isAlreadyInterconnected = connectedLines.some(existingLineMap => {
                        return (existingLineMap[0] === selectedPointForConnection && existingLineMap[1] === clickedPointTargetIdx) ||
                               (existingLineMap[0] === clickedPointTargetIdx && existingLineMap[1] === selectedPointForConnection);
                    });
                    
                    if (!isAlreadyInterconnected) {
                        connectedLines.push([selectedPointForConnection, clickedPointTargetIdx]);
                    }
                }
                selectedPointForConnection = null;
                canvasClickMode = 'pan';
                connectPointsBtn.className = '';
                connectPointsBtn.textContent = "Connect Nodes Linker";
                render();
            }
        } else {
            showFloatingToast("Click cleanly onto any node circle target bounds.");
        }
    }
}

// Attach listeners for interaction control
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

window.addEventListener('mouseup', () => {
    isDragging = false;
});

container.addEventListener('wheel', (event) => {
    event.preventDefault();
    scale = event.deltaY < 0 ? scale * 1.1 : scale / 1.1;
    
    // Set safety grid boundaries scaling caps
    if (scale < 5) scale = 5;
    if (scale > 400) scale = 400;
    
    render();
}, { passive: false });

// --- SECTION 10: COMPREHENSIVE MOBILE GESTURE CAPTURE UTILITIES ---
container.addEventListener('touchstart', (event) => {
    const spatialRectBound = canvas.getBoundingClientRect();
    
    if (event.touches.length === 1) {
        const primaryTouchPointX = event.touches[0].clientX;
        const primaryTouchPointY = event.touches[0].clientY;
        
        const relativeCanvasTouchX = primaryTouchPointX - spatialRectBound.left;
        const relativeCanvasTouchY = primaryTouchPointY - spatialRectBound.top;
        
        if (canvasClickMode !== 'pan') {
            handleCanvasClickAction(relativeCanvasTouchX, relativeCanvasTouchY);
        } else {
            isDragging = true;
            startX = primaryTouchPointX - offsetX;
            startY = primaryTouchPointY - offsetY;
        }
    } else if (event.touches.length === 2) {
        isDragging = false;
        // Calculate hypotenuse span metrics to coordinate mobile pinch zooms
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
        render();
    } else if (event.touches.length === 2) {
        const activeTouchDistanceSpan = Math.hypot(
            event.touches[0].clientX - event.touches[1].clientX,
            event.touches[0].clientY - event.touches[1].clientY
        );
        
        const velocityScalingFactor = activeTouchDistanceSpan / touchStartDist;
        if (Math.abs(velocityScalingFactor - 1) > 0.01) {
            scale = velocityScalingFactor > 1 ? scale * 1.04 : scale / 1.04;
            if (scale < 5) scale = 5;
            if (scale > 400) scale = 400;
            
            touchStartDist = activeTouchDistanceSpan;
            render();
        }
    }
}, { passive: true });

container.addEventListener('touchend', () => {
    isDragging = false;
    touchStartDist = 0;
});

// --- SECTION 11: INITIALIZATION ENGINE TRIGGER LAYERS ---
[eqInputX, eqInputY].forEach(inputNodeElement => {
    inputNodeElement.addEventListener('input', () => {
        compileEquations();
        render();
    });
});

[mA, mB, mC, mD].forEach(matrixInputElement => {
    matrixInputElement.addEventListener('input', () => {
        render();
    });
});

lineColorIn.addEventListener('input', () => {
    render();
});

/**
 * Resets the active laboratory workspace parameters state trees back to system default origins.
 */
resetBtn.addEventListener('click', () => {
    scale = 40;
    offsetX = canvas.width / 2;
    offsetY = canvas.height / 2;
    
    eqInputX.value = "";
    eqInputY.value = "";
    
    mA.value = 1;
    mB.value = 0;
    mC.value = 0;
    mD.value = 1;
    
    pointsArray = [
        { x: 2.0, y: 2.0, color: '#ff4757' },
        { x: -3.0, y: 1.0, color: '#2ed573' }
    ];
    
    connectedLines = [[0, 1]];
    selectedPointForConnection = null;
    canvasClickMode = 'pan';
    
    pointModeBtn.className = '';
    connectPointsBtn.className = '';
    
    pointModeBtn.textContent = "Plot Points (0.1)";
    connectPointsBtn.textContent = "Connect Nodes Linker";
    
    compileEquations();
    syncPointsUI();
    render();
});

/**
 * Dynamically updates canvas buffer limits based on viewport scaling modifications.
 */
function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // On system startup executions, center axis origin offsets automatically
    if (offsetX === 0 && offsetY === 0) {
        offsetX = canvas.width / 2;
        offsetY = canvas.height / 2;
    }
    render();
}

// Global System Boot Loops
window.addEventListener('resize', resizeCanvas);
compileEquations();
syncPointsUI();
resizeCanvas();