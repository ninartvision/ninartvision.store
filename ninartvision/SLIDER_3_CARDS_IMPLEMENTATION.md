# 🎠 3-Card Slider Implementation Guide

## Overview
The Featured Projects section displays **3 cards simultaneously** on desktop with smooth arrow-based navigation. Fully responsive with 2 cards on tablet and 1 card on mobile.

---

## 📋 Complete Implementation

### 1️⃣ HTML Structure (Already in index.html)

```html
<section id="projects" class="section">
  <div class="container">
    <div class="section-top">
      <h2>Featured Projects</h2>
      <p class="muted">Support new releases, limited editions, and exclusive content.</p>
    </div>

    <!-- Slider Wrapper -->
    <div class="projects-slider-wrap">

      <!-- Left Arrow Button -->
      <button class="projects-arrow left" id="projectsPrev" aria-label="Previous project">
        &#10094;
      </button>

      <!-- Slider Container -->
      <div class="projects-slider" id="projectsSlider">
        <div class="projects-track" id="projectsTrack">
          
          <!-- Card 1 -->
          <article class="card">
            <img src="./images/me9.jpg" alt="Project">
            <div class="card-body">
              <h3>„Svaneti"-„სვანეთი"</h3>
              <p class="muted">Limited edition artworks and fan experiences.</p>
              <a class="link" href="project1.html">Read more →</a>
            </div>
          </article>
      
          <!-- Card 2 -->
          <article class="card">
            <img src="./images/me10.jpg" alt="Project">
            <div class="card-body">
              <h3>„Silent Bloom" - „ჩუმი ყვავილობა"</h3>
              <p class="muted">Join the journey and be part of the creation.</p>
              <a class="link" href="project2.html">Read more →</a>
            </div>
          </article>

          <!-- Card 3 -->
          <article class="card">
            <img src="./images/me6.jpg" alt="Project">
            <div class="card-body">
              <h3>„Roseslover"</h3>
              <p class="muted">Limited edition.</p>
              <a class="link" href="project3.html">Read more →</a>
            </div>
          </article>

          <!-- Add more cards as needed... -->
          
        </div>
      </div>

      <!-- Right Arrow Button -->
      <button class="projects-arrow right" id="projectsNext" aria-label="Next project">
        &#10095;
      </button>

    </div>
  </div>
</section>
```

---

### 2️⃣ CSS Styling (style.css)

```css
/* ===========================
   FEATURED PROJECTS SLIDER
   (Shows 3 cards at a time)
=========================== */
.projects-slider-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0;
}

.projects-slider {
  width: 100%;
  overflow: hidden;
  position: relative;
}

.projects-track {
  display: flex;
  gap: 22px;
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

/* Desktop: Show exactly 3 cards */
.projects-track .card {
  flex: 0 0 calc((100% - 44px) / 3);
  min-width: 0;
  max-width: calc((100% - 44px) / 3);
}

/* Arrow Buttons */
.projects-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  cursor: pointer;
  font-size: 20px;
  font-weight: 700;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  color: #111;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.projects-arrow.left { 
  left: -60px; 
}

.projects-arrow.right { 
  right: -60px; 
}

.projects-arrow:hover:not(:disabled) {
  border-color: #111;
  background: #fff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-50%) scale(1.05);
}

.projects-arrow:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

/* Tablet: Show 2 cards */
@media (max-width: 900px) {
  .projects-track .card {
    flex: 0 0 calc((100% - 22px) / 2);
    max-width: calc((100% - 22px) / 2);
  }
}

/* Mobile: Show 1 card */
@media (max-width: 600px) {
  .projects-track .card {
    flex: 0 0 100%;
    max-width: 100%;
  }

  .projects-arrow.left { left: -10px; }
  .projects-arrow.right { right: -10px; }
}
```

---

### 3️⃣ JavaScript Logic (script.js)

```javascript
/* ========================
   FEATURED PROJECTS SLIDER (3 Cards Visible)
========================= */
const projectsTrack = document.getElementById("projectsTrack");
const projectsPrev = document.getElementById("projectsPrev");
const projectsNext = document.getElementById("projectsNext");

if (projectsTrack && projectsPrev && projectsNext) {
  let currentIndex = 0;
  const cards = projectsTrack.querySelectorAll(".card");
  const totalCards = cards.length;

  // Determine how many cards are visible at once
  function getVisibleCards() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3; // Desktop: Show 3 cards
  }

  // Calculate maximum scroll index
  function getMaxIndex() {
    const visibleCards = getVisibleCards();
    return Math.max(0, totalCards - visibleCards);
  }

  // Update slider position and arrow states
  function updateSlider() {
    const visibleCards = getVisibleCards();
    const cardWidth = cards[0]?.offsetWidth || 0;
    const gap = 22;
    
    // Calculate offset for smooth scrolling
    const offset = currentIndex * (cardWidth + gap);
    projectsTrack.style.transform = `translateX(-${offset}px)`;

    // Update arrow button states
    projectsPrev.disabled = currentIndex === 0;
    projectsPrev.style.opacity = currentIndex === 0 ? '0.4' : '1';
    
    projectsNext.disabled = currentIndex >= getMaxIndex();
    projectsNext.style.opacity = currentIndex >= getMaxIndex() ? '0.4' : '1';
  }

  // Navigate to previous card
  projectsPrev.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateSlider();
    }
  });

  // Navigate to next card
  projectsNext.addEventListener("click", () => {
    const maxIndex = getMaxIndex();
    if (currentIndex < maxIndex) {
      currentIndex++;
      updateSlider();
    }
  });

  // Handle window resize
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      currentIndex = 0;
      updateSlider();
    }, 150);
  });

  // Keyboard navigation (bonus feature)
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" && currentIndex > 0) {
      currentIndex--;
      updateSlider();
    } else if (e.key === "ArrowRight" && currentIndex < getMaxIndex()) {
      currentIndex++;
      updateSlider();
    }
  });

  // Initial setup
  setTimeout(() => {
    updateSlider();
  }, 100);
}
```

---

## 🎯 How It Works

### Desktop View (> 900px)
- **3 cards visible** at the same time
- Clicking left/right arrows scrolls **1 card** at a time
- Smooth CSS transition animation
- Arrows disabled at start/end positions

### Tablet View (600px - 900px)
- **2 cards visible**
- Same arrow navigation
- Responsive card sizing

### Mobile View (< 600px)
- **1 card visible**
- Full-width cards
- Arrows positioned closer to edges

---

## 📐 Key Features

✅ **3 cards displayed simultaneously** on desktop  
✅ **Arrow-based navigation** (left/right buttons)  
✅ **Smooth horizontal scrolling** with CSS transitions  
✅ **Disabled state** for arrows at boundaries  
✅ **Keyboard support** (Arrow Left/Right keys)  
✅ **Fully responsive** (3 → 2 → 1 cards)  
✅ **Works on GitHub Pages** (no external dependencies)  
✅ **Vanilla JavaScript** (no jQuery or frameworks)  
✅ **Clean, modern design** with hover effects  

---

## 🔧 Customization

### Change Number of Visible Cards

**In CSS**, adjust the flex basis calculation:
```css
/* Show 4 cards instead of 3 */
.projects-track .card {
  flex: 0 0 calc((100% - 66px) / 4); /* 4 cards, 3 gaps of 22px */
  max-width: calc((100% - 66px) / 4);
}
```

**In JavaScript**, update `getVisibleCards()`:
```javascript
function getVisibleCards() {
  if (window.innerWidth <= 600) return 1;
  if (window.innerWidth <= 900) return 2;
  return 4; // Changed from 3 to 4
}
```

---

### Change Scroll Speed

**In CSS**, adjust transition duration:
```css
.projects-track {
  transition: transform 0.6s ease; /* Slower (was 0.45s) */
}
```

---

### Change Gap Between Cards

**In CSS**:
```css
.projects-track {
  gap: 30px; /* Changed from 22px */
}
```

**In JavaScript**, update gap value:
```javascript
const gap = 30; // Changed from 22
```

---

### Scroll Multiple Cards at Once

**In JavaScript**, change increment:
```javascript
projectsNext.addEventListener("click", () => {
  const maxIndex = getMaxIndex();
  if (currentIndex < maxIndex) {
    currentIndex += 3; // Scroll 3 cards instead of 1
    if (currentIndex > maxIndex) currentIndex = maxIndex;
    updateSlider();
  }
});
```

---

## 🐛 Troubleshooting

### Issue: Cards not showing 3 at a time

**Solution**: Check browser width is > 900px and verify CSS calc() is correct:
```css
flex: 0 0 calc((100% - 44px) / 3);
```

---

### Issue: Arrows not working

**Solution**: Verify IDs match in HTML and JavaScript:
- HTML: `id="projectsPrev"`, `id="projectsNext"`, `id="projectsTrack"`
- JS: Must match exactly (case-sensitive)

---

### Issue: Cards overlap or break layout

**Solution**: Ensure `max-width` is set:
```css
.projects-track .card {
  max-width: calc((100% - 44px) / 3);
}
```

---

### Issue: Smooth scrolling not working

**Solution**: Add GPU acceleration:
```css
.projects-track {
  will-change: transform;
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 📱 Browser Compatibility

✅ Chrome/Edge (latest)  
✅ Firefox (latest)  
✅ Safari (latest)  
✅ Mobile browsers (iOS Safari, Chrome Mobile)  
✅ GitHub Pages static hosting  

**Minimum Requirements**:
- CSS Flexbox support
- CSS calc() function
- JavaScript ES6 (arrow functions, const/let)

---

## 🚀 Deployment to GitHub Pages

1. **Commit changes**:
```bash
git add .
git commit -m "Implement 3-card slider with arrow navigation"
git push origin main
```

2. **Wait 2-3 minutes** for GitHub Pages to rebuild

3. **Test on production**:
```
https://ninartvision.store
```

4. **Hard refresh** to bypass cache:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

---

## 📊 Performance

- **No external libraries** - Pure vanilla JavaScript
- **Hardware-accelerated** - Uses CSS transforms
- **Smooth 60fps** animations
- **Minimal JavaScript** - ~80 lines of code
- **SEO-friendly** - Semantic HTML structure

---

## ✨ Bonus Features Included

1. **Keyboard navigation** - Use arrow keys
2. **Disabled arrow states** - Visual feedback
3. **Responsive resize handling** - Smooth transitions
4. **Accessibility** - ARIA labels on buttons
5. **Touch-friendly** - Large 48px buttons
6. **Hover effects** - Enhanced UX

---

**Created**: January 31, 2026  
**For**: Ninart Vision Projects Slider  
**Status**: ✅ Production Ready
