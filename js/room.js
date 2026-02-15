room.js
// ==============================
// ROOM.JS — FINAL STABLE VERSION (MOBILE SAFE)
// ==============================

const roomTitle = document.getElementById("roomTitle");
const songList = document.getElementById("songList");

const params = new URLSearchParams(window.location.search);

let roomId = params.get("room");

// 🔥 IMPORTANT: Wait for Spotify redirect cleanup before redirecting home
function resolveRoomId() {
  const state = new URLSearchParams(window.location.search).get("state");

  if (!roomId && state) {
    roomId = state;
    window.history.replaceState({}, "", `room.html?room=${roomId}`);
  }

  if (!roomId && (localStorage.getItem("spotify_room") || sessionStorage.getItem("spotify_room"))) {
  roomId = localStorage.getItem("spotify_room") || sessionStorage.getItem("spotify_room");
  window.history.replaceState({}, "", `room.html?room=${roomId}`);
}


  return roomId;
}

roomId = resolveRoomId();

if (!roomId) {
  // Delay redirect slightly (prevents race condition on mobile)
  setTimeout(() => {
    if (!new URLSearchParams(window.location.search).get("room")) {
      window.location.replace("home.html");
    }
  }, 800);
}

// ==============================
// FIREBASE REFERENCES
// ==============================

const roomRef = db.collection("rooms").doc(roomId);
const songsRef = roomRef.collection("songs");
const votesRef = roomRef.collection("votes");

let currentUser = null;
let isHost = false;

// ==============================
// AUTH LISTENER
// ==============================

auth.onAuthStateChanged(user => {

  if (!user) return;

  currentUser = user;

  roomRef.get().then(doc => {

    if (!doc.exists) {
      alert("Room not found");
      window.location.replace("home.html");
      return;
    }

    const room = doc.data();
    roomTitle.innerText = room.name;
    isHost = user.uid === room.hostId;

    listenSongs();
  });

});

// ==============================
// LISTEN FOR SONG UPDATES
// ==============================

function listenSongs() {

  songsRef.orderBy("votes", "desc").onSnapshot(snapshot => {

    songList.innerHTML = "";

    snapshot.forEach(doc => {

      const s = doc.data();

      songList.innerHTML += `
        <div>
          <strong>${s.title}</strong> — ${s.artist}
          <p>Votes: ${s.votes || 0}</p>
          <button onclick="voteSong('${doc.id}')">Vote</button>
          ${isHost ? `<button onclick="removeSong('${doc.id}')">Remove</button>` : ""}
        </div>
      `;

    });

  });

}

// ==============================
// VOTING SYSTEM
// ==============================

window.voteSong = async songId => {

  if (!currentUser) return;

  await db.runTransaction(async tx => {

    const voteDoc = votesRef.doc(currentUser.uid);
    const prev = await tx.get(voteDoc);

    if (prev.exists) {
      tx.update(songsRef.doc(prev.data().songId), {
        votes: firebase.firestore.FieldValue.increment(-1)
      });
    }

    tx.update(songsRef.doc(songId), {
      votes: firebase.firestore.FieldValue.increment(1)
    });

    tx.set(voteDoc, { songId });

  });

};

// ==============================
// REMOVE SONG (HOST ONLY)
// ==============================

window.removeSong = id => {
  if (isHost) songsRef.doc(id).delete();
};

// ==============================
// LEAVE ROOM
// ==============================

window.leaveRoom = () => {
  window.location.replace("home.html");
};

// ==============================
// ADD SPOTIFY SONG
// ==============================

window.addSpotifySong = async (id, title, artist) => {

  if (!currentUser) {
    alert("You must be logged in");
    return;
  }

  await songsRef.doc(id).set({
    spotifyId: id,
    title,
    artist,
    votes: 0,
    addedBy: currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

};
