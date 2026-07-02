// 1. Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);

// 2. Save directly into clean variables with defaults
let actionID = urlParams.get('actionID') || '000';
let actionName = urlParams.get('actionName') || 'tree-view';

// 3. Update the URL to reflect the current state
if (!urlParams.has('actionID') || !urlParams.has('actionName')) {
    // window.location.pathname automatically includes /games/treegrowinggame/
    const newURL = `${window.location.pathname}?actionID=${actionID}&actionName=${actionName}`;
    window.history.replaceState({}, '', newURL);
}


// 4. Your game conditions
if (actionID === '000') {
    console.log("Default game ID loaded successfully!");
}

if (actionName === 'tree-view') {
    console.log("Default action name loaded successfully!");
}

function setActionID(ID) {
    actionID = ID;
    const newURL = `${window.location.pathname}?actionID=${actionID}&actionName=${actionName}`;
    window.history.replaceState({}, '', newURL);
}

function setActionName(name) {
    actionName = name;
    const newURL = `${window.location.pathname}?actionID=${actionID}&actionName=${actionName}`;
    window.history.replaceState({}, '', newURL);
}
//if no waterBuckets in localStorage, set it to 0
if (!localStorage.getItem('waterBuckets')) {
    localStorage.setItem('waterBuckets', 0);
}

//if no seeds in localStorage, set it to 0
if (!localStorage.getItem('seeds') && !localStorage.getItem('tree-planted')) {
    localStorage.setItem('seeds', 1);
}

//if no day in localStorage, set it to 0
if (!localStorage.getItem('day')) {
    localStorage.setItem('day', 1);
}


//functions
function customAlert(message) {
    const alertBox = document.createElement('div');
    alertBox.style.position = 'fixed';
    alertBox.style.top = '50%';
    alertBox.style.left = '50%';
    alertBox.style.transform = 'translate(-50%, -50%)';
    alertBox.style.backgroundColor = '#fff';
    alertBox.style.padding = '20px';
    alertBox.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    alertBox.style.zIndex = '1000';
    alertBox.innerHTML = `
        <p>${message}</p>
        <button onclick="document.body.removeChild(this.parentElement)">OK</button>
    `;
    document.body.appendChild(alertBox);
}

function plantTree() {
    if (localStorage.getItem('seeds') > 0) {
        localStorage.setItem('tree-planted', true);
        localStorage.setItem('seeds', localStorage.getItem('seeds') - 1);
        localStorage.setItem('tree-watered', false);
        localStorage.setItem('lastWatered', false);
        setActionID('000');
        setActionName('tree-view');
        location.reload();
    } else {
        customAlert("You don't have any seeds left!");
    }
}

function checkTreeWatered() {
    if (!localStorage.getItem('tree-watered')) {
        console.log("Tree is not watered.");
    }
}

checkTreeWatered();

//set lastwatered to localStorage to false if tree is not watered and to date and time if tree is watered
function waterTree() {
    if (localStorage.getItem('waterBuckets') > 0) {
        localStorage.setItem('tree-watered', true);
        localStorage.setItem('lastWatered', new Date().getTime());
        localStorage.setItem('waterBuckets', localStorage.getItem('waterBuckets') - 1);
        customAlert("You watered your tree!");
        setActionID('000');
        setActionName('tree-view');
        location.reload();
    } else {
        customAlert("You don't have any water buckets left!");
    }
}

if (!localStorage.getItem('tree-watered')) {
    localStorage.setItem('tree-watered', false);
}

//checks if tree is not watered for 24 hours, if so, remove tree and set tree-planted to false
function checkTreeWatered() {
    const lastWatered = localStorage.getItem('lastWatered');
    if (lastWatered) {
        const now = new Date().getTime();
        const timeDiff = now - lastWatered;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        if (hoursDiff >= 24) {
            localStorage.removeItem('tree-planted');
            localStorage.removeItem('tree-watered');
            customAlert("Your tree has died because it wasn't watered for 24 hours. You will need to play 5 minigames to get a new seed.");
            setActionID('000');
            setActionName('tree-view');
            location.reload();
        }
    }
    //if the tree is not watered, sets the Treewater
}

// Call the function to check if the tree is watered
checkTreeWatered();

//pages

if (actionID === '000' && actionName === 'tree-view' && !localStorage.getItem('tree-planted')) {
    document.body.innerHTML = `
        <h1>Welcome to the Tree Growing Game!</h1>
        <p>Grow a tree and play minigames to get water buckets(1 bucket = 3 games) to water your tree and grow it! if you lose your tree(do not water it for 24 hours), you will have to play 5 minigames to get a new seed(btw you start the game with a seed but no water buckets)</p>
        <h2>total water buckets left: ${localStorage.getItem('waterBuckets') || 0}</h2>
        <h2>total seeds left: ${localStorage.getItem('seeds') || 0}</h2>
        <button  onclick="setActionID('001'); setActionName('plant-tree'); location.reload();">Plant Tree</button>
    `;
}

if (actionID === '000' && actionName === 'tree-view' && localStorage.getItem('tree-planted') && localStorage.getItem('tree-watered') == 'false') {
    document.body.innerHTML = `
        <h1>Day: ${localStorage.getItem('day') || 0}</h1>
        <h2>total water buckets left: ${localStorage.getItem('waterBuckets') || 0}</h2>
        <h2>total seeds left: ${localStorage.getItem('seeds') || 0}</h2>
        <p>your tree is planted! water it to grow it!</p>
        <button  onclick="setActionID('002'); setActionName('water-tree'); location.reload();">Water Tree</button>
    `;
}

if (actionID === '001' && actionName === 'plant-tree'){
    document.body.innerHTML = `
        <h1>plant your tree!</h1>
        <p>you have ${localStorage.getItem('seeds')} seeds left</p>
        <button  onclick="plantTree()">Plant Tree</button>
    `;
}

if (actionID === '002' && actionName === 'water-tree' && localStorage.getItem('tree-planted') && localStorage.getItem('tree-watered') == 'false') {
    if (localStorage.getItem('waterBuckets') > 0) {
        document.body.innerHTML = `
            <h1>water your tree!</h1>
            <p>you have ${localStorage.getItem('waterBuckets')} water buckets left</p>
            <button  onclick="waterTree()">Water Tree</button>
        `;
    } else {
        document.body.innerHTML = `
            <h1>you don't have any water buckets left!</h1>
            <p>play minigames to get water buckets(1 bucket = 3 games)</p>
            <button  onclick="setActionID('003'); setActionName('get-water-minigames'); location.reload();">Play to get water buckets</button>
        `;
    }
}

if (actionID === '003' && actionName === 'water-tree-minigames' && localStorage.getItem('tree-planted') && localStorage.getItem('tree-watered') == 'false') {
    document.body.innerHTML = `
        <h1>play minigames to get water buckets!</h1>
        <p>play 3 minigames to get 1 water bucket!</p>
        <button  onclick="setActionID('003.5'); setActionName('minigames'); location.reload();">Play Minigames</button>
    `;
}
let randomminnigame1 = Math.floor(Math.random() * 10);
let randomminnigame2 = Math.floor(Math.random() * 10);
if (randomminnigame1 === randomminnigame2) {
    randomminnigame2 = Math.floor(Math.random() * 10);
}

if (actionID === '003.5' && actionName === 'minigames' && localStorage.getItem('tree-planted')) {
    document.body.innerHTML = `
        <h1>play minigames to get water buckets!</h1>
        <p>play 3 minigames to get 1 water bucket!</p>
        <h2>minigame 1</h2>
        <div class="minigame-content">
            <iframe src="/games/minigames/minigame${randomminnigame1}.html" width="800" height="600" frameborder="0"></iframe>
        </div>
        <h2>minigame 2</h2>
        <div class="minigame-content">
            <iframe src="/games/minigames/minigame${randomminnigame2}.html" width="800" height="600" frameborder="0"></iframe>
        </div>
        <h2>minigame 3</h2>
        <div class="minigame-content">
            <iframe src="/games/minigames/minigame${Math.floor(Math.random() * 10)}.html" width="800" height="600" frameborder="0"></iframe>
        </div>
        <button onclick="setActionID('000'); setActionName('tree-view'); location.reload();">Back home</button>
        `;
}