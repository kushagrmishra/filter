# 🎀 Pink Tilt Quiz - Instagram / Meta Spark Filter Guide

This package contains everything needed to publish **Pink Tilt Quiz** as a native camera filter on **Instagram Stories / Reels** and **Facebook** using Meta Spark Studio (formerly Spark AR).

---

## 📁 Package Contents

- **`scripts/PinkTiltQuiz.js`**: Meta Spark JavaScript engine script handling face tracking, head tilt angles (left/right), question randomization, answer validation, score counting, and feedback animations.
- **`questions.json`**: The complete bank of 50 breast cancer awareness questions formatted for Meta Spark.
- **`manifest.json`**: Capabilities specification (Face Tracking, Scripting, Touch Gestures) and target platforms.

---

## 🚀 Step-by-Step Setup in Meta Spark Studio

### 1. Download & Open Meta Spark Studio
1. Download **[Meta Spark Studio](https://spark.meta.com/download/)** (free for macOS / Windows).
2. Log in with your Facebook / Instagram creator account.
3. Click **New Project** → Select **Face Tracking** template (or Blank Project).

### 2. Scene Graph Setup
In the **Scene** panel on the left:
1. Right click on `Camera` → **Add Object** → `Face Tracker`.
2. Under `Face Tracker`, add a **Null Object** and name it `ForeheadAnchor`.
   - Set its Position `Y` to approximately `0.1` to position it directly above the brow / hairline.
3. Inside `ForeheadAnchor`, add:
   - **2D Text** → Name it `txtQuestion` (Question prompt text).
   - **Plane** → Name it `planeLeftCard`. Inside it, add **2D Text** named `txtLeftOption`.
   - **Plane** → Name it `planeRightCard`. Inside it, add **2D Text** named `txtRightOption`.
   - **2D Text** → Name it `txtCounter` (e.g. `Question 1/5`).
   - **2D Text** → Name it `txtFeedback` (e.g. `Tilt your head 👈 or 👉`).
   - **2D Text** → Name it `txtScore` (for results screen).
4. Organize cards into container null objects: `containerStart`, `containerGame`, and `containerEnd`.

### 3. Import Script & Questions
1. In the **Assets** panel (bottom left), click **+ Add Asset** → **Script** → **JavaScript**.
2. Rename the script file or replace its contents with [PinkTiltQuiz.js](file:///Users/kushagrmishra/Documents/filter/spark_ar/scripts/PinkTiltQuiz.js).
3. Save the project as `PinkTiltQuiz.arproj`.

### 4. Test in the Simulator & On Device
- **In Spark Studio**: Select the Real-time Video dropdown in the top bar to test with pre-recorded face tilting video samples or your webcam.
- **On Your Phone**:
  1. Download the **Meta Spark Player** app from the App Store or Google Play Store.
  2. Connect your phone via USB or Wi-Fi, then click **Test on Device** → **Send to Meta Spark Player**.
  3. Tilt your head left and right to verify responsiveness!

---

## 📲 Publishing to Instagram

1. In Meta Spark Studio, click **Publish** (blue button in top right) → **Upload New Effect**.
2. This opens **[Meta Spark Hub](https://spark.meta.com/hub/)**:
   - **Effect Name**: `Pink Tilt Quiz`
   - **Owner / Publisher**: Select your Instagram account.
   - **Platforms**: Check **Instagram** and **Facebook**.
   - **Categories**: *Causes & Awareness*, *Games*, *Selfies*.
   - **Tags**: `breastcancerawareness`, `quiz`, `filter`, `pinkribbon`, `awareness`.
3. **Upload an Icon**: Square 200×200px PNG featuring a pink ribbon and quiz badge.
4. **Upload Demo Video**: Record a 15-second screen recording of yourself tilting your head answering questions.
5. Click **Submit for Review** (Meta review typically approves within 2 to 24 hours).
6. Once approved, your filter will automatically appear on your Instagram profile under the **✨ Filter tab**, and you'll get a direct link you can put on your Instagram bio, Stories, or website!
