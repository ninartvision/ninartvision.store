// ============================================
// FIREBASE AUTHENTICATION CONFIGURATION
// ============================================

// TODO: Replace with your actual Firebase config
// Get this from Firebase Console > Project Settings > Your apps > Web app
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let auth;
try {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
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
    alert('Firebase is not configured. Please add your Firebase config in auth.js');
    return;
  }

  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  auth.signInWithPopup(provider)
    .then((result) => {
      console.log('✅ Sign in successful:', result.user.displayName);
      // User is signed in, onAuthStateChanged will handle UI update
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
    .then(() => {
      console.log('✅ Sign out successful');
    })
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
    // User is signed in
    console.log('👤 User signed in:', user.displayName);
    showUserUI(user);
  } else {
    // User is signed out
    console.log('👤 User signed out');
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
