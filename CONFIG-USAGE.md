# Configuration System Usage Guide

## Overview

The `config.js` file contains all site statistics and settings that can be easily updated without modifying the HTML or main JavaScript files.

## How It Works

### 1. Configuration File (`config.js`)
Contains all configurable data:
```javascript
const CONFIG = {
    stats: {
        invitationsSent: 10000,
        templates: 60,
        happyCouples: 10000,
        satisfaction: 99,
        averageRating: 4.9
    },
    countdown: {
        daysAhead: 47
    }
    // ... more settings
};
```

### 2. HTML Elements (`index.html`)
Elements with `data-stat` attributes will be automatically updated:
```html
<span class="hero-stat-number" data-stat="invitationsSent">10,000+</span>
<span class="hero-stat-number" data-stat="templates">50+</span>
<span class="hero-stat-number" data-stat="satisfaction">98%</span>
```

### 3. JavaScript Loader (`script.js`)
The `loadConfigData()` function:
- Reads values from `CONFIG.stats`
- Finds all elements with `data-stat` attributes
- Updates their content with formatted values
- Logs the process to the console

## Updating Statistics

### Step 1: Edit `config.js`
```javascript
const CONFIG = {
    stats: {
        invitationsSent: 15000,  // Changed from 10000
        templates: 75,            // Changed from 60
        satisfaction: 99          // Changed from 98
    }
};
```

### Step 2: Refresh the Page
The changes will automatically appear on the website!

## Supported Stat Keys

| Key | Format | Example Output |
|-----|--------|----------------|
| `invitationsSent` | `X,XXX+` | `10,000+` |
| `happyCouples` | `X,XXX+` | `10,000+` |
| `templates` | `XX+` | `60+` |
| `satisfaction` | `XX%` | `99%` |
| `averageRating` | `X.X / 5` | `4.9 / 5` |

## Where Stats Appear

### Hero Section
- Invitations Sent
- Templates
- Satisfaction (Happy Couples)

### Reviews Section (Trust Bar)
- Happy Couples
- Average Rating
- Would Recommend (Satisfaction)

## Debugging

Open the browser console (F12) to see:
- ✅ Configuration loading status
- 📊 Number of elements found
- ✓ Each stat update
- ⚠️ Any warnings or errors

Example console output:
```
✅ Loading configuration data...
📊 Found 6 stat elements to update
  ✓ Updated invitationsSent: 10,000+
  ✓ Updated templates: 60+
  ✓ Updated satisfaction: 99%
  ✓ Updated happyCouples: 10,000+
  ✓ Updated averageRating: 4.9 / 5
  ✓ Updated satisfaction: 99%
✅ Configuration data loaded successfully
```

## Troubleshooting

### Stats Not Updating?

1. **Check Console**: Open browser console (F12) and look for errors
2. **Verify Script Order**: Ensure `config.js` loads before `script.js`
   ```html
   <script src="config.js"></script>
   <script src="script.js"></script>
   ```
3. **Check Attribute Names**: Ensure `data-stat` values match keys in `CONFIG.stats`
4. **Clear Cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Common Issues

**Issue**: "CONFIG not found" error
- **Solution**: Make sure `config.js` is loaded before `script.js`

**Issue**: Stats show old values
- **Solution**: Clear browser cache or add cache-busting parameter:
  ```html
  <script src="config.js?v=2"></script>
  ```

**Issue**: Some stats update, others don't
- **Solution**: Check that the `data-stat` attribute matches a key in `CONFIG.stats`

## Adding New Stats

### 1. Add to Config
```javascript
const CONFIG = {
    stats: {
        // ... existing stats
        newStat: 1234  // Add new stat
    }
};
```

### 2. Add to HTML
```html
<span data-stat="newStat">0</span>
```

### 3. (Optional) Add Custom Formatting
Edit `loadConfigData()` in `script.js`:
```javascript
switch(statKey) {
    // ... existing cases
    case 'newStat':
        formattedValue = `${value} custom format`;
        break;
}
```

## Best Practices

1. **Update config.js only**: Don't edit HTML for stat changes
2. **Use meaningful keys**: Choose clear, descriptive stat names
3. **Test after changes**: Always check console for errors
4. **Keep backups**: Save a copy before making major changes
5. **Document changes**: Note what you changed and why

## Example: Updating for a Milestone

When you reach 20,000 invitations sent:

```javascript
// config.js
const CONFIG = {
    stats: {
        invitationsSent: 20000,  // Updated!
        templates: 60,
        happyCouples: 20000,     // Updated!
        satisfaction: 99,
        averageRating: 4.9
    }
};
```

Save the file, refresh the page, and the stats will automatically update to:
- `20,000+` invitations sent
- `20,000+` happy couples

---

**Last Updated**: 2025-04-27  
**Version**: 2.0
