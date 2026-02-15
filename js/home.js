home.js
function makeRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function createRoom() {
  const name = document.getElementById("roomName").value.trim();
  const pass = document.getElementById("roomPass").value.trim();

  if (!name) return alert("Room name required");

  const roomId = makeRoomId();

  db.collection("rooms").doc(roomId).set({
    name,
    passcode: pass || null,
    hostId: auth.currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    window.location.href = `room.html?room=${roomId}`;
  });
}

function joinRoom(roomId) {
  db.collection("rooms").doc(roomId).get().then(doc => {
    const room = doc.data();
    if (!room.passcode) {
      window.location.href = `room.html?room=${roomId}`;
    } else {
      const entered = prompt("Enter room passcode");
      if (entered === room.passcode) {
        window.location.href = `room.html?room=${roomId}`;
      } else {
        alert("Wrong passcode");
      }
    }
  });
}

db.collection("rooms")
  .orderBy("createdAt", "desc")
  .onSnapshot(snapshot => {
    const list = document.getElementById("roomList");
    list.innerHTML = "";

    snapshot.forEach(doc => {
      const room = doc.data();
      const div = document.createElement("div");
      div.className = "room-card";
      div.innerHTML = `
        <h3>${room.name}</h3>
        <p>${room.passcode ? "🔒 Passcode protected" : "🔓 Open room"}</p>
      `;
      div.onclick = () => joinRoom(doc.id);
      list.appendChild(div);
    });
  });
