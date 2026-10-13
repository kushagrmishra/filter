# 🎵 Pink Tilt Quiz — Live TikTok App Filter Guide

This folder contains everything you need to run **Pink Tilt Quiz** as an official, live face filter inside the **TikTok App** on your phone!

---

## ⚡ How to Use This Filter LIVE Inside the TikTok App (5 Minutes)

TikTok allows any creator to test and use their effects live in the TikTok mobile app using **Effect House**'s instant QR Code Preview.

### Step 1: Open TikTok Effect House
1. Download **TikTok Effect House** (free) from [effecthouse.tiktok.com](https://effecthouse.tiktok.com/).
2. Log in with your TikTok account.

### Step 2: Open the "One Person Quiz" Template
1. On the Effect House home screen, click the **Templates** tab on the left.
2. Select **"One Person Quiz"** (found under the **Interactive** category).
   - This template already has all the head tracking, left/right tilt logic, answer timers, and scoring built in!

### Step 3: Drag & Drop the Distinct Question & Answer Textures
The questions and answers are designed with **completely distinct visual styles**:
- **Distinct Question Banners** (`tiktok_effect_house/textures/questions/question_1.png` to `question_50.png`):
  - Wide 800×320 dark neon chalkboard banner with glowing `#FE2C55` border and `🎀 QUESTION #` pill badge.
- **Distinct Left Answer Pods** (`tiktok_effect_house/textures/answers_left/ans_left_1.png` to `ans_left_50.png`):
  - TikTok Red `#FE2C55` pod featuring a bold `⬅️ TILT LEFT` header badge and `OPTION A` label.
- **Distinct Right Answer Pods** (`tiktok_effect_house/textures/answers_right/ans_right_1.png` to `ans_right_50.png`):
  - TikTok Cyan `#25F4EE` pod featuring a bold `TILT RIGHT ➡️` header badge and `OPTION B` label.
- **Composite All-in-One Cards** (`tiktok_effect_house/textures/cards/question_1.png` to `question_50.png`):
  - Pre-combined card containing both the distinct dark question banner on top and the two distinct red/cyan answer pods below.
- **UI Badges & Icons** (`tiktok_effect_house/textures/ui/`):
  - `effect_icon_512x512.png`, `correct_badge.png`, `wrong_badge.png`.

**In Effect House**:
1. In the **Assets** panel (bottom left), click **+ > Import > From Computer**.
2. If using the template's separate slots:
   - Assign `textures/questions/` to the **Question BG** object.
   - Assign `textures/answers_left/` to the **Left Answer BG** object.
   - Assign `textures/answers_right/` to the **Right Answer BG** object.
   *(Or if using single-card mode, simply assign `textures/cards/`).*

### Step 4: Preview & Play LIVE in the TikTok App! 📱
1. In the top-right corner of Effect House, click **"Preview in TikTok"**.
2. A QR Code window will pop up on your computer screen.
3. On your mobile phone, open the **TikTok app**:
   - Go to your **Profile** tab.
   - Tap the **☰ (Menu)** in the top right ➔ tap **My QR Code**.
   - Tap the **Scanner** icon in the top right corner.
   - Point your phone camera at the QR code on your computer screen.
4. **BOOM! The effect opens immediately inside your live TikTok camera!**
   - Tilt your head left or right to answer.
   - Record and post live TikToks with your filter.
   - Tap the Bookmark icon to save it to your **TikTok Favorites** so you can use it anytime.

---

## 🚀 How to Publish the Filter for Everyone on TikTok

Once you're happy with your live test:
1. In Effect House, click the **Submit** button in the top right corner.
2. Enter the effect information:
   - **Effect Name**: `Pink Tilt Quiz`
   - **Effect Icon**: Use the included `tiktok_effect_house/textures/ui/effect_icon_512x512.png`.
   - **Category**: Interactive / Quiz / Awareness.
   - **Hint**: `Tilt head to answer!`
   - **Tags**: `#PinkTiltQuiz`, `#BreastCancerAwareness`, `#HealthCheck`, `#PinkRibbon`
3. Upload a 5–10 second demo video recorded during your test.
4. Click **Submit**. TikTok typically reviews and approves effects within 1 to 24 hours.
5. Once approved, your filter has its own TikTok effect page and audio page where millions of TikTok users can make videos with it!

---

## 📁 File Manifest
```
tiktok_effect_house/
├── README.md                          # This step-by-step guide
├── questions.json                     # JSON list of all 50 questions & answers
└── textures/
    ├── questions/                     # 50 Distinct Question Banners (question_1.png ... question_50.png)
    ├── answers_left/                  # 50 Distinct Left Answer Pods (ans_left_1.png ... ans_left_50.png)
    ├── answers_right/                 # 50 Distinct Right Answer Pods (ans_right_1.png ... ans_right_50.png)
    ├── cards/                         # 50 Composite All-in-One Cards (question_1.png ... question_50.png)
    └── ui/
        ├── effect_icon_512x512.png    # Official square icon required for TikTok submission
        ├── correct_badge.png          # Green "+1 CORRECT" feedback badge
        └── wrong_badge.png            # Red "NOT QUITE" feedback badge
```
