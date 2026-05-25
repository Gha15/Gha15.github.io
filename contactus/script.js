let isApiVerified = false;

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
  if (isApiVerified) {
    isApiVerified = false; 
    return true;
  }
  event.preventDefault();

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

  // Isolate the email address text block domain safely
  const emailParts = email.split('@');
  const domain = emailParts[1].toLowerCase();

  // 3. Strict Check: If it is standard gmail or your exact live club domain, pass it immediately without an API lookup
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
      // If the domain is marked as fake/disposable, block it immediately
      if (data.disposable === true) {
        sendBtn.disabled = false;
        sendBtn.innerText = "Send Email";
        showAlert("Invalid Domain", "This email domain is blocked or temporary. Please provide a real email!", true);
      } else {
        // If it passes checking, allow submission to Formspree
        proceedWithSubmission(name, email, subj, desc);
      }
    })
    .catch(error => {
      console.error("API Verification crashed:", error);
      sendBtn.disabled = false;
      sendBtn.innerText = "Send Email";
      showAlert("Verification Error", "Could not complete account lookups. Check your connection.", true);
    });

  return false; 
}

// Final action to structure variables text boxes and push to the iframe target safely
function proceedWithSubmission(name, email, subj, desc) {
  const sendBtn = document.getElementById('sendBtn');
  
  document.getElementById('hiddenSubject').value = `New Ticket: ${subj}`;
  document.getElementById('hiddenMessage').value = `name:${name}\nemail:${email}\nsubject:${subj}\ntext:${desc}`;

  showAlert("Success!", "We will reply as soon as possible! keep an eye on your inbox 👀", false);

  isApiVerified = true;
  document.getElementById('ticketForm').submit();

  // Reset inputs cleanly
  setTimeout(() => {
    document.getElementById('fullName').value = "";
    document.getElementById('email').value = "";
    document.getElementById('subjectSelect').value = "";
    document.getElementById('description').value = "";
    document.getElementById('otherSubjectContainer').style.display = "none";
    sendBtn.disabled = false;
    sendBtn.innerText = "Send Email";
  }, 100);
}
