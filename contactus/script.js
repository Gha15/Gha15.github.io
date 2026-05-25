let isDnsVerified = false;

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
  if (isDnsVerified) {
    isDnsVerified = false; 
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

  // 2. Syntax Check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAlert("Invalid Email", "Please enter a correctly formatted email address!", true);
    return false;
  }

  // Safely split and convert the domain text block to lowercase using index 1
  const emailParts = email.split('@');
  const domain = emailParts[1].toLowerCase();

  // Consumer addresses skip the DNS lookup step entirely to speed up loading
  if (domain === "gmail.com") {
    proceedWithSubmission(name, email, subj, desc);
    return false;
  }

  sendBtn.disabled = true;
  sendBtn.innerText = "Checking Google Workspace...";

  // 3. Live Server Check against Google Public DNS Database for custom organizations
  fetch('https://dns.google' + domain + '&type=MX')
    .then(res => res.json())
    .then(data => {
      let isGoogleWorkspace = false;

      if (data.Answer && data.Answer.length > 0) {
        // Enforce checking if the custom domain points back to Google Workspace infrastructure
        isGoogleWorkspace = data.Answer.some(record => {
          const recordData = record.data.toLowerCase();
          return recordData.includes("google.com") || recordData.includes("googlemail.com");
        });
      }

      if (isGoogleWorkspace) {
        proceedWithSubmission(name, email, subj, desc);
      } else {
        sendBtn.disabled = false;
        sendBtn.innerText = "Send Email";
        showAlert("Access Restricted", "This form only accepts standard Gmail accounts or verified Google Workspace custom domains!", true);
      }
    })
    .catch(() => {
      sendBtn.disabled = false;
      sendBtn.innerText = "Send Email";
      showAlert("Verification Error", "Could not complete lookups. Check your connection.", true);
    });

  return false; 
}

// Final action to structure variables text boxes and push to the iframe target safely
function proceedWithSubmission(name, email, subj, desc) {
  const sendBtn = document.getElementById('sendBtn');
  
  document.getElementById('hiddenSubject').value = `New Ticket: ${subj}`;
  document.getElementById('hiddenMessage').value = `name:${name}\nemail:${email}\nsubject:${subj}\ntext:${desc}`;

  showAlert("Success!", "We will reply as soon as possible! keep an eye on your inbox 👀", false);

  isDnsVerified = true;
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
