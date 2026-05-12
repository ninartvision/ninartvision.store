# Firebase Google Authentication Setup Guide

## 📋 Overview
This guide will help you set up Google Sign-In on your GitHub Pages website using Firebase Authentication.

---

## 🚀 Step 1: Create a Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Click **"Add project"** or select an existing project

2. **Create/Select Your Project**
   - Project name: `ninartvision` (or your choice)
   - Enable Google Analytics (optional)
   - Click **"Create project"**

---

## 🔧 Step 2: Register Your Web App

1. **Add a Web App**
   - In Firebase Console, click the **</>** (web) icon
   - App nickname: `Ninart Vision Website`
   - Check **"Also set up Firebase Hosting"** (optional)
   - Click **"Register app"**

2. **Copy Your Firebase Config**
   - You'll see a code snippet like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```
   - **Copy this entire config object**

---

## 🔐 Step 3: Enable Google Authentication

1. **Navigate to Authentication**
   - In Firebase Console sidebar, click **"Authentication"**
   - Click **"Get started"** (if first time)

2. **Enable Google Sign-In**
   - Go to **"Sign-in method"** tab
   - Click **"Google"**
   - Toggle **"Enable"**
   - Select a **"Project support email"**
   - Click **"Save"**

---

## 🌐 Step 4: Add Authorized Domains

1. **Go to Settings**
   - In Authentication > **"Settings"** tab
   - Scroll to **"Authorized domains"**

2. **Add Your GitHub Pages Domain**
   - Click **"Add domain"**
   - Add: `YOUR-USERNAME.github.io`
   - Example: `johnsmith.github.io`
   
3. **Add Custom Domain (if you have one)**
   - If you use a custom domain like `ninartvision.com`
   - Add: `ninartvision.com`
   - Add: `www.ninartvision.com`

4. **For Testing (optional)**
   - `localhost` is already authorized by default

---

## 📝 Step 5: Update Your Code

1. **Open `auth.js`**
   - Find the `firebaseConfig` object at the top

2. **Replace with Your Config**
   - Replace the placeholder values:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",           // ← Replace this
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",  // ← Replace this
     projectId: "YOUR_PROJECT_ID",     // ← Replace this
     storageBucket: "YOUR_PROJECT_ID.appspot.com",  // ← Replace this
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // ← Replace this
     appId: "YOUR_APP_ID"              // ← Replace this
   };
   ```

3. **Save the File**

---

## 🚢 Step 6: Deploy to GitHub Pages

1. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add Firebase Google Authentication"
   git push origin main
   ```

2. **Wait for Deployment**
   - GitHub Pages usually updates within 1-2 minutes
   - Check your site: `https://YOUR-USERNAME.github.io/REPO-NAME`

---

## ✅ Step 7: Test the Authentication

1. **Visit Your Website**
   - Open your GitHub Pages URL

2. **Click "Sign In" Button**
   - Should be a black button in the navigation
   - Click it

3. **Sign In with Google**
   - A popup window will appear
   - Select your Google account
   - Grant permissions

4. **Verify Success**
   - Popup should close
   - "Sign In" button should disappear
   - Your profile picture and name should appear
   - "Log Out" button should be visible

5. **Test Log Out**
   - Click "Log Out"
   - Should return to signed-out state
   - "Sign In" button should reappear

---

## 🔍 Troubleshooting

### ❌ Popup Blocked
**Problem:** Browser blocks the sign-in popup

**Solution:**
- Allow popups for your site in browser settings
- Click the popup icon in address bar
- Select "Always allow popups from this site"

### ❌ Unauthorized Domain Error
**Problem:** `auth/unauthorized-domain`

**Solution:**
- Go to Firebase Console > Authentication > Settings
- Add your exact domain to "Authorized domains"
- Wait 1-2 minutes for changes to propagate

### ❌ Firebase Not Initialized
**Problem:** Console shows "Firebase is not configured"

**Solution:**
- Check that you replaced ALL placeholder values in `auth.js`
- Ensure Firebase config matches your project exactly
- Check browser console for specific errors

### ❌ Network Error
**Problem:** `auth/network-request-failed`

**Solution:**
- Check internet connection
- Verify Firebase project is active
- Try disabling browser extensions (especially ad blockers)

---

## 🎨 Customization

### Change Button Colors
Edit `style.css`:
```css
.nav-btn.signin{
  background: #111;  /* Change to any color */
  color: #fff;       /* Change text color */
}
```

### Show Both Login and Sign In Buttons
Edit `auth.js` - in `showSignInUI()` function:
```javascript
if (loginBtn) loginBtn.style.display = 'inline-block'; // Change to inline-block
```

### Change User Name Display
Edit `auth.js` - in `showUserUI()` function:
```javascript
// Show only first name
userName.textContent = user.displayName?.split(' ')[0] || 'User';

// Show email instead
userName.textContent = user.email;
```

---

## 📱 Mobile Responsiveness

The authentication UI is already responsive:
- Desktop: Full name + avatar + Log Out button
- Mobile: Optimized layout via existing CSS

To customize mobile view, edit `style.css`:
```css
@media (max-width: 768px) {
  .user-name {
    display: none; /* Hide name on mobile */
  }
  
  .user-avatar {
    width: 28px;
    height: 28px;
  }
}
```

---

## 🔒 Security Best Practices

1. **API Key is Public**
   - ✅ It's safe to commit `apiKey` to GitHub
   - Firebase API keys are restricted by domain
   - Only authorized domains can use your Firebase

2. **Set Up Security Rules** (if using Firestore/Database later)
   - Ensure only authenticated users can access data
   - Configure in Firebase Console

3. **Monitor Usage**
   - Check Firebase Console > Usage tab
   - Free tier includes:
     - 50,000 MAU (Monthly Active Users)
     - 10K verifications/day

---

## 📚 Additional Features (Optional)

### Store User Data
If you want to save user info to Firestore:

1. Enable Firestore in Firebase Console
2. Add Firestore SDK to `index.html`:
```html
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
```

3. In `auth.js`, add:
```javascript
const db = firebase.firestore();

function saveUserData(user) {
  db.collection('users').doc(user.uid).set({
    name: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

// Call in handleAuthStateChange when user signs in
```

---

## 🎯 Quick Reference

**Files Modified:**
- ✅ `index.html` - Added Firebase SDK and updated nav buttons
- ✅ `style.css` - Added auth UI styles
- ✅ `auth.js` - Firebase authentication logic (NEW)

**Firebase Console URLs:**
- Project Console: https://console.firebase.google.com/
- Authentication: [Your Project] > Authentication
- Authorized Domains: Authentication > Settings > Authorized domains

**Support:**
- Firebase Docs: https://firebase.google.com/docs/auth/web/google-signin
- Stack Overflow: https://stackoverflow.com/questions/tagged/firebase-authentication

---

## ✨ You're All Set!

Your website now has professional Google Sign-In authentication, completely free and working on GitHub Pages!

**Next Steps:**
1. Replace Firebase config in `auth.js`
2. Push to GitHub
3. Test on your live site
4. Customize styling as needed

Questions? Check the troubleshooting section above or Firebase documentation.
