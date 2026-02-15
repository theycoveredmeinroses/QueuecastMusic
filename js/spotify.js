spotify.js
// =======================================
// SPOTIFY LOGIN (PKCE) — FINAL STABLE (STATE FIX)
// Works on mobile + desktop
// =======================================

const SPOTIFY_CLIENT_ID = "49684497af374db1afc6cdf71f0ff72b";
const BASE_REDIRECT = "https://queuecastformusic.netlify.app/room.html";

// ---------------------------------------
// Random string generator
// ---------------------------------------
function generateRandomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


// ---------------------------------------
// Base64 URL encode
// ---------------------------------------
function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}


// ---------------------------------------
// SHA256 PKCE
// ---------------------------------------
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}


// ---------------------------------------
// START SPOTIFY LOGIN (WITH STATE)
// ---------------------------------------
async function spotifyLogin() {

  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");

  if (!roomId) {
    alert("Room not found");
    return;
  }

localStorage.setItem("spotify_room", roomId);
sessionStorage.setItem("spotify_room", roomId);


  const verifier = generateRandomString(128);
  const challenge = await sha256(verifier);

  localStorage.setItem("spotify_verifier", verifier);

  const scope = "user-read-private user-read-email";

  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      response_type: "code",
      client_id: SPOTIFY_CLIENT_ID,
      scope,
      redirect_uri: BASE_REDIRECT,
      state: roomId,
      code_challenge_method: "S256",
      code_challenge: challenge
    });

  window.location.href = authUrl;
}



// ---------------------------------------
// HANDLE SPOTIFY REDIRECT
// ---------------------------------------
async function checkSpotifyRedirect() {

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const roomId = params.get("state"); // ✅ GET ROOM FROM STATE

  if (!code) return;

  const verifier = localStorage.getItem("spotify_verifier");

  if (!verifier || !roomId) {
    alert("Spotify login expired. Try again.");
    return;
  }

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: "authorization_code",
        code,
        redirect_uri: BASE_REDIRECT,
        code_verifier: verifier
      })
    }
  );

  if (!response.ok) {
    alert("Spotify login failed");
    return;
  }

  const data = await response.json();

  if (!data.access_token) {
    alert("Spotify login failed");
    return;
  }
localStorage.setItem("spotify_access_token", data.access_token);
localStorage.removeItem("spotify_verifier");

window.history.replaceState({}, document.title, `room.html?room=${roomId}`);


enableSpotifyUI();
}


// ---------------------------------------
// ENABLE UI AFTER LOGIN
// ---------------------------------------
function enableSpotifyUI() {
  const btn = document.getElementById("spotifyLoginBtn");
  if (btn) btn.style.display = "none";

  const box = document.getElementById("searchBox");
  const searchBtn = document.getElementById("searchButton");

  if (box) box.disabled = false;
  if (searchBtn) searchBtn.disabled = false;
}


// ---------------------------------------
// SEARCH SONGS
// ---------------------------------------
async function searchSongs() {

  const token = localStorage.getItem("spotify_access_token");

  if (!token) {
    alert("Login with Spotify first");
    return;
  }

  const queryInput = document.getElementById("searchBox");
  const results = document.getElementById("searchResults");

  if (!queryInput || !results) return;

  const query = queryInput.value.trim();
  if (!query) return;

  results.innerHTML = "<p>Searching...</p>";

  try {

    const res = await fetch(
      `https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(query)}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (res.status === 401) {
      alert("Spotify session expired. Login again.");
      localStorage.removeItem("spotify_access_token");
      return;
    }

    if (!res.ok) {
      results.innerHTML = "<p>Search failed</p>";
      return;
    }

    const data = await res.json();

    results.innerHTML = "";

    if (!data.tracks || !data.tracks.items.length) {
      results.innerHTML = "<p>No results</p>";
      return;
    }

    data.tracks.items.forEach(track => {

      const cleanTitle = track.name.replace(/'/g, "");
      const cleanArtist = track.artists[0].name.replace(/'/g, "");

      const div = document.createElement("div");
      div.className = "songResult";

      div.innerHTML = `
        <p><strong>${cleanTitle}</strong> — ${cleanArtist}</p>
        <button onclick="addSpotifySong('${track.id}', '${cleanTitle}', '${cleanArtist}')">
          Add to Queue
        </button>
      `;

      results.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    results.innerHTML = "<p>Error searching</p>";
  }
}


// ---------------------------------------
// INIT
// ---------------------------------------
// ---------------------------------------
// INIT (MOBILE SAFE VERSION)
// ---------------------------------------
window.addEventListener("load", async () => {

  const params = new URLSearchParams(window.location.search);
  const hasCode = params.get("code");

  // If coming from Spotify redirect
  if (hasCode) {
    await checkSpotifyRedirect();
    return; // stop here (avoid double init)
  }

  // Normal page load
  const token = localStorage.getItem("spotify_access_token");

  if (token) {
    enableSpotifyUI();
  }

});

