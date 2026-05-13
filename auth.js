// ============================================
// FIREBASE AUTHENTICATION CONFIGURATION
// ============================================
// Optional local config (gitignored): copy auth.config.example.js → auth.config.js
// and set real values from Firebase Console > Project Settings > Web app.
// index.html may load auth.config.js before this file when Firebase is enabled; otherwise auth stays disabled.

function getFirebaseConfig() {
  if (typeof window === 'undefined') return null;
  var c = window.__NV_FIREBASE_CONFIG__;
  if (!c || typeof c !== 'object') return null;
  if (typeof c.apiKey !== 'string' || !c.apiKey.trim()) return null;
  if (typeof c.projectId !== 'string' || !c.projectId.trim()) return null;
  if (typeof c.authDomain !== 'string' || !c.authDomain.trim()) return null;
  if (typeof c.storageBucket !== 'string' || !c.storageBucket.trim()) return null;
  if (typeof c.messagingSenderId !== 'string' || !c.messagingSenderId.trim()) return null;
  if (typeof c.appId !== 'string' || !c.appId.trim()) return null;
  return c;
}

// Initialize Firebase
let auth;
const firebaseConfig = getFirebaseConfig();
if (firebaseConfig) {
  try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
}

// ============================================
// DOM ELEMENTS
// ============================================
let signInBtn, loginBtn, logoutBtn, userInfo, userAvatar, userName;

document.addEventListener('DOMContentLoaded', function() {
  signInBtn = document.getElementById('signInBtn');
  loginBtn = document.getElementById('loginBtn');
  logoutBtn = document.getElementById('logoutBtn');
  userInfo = document.getElementById('userInfo');
  userAvatar = document.getElementById('userAvatar');
  userName = document.getElementById('userName');

  // Event Listeners
  if (signInBtn) {
    signInBtn.addEventListener('click', signInWithGoogle);
  }
  
  if (loginBtn) {
    loginBtn.addEventListener('click', signInWithGoogle);
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Auth State Observer
  if (auth) {
    auth.onAuthStateChanged(handleAuthStateChange);
  }
});

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Sign in with Google
 */
function signInWithGoogle() {
  if (!auth) {
    alert('Firebase is not configured. Copy auth.config.example.js to auth.config.js, add your Firebase web app values, and reload. See FIREBASE_SETUP.md.');
    return;
  }

  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  auth.signInWithPopup(provider)
    .then(() => {
      /* onAuthStateChanged updates UI */
    })
    .catch((error) => {
      console.error('❌ Sign in error:', error);
      let errorMessage = 'Sign in failed. Please try again.';
      
      switch (error.code) {
        case 'auth/popup-blocked':
          errorMessage = 'Popup was blocked. Please allow popups for this site.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign in cancelled.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
      }
      
      alert(errorMessage);
    });
}

/**
 * Log out
 */
function logout() {
  if (!auth) return;

  auth.signOut()
    .then(() => {})
    .catch((error) => {
      console.error('❌ Sign out error:', error);
      alert('Sign out failed. Please try again.');
    });
}

/**
 * Handle authentication state changes
 */
function handleAuthStateChange(user) {
  if (user) {
    showUserUI(user);
  } else {
    showSignInUI();
  }
}

/**
 * Show user interface when signed in
 */
function showUserUI(user) {
  // Hide sign in buttons
  if (signInBtn) signInBtn.style.display = 'none';
  if (loginBtn) loginBtn.style.display = 'none';
  
  // Show user info
  if (userInfo) {
    userInfo.style.display = 'flex';
    
    if (userAvatar && user.photoURL) {
      userAvatar.src = user.photoURL;
      userAvatar.alt = user.displayName || 'User';
    }
    
    if (userName) {
      userName.textContent = user.displayName || user.email || 'User';
    }
  }
}

/**
 * Show sign in interface when signed out
 */
function showSignInUI() {
  // Show sign in button
  if (signInBtn) signInBtn.style.display = 'inline-block';
  
  // Hide login button (optional - can show both)
  if (loginBtn) loginBtn.style.display = 'none';
  
  // Hide user info
  if (userInfo) userInfo.style.display = 'none';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get current user
 */
function getCurrentUser() {
  return auth ? auth.currentUser : null;
}

/**
 * Check if user is signed in
 */
function isUserSignedIn() {
  return getCurrentUser() !== null;
}

// Make functions available globally if needed
window.getCurrentUser = getCurrentUser;
window.isUserSignedIn = isUserSignedIn;
