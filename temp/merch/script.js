let windowwidth = '0px'
let windowheight = '0px'
let items = []
function opencategorywindowwithanxtoclose(category) {
    if (category === 'pens') {
        items = ['I love matix fan pen', 'official matix logo pen'];
    } else if (category === 'shirts') {
        items = ['Matix officil logo shirt', 'math signs shirt', 'multiplication table shirt with matix logo above it']
    }
    const categoryWindow = document.createElement('div');
    categoryWindow.classList.add('category-window');
    
    // SCALE TO FIT SCREEN: Apply base styling to window overlay
    categoryWindow.style.position = 'fixed';
    categoryWindow.style.top = '50%';
    categoryWindow.style.left = '50%';
    categoryWindow.style.transform = 'translate(-50%, -50%)';
    categoryWindow.style.width = '0%';
    categoryWindow.style.height = '0%';
    categoryWindow.style.overflow = 'hidden';
    categoryWindow.style.transition = 'width 0.5s ease, height 0.5s ease';
    
    document.body.appendChild(categoryWindow);
    
    const closeButton = document.createElement('button');
    closeButton.classList.add('x-close');
    closeButton.textContent = 'X';
    categoryWindow.appendChild(closeButton);
    closeButton.addEventListener('click', () => {
        categoryWindow.remove();
    });
    
    const categoryContent = document.createElement('div');
    const categoryContenttext2 = document.createElement('div');
    categoryContent.classList.add('category-content');
    categoryWindow.appendChild(categoryContent);
    categoryContent.textContent = ` ${category} - merch coming soon! `;
    categoryContent.appendChild(categoryContenttext2);
    categoryContenttext2.classList.add('category-subtitle');
    categoryContenttext2.textContent = 'if you press the items nothing will happen cause they are not real yet :)';
    
    // SCALE TO FIT SCREEN: Content container expands completely inside window
    categoryContent.style.width = '100%';
    categoryContent.style.height = '100%';
    categoryContent.style.boxSizing = 'border-box';
    categoryContent.style.overflowY = 'auto'; // Allows scrolling on small screens
    
    setTimeout(() => {
        // SCALE TO FIT SCREEN: Responsive size boundaries for the main popup
        if (window.innerWidth < 600) {
            categoryWindow.style.width = '95%';
            categoryWindow.style.height = '85%';
        } else {
            categoryWindow.style.width = '80%';
            categoryWindow.style.height = '75%';
        }
    }, 10);

    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('category-item');
        
        // SCALE TO FIT SCREEN: Use flexbox layouts for auto-adjusting item grids
        itemElement.style.display = 'inline-flex';
        itemElement.style.flexDirection = 'column';
        itemElement.style.alignItems = 'center';
        itemElement.style.margin = '10px';
        itemElement.style.width = 'calc(50% - 20px)'; // Fits 2 columns on small screens safely
        itemElement.style.minWidth = '140px';
        
        categoryContent.appendChild(itemElement);
        
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('item-image-container');
        
        // SCALE TO FIT SCREEN: Force container to look proportional
        imageContainer.style.width = '100%';
        imageContainer.style.display = 'flex';
        imageContainer.style.justifyContent = 'center';
        
        const itemImage = document.createElement('img');
        itemImage.classList.add('item-image');
        
        // FIT TO SCREEN: Force SVGs to scale proportionally inside container boundaries
        itemImage.style.width = '100%';
        itemImage.style.height = 'auto';
        itemImage.style.objectFit = 'contain'; 
        
        const imageName = item.toLowerCase().replace(/\s+/g, '-') + '.svg';
        const imageUrl = `images/${imageName}`;
        
        itemImage.src = imageUrl;
        itemImage.onerror = function() {
            this.src = 'images/comingsoon.svg';
            updateImageSizes();
        };
        
        itemImage.onload = function() {
            updateImageSizes();
        };
        
        imageContainer.appendChild(itemImage);
        itemElement.appendChild(imageContainer);
        
        const textContainer = document.createElement('div');
        textContainer.classList.add('item-text-container');
        textContainer.textContent = item;
        textContainer.style.textAlign = 'center';
        textContainer.style.fontSize = 'clamp(0.8rem, 2vw, 1.1rem)'; // SCALE TO FIT SCREEN: Fluid text size
        itemElement.appendChild(textContainer);
        
        itemElement.addEventListener('click', () => {
            showcustomalert('This item is not available yet!', 'OK');
        });
    });
    
    updateImageSizes();
}

function showcustomalert(message, close_message) {
    const alertOverlay = document.createElement('div');
    alertOverlay.classList.add('alert-overlay');
    
    // SCALE TO FIT SCREEN: Responsive layout cover
    alertOverlay.style.position = 'fixed';
    alertOverlay.style.top = '0';
    alertOverlay.style.left = '0';
    alertOverlay.style.width = '100vw';
    alertOverlay.style.height = '100vh';
    alertOverlay.style.display = 'flex';
    alertOverlay.style.justifyContent = 'center';
    alertOverlay.style.alignItems = 'center';
    
    document.body.appendChild(alertOverlay);
    const alertBox = document.createElement('div');
    alertBox.classList.add('alert-box');
    alertBox.textContent = message;
    
    // SCALE TO FIT SCREEN: Fluid alert sizing
    alertBox.style.width = 'min(400px, 85%)';
    alertBox.style.padding = '20px';
    
    alertOverlay.appendChild(alertBox);
    const closeButton = document.createElement('button');
    closeButton.classList.add('alert-close');
    closeButton.classList.add('button');
    closeButton.textContent = close_message || 'Close';
    alertBox.appendChild(closeButton);
    closeButton.addEventListener('click', () => {
        document.body.removeChild(alertOverlay);
    });
}

// FIT TO SCREEN: Calculates accurate vector limits relative to the user viewport width
function updateImageSizes() {
    const itemImages = document.querySelectorAll('.item-image');
    const windowWidth = window.innerWidth;
    
    itemImages.forEach(img => {
        if (windowWidth < 600) {
            // Mobile: Scale bounded layout
            img.style.maxHeight = '25vw';
            img.style.maxWidth = '25vw';
        } else if (windowWidth < 1024) {
            // Tablet
            img.style.maxHeight = '150px';
            img.style.maxWidth = '150px';
        } else {
            // Desktop
            img.style.maxHeight = '200px';
            img.style.maxWidth = '200px';
        }
    });
}

window.addEventListener('load', updateImageSizes);
window.addEventListener('resize', updateImageSizes);
