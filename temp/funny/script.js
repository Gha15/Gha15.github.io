const firebaseConfig = {
	apiKey: "<SECRET>",
	authDomain: "matix-1d538.firebaseapp.com",
	databaseURL: "https://matix-1d538-default-rtdb.firebaseio.com",
	projectId: "matix-1d538",
	storageBucket: "matix-1d538.firebasestorage.app"
};

if (!firebase.apps.length) {
	firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();

let activeUser = getActiveUser();

const usernameForm = document.getElementById("username-form");
const usernameInput = document.getElementById("username-input");
const usernameHint = document.getElementById("username-hint");
const memeForm = document.getElementById("meme-form");
const memeTypeInput = document.getElementById("meme-type");
const memeTitleInput = document.getElementById("meme-title");
const memeContentInput = document.getElementById("meme-content");
const memeQnaFields = document.getElementById("meme-qna-fields");
const memeQuestionInput = document.getElementById("meme-question");
const memeAnswerInput = document.getElementById("meme-answer");
const memeFeed = document.getElementById("meme-feed");
const memeCount = document.getElementById("meme-count");
const memeFormHint = document.getElementById("meme-form-hint");

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatList = document.getElementById("chat-list");

const memesRef = db.ref("funny_memes");
const chatRef = db.ref("funny_chat");

let currentMemes = [];
let currentChatMessages = [];
let threadListeners = {};

function normalizeFunnyUser(name) {
	const cleaned = String(name || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "").slice(0, 20);
	const compact = cleaned.replace(/[^a-z0-9_]/g, "");
	if (compact === "matix" || compact === "ghadimatix") {
		return "ghadi";
	}
	return cleaned || "guest";
}

function getActiveUser() {
	const savedUser = sessionStorage.getItem("mx_user") || sessionStorage.getItem("matix_auth_user");
	if (savedUser) {
		const normalizedSaved = normalizeFunnyUser(savedUser);
		sessionStorage.setItem("mx_user", normalizedSaved);
		sessionStorage.setItem("matix_auth_user", normalizedSaved);
		return normalizedSaved;
	}

	const cachedGuest = localStorage.getItem("matix_meme_guest");
	if (cachedGuest) {
		return normalizeFunnyUser(cachedGuest);
	}

	// Don't auto-prompt — let user choose to post anonymously or sign in via nav
	return "guest";
}

function saveUsername(name) {
	const cleaned = normalizeFunnyUser(name);
	if (!cleaned) {
		return false;
	}
	activeUser = cleaned;
	sessionStorage.setItem("mx_user", cleaned);
	sessionStorage.setItem("matix_auth_user", cleaned);
	localStorage.setItem("matix_meme_guest", cleaned);
	usernameInput.value = cleaned;
	usernameHint.textContent = "Saved as @" + cleaned;
	usernameHint.style.color = "#86efac";
	return true;
}

function requireUsername() {
	if (activeUser) {
		usernameInput.value = activeUser;
		return true;
	}
	const chosen = prompt("Pick a username before posting:");
	if (!chosen) {
		return false;
	}
	return saveUsername(chosen);
}

function showHint(message, isError) {
	memeFormHint.textContent = message;
	memeFormHint.style.color = isError ? "#fecaca" : "#86efac";
}

function isSafeImageUrl(url) {
	return /^https?:\/\//i.test(url);
}

function escapeText(value) {
	return String(value || "").trim();
}

function setTypeVisibility() {
	const isQna = memeTypeInput.value === "qna";
	memeQnaFields.classList.toggle("hidden", !isQna);
	if (isQna) {
		memeContentInput.placeholder = "Short intro or summary";
	} else {
		memeContentInput.placeholder = "Write the meme content";
	}
}

function threadRef(memeId) {
	return db.ref("funny_memes/" + memeId + "/thread");
}

function globalChatCountLabel(count) {
	return count + " message" + (count === 1 ? "" : "s");
}

function renderMemes() {
	memeFeed.innerHTML = "";

	if (!currentMemes.length) {
		const empty = document.createElement("div");
		empty.className = "empty";
		empty.textContent = "No memes yet. Be the first to post one.";
		memeFeed.appendChild(empty);
		memeCount.textContent = "0 memes";
		return;
	}

	currentMemes.forEach((meme) => {
		const card = document.createElement("article");
		card.className = "meme-card";
		card.dataset.memeId = meme.id;

		const typeTag = document.createElement("div");
		typeTag.className = "type-tag";
		typeTag.textContent = meme.type === "qna" ? "Q and A" : "Title + Content";
		card.appendChild(typeTag);

		const title = document.createElement("h3");
		title.className = "meme-title";
		title.textContent = meme.title;
		card.appendChild(title);

		const content = document.createElement("p");
		content.className = "meme-content";
		content.textContent = meme.content;
		card.appendChild(content);

		if (meme.type === "qna") {
			if (meme.question) {
				const question = document.createElement("p");
				question.className = "meme-qna-line";
				question.innerHTML = "<strong>Q:</strong> " + escapeText(meme.question);
				card.appendChild(question);
			}
			if (meme.answer) {
				const answer = document.createElement("p");
				answer.className = "meme-qna-line";
				answer.innerHTML = "<strong>A:</strong> " + escapeText(meme.answer);
				card.appendChild(answer);
			}
		}

		const meta = document.createElement("div");
		meta.className = "meme-meta";

		const by = document.createElement("span");
		by.textContent = "@" + meme.postedBy;
		meta.appendChild(by);

		const time = document.createElement("span");
		time.textContent = formatTime(meme.createdAt);
		meta.appendChild(time);

		card.appendChild(meta);

		const actions = document.createElement("div");
		actions.className = "meme-actions";

		const loves = meme.loves || 0;
		const lovedByMap = meme.lovedBy || {};
		const isLoved = Boolean(lovedByMap[activeUser]);

		const loveButton = document.createElement("button");
		loveButton.className = "love-button" + (isLoved ? " active" : "");
		loveButton.textContent = "Love " + (isLoved ? "(added)" : "") + "  -  " + loves;
		loveButton.addEventListener("click", () => toggleLove(meme.id, isLoved, loves));
		actions.appendChild(loveButton);

		card.appendChild(actions);

		const threadWrap = document.createElement("section");
		threadWrap.className = "meme-thread";
		threadWrap.innerHTML = '<div class="thread-head"><strong>Thread</strong><span>Live</span></div><div class="thread-list" id="thread-list-' + meme.id + '"></div><form class="thread-form" data-meme-id="' + meme.id + '"><input maxlength="220" placeholder="Reply in this meme thread" required><button type="submit">Send</button></form>';
		card.appendChild(threadWrap);

		attachThreadListener(meme.id);

		memeFeed.appendChild(card);
	});

	memeCount.textContent = currentMemes.length + " meme" + (currentMemes.length === 1 ? "" : "s");
}

function renderThread(memeId, threadMessages) {
	const threadList = document.getElementById("thread-list-" + memeId);
	if (!threadList) {
		return;
	}

	threadList.innerHTML = "";
	if (!threadMessages.length) {
		const empty = document.createElement("div");
		empty.className = "empty thread-empty";
		empty.textContent = "No replies yet. Start the thread.";
		threadList.appendChild(empty);
		return;
	}

	threadMessages.forEach((msg) => {
		const item = document.createElement("div");
		item.className = "chat-item thread-item";
		const user = document.createElement("span");
		user.className = "chat-user";
		user.textContent = "@" + msg.user + ":";
		item.appendChild(user);
		const text = document.createElement("span");
		text.textContent = msg.text;
		item.appendChild(text);
		threadList.appendChild(item);
	});

	threadList.scrollTop = threadList.scrollHeight;
}

function attachThreadListener(memeId) {
	if (threadListeners[memeId]) {
		return;
	}

	threadListeners[memeId] = true;
	threadRef(memeId).orderByChild("createdAt").limitToLast(60).on("value", (snapshot) => {
		const raw = snapshot.val() || {};
		const messages = Object.keys(raw).map((id) => ({ id, ...raw[id] }));
		messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
		renderThread(memeId, messages);
	});
}

function renderChat() {
	chatList.innerHTML = "";

	if (!currentChatMessages.length) {
		const empty = document.createElement("div");
		empty.className = "empty";
		empty.textContent = "Chat is quiet. Start the meme chaos.";
		chatList.appendChild(empty);
		return;
	}

	currentChatMessages.forEach((msg) => {
		const item = document.createElement("div");
		item.className = "chat-item";

		const user = document.createElement("span");
		user.className = "chat-user";
		user.textContent = "@" + msg.user + ":";
		item.appendChild(user);

		const text = document.createElement("span");
		text.textContent = msg.text;
		item.appendChild(text);

		chatList.appendChild(item);
	});

	chatList.scrollTop = chatList.scrollHeight;
	document.getElementById("chat-status").textContent = globalChatCountLabel(currentChatMessages.length);
}

function formatTime(timestamp) {
	if (!timestamp) {
		return "just now";
	}

	const d = new Date(timestamp);
	if (Number.isNaN(d.getTime())) {
		return "just now";
	}

	return d.toLocaleString();
}

function toggleLove(memeId, isLoved, loves) {
	const updates = {};
	updates["funny_memes/" + memeId + "/lovedBy/" + activeUser] = isLoved ? null : true;
	updates["funny_memes/" + memeId + "/loves"] = isLoved ? Math.max(0, loves - 1) : loves + 1;
	db.ref().update(updates);
}

function listenForMemes() {
	memesRef.orderByChild("createdAt").limitToLast(80).on("value", (snapshot) => {
		const raw = snapshot.val() || {};
		const list = Object.keys(raw).map((id) => ({ id, ...raw[id] }));
		currentMemes = list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
		renderMemes();
	});
}

function listenForChat() {
	chatRef.orderByChild("createdAt").limitToLast(120).on("value", (snapshot) => {
		const raw = snapshot.val() || {};
		const list = Object.keys(raw).map((id) => ({ id, ...raw[id] }));
		currentChatMessages = list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
		renderChat();
	});
}

memeForm.addEventListener("submit", (event) => {
	event.preventDefault();
	if (!requireUsername()) {
		showHint("Pick a username first.", true);
		return;
	}

	const type = memeTypeInput.value;
	const title = memeTitleInput.value.trim();
	const content = memeContentInput.value.trim();
	const question = memeQuestionInput.value.trim();
	const answer = memeAnswerInput.value.trim();

	if (!title || !content) {
		showHint("Title and content are required.", true);
		return;
	}

	if (type === "qna" && (!question || !answer)) {
		showHint("Q and A need both question and answer.", true);
		return;
	}

	const payload = {
		type,
		title,
		content,
		question: type === "qna" ? question : "",
		answer: type === "qna" ? answer : "",
		postedBy: activeUser,
		loves: 0,
		createdAt: Date.now()
	};

	memesRef.push(payload)
		.then(() => {
			memeForm.reset();
			showHint("Meme posted.", false);
		})
		.catch(() => {
			showHint("Could not post meme right now.", true);
		});
});

usernameForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const ok = saveUsername(usernameInput.value);
	if (!ok) {
		usernameHint.textContent = "Enter a valid username.";
		usernameHint.style.color = "#fecaca";
	}
});

memeTypeInput.addEventListener("change", setTypeVisibility);

document.addEventListener("submit", (event) => {
	const form = event.target;
	if (!form.classList || !form.classList.contains("thread-form")) {
		return;
	}

	event.preventDefault();
	if (!requireUsername()) {
		return;
	}

	const memeId = form.dataset.memeId;
	const input = form.querySelector("input");
	const text = input.value.trim();
	if (!text) {
		return;
	}

	threadRef(memeId).push({
		user: activeUser,
		text,
		createdAt: Date.now()
	}).then(() => {
		input.value = "";
	});
});

chatForm.addEventListener("submit", (event) => {
	event.preventDefault();
	if (!requireUsername()) {
		return;
	}
	const text = chatInput.value.trim();

	if (!text) {
		return;
	}

	chatRef.push({
		user: activeUser,
		text,
		createdAt: Date.now()
	}).then(() => {
		chatInput.value = "";
	});
});

setTypeVisibility();
listenForMemes();
listenForChat();
usernameInput.value = activeUser;
usernameHint.textContent = "Current username: @" + activeUser;
usernameHint.style.color = "#86efac";
