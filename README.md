# 🎵 Pink Tilt Quiz — TikTok Face Filter

A mobile-first TikTok face filter quiz for breast cancer awareness played by tilting your head, inspired by trending TikTok Head Quiz filter games.

Built with vanilla HTML5, CSS3, and modern JavaScript, powered by Google MediaPipe Face Landmarker running 100% on-device in real time with zero server lag.

---

## ✨ TikTok Filter Features

- **TikTok Filter Experience**:
  - Live selfie camera feed with TikTok HUD aesthetics.
  - Floating question card positioned over the hairline/forehead that rotates in real time with your head.
  - Non-mirrored direct view with symmetrical, effortless tilt detection calibrated to ~1.2°–1.5°.
- **Head Tilt Mechanics**:
  - Roll angle computed from outer eye corner landmarks (`33` and `263`).
  - Leaning slightly (~0.6°) highlights your selected option.
  - Tilting past **~1.2°** locks in your answer with a visual charge bar.
  - Symmetrical left/right tilt vector calculation ensures effortless, natural movement.
  - **Deadband / Neutral Reset**: Requires head to return to center before unlocking the next question to prevent accidental double-picks.
- **50 Accessible Awareness Questions**:
  - Balanced, everyday questions about breast cancer awareness, early detection, and healthy habits.
  - Randomly selects 5 questions per round with randomized left/right positions.
- **TikTok Recording Controls**:
  - **Shutter Button**: Signature TikTok red recording core with pulse animation.
  - **Hands-Free Timer**: 3-second countdown timer for hands-free TikTok recording.
  - **Camera Flip**: Instant toggle between front selfie camera and back camera.
  - **Real-Time Video Recording**: Canvas recorder locked to stable 30 FPS with synced audio track for smooth playback.
  - **Direct TikTok Sharing**: Export modal with **"Share to TikTok 🎵"** via the Web Share API or download high-res MP4/WebM.
- **Native TikTok Effect House Project**:
  - Includes a dedicated [`tiktok_effect_house/`](file:///Users/kushagrmishra/Documents/filter/tiktok_effect_house/) folder with formatted `questions.json` and a complete guide to publish directly as an official filter on the TikTok App.

---

## 🎯 How to Use as a TikTok Filter

### 1. Web AR TikTok Filter Simulator (Instant on Mobile)
1. Open the project in your mobile browser (Safari on iOS or Chrome on Android).
2. Tap the **🏷️ AR Forehead** button to lock the card to your forehead.
3. Tap **⏱️ Timer** (optional 3s countdown) and tap the **🔴 Shutter** button to start recording.
4. Tilt your head left or right to answer each question.
5. When finished, tap **🎵 Share to TikTok** to launch TikTok and add trending audio!

### 2. Live Inside the TikTok App (TikTok Effect House)
To use this filter **live directly in your TikTok phone app**:
1. Open [`tiktok_effect_house/README.md`](file:///Users/kushagrmishra/Documents/filter/tiktok_effect_house/README.md).
2. Launch **TikTok Effect House** and open the **"One Person Quiz"** template.
3. Import the pre-made question textures from [`tiktok_effect_house/textures/cards/`](file:///Users/kushagrmishra/Documents/filter/tiktok_effect_house/textures/cards/).
4. Click **"Preview in TikTok"** in Effect House to generate your live QR code.
5. In your **TikTok phone app**, scan the QR code — **the filter opens live on your TikTok camera immediately!** You can record TikTok videos with it and save it to your Favorites.

---

## 💻 Running Locally

Test locally on desktop or mobile:

```bash
# Start local web server:
python3 -m http.server 8099
```

Open `http://localhost:8099` on your browser. Browsers treat `localhost` as a secure context, enabling camera access immediately.

---

## 🚀 One-Click Mobile Deployment (HTTPS)

Modern mobile browsers strictly require **HTTPS** for camera access:

### Option 1: Netlify Drop (Fastest, 30 seconds)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop this folder (`filter/`) directly into the browser window.
3. Netlify will instantly provide a live HTTPS URL you can open on any phone.

### Option 2: GitHub Pages
1. Push this repository to GitHub.
2. In repository **Settings** → **Pages**, select branch `main` and root `/`.
3. Open the generated HTTPS URL on your phone to use the TikTok filter!

---

## 📁 Project Structure

```
├── index.html                  # TikTok filter UI, camera feed, AR forehead mode, recording controls
├── style.css                   # TikTok neon color system (#FE2C55 & #25F4EE), shutter button, cards
├── app.js                      # Head tilt math (1.2°), MediaPipe tracking, 30fps canvas recorder, TikTok share
├── questions.js                # 50 verified awareness questions [Question, Correct, Wrong]
├── tiktok_effect_house/        # Native TikTok Effect House package
│   ├── questions.json          # Formatted 50 questions for TikTok Effect House Head Quiz template
│   └── README.md               # Step-by-step Effect House creation & publishing guide
└── _headers                    # Security & camera permissions headers for hosting
```
