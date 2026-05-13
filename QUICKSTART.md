# 🚀 Quick Start - Firebase Authentication

## ⚡ 5-Minute Setup

### Step 1: Get Firebase Config (2 minutes)
1. Go to https://console.firebase.google.com/
2. Create a new project or select existing
3. Click **</>** (Web) icon
4. Copy the `firebaseConfig` object from the Firebase snippet (you will paste the values in Step 2)

### Step 2: Add a local config file (1 minute)
Do **not** put secrets in **`auth.js`** (that file is tracked in Git).

1. In the **project root** (next to `index.html`), copy the template:
   ```bash
   cp auth.config.example.js auth.config.js
   ```
   (On Windows you can copy the file in Explorer and rename it.)

2. Open **`auth.config.js`** and paste your Firebase values into **`window.__NV_FIREBASE_CONFIG__`** (replace each empty `''` with the matching string from the Firebase console).

3. Save. **`auth.config.js` is gitignored** — do not `git add` it.

The shape matches what Firebase shows, for example:
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

### Step 3: Enable Google Sign-In (1 minute)
1. Firebase Console → **Authentication** → **Get started**
2. **Sign-in method** tab → Click **Google**
3. Toggle **Enable** → Select support email → **Save**

### Step 4: Add Your Domain (1 minute)
1. Authentication → **Settings** → **Authorized domains**
2. Click **Add domain**
3. Add: `your-username.github.io`

### Step 5: Deploy & Test
```bash
git add .
git commit -m "Add Firebase auth"
git push
```

**Done!** Open the site where **`auth.config.js`** exists (e.g. your machine after copying that file), hard-refresh, and click **Sign In**.

---

## 📋 What You Get

✅ **Black "Sign In" button** (white text)
✅ **Google authentication popup**
✅ **User avatar & name display**
✅ **Working "Log Out" button**
✅ **Mobile responsive**
✅ **No backend required**
✅ **100% free** (50K users/month)

---

## 🔧 Files involved

- ✅ `index.html` - Firebase SDKs, **`auth.config.js`** (optional), then **`auth.min.js`**
- ✅ `style.css` - Auth UI styles
- ✅ `auth.js` / **`auth.min.js`** - Sign-in logic (no Firebase secrets in repo)
- ✅ **`auth.config.example.js`** - Safe template (committed)
- ✅ **`auth.config.js`** - Your real config (**local only**, gitignored)
- ✅ `FIREBASE_SETUP.md` - Full documentation

---

## ⚠️ Common Issues

**Problem:** Popup blocked
**Fix:** Allow popups in browser settings

**Problem:** "Unauthorized domain"
**Fix:** Add your exact domain to Firebase authorized domains

**Problem:** "Firebase is not configured" (alert)
**Fix:** Ensure **`auth.config.js`** exists next to `index.html`, every field is filled, then hard-refresh. Check Network: **`auth.config.js`** should load before **`auth.min.js`**.

**Problem:** Sign-in works locally but not after `git clone`
**Fix:** Expected — **`auth.config.js`** is not in the repo. Copy it again on that machine (or use your team’s secure distribution process).

---

## 📖 Full Documentation

See `FIREBASE_SETUP.md` for:
- Detailed setup instructions
- Troubleshooting guide
- Customization options
- Security best practices
- Additional features

---

## 🎯 Test Locally

Before deploying, test with:
```bash
# Install a simple server
npm install -g http-server

# Run from project directory
http-server

# Visit http://localhost:8080
```

Note: `localhost` is pre-authorized in Firebase. Keep **`auth.config.js`** in the project root while testing.

---

## 💡 Pro Tips

1. **Never commit `auth.config.js`** — it contains your Firebase web config; `.gitignore` already excludes it
2. **After editing `auth.js`**, run **`npm run build:js`** so **`auth.min.js`** matches (CI also runs this on deploy)
3. **Monitor usage** - Firebase Console → Usage tab
4. **Add custom styling** - Edit `.nav-btn.signin` in style.css
5. **Store user data** - Use Firestore (see full docs)

---

Happy coding! 🚀
