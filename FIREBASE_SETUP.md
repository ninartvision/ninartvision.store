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

## 📝 Step 5: Add your Firebase config (safe flow)

The site loads **`auth.min.js`**, which reads config from **`window.__NV_FIREBASE_CONFIG__`**.  
You set that in a **local-only** file so you never paste real keys into `auth.js` (which stays in Git).

1. **Copy the example file** (in the **site root**, next to `index.html`):
   ```bash
   cp auth.config.example.js auth.config.js
   ```
   On Windows (PowerShell), you can copy-paste in File Explorer instead.

2. **Open `auth.config.js`** and replace the **empty strings** with the values from Firebase (Project settings → Your apps → Web app → `firebaseConfig`).

   The file should look like this shape (use **your** values from the console — the example below is not real):

   ```javascript
   window.__NV_FIREBASE_CONFIG__ = {
     apiKey: '…',
     authDomain: '…',
     projectId: '…',
     storageBucket: '…',
     messagingSenderId: '…',
     appId: '…',
   };
   ```

3. **Keep `auth.config.js` out of Git**  
   It is already listed in **`.gitignore`**. Do not `git add` it.  
   If you open `auth.config.example.js`, you’ll see the same structure with empty placeholders — that file **is** safe to commit.

4. **Reload the site**  
   `index.html` loads `auth.config.js` **before** `auth.min.js`. If the file is missing or any field is left empty, sign-in stays disabled (no crash).

5. **Optional: minified auth bundle**  
   After changing **`auth.js`** (logic only), run **`npm run build:js`** so **`auth.min.js`** stays in sync (CI does this on deploy too).

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
**Problem:** Alert or console shows that Firebase is not configured

**Solution:**
- Confirm **`auth.config.js`** exists in the **project root** (copied from **`auth.config.example.js`**).
- Fill **every** field in **`window.__NV_FIREBASE_CONFIG__`** (no empty strings).
- Hard-refresh the page. Check the browser **Network** tab: `auth.config.js` should load **before** `auth.min.js` (HTTP 200 on your machine; a 404 is OK on GitHub until you add the file locally and deploy, or use a private deploy secret — for Pages, keep config in `auth.config.js` only on machines that need sign-in, or document your team’s approach).

### ❌ Wrong file edited
**Problem:** Keys were pasted into **`auth.js`** and committed

**Solution:**
- Remove secrets from Git history if they were committed (rotate keys in Firebase Console).
- Move values into **`auth.config.js`** only; restore **`auth.js`** from the repo.

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
Edit **`auth.js`** (then run **`npm run build:js`** to refresh **`auth.min.js`**) — in **`showSignInUI()`**:
```javascript
if (loginBtn) loginBtn.style.display = 'inline-block'; // Change to inline-block
```

### Change User Name Display
Edit **`auth.js`** — in **`showUserUI()`**:
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

1. **Keep Firebase web config out of Git**  
   - Use **`auth.config.js`** (gitignored) for `apiKey`, `projectId`, etc.  
   - **`auth.config.example.js`** shows the shape with **empty** strings — safe to commit.

2. **API Key still appears in the browser**  
   - That is normal for client-side Firebase. Restrict with **Authorized domains** in Firebase Console.

3. **Set Up Security Rules** (if using Firestore/Database later)
   - Ensure only authenticated users can access data
   - Configure in Firebase Console

4. **Monitor Usage**
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

3. In **`auth.js`** (then rebuild **`auth.min.js`** with **`npm run build:js`**), add:
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

**Files involved:**
- ✅ `index.html` - Loads Firebase SDKs, optional **`auth.config.js`**, then **`auth.min.js`**
- ✅ `style.css` - Auth UI styles
- ✅ `auth.js` / **`auth.min.js`** - Sign-in logic (no secrets in repo)
- ✅ **`auth.config.example.js`** - Committed template (empty values)
- ✅ **`auth.config.js`** - **Local only** (gitignored) — paste your Firebase web config here

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
1. Create **`auth.config.js`** from **`auth.config.example.js`** and add your Firebase web app values
2. Run **`npm run build:js`** locally if you edited **`auth.js`**
3. Push to GitHub (**never** commit **`auth.config.js`** — it stays gitignored)
4. Test sign-in in an environment that actually has **`auth.config.js`** (e.g. local preview). A fresh clone from GitHub will not include that file
5. Customize styling as needed

Questions? Check the troubleshooting section above or Firebase documentation.
