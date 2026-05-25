// Open Custom Notification Box
function showAlert(title, message, isError = true) {
  const titleEl = document.getElementById('modalTitle');
  titleEl.innerText = title;
  titleEl.style.color = isError ? '#e53e3e' : '#28a745';
  document.getElementById('modalText').innerText = message;
  document.getElementById('alertModal').style.display = 'flex';
}

// Close Custom Notification Box
function closeModal() {
  document.getElementById('alertModal').style.display = 'none';
}

// Handle Dropdown Selection Event
function toggleOtherInput() {
  const selectBox = document.getElementById('subjectSelect');
  const otherContainer = document.getElementById('otherSubjectContainer');
  if (selectBox.value === "Other") {
    otherContainer.style.display = "block";
  } else {
    otherContainer.style.display = "none";
    document.getElementById('customSubject').value = "";
  }
}

// Form Validation and Structuring Logic
function validateAndFormat(event) {
  event.preventDefault(); // Always intercept the native submission

  const name = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const selectBox = document.getElementById('subjectSelect');
  const desc = document.getElementById('description').value.trim();
  const sendBtn = document.getElementById('sendBtn');
  
  let subj = selectBox.value === "Other" ? document.getElementById('customSubject').value.trim() : selectBox.value;

  // 1. Strict Blank Field Validation
  if (!name || !email || !subj || !desc) {
    showAlert("Missing Fields", "All text boxes and choices must be completely filled out!", true);
    return false; 
  }

  // 2. Syntax Check using browser email validation standards
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAlert("Invalid Email", "Please enter a correctly formatted email address!", true);
    return false;
  }

  // Target item 1 (the domain text block) safely
  const emailParts = email.split('@');
  const domain = emailParts[1].toLowerCase();

  // 3. Instant Bypass: Check if it is a valid Google domain option
  if (domain === "gmail.com" || domain === "matixthemathclub.com") {
    proceedWithSubmission(name, email, subj, desc);
    return false;
  }

  sendBtn.disabled = true;
  sendBtn.innerText = "Verifying email domain...";

  // 4. Query Kickbox's free public open domain API for external custom addresses
  fetch('https://kickbox.com' + encodeURIComponent(domain))
    .then(res => res.json())
    .then(data => {
      if (data.disposable === true) {
        sendBtn.disabled = false;
        sendBtn.innerText = "Send Email";
        showAlert("Invalid Domain", "This email domain is blocked or temporary. Please provide a real email!", true);
      } else {
        proceedWithSubmission(name, email, subj, desc);
      }
    })
    .catch(() => {
      // Fallback: If the verification API times out, submit anyway so you don't lose the message!
      proceedWithSubmission(name, email, subj, desc);
    });

  return false; 
}

// Final action: Packages the text boxes cleanly and sends via a secure AJAX request
function proceedWithSubmission(name, email, subj, desc) {
  const sendBtn = document.getElementById('sendBtn');
  
  // Set UI state to sending
  sendBtn.disabled = true;
  sendBtn.innerText = "Sending...";

  // Format message variables layout string matching your exact request
  const formattedMessage = `name:${name}\nemail:${email}\nsubject:${subj}\ntext:${desc}`;

  // Build the payload required by the Formspree API engine
  const payload = {
    _replyto: email,
    _subject: `New Ticket: ${subj}`,
    message: formattedMessage
  };

  // Live direct JSON transfer bypassing iframe filters completely [1]
  fetch('https://formspree.io', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })
  .then(response => {
    sendBtn.disabled = false;
    sendBtn.innerText = "Send Email";

    if (response.ok) {
      // Trigger your success message popup window overlay
      showAlert("Success!", "We will reply as soon as possible! keep an eye on your inbox 👀", false);

      // Reset all layout input elements completely
      document.getElementById('fullName').value = "";
      document.getElementById('email').value = "";
      document.getElementById('subjectSelect').value = "";
      document.getElementById('description').value = "";
      document.getElementById('otherSubjectContainer').style.display = "none";
    } else {
      showAlert("Submission Failed", "The server rejected the form request. Verify your Formspree backend setup.", true);
    }
  })
  .catch(error => {
    console.error("Formspree AJAX Delivery failed:", error);
    sendBtn.disabled = false;
    sendBtn.innerText = "Send Email";
    showAlert("Transmission Error", "Unable to establish secure tunnel connection. Try again.", true);
  });
}
