// 🔒 auth.js — ROOM SAFE FINAL VERSION

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

auth.onAuthStateChanged(user => {

  const path = location.pathname;

  // ✅ NEVER interfere with room page (even during Spotify redirect)
  if (path.includes("room.html")) {
    return;
  }

  // Not logged in → protect home page only
  if (!user) {
    if (path.includes("home.html")) {
      window.location.replace("index.html");
    }
    return;
  }

  // Logged in → prevent going back to login page
  if (path.includes("index.html") || path === "/") {
    window.location.replace("home.html");
  }
});


// ==============================
// EMAIL LOGIN
// ==============================
function login() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => window.location.replace("home.html"))
    .catch(err => alert(err.message));
}


// ==============================
// REGISTER
// ==============================
function register() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => window.location.replace("home.html"))
    .catch(err => alert(err.message));
}


// ==============================
// GOOGLE LOGIN
// ==============================
function signInWithGoogle() {
  auth.signInWithPopup(provider)
    .then(() => window.location.replace("home.html"))
    .catch(err => alert(err.message));
}

function logout() {
  auth.signOut().then(() => {
    window.location.replace("index.html");
  });
}
