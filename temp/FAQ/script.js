
function closewindowforquetion() {
    //closes the question window
    var questionwindow = document.querySelector(".question-window");
    if (questionwindow) {
        document.body.removeChild(questionwindow);
    }
}

function openwindowforquestion(question, answer) {
    //opens a centered window on top of the screen for the question that is clicked on
    var questionwindow = document.createElement("div");
    questionwindow.classList.add("question-window");
    questionwindow.innerHTML = "<h2>" + question + "</h2><p>" + answer + "</p><button onclick='closewindowforquetion()'>Close</button>";
    document.body.appendChild(questionwindow);
    // Center the window to the center on top of the items on the page
    questionwindow.style.position = "fixed";
    questionwindow.style.top = "50%";
    questionwindow.style.left = "39.24%";
    questionwindow.style.zIndex = "1000";
    questionwindow.style.width = "400px";
    // Color the window nicely with contrast colors to the bg page
    questionwindow.style.backgroundColor = "#fff";
    questionwindow.style.border = "2px solid #333";
    questionwindow.style.borderRadius = "10px";
    // Add some padding and make the text look nice
    questionwindow.style.padding = "20px";
    questionwindow.style.fontFamily = "Arial, sans-serif";
    //contrast the question and answer
    questionwindow.querySelector("h2").style.color = "#333";
    questionwindow.querySelector("p").style.color = "#666";
    // Add a shadow to the window
    questionwindow.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    // Add a transition effect to the window
    questionwindow.style.transition = "all 0.3s ease";
    // Add a hover effect to the window
    questionwindow.addEventListener("mouseover", function() {
        questionwindow.style.transform = "scale(1.05)";
    });
    questionwindow.addEventListener("mouseout", function() {
        questionwindow.style.transform = "scale(1)";
    });
    // Add a close button to the window
    var closeButton = questionwindow.querySelector("button");
    closeButton.style.backgroundColor = "#333";
    closeButton.style.color = "#fff";
    closeButton.style.border = "none";
    closeButton.style.padding = "10px 20px";
    closeButton.style.borderRadius = "5px";
    closeButton.style.cursor = "pointer";
    // Add a hover effect to the close button
    closeButton.addEventListener("mouseover", function() {
        closeButton.style.backgroundColor = "#555";
    });
    closeButton.addEventListener("mouseout", function() {
        closeButton.style.backgroundColor = "#333";
    });
    // Add a click event to the close button    
    closeButton.addEventListener("click", function() {
        closewindowforquetion();
    });
    // Add a click event to the window to close it when clicked outside of the content
    questionwindow.addEventListener("click", function(event) {
        if (event.target === questionwindow) {
            closewindowforquetion();
        }
    });
    // Add a keydown event to the window to close it when the escape key is pressed
    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            closewindowforquetion();
        }
    });
    // Add a fade in effect to the window
    questionwindow.style.opacity = "0";
    setTimeout(function() {
        questionwindow.style.opacity = "1";
    }, 100);
    // Add a fade out effect to the window when it is closed
    closeButton.addEventListener("click", function() {
        questionwindow.style.opacity = "0";
        setTimeout(function() {
            closewindowforquetion();
        }, 300);
    });
    // Add a fade out effect to the window when it is closed by clicking outside of the content
    questionwindow.addEventListener("click", function(event) {
        if (event.target === questionwindow) {
            questionwindow.style.opacity = "0";
            setTimeout(function() {
                closewindowforquetion();
            }, 300);
        }
    });
    // Add a fade out effect to the window when it is closed by pressing the escape key
    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            questionwindow.style.opacity = "0";
            setTimeout(function() {
                closewindowforquetion();
            }, 300);
        }
    });
}
    