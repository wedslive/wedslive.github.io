# Deployment Checklist

Use this checklist before every deployment to prevent caching and blank page issues.

## Pre-Deployment

### 1. Update Version Numbers
- [ ] Increment CSS version: `styles.css?v=__`
- [ ] Increment JS version if changed: `script.js?v=__`
- [ ] Increment config version if changed: `config.js?v=__`

### 2. Code Review
- [ ] No `visibility: hidden` on `<body>` tag
- [ ] No `!important` in CSS (except critical cases)
- [ ] All animations have fallbacks
- [ ] JavaScript has error handling

### 3. Local Testing
- [ ] Test in normal browser
- [ ] Test in incognito/private mode
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Test with JavaScript disabled
- [ ] Test with slow 3G network
- [ ] Test on mobile device

### 4. Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## Deployment

### 1. Deploy Files
- [ ] Upload all changed files
- [ ] Verify upload success
- [ ] Check file permissions

### 2. Immediate Verification
- [ ] Open site in incognito mode
- [ ] Check for blank page
- [ ] Check console for errors
- [ ] Test navigation
- [ ] Test all CTAs

### 3. Cache Testing
- [ ] Clear browser cache and reload
- [ ] Test with different cache states
- [ ] Verify version numbers in network tab

## Post-Deployment

### 1. Monitor (First 30 Minutes)
- [ ] Check analytics for errors
- [ ] Monitor user reports
- [ ] Check server logs
- [ ] Verify all pages load

### 2. User Testing
- [ ] Ask team to test
- [ ] Check on different devices
- [ ] Verify mobile experience
- [ ] Test all major features

### 3. Rollback Plan
- [ ] Have previous version ready
- [ ] Know how to rollback quickly
- [ ] Have emergency contact list

## Emergency Response

If users report blank pages:

### Immediate Actions (< 5 minutes)
1. Check if site loads in incognito
2. Check browser console for errors
3. Verify CSS/JS files are loading
4. Check version numbers

### Quick Fix (< 15 minutes)
1. Add to inline CSS:
   ```css
   body { visibility: visible !important; }
   ```
2. Increment version numbers
3. Deploy and verify

### Proper Fix (< 1 hour)
1. Identify root cause
2. Implement proper solution
3. Test thoroughly
4. Deploy with new version
5. Monitor for 1 hour

## Version History

| Version | Date | Changes | Deployed By |
|---------|------|---------|-------------|
| v=27 | 2025-04-27 | Fixed blank page issue | - |
| v=26 | 2025-04-27 | Added FOUC prevention | - |
| v=25 | - | Initial version | - |

## Notes

- Always increment version on CSS/JS changes
- Test in incognito mode before announcing
- Keep this checklist updated
- Document any issues encountered

---

**Remember:** Better to spend 10 minutes testing than 1 hour fixing production issues!
