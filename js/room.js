// ==============================
// ROOM.JS — STABLE FIXED VERSION
// ==============================

const roomTitle = document.getElementById("roomTitle");
const songList = document.getElementById("songList");

let currentUser = null;
let isHost = false;
let roomId = null;
let roomRef = null;
let songsRef = null;
let votesRef = null;


// ==============================
// RESOLVE ROOM ID (Spotify safe)
// ==============================

function resolveRoomId() {

  const params = new URLSearchParams(window.location.search);
  let id = params.get("room");

  const state = params.get("state");

  // If coming back from Spotify
  if (!id && state) {
    id = state;
    window.history.replaceState({}, "", `room.html?room=${id}`);
  }

  // Fallback to storage (Spotify mobile safety)
  if (!id) {
    id = localStorage.getItem("spotify_room") ||
         sessionStorage.getItem("spotify_room");
    if (id) {
      window.history.replaceState({}, "", `room.html?room=${id}`);
    }
  }

  return id;
}


// ==============================
// INITIALIZE ROOM
// ==============================

function initRoom() {

  roomId = resolveRoomId();

  if (!roomId) {
    alert("Room not found");
    window.location.replace("home.html");
    return;
  }

  roomRef = db.collection("rooms").doc(roomId);
  songsRef = roomRef.collection("songs");
  votesRef = roomRef.collection("votes");

  setupAuthListener();
}


// ==============================
// AUTH LISTENER
// ==============================

function setupAuthListener() {

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

}


// ==============================
// LISTEN FOR SONG UPDATES
// ==============================

function listenSongs() {

  songsRef.orderBy("votes", "desc")
    .onSnapshot(snapshot => {

      songList.innerHTML = "";

      snapshot.forEach(doc => {

        const s = doc.data();

        const div = document.createElement("div");

        div.innerHTML = `
          <strong>${s.title}</strong> — ${s.artist}
          <p>Votes: ${s.votes || 0}</p>
          <button onclick="voteSong('${doc.id}')">Vote</button>
          ${isHost ? `<button onclick="removeSong('${doc.id}')">Remove</button>` : ""}
        `;

        songList.appendChild(div);

      });

    });

}


// ==============================
// VOTE SONG
// ==============================

window.voteSong = async (songId) => {

  if (!currentUser) return;

  await db.runTransaction(async tx => {

    const voteDoc = votesRef.doc(currentUser.uid);
    const prev = await tx.get(voteDoc);

    if (prev.exists) {
      tx.update(
        songsRef.doc(prev.data().songId),
        { votes: firebase.firestore.FieldValue.increment(-1) }
      );
    }

    tx.update(
      songsRef.doc(songId),
      { votes: firebase.firestore.FieldValue.increment(1) }
    );

    tx.set(voteDoc, { songId });

  });

};


// ==============================
// REMOVE SONG (HOST)
// ==============================

window.removeSong = (id) => {
  if (isHost) {
    songsRef.doc(id).delete();
  }
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
    alert("Login required");
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


// ==============================
// START
// ==============================

window.addEventListener("load", () => {
  initRoom();
});
