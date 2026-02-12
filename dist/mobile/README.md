# HIVEMIND Mobile

Mobile client for HIVEMIND network - works on Android, iOS, and any mobile browser.

## Features

- 📱 **Mobile Optimized** - Touch-friendly interface
- 📴 **Offline Ready** - PWA with service worker
- 🔗 **WebSocket Connection** - Real-time updates
- 🪙 **Credit Management** - View and earn credits
- 📝 **Task Submission** - Submit AI tasks from phone
- 👥 **Worker Monitoring** - View network status

## How to Use

### Option 1: Mobile Browser (Easiest)
1. Copy `dist/mobile/` folder to your web server
2. Open on phone: `http://YOUR_SERVER/mobile/`
3. Add to home screen for app experience

### Option 2: Android App (APK)
Build with Capacitor or Cordova:

```bash
npm install -g capacitor
cd dist/mobile
npx cap init "HIVEMIND" --web-dir=.
npx cap add android
npx cap sync
# Open Android Studio and build APK
```

### Option 3: iOS App
```bash
npm install -g capacitor
cd dist/mobile
npx cap init "HIVEMIND" --web-dir=.
npx cap add ios
npx cap sync
# Open Xcode and build
```

## Requirements

- Modern mobile browser (Chrome, Safari, Firefox)
- Internet connection
- HIVEMIND server URL

## Configuration

Edit `index.html` and change:
```javascript
const API_URL = 'ws://YOUR_SERVER_IP:3001';
```

Or configure in localStorage from the app settings.

## Running on Phone

1. Host the mobile folder on a web server
2. Get your server IP: `curl ifconfig.me`
3. Open port 3000 on your firewall
4. Users visit: `http://YOUR_IP:3000/mobile/`
5. Tap "Add to Home Screen" for full app experience

## Features

- ✅ Submit AI tasks
- ✅ View credit balance
- ✅ Monitor workers
- ✅ Real-time updates
- ✅ Works offline (cached)
- ✅ Dark mode
- ✅ Touch optimized

## Browser Support

- Chrome Android: ✅ Full support
- Safari iOS: ✅ Full support  
- Firefox Mobile: ✅ Full support
- Samsung Internet: ✅ Full support

## Build for Production

For better performance, minify the HTML:

```bash
# Install html-minifier
npm install -g html-minifier

# Minify
html-minifier --collapse-whitespace --remove-comments --minify-css --minify-js index.html -o index.min.html
```

---

**Version**: 1.0.0
