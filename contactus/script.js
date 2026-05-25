let isDnsVerified = false;

function showAlert(title, message, isError = true) {
  const titleEl = document.getElementById('modalTitle');
  titleEl.innerText = title;
  titleEl.style.color = isError ? '#e53e3e' : '#28a745';
  document.getElementById('modalText').innerText = message;
  document.getElementById('alertModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('alertModal').style.display = 'none';
}

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

  if (!name || !email || !subj || !desc) {
    showAlert("Missing Fields", "All text boxes and choices must be completely filled out!", true);
    return false; 
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAlert("Invalid Email", "Please enter a correctly formatted email address!", true);
    return false;
  }

  const emailParts = email.split('@');
  const domain = emailParts[1].toLowerCase();

  if (domain === "gmail.com") {
    proceedWithSubmission(name, email, subj, desc);
    return false;
  }

  sendBtn.disabled = true;
  sendBtn.innerText = "Checking Google Workspace...";

  fetch('https://dns.google' + domain + '&type=MX')
    .then(res => res.json())
    .then(data => {
      let isGoogleWorkspace = false;
      if (data.Answer && data.Answer.length > 0) {
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

function proceedWithSubmission(name, email, subj, desc) {
  const sendBtn = document.getElementById('sendBtn');
  document.getElementById('hiddenSubject').value = `New Ticket: ${subj}`;
  document.getElementById('hiddenMessage').value = `name:${name}\nemail:${email}\nsubject:${subj}\ntext:${desc}`;
  showAlert("Success!", "We will reply as soon as possible! keep an eye on your inbox 👀", false);
  isDnsVerified = true;
  document.getElementById('ticketForm').submit();
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
