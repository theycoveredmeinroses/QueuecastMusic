auth.js
// 🔒 auth.js — ROOM SAFE FINAL VERSION

const emailInput = document.getElementById("email") || null;
const passwordInput = document.getElementById("password") || null;


auth.onAuthStateChanged(user => {
  const path = location.pathname;
  const params = new URLSearchParams(location.search);

  // Allow Spotify redirect to process first
  if (params.has("code")) return;

  // If NOT logged in
  if (!user) {
    if (path.includes("home.html") || path.includes("room.html")) {
      window.location.replace("index.html");
    }
    return;
  }

  // If logged in and on login page
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
