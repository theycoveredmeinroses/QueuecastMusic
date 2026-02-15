firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyDYiZIQC6Ej9wmW3t_RuVdu5nxnf9VZ1lA",
  authDomain: "queuecast-390d2.firebaseapp.com",
  projectId: "queuecast-390d2",
  storageBucket: "queuecast-390d2.firebasestorage.app",
  messagingSenderId: "44106268436",
  appId: "1:44106268436:web:e81b2d662d689c7ed00c01"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch(console.error);
