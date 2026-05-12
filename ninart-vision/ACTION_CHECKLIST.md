# ✅ SANITY AUDIT ACTION CHECKLIST

**Project**: Ninart Vision  
**Created**: February 3, 2026  
**Status**: Audit Complete, Implementation Pending

---

## 📋 AUDIT COMPLETION STATUS

### Documentation Created ✅

- [x] Global audit report ([SANITY_GLOBAL_AUDIT.md](SANITY_GLOBAL_AUDIT.md))
- [x] Executive summary ([AUDIT_EXECUTIVE_SUMMARY.md](AUDIT_EXECUTIVE_SUMMARY.md))
- [x] Implementation guide ([MODAL_GALLERY_FIX.md](MODAL_GALLERY_FIX.md))
- [x] Quick fix reference ([QUICK_MODAL_FIX.md](QUICK_MODAL_FIX.md))
- [x] Fix summary ([MODAL_FIX_SUMMARY.md](MODAL_FIX_SUMMARY.md))

### Documentation Updated ✅

- [x] Safe gallery queries ([GROQ_QUERIES.md](GROQ_QUERIES.md))
- [x] Safe rendering patterns ([FRONTEND_RENDERING.md](FRONTEND_RENDERING.md))
- [x] Architecture examples ([ARCHITECTURE.md](ARCHITECTURE.md))
- [x] Homepage schema examples ([HOMEPAGE_SCHEMA.md](HOMEPAGE_SCHEMA.md))

### Audit Tasks ✅

- [x] Review all 7 document schemas
- [x] Review all 10 object schemas
- [x] Audit all GROQ query documentation
- [x] Identify navigation fields in schemas
- [x] Map reference relationships
- [x] Analyze portable text usage
- [x] Establish context separation rules
- [x] Identify all navigation risks

---

## 🔴 CRITICAL ACTIONS (Frontend Team)

### Phase 1: Gallery Fix (URGENT)

- [ ] **Update GROQ queries** in `sanity/lib/queries.ts`
  - [ ] Remove `slug` from gallery artwork projections
  - [ ] Remove `slug` from artist references in galleries
  - [ ] Add `year`, `medium`, `dimensions`, `description` fields
  - Reference: [GROQ_QUERIES.md](GROQ_QUERIES.md) lines 35-88

- [ ] **Update Gallery Component** in `components/sections/GallerySection.tsx`
  - [ ] Remove all `<Link>` wrappers around artworks
  - [ ] Replace with `<button type="button">`
  - [ ] Add modal state management (`useState`)
  - [ ] Implement `onClick` with `preventDefault` and `stopPropagation`
  - [ ] Add modal UI with navigation controls
  - Reference: [MODAL_GALLERY_FIX.md](MODAL_GALLERY_FIX.md) lines 115-283

- [ ] **Add Modal Styles** in `app/globals.css` or `styles/gallery.css`
  - [ ] Gallery button styles
  - [ ] Modal overlay styles
  - [ ] Modal content styles
  - [ ] Modal close button styles
  - [ ] Modal navigation button styles
  - Reference: [MODAL_GALLERY_FIX.md](MODAL_GALLERY_FIX.md) lines 289-410

- [ ] **Test Gallery Interactions**
  - [ ] Click any artwork → modal opens (no navigation)
  - [ ] Modal displays correct artwork
  - [ ] Prev/Next buttons work
  - [ ] Close button works
  - [ ] Click overlay → modal closes
  - [ ] ESC key closes modal
  - [ ] No redirects to Shop/Support
  - [ ] Test across all artists
  - [ ] Test on mobile devices

### Phase 2: Shop/Support Investigation (HIGH PRIORITY)

- [ ] **Check Frontend Routes**
  - [ ] Search codebase for `/shop` route
  - [ ] Search codebase for `/support` route
  - [ ] Check route configuration files

- [ ] **Query Sanity for Pages**
  - [ ] Query: `*[_type == "page" && slug.current match "shop*"]`
  - [ ] Query: `*[_type == "page" && slug.current match "support*"]`
  - [ ] Check results for page documents

- [ ] **Audit Navigation Menu**
  - [ ] Query Sanity for siteSettings
  - [ ] Review `mainNavigation` array
  - [ ] Check for Shop/Support links
  - [ ] Verify link types (internal/external)

- [ ] **Check External Integrations**
  - [ ] Shopify integration?
  - [ ] WooCommerce integration?
  - [ ] Support ticketing system?
  - [ ] Any third-party e-commerce?

### Phase 3: Secondary Risk Mitigation (MEDIUM PRIORITY)

- [ ] **Audit Slider Sections**
  - [ ] Find all sliderSection implementations
  - [ ] Check for slides with links
  - [ ] Review z-index and positioning
  - [ ] Ensure sliders don't overlay galleries
  - [ ] Test slider click behavior

- [ ] **Audit Artist Sections**
  - [ ] Find ArtistSection component
  - [ ] Check if artists use `<Link>` wrappers
  - [ ] If yes, assess if this causes issues
  - [ ] Consider button pattern for consistency
  - [ ] Test artist card interactions

- [ ] **Review Navigation Menu**
  - [ ] Check header/nav positioning (sticky/fixed?)
  - [ ] Review z-index values
  - [ ] Ensure nav doesn't overlay gallery
  - [ ] Test navigation hover states
  - [ ] Check mobile menu behavior

- [ ] **Audit Portable Text Rendering**
  - [ ] Find PortableText component
  - [ ] Check how internalLink annotations render
  - [ ] Review textSection positioning
  - [ ] Ensure adequate spacing from galleries
  - [ ] Test link click behavior

---

## ⚠️ MEDIUM PRIORITY ACTIONS

### Code Quality Improvements

- [ ] **TypeScript Type Safety**
  - [ ] Create `ArtworkGalleryItem` type (without slug)
  - [ ] Create `ArtworkDetail` type (with slug)
  - [ ] Update component signatures
  - [ ] Enforce context-specific types

- [ ] **Query Library**
  - [ ] Create `projections.ts` file
  - [ ] Define `ARTWORK_GALLERY_PROJECTION`
  - [ ] Define `ARTWORK_DETAIL_PROJECTION`
  - [ ] Define `ARTIST_GALLERY_PROJECTION`
  - [ ] Use named projections in queries

- [ ] **ESLint Rules**
  - [ ] Add rule: No `<Link>` wrapping `<Image>` in galleries
  - [ ] Add rule: Gallery components must use button
  - [ ] Configure no-restricted-syntax rules
  - Reference: [MODAL_GALLERY_FIX.md](MODAL_GALLERY_FIX.md) lines 425-438

### Testing

- [ ] **Unit Tests**
  - [ ] Gallery component rendering
  - [ ] Modal state management
  - [ ] Event handler behavior
  - [ ] Button click prevents navigation

- [ ] **Integration Tests**
  - [ ] Gallery → Modal flow
  - [ ] Modal navigation controls
  - [ ] Close modal interactions
  - [ ] No accidental navigation

- [ ] **Visual Regression**
  - [ ] Gallery grid layout
  - [ ] Modal open state
  - [ ] Modal with different artwork data
  - [ ] Responsive layouts

---

## ✅ LOW PRIORITY ACTIONS

### Documentation Improvements

- [ ] **Schema Field Hints**
  - [ ] Add descriptions to slug fields
  - [ ] Warn about context-specific usage
  - [ ] Document field groups

- [ ] **Frontend Documentation**
  - [ ] Document context separation pattern
  - [ ] Create component usage examples
  - [ ] Add troubleshooting guide

### Long-Term Improvements

- [ ] **Performance Optimization**
  - [ ] Lazy load modal component
  - [ ] Optimize image loading
  - [ ] Implement virtualization for large galleries

- [ ] **Accessibility Enhancements**
  - [ ] Keyboard navigation improvements
  - [ ] Screen reader announcements
  - [ ] Focus management in modal
  - [ ] ARIA attributes audit

- [ ] **User Experience**
  - [ ] Add image zoom in modal
  - [ ] Implement swipe gestures (mobile)
  - [ ] Add loading states
  - [ ] Improve transitions

---

## 📊 PROGRESS TRACKING

### Critical Path Progress

| Task | Status | Owner | Due Date | Notes |
|------|--------|-------|----------|-------|
| Update gallery queries | ⏳ Pending | Frontend | ASAP | Blocking |
| Update gallery component | ⏳ Pending | Frontend | ASAP | Blocking |
| Add modal styles | ⏳ Pending | Frontend | ASAP | Blocking |
| Test gallery interactions | ⏳ Pending | QA | After above | Blocking |
| Investigate Shop/Support | ⏳ Pending | Frontend | High priority | Important |

### Secondary Tasks Progress

| Category | Tasks Total | Completed | Pending | Priority |
|----------|-------------|-----------|---------|----------|
| Slider audit | 5 | 0 | 5 | Medium |
| Artist section audit | 5 | 0 | 5 | Medium |
| Navigation menu | 5 | 0 | 5 | Medium |
| Portable text | 4 | 0 | 4 | Medium |
| Type safety | 4 | 0 | 4 | Medium |
| ESLint rules | 3 | 0 | 3 | Medium |
| Testing | 9 | 0 | 9 | Medium |

---

## 🎯 SUCCESS CRITERIA

### Must Have (P0)
- ✅ No redirects when clicking gallery artworks
- ✅ Modal opens for every gallery click
- ✅ Modal displays correct artwork information
- ✅ Modal navigation works (prev/next)
- ✅ Modal closes properly (button, overlay, ESC)

### Should Have (P1)
- ✅ Shop/Support navigation sources identified
- ✅ No slider interference with galleries
- ✅ No navigation menu overlay issues
- ✅ Type safety implemented

### Nice to Have (P2)
- ✅ ESLint rules prevent regressions
- ✅ Comprehensive test coverage
- ✅ Visual regression tests
- ✅ Performance optimizations

---

## 📝 NOTES & LEARNINGS

### Key Insights
- Sanity schemas are well-designed; no schema changes needed
- Same data needs different queries for different contexts
- Defensive event handling is essential for modal interactions
- Type safety can enforce context separation

### Common Pitfalls to Avoid
- Don't fetch slug fields in gallery contexts
- Don't auto-wrap images in `<Link>` components
- Don't assume single event handlers are sufficient
- Don't ignore z-index and positioning issues

### Best Practices Established
- Use named projections for context-specific queries
- Implement discriminated unions for type safety
- Always use preventDefault + stopPropagation in modals
- Test interactions across all data scenarios

---

## 🆘 SUPPORT RESOURCES

### Documentation
- [SANITY_GLOBAL_AUDIT.md](SANITY_GLOBAL_AUDIT.md) - Comprehensive analysis
- [MODAL_GALLERY_FIX.md](MODAL_GALLERY_FIX.md) - Implementation guide
- [QUICK_MODAL_FIX.md](QUICK_MODAL_FIX.md) - Quick reference

### Code References
- [GROQ_QUERIES.md](GROQ_QUERIES.md) - Safe query patterns
- [FRONTEND_RENDERING.md](FRONTEND_RENDERING.md) - Component examples

### Contact Points
- Sanity Schema Issues: Review [SANITY_GLOBAL_AUDIT.md](SANITY_GLOBAL_AUDIT.md) Section 1
- Query Issues: Review [SANITY_GLOBAL_AUDIT.md](SANITY_GLOBAL_AUDIT.md) Section 3
- Frontend Issues: Review [MODAL_GALLERY_FIX.md](MODAL_GALLERY_FIX.md)

---

**Last Updated**: February 3, 2026  
**Next Review**: After Phase 1 implementation  
**Owner**: Frontend Team Lead
