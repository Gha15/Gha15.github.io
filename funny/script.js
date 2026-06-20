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

const activeUser = getActiveUser();

const memeForm = document.getElementById("meme-form");
const memeCaptionInput = document.getElementById("meme-caption");
const memeImageInput = document.getElementById("meme-image");
const memeNoteInput = document.getElementById("meme-note");
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

function getActiveUser() {
	const savedUser = sessionStorage.getItem("matix_auth_user");
	if (savedUser) {
		return savedUser;
	}

	const cachedGuest = localStorage.getItem("matix_meme_guest");
	if (cachedGuest) {
		return cachedGuest;
	}

	const prompted = prompt("Pick a meme nickname:");
	const finalName = (prompted || "guest").trim().toLowerCase().slice(0, 20) || "guest";
	localStorage.setItem("matix_meme_guest", finalName);
	return finalName;
}

function showHint(message, isError) {
	memeFormHint.textContent = message;
	memeFormHint.style.color = isError ? "#fecaca" : "#86efac";
}

function isSafeImageUrl(url) {
	return /^https?:\/\//i.test(url);
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

		const img = document.createElement("img");
		img.src = meme.imageUrl;
		img.alt = meme.caption;
		img.loading = "lazy";
		card.appendChild(img);

		const caption = document.createElement("p");
		caption.className = "meme-caption";
		caption.textContent = meme.caption;
		card.appendChild(caption);

		if (meme.note) {
			const note = document.createElement("p");
			note.className = "meme-note";
			note.textContent = meme.note;
			card.appendChild(note);
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

		const loves = meme.loves || 0;
		const lovedByMap = meme.lovedBy || {};
		const isLoved = Boolean(lovedByMap[activeUser]);

		const loveButton = document.createElement("button");
		loveButton.className = "love-button" + (isLoved ? " active" : "");
		loveButton.textContent = "Love " + (isLoved ? "(added)" : "") + "  -  " + loves;
		loveButton.addEventListener("click", () => toggleLove(meme.id, isLoved, loves));
		card.appendChild(loveButton);

		memeFeed.appendChild(card);
	});

	memeCount.textContent = currentMemes.length + " meme" + (currentMemes.length === 1 ? "" : "s");
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
	const caption = memeCaptionInput.value.trim();
	const imageUrl = memeImageInput.value.trim();
	const note = memeNoteInput.value.trim();

	if (!caption || !imageUrl) {
		showHint("Caption and image URL are required.", true);
		return;
	}

	if (!isSafeImageUrl(imageUrl)) {
		showHint("Use a valid http/https image URL.", true);
		return;
	}

	const payload = {
		caption,
		imageUrl,
		note,
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

chatForm.addEventListener("submit", (event) => {
	event.preventDefault();
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

listenForMemes();
listenForChat();
