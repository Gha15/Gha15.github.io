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

  // 2. Quick Syntax Check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAlert("Invalid Email", "Please enter a correctly formatted email address!", true);
    return false;
  }

  sendBtn.disabled = true;
  sendBtn.innerText = "Verifying email account...";

  // 3. Query the Free, Secure EmailCheck API (No API Key Required)
  fetch('https://emailcheck.cc' + encodeURIComponent(email))
    .then(res => res.json())
    .then(data => {
      // emailcheck.cc returns true for valid, existing emails
      const isRealAccount = data.valid;

      if (isRealAccount) {
        // If it passes the live account check, fire the form!
        proceedWithSubmission(name, email, subj, desc);
      } else {
        sendBtn.disabled = false;
        sendBtn.innerText = "Send Email";
        showAlert("Invalid Account", "This email account does not exist or cannot receive mail. Please type a real email!", true);
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
