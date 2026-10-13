// Pink Tilt Quiz - Breast Cancer Awareness Filter App
import {
  FaceLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

// --- Game State & Configuration ---
const CONFIG = {
  ROUND_QUESTIONS_COUNT: 5,
  TILT_HIGHLIGHT_DEG: 0.6, // Early highlight at ~0.6 degrees
  TILT_LOCKIN_DEG: 1.2,    // 20% easier lock-in at ~1.2 degrees
  TILT_LOCKIN_MS: 180,     // Snappy 180ms hold duration
  TILT_NEUTRAL_DEG: 0.5,   // Effortless neutral return threshold
  MODEL_URL: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  WASM_URL: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
};

const state = {
  currentRoundQuestions: [],
  currentQuestionIndex: 0,
  score: 0,
  completedCount: 0,
  gameState: "start", // 'start', 'playing', 'answering', 'wrong_modal', 'end'
  cameraEnabled: false,
  soundEnabled: true,
  faceLandmarker: null,
  activeTiltDirection: null, // 'left' | 'right' | null
  tiltStartTime: 0,
  currentAngle: 0,
  waitingForNeutral: false,
  lastVideoTime: -1,
  faceDetected: false,
  // Instagram Filter AR & Recording state
  arForeheadTracking: true,
  arCurrentX: 0,
  arCurrentY: 0,
  arCurrentScale: 1,
  arCurrentAngle: 0,
  isRecording: false,
  mediaRecorder: null,
  recordedChunks: [],
  recordedBlob: null,
  recordStartTime: 0,
  recordTimerInterval: null,
  cameraFacingMode: "user", // 'user' | 'environment'
  recordTimerCountdown: 0   // 0 (off) or 3 seconds
};

// --- DOM Elements ---
const elements = {
  appContainer: document.getElementById("app-container"),
  cameraFeed: document.getElementById("camera-feed"),
  btnSoundToggle: document.getElementById("btn-sound-toggle"),
  btnArToggle: document.getElementById("btn-ar-toggle"),
  faceHint: document.getElementById("face-hint"),
  neutralHint: document.getElementById("neutral-hint"),
  quizSection: document.querySelector(".quiz-section"),
  quizCard: document.getElementById("quiz-card"),
  questionText: document.getElementById("question-text"),
  answerLeft: document.getElementById("answer-left"),
  answerRight: document.getElementById("answer-right"),
  answerLeftLabel: document.getElementById("answer-left-label"),
  answerRightLabel: document.getElementById("answer-right-label"),
  answerLeftFill: document.getElementById("answer-left-fill"),
  answerRightFill: document.getElementById("answer-right-fill"),
  tiltDivider: document.getElementById("tilt-divider"),
  tiltMeterDot: document.getElementById("tilt-meter-dot"),
  ribbonClipRect: document.getElementById("ribbon-clip-rect"),
  progressCounter: document.getElementById("progress-counter"),
  wrongModal: document.getElementById("wrong-answer-modal"),
  wrongModalAnswer: document.getElementById("wrong-modal-answer"),
  startScreen: document.getElementById("start-screen"),
  endScreen: document.getElementById("end-screen"),
  cameraErrorModal: document.getElementById("camera-error-modal"),
  errorMessage: document.getElementById("error-message"),
  btnStart: document.getElementById("btn-start"),
  btnPlayTap: document.getElementById("btn-play-tap"),
  btnPlayAgain: document.getElementById("btn-play-again"),
  btnRetryCamera: document.getElementById("btn-retry-camera"),
  btnFallbackTap: document.getElementById("btn-fallback-tap"),
  finalScore: document.getElementById("final-score"),
  finalMessage: document.getElementById("final-message"),
  // Video Recording & Export elements
  btnRecord: document.getElementById("btn-record"),
  btnRecordTimer: document.getElementById("btn-record-timer"),
  timerLabel: document.getElementById("timer-label"),
  btnCameraFlip: document.getElementById("btn-camera-flip"),
  countdownOverlay: document.getElementById("countdown-overlay"),
  countdownNumber: document.getElementById("countdown-number"),
  recordingBadge: document.getElementById("recording-badge"),
  recordingTimer: document.getElementById("recording-timer"),
  recorderCanvas: document.getElementById("recorder-canvas"),
  videoExportModal: document.getElementById("video-export-modal"),
  recordedPreview: document.getElementById("recorded-preview"),
  btnShareTikTok: document.getElementById("btn-share-tiktok") || document.getElementById("btn-share-insta"),
  btnShareInsta: document.getElementById("btn-share-tiktok") || document.getElementById("btn-share-insta"),
  btnDownloadVideo: document.getElementById("btn-download-video"),
  btnCloseExport: document.getElementById("btn-close-export")
};

// --- Synthesized Web Audio Sound Effects ---
class SoundManager {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => { });
    }
  }

  playTone(freq, duration, type = "sine", gainVal = 0.2, decay = 0.05) {
    if (!state.soundEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      if (this.recDest) {
        try { gain.connect(this.recDest); } catch (err) { }
      }
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio fallback silent
    }
  }

  playTiltTick() {
    this.playTone(600, 0.08, "triangle", 0.08);
  }

  playCorrect() {
    if (!state.soundEnabled || !this.ctx) return;
    // Cheerful, uplifting chord
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.35, "sine", 0.18);
      }, i * 90);
    });
  }

  playWrong() {
    if (!state.soundEnabled || !this.ctx) return;
    // Gentle soft descending tone
    const now = this.ctx.currentTime;
    [392.00, 311.13].forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.4, "triangle", 0.16);
      }, i * 150);
    });
  }

  playCelebration() {
    if (!state.soundEnabled || !this.ctx) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.5, "sine", 0.2);
      }, i * 110);
    });
  }
}

const sounds = new SoundManager();

// --- MediaPipe Face Landmarker Initialization ---
async function initMediaPipe() {
  if (state.faceLandmarker) return state.faceLandmarker;

  const vision = await FilesetResolver.forVisionTasks(CONFIG.WASM_URL);

  // Try GPU first; if hardware doesn't support it, cleanly fallback to CPU
  try {
    state.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: CONFIG.MODEL_URL,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numFaces: 1
    });
  } catch (gpuError) {
    console.warn("GPU delegate unavailable, attempting CPU delegate:", gpuError);
    state.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: CONFIG.MODEL_URL,
        delegate: "CPU"
      },
      runningMode: "VIDEO",
      numFaces: 1
    });
  }

  return state.faceLandmarker;
}

// --- Camera Setup & Stream Management ---
async function startCamera() {
  elements.btnStart.disabled = true;
  elements.btnStart.innerHTML = `<div class="loading-indicator"><div class="spinner"></div><span>Starting camera…</span></div>`;

  try {
    sounds.init();

    // Check mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera API is not supported in this browser or requires HTTPS (or localhost).");
    }

    let stream = null;
    const constraintTries = [
      { video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } }, audio: false },
      { video: { facingMode: "user" }, audio: false },
      { video: true, audio: false }
    ];

    let lastErr = null;
    for (const constraints of constraintTries) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err) {
        lastErr = err;
        console.warn("Camera constraint attempt failed, trying fallback:", constraints, err);
      }
    }

    if (!stream) {
      throw lastErr || new Error("Could not access camera device.");
    }

    state.mediaStream = stream;
    const video = elements.cameraFeed;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.srcObject = stream;

    // Immediately trigger play
    try {
      await video.play();
    } catch (pErr) {
      console.warn("Initial video.play() warning, awaiting loadedmetadata:", pErr);
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve).catch(resolve);
        };
        setTimeout(resolve, 800);
      });
    }

    state.cameraEnabled = true;
    elements.appContainer.classList.remove("camera-inactive");

    // Hide Start Screen & Start Quiz immediately with live camera background
    elements.startScreen.classList.add("hidden");
    startNewGameRound();

    // Initialize MediaPipe AI in background without blocking camera feed
    initMediaPipe()
      .then(() => {
        console.log("MediaPipe Face Landmarker loaded successfully!");
        state.lastDetectionTimestamp = performance.now();
        requestAnimationFrame(predictVideoLoop);
      })
      .catch((pipeErr) => {
        console.warn("MediaPipe model loading warning, tap fallback active:", pipeErr);
        if (elements.faceHint) {
          elements.faceHint.textContent = "TAP TO CHOOSE (AI LOADING…)";
          elements.faceHint.classList.remove("hidden");
          setTimeout(() => {
            if (!state.faceDetected) {
              elements.faceHint.classList.add("hidden");
            }
          }, 3500);
        }
      });

  } catch (err) {
    console.error("Camera access failed:", err);
    showCameraError(err.message || "Could not access the camera. Please check permissions or run over HTTPS.");
  } finally {
    elements.btnStart.disabled = false;
    elements.btnStart.textContent = "Allow camera & start";
  }
}

function stopCamera() {
  if (state.mediaStream) {
    try {
      state.mediaStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.warn("Error stopping media tracks:", e);
    }
    state.mediaStream = null;
  }
  if (elements.cameraFeed) {
    elements.cameraFeed.srcObject = null;
  }
  state.cameraEnabled = false;
}

function showCameraError(msg) {
  elements.errorMessage.textContent = msg;
  elements.cameraErrorModal.classList.remove("hidden");
}

function startTapOnlyMode() {
  sounds.init();
  stopCamera();
  elements.appContainer.classList.add("camera-inactive");
  elements.startScreen.classList.add("hidden");
  elements.cameraErrorModal.classList.add("hidden");
  elements.faceHint.classList.add("hidden");
  elements.neutralHint.classList.remove("visible");
  startNewGameRound();
}

// --- MediaPipe Frame Processing Loop ---
function predictVideoLoop() {
  if (!state.cameraEnabled || !state.faceLandmarker) return;

  const video = elements.cameraFeed;

  if (video.readyState >= 2 && video.currentTime !== state.lastVideoTime) {
    state.lastVideoTime = video.currentTime;
    let now = performance.now();
    if (now <= (state.lastDetectionTimestamp || 0)) {
      now = (state.lastDetectionTimestamp || 0) + 1;
    }
    state.lastDetectionTimestamp = now;

    try {
      const results = state.faceLandmarker.detectForVideo(video, now);

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        state.faceDetected = true;
        elements.faceHint.classList.add("hidden");

        const landmarks = results.faceLandmarks[0];
        // Landmark 33: Outer right eye corner (in raw image space: left side)
        // Landmark 263: Outer left eye corner (in raw image space: right side)
        const eye1 = landmarks[33];
        const eye2 = landmarks[263];

        if (eye1 && eye2) {
          const dx = eye2.x - eye1.x;
          // Non-mirrored screen tilt: leaning towards screen-left drops eye1 lower (eye1.y > eye2.y)
          const dy = eye1.y - eye2.y;
          const angleRad = Math.atan2(dy, dx);
          const rawAngle = angleRad * (180 / Math.PI);
          // EMA filter to keep sub-2 degree micro-tilts smooth and jitter-free
          state.currentAngle = (typeof state.currentAngle === "number" && !isNaN(state.currentAngle))
            ? (state.currentAngle * 0.6 + rawAngle * 0.4)
            : rawAngle;
          handleHeadTilt(state.currentAngle, now);

          // Update AR forehead card tracking
          updateArForeheadCard(landmarks, state.currentAngle);
        }
      } else {
        state.faceDetected = false;
        if (state.gameState === "playing") {
          elements.faceHint.classList.remove("hidden");
        }
        resetTiltState();
        resetArForeheadCard();
      }
    } catch (detectErr) {
      // Ignore transient frame dropping errors
    }
  }

  requestAnimationFrame(predictVideoLoop);
}

// --- Instagram Filter AR Forehead Tracking Math ---
function updateArForeheadCard(landmarks, angleDeg) {
  if (!state.arForeheadTracking || !state.cameraEnabled || state.gameState === "start") {
    resetArForeheadCard();
    return;
  }

  elements.quizCard.classList.add("ar-tracking-mode");
  elements.quizSection.classList.add("ar-active");

  const container = elements.appContainer;
  const cWidth = container.clientWidth || 390;
  const cHeight = container.clientHeight || 844;
  const video = elements.cameraFeed;
  const vWidth = video.videoWidth || 720;
  const vHeight = video.videoHeight || 1280;

  const contAspect = cWidth / cHeight;
  const vidAspect = vWidth / vHeight;

  let renderWidth = cWidth;
  let renderHeight = cHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (vidAspect > contAspect) {
    renderHeight = cHeight;
    renderWidth = cHeight * vidAspect;
    offsetX = (renderWidth - cWidth) / 2;
  } else {
    renderWidth = cWidth;
    renderHeight = cWidth / vidAspect;
    offsetY = (renderHeight - cHeight) / 2;
  }

  // Landmark 10 is the hairline forehead anchor
  const fh = landmarks[10] || landmarks[151];
  const eye1 = landmarks[33];
  const eye2 = landmarks[263];

  if (!fh || !eye1 || !eye2) return;

  // Unmirrored X coordinate: maps directly to screen width
  const targetX = fh.x * renderWidth - offsetX;
  // Positioned higher up above the forehead/hairline so eyes and face are fully visible
  const targetY = fh.y * renderHeight - offsetY - 75;

  const eyeDist = Math.hypot((eye2.x - eye1.x) * renderWidth, (eye2.y - eye1.y) * renderHeight);
  const targetScale = Math.max(0.68, Math.min(1.15, eyeDist / 125));

  // Organic smoothing (lerp factor 0.35)
  if (state.arCurrentX === 0) {
    state.arCurrentX = targetX;
    state.arCurrentY = targetY;
    state.arCurrentScale = targetScale;
    state.arCurrentAngle = angleDeg;
  } else {
    state.arCurrentX += (targetX - state.arCurrentX) * 0.35;
    state.arCurrentY += (targetY - state.arCurrentY) * 0.35;
    state.arCurrentScale += (targetScale - state.arCurrentScale) * 0.25;
    state.arCurrentAngle += (angleDeg - state.arCurrentAngle) * 0.35;
  }

  // Rotate card in sync with head tilt direction
  elements.quizCard.style.transform = `translate3d(calc(${state.arCurrentX.toFixed(1)}px - 50%), calc(${state.arCurrentY.toFixed(1)}px - 100%), 0) rotate(${(-state.arCurrentAngle).toFixed(1)}deg) scale(${state.arCurrentScale.toFixed(2)})`;
}

function resetArForeheadCard() {
  if (elements.quizCard) {
    elements.quizCard.classList.remove("ar-tracking-mode");
    elements.quizCard.style.transform = "";
  }
  if (elements.quizSection) {
    elements.quizSection.classList.remove("ar-active");
  }
}

function toggleArMode() {
  state.arForeheadTracking = !state.arForeheadTracking;
  if (state.arForeheadTracking) {
    elements.btnArToggle.textContent = "🏷️";
    elements.btnArToggle.title = "AR Forehead Tracking: ON";
    elements.btnArToggle.classList.add("active-filter");
  } else {
    elements.btnArToggle.textContent = "📌";
    elements.btnArToggle.title = "AR Forehead Tracking: OFF (Fixed Top)";
    elements.btnArToggle.classList.remove("active-filter");
    resetArForeheadCard();
  }
}

// --- Tilt Detection & Deadband Neutral Reset ---
function handleHeadTilt(angleDeg, now) {
  // Update tilt meter indicator dot (scaled to responsive 2 deg range, moves left on screen-left tilt)
  const clampDeg = Math.max(-2, Math.min(2, angleDeg));
  const dotOffset = (clampDeg / 2) * 18; // px offset in small bar
  elements.tiltMeterDot.style.transform = `translateX(${-dotOffset}px)`;

  // Deadband check: if waiting for neutral, ignore inputs until angle < CONFIG.TILT_NEUTRAL_DEG
  if (state.waitingForNeutral) {
    if (Math.abs(angleDeg) < CONFIG.TILT_NEUTRAL_DEG) {
      state.waitingForNeutral = false;
      elements.neutralHint.classList.remove("visible");
    } else {
      elements.neutralHint.classList.add("visible");
      resetTiltState();
      return;
    }
  } else {
    elements.neutralHint.classList.remove("visible");
  }

  // Tilt inputs are only processed when active game question is playing
  if (state.gameState !== "playing") {
    resetTiltState();
    return;
  }

  const absAngle = Math.abs(angleDeg);

  // 1. Highlight phase (~0.6 degrees)
  if (angleDeg >= CONFIG.TILT_HIGHLIGHT_DEG) {
    // Leaning toward screen-left
    elements.answerLeft.classList.add("tilt-leaning");
    elements.answerRight.classList.remove("tilt-leaning");
    elements.tiltDivider.textContent = "←";
    elements.tiltDivider.className = "tilt-divider tilting-left";
  } else if (angleDeg <= -CONFIG.TILT_HIGHLIGHT_DEG) {
    // Leaning toward screen-right
    elements.answerRight.classList.add("tilt-leaning");
    elements.answerLeft.classList.remove("tilt-leaning");
    elements.tiltDivider.textContent = "→";
    elements.tiltDivider.className = "tilt-divider tilting-right";
  } else {
    // Neutral center
    elements.answerLeft.classList.remove("tilt-leaning");
    elements.answerRight.classList.remove("tilt-leaning");
    elements.tiltDivider.textContent = "⚡";
    elements.tiltDivider.className = "tilt-divider";
  }

  // 2. Lock-in phase (~1.2 degrees held for ~180ms)
  let targetDirection = null;
  if (angleDeg >= CONFIG.TILT_LOCKIN_DEG) {
    targetDirection = "left";
  } else if (angleDeg <= -CONFIG.TILT_LOCKIN_DEG) {
    targetDirection = "right";
  }

  if (targetDirection) {
    if (state.activeTiltDirection === targetDirection) {
      const elapsed = now - state.tiltStartTime;
      const progress = Math.min(1, elapsed / CONFIG.TILT_LOCKIN_MS);

      // Visual progress fill
      if (targetDirection === "left") {
        elements.answerLeftFill.style.width = `${progress * 100}%`;
        elements.answerRightFill.style.width = "0%";
      } else {
        elements.answerRightFill.style.width = `${progress * 100}%`;
        elements.answerLeftFill.style.width = "0%";
      }

      if (elapsed >= CONFIG.TILT_LOCKIN_MS) {
        // Locked in!
        chooseAnswer(targetDirection);
      }
    } else {
      // Just started tilting in this direction
      state.activeTiltDirection = targetDirection;
      state.tiltStartTime = now;
      sounds.playTiltTick();
    }
  } else {
    // Less than lock-in threshold, reset timer & progress fill
    state.activeTiltDirection = null;
    state.tiltStartTime = 0;
    elements.answerLeftFill.style.width = "0%";
    elements.answerRightFill.style.width = "0%";
  }
}

function resetTiltState() {
  state.activeTiltDirection = null;
  state.tiltStartTime = 0;
  elements.answerLeftFill.style.width = "0%";
  elements.answerRightFill.style.width = "0%";
  elements.answerLeft.classList.remove("tilt-leaning");
  elements.answerRight.classList.remove("tilt-leaning");
  elements.tiltDivider.textContent = "⚡";
  elements.tiltDivider.className = "tilt-divider";
}

// --- Game Logic: Shuffle, Pick 5, Sides ---
const FALLBACK_QUESTIONS = [
  ["What color ribbon represents breast cancer awareness?", "Pink ribbon", "Yellow ribbon"],
  ["Which month is Breast Cancer Awareness Month?", "October", "May"],
  ["Can men also develop breast cancer?", "Yes, men can get it too", "No, only women"],
  ["Is every breast lump a sign of cancer?", "No, most lumps are benign", "Yes, all lumps are cancer"],
  ["What is the primary early screening test for breast cancer?", "Mammogram", "Blood test"],
  ["About 1 in ___ women will develop breast cancer in their lifetime.", "8", "50"],
  ["At what age do routine screening mammograms usually begin?", "Age 40", "Age 65"],
  ["Does regular physical exercise help lower breast cancer risk?", "Yes, it helps lower risk", "No, it has no effect"],
  ["Does early detection significantly improve survival rates?", "Yes, over 90% survival", "No, stage doesn't matter"],
  ["What is the most common early sign of breast cancer?", "A new painless lump", "A sudden neck rash"],
  ["Which gene mutations are most famously linked to hereditary risk?", "BRCA1 and BRCA2", "Trisomy 21"],
  ["Does having dense breast tissue make mammograms harder to read?", "Yes, tissue appears white", "No, it makes them clearer"],
  ["Can alcohol consumption increase breast cancer risk?", "Yes, higher intake raises risk", "No, alcohol lowers risk"],
  ["What should you do if you notice a new breast lump or change?", "Consult a doctor promptly", "Wait months to see"],
  ["Does breastfeeding help lower a mother's breast cancer risk?", "Yes, it offers protection", "No, it increases risk"],
  ["Stage 0 non-invasive breast cancer is commonly called…", "DCIS", "Metastatic cancer"],
  ["Does wearing an underwire bra cause breast cancer?", "No, that is a proven myth", "Yes, it traps toxins"],
  ["Can antiperspirants or deodorants cause breast cancer?", "No, there is no scientific link", "Yes, proven cause"],
  ["What percentage of breast cancers are inherited from family?", "About 5% to 10%", "Over 80%"],
  ["What is a lumpectomy?", "Removing the lump and a margin", "Removing the entire breast"],
  ["What is a mastectomy?", "Removing the breast tissue", "Taking a tiny skin scrape"],
  ["What is a breast biopsy?", "Taking a tissue sample to test", "An ultrasound scan"],
  ["What does 'metastatic' breast cancer mean?", "Spread to other body organs", "Contained in one tiny duct"],
  ["Maintaining a healthy body weight after menopause helps…", "Lower breast cancer risk", "Has zero health impact"],
  ["Are mammograms recommended even if you feel completely healthy?", "Yes, catches changes early", "No, only if you feel pain"],
  ["Can a mammogram detect lumps before you can feel them by hand?", "Yes, years before", "No, only huge lumps"],
  ["What is 3D mammography formally called?", "Tomosynthesis", "Elastography"],
  ["Can a family history of breast cancer increase your risk?", "Yes, especially close relatives", "No, genetics don't matter"],
  ["Breast cancer that hasn't spread outside the breast is called…", "Localized", "Distant"],
  ["Is breast cancer usually painful in its early stages?", "No, usually painless", "Yes, sharp continuous pain"],
  ["Can breast ultrasound be used with mammograms for dense breasts?", "Yes, gives extra clarity", "No, ultrasounds are never used"],
  ["A diet rich in vegetables, fruits and fiber helps…", "Support overall cancer prevention", "Guarantees you never get sick"],
  ["Smoking tobacco is linked to…", "Higher breast cancer risk", "Lower cancer risk"],
  ["Does having a family member with breast cancer guarantee you'll get it?", "No, it only raises relative risk", "Yes, 100% guarantee"],
  ["What is the main goal of screening mammography?", "Finding cancer early when treatable", "Preventing lumps entirely"],
  ["Can hormone replacement therapy (HRT) influence risk?", "Yes, long-term use can raise risk", "No, hormones have no effect"],
  ["What is 'breast self-awareness'?", "Knowing how your breasts normally feel", "Measuring breast size daily"],
  ["For women with very high genetic risk, doctors may recommend…", "Annual breast MRI", "Routine brain scans"],
  ["Most breast cancers are diagnosed in women aged…", "50 and older", "Under 20"],
  ["Can a benign (non-cancerous) cyst turn into breast cancer?", "Most benign cysts stay benign", "All cysts become cancer"],
  ["What is the 5-year survival rate for localized early breast cancer?", "Over 90%", "Under 30%"],
  ["A sudden inward nipple retraction should be…", "Checked by a doctor", "Ignored as normal aging"],
  ["Does a needle biopsy cause cancer cells to spread?", "No, biopsies are safe and standard", "Yes, spreads cancer"],
  ["Can a father pass down a BRCA gene mutation to his daughter?", "Yes, fathers can pass it down", "No, only mothers pass it"],
  ["What does 'remission' mean in cancer treatment?", "Signs and symptoms have disappeared", "The cancer doubled in size"],
  ["Radiation therapy after a lumpectomy helps…", "Destroy any microscopic cells left", "Restore breast milk"],
  ["Which hormone fuels the majority of hormone-receptor positive cancers?", "Estrogen", "Insulin"],
  ["Tamoxifen is a common medicine that works by…", "Blocking estrogen from cancer cells", "Inducing deep sleep"],
  ["Can regular checkups after treatment help catch recurrence early?", "Yes, vital for survivorship", "No, follow-ups are useless"],
  ["The famous pink ribbon awareness symbol was launched in…", "The 1990s (1992)", "The 1800s"]
];

function getQuestionsBank() {
  if (Array.isArray(window.PINK_QUIZ_QUESTIONS) && window.PINK_QUIZ_QUESTIONS.length > 0) {
    return window.PINK_QUIZ_QUESTIONS;
  }
  if (typeof PINK_QUIZ_QUESTIONS !== "undefined" && Array.isArray(PINK_QUIZ_QUESTIONS) && PINK_QUIZ_QUESTIONS.length > 0) {
    return PINK_QUIZ_QUESTIONS;
  }
  return FALLBACK_QUESTIONS;
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function startNewGameRound() {
  state.score = 0;
  state.completedCount = 0;
  state.currentQuestionIndex = 0;
  state.waitingForNeutral = true;

  updateRibbonProgress(0);

  // Pick 5 random questions without repeats from the 50 bank
  const bank = getQuestionsBank();
  const shuffledBank = shuffleArray(bank);
  state.currentRoundQuestions = shuffledBank.slice(0, CONFIG.ROUND_QUESTIONS_COUNT);

  // Hide end screen and wrong answer modal if open
  elements.endScreen.classList.add("hidden");
  elements.wrongModal.classList.add("hidden");

  loadCurrentQuestion();
}

function loadCurrentQuestion() {
  resetTiltState();

  const qData = state.currentRoundQuestions[state.currentQuestionIndex];
  if (!qData) {
    showEndScreen();
    return;
  }

  const [question, correct, wrong] = qData;

  // Randomize which side the correct answer appears on
  const isCorrectLeft = Math.random() < 0.5;
  state.currentQuestion = {
    text: question,
    correctText: correct,
    wrongText: wrong,
    correctSide: isCorrectLeft ? "left" : "right",
    leftText: isCorrectLeft ? correct : wrong,
    rightText: isCorrectLeft ? wrong : correct
  };

  // Reset UI elements
  elements.questionText.textContent = question;
  elements.answerLeftLabel.textContent = state.currentQuestion.leftText;
  elements.answerRightLabel.textContent = state.currentQuestion.rightText;

  elements.answerLeft.className = "answer-btn answer-left";
  elements.answerRight.className = "answer-btn answer-right";
  elements.answerLeftFill.style.width = "0%";
  elements.answerRightFill.style.width = "0%";
  elements.tiltDivider.className = "tilt-divider";
  elements.tiltDivider.textContent = "⚡";

  state.gameState = "playing";
}

// --- Answer Handling: Correct / Wrong Flow ---
function chooseAnswer(side) {
  if (state.gameState !== "playing") return;
  state.gameState = "answering";
  resetTiltState();

  const q = state.currentQuestion;
  const isCorrect = side === q.correctSide;

  const chosenBtn = side === "left" ? elements.answerLeft : elements.answerRight;
  const otherBtn = side === "left" ? elements.answerRight : elements.answerLeft;

  // Collapse the non-chosen answer and divider
  otherBtn.classList.add("collapsed");
  elements.tiltDivider.classList.add("collapsed");

  chosenBtn.classList.add("selected");

  if (isCorrect) {
    // CORRECT answer flow
    chosenBtn.classList.add("correct");
    sounds.playCorrect();
    state.score++;
    state.completedCount++;
    updateRibbonProgress(state.completedCount);

    // Green state for ~1 second, then auto-advance
    setTimeout(() => {
      advanceNextQuestion();
    }, 1000);

  } else {
    // WRONG answer flow
    chosenBtn.classList.add("wrong");
    sounds.playWrong();
    state.completedCount++;
    updateRibbonProgress(state.completedCount);

    // After a short delay (~550ms), show full-screen dark popup with the correct answer
    setTimeout(() => {
      elements.wrongModalAnswer.textContent = q.correctText;
      elements.wrongModal.classList.remove("hidden");
      state.gameState = "wrong_modal";
    }, 550);
  }
}

function dismissWrongModal() {
  if (state.gameState !== "wrong_modal") return;
  elements.wrongModal.classList.add("hidden");
  advanceNextQuestion();
}

function advanceNextQuestion() {
  state.currentQuestionIndex++;
  // Require return to neutral before answering next question
  state.waitingForNeutral = true;

  if (state.currentQuestionIndex < CONFIG.ROUND_QUESTIONS_COUNT) {
    loadCurrentQuestion();
  } else {
    showEndScreen();
  }
}

// --- Bottom Awareness Ribbon Progress Update ---
function updateRibbonProgress(completed) {
  // Ribbon clip path fills from bottom to top (y goes from 120 down to 0)
  const total = CONFIG.ROUND_QUESTIONS_COUNT;
  const fraction = Math.min(1, Math.max(0, completed / total));
  const height = 120 * fraction;
  const y = 120 - height;

  elements.ribbonClipRect.setAttribute("y", y);
  elements.ribbonClipRect.setAttribute("height", height);
  elements.progressCounter.textContent = `${completed} / ${total}`;
}

// --- End Screen Display ---
function showEndScreen() {
  state.gameState = "end";
  resetTiltState();
  sounds.playCelebration();

  if (state.isRecording) {
    stopFilterRecording();
  }

  elements.finalScore.textContent = `${state.score} / ${CONFIG.ROUND_QUESTIONS_COUNT}`;

  if (state.score === 5) {
    elements.finalMessage.textContent = "Perfect! You're a champion 🎀";
  } else if (state.score >= 3) {
    elements.finalMessage.textContent = "Great job! 💗";
  } else {
    elements.finalMessage.textContent = "Good try, now you know more! 💗";
  }

  elements.endScreen.classList.remove("hidden");
}

// --- Instagram Filter In-Browser Video Recording & Sharing ---
let recordingCanvasCtx = null;
let recordingAnimationId = null;
let lastRecordFrameTime = 0;
const RECORD_FPS = 30;
const RECORD_FRAME_INTERVAL = 1000 / RECORD_FPS; // ~33.3ms

async function toggleRecording() {
  if (state.isRecording) {
    stopFilterRecording();
  } else {
    if (state.recordTimerCountdown > 0) {
      await runCountdownOverlay();
    }
    startFilterRecording();
    if (state.gameState === "start") {
      startGame();
    }
  }
}

async function runCountdownOverlay() {
  if (!elements.countdownOverlay) return;
  elements.countdownOverlay.classList.remove("hidden");
  for (let c = state.recordTimerCountdown; c > 0; c--) {
    elements.countdownNumber.textContent = c;
    elements.countdownNumber.style.animation = "none";
    elements.countdownNumber.offsetHeight; // trigger reflow
    elements.countdownNumber.style.animation = "countdownPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards";
    sounds.playTone(750, 0.09, "sine", 0.25);
    await new Promise((r) => setTimeout(r, 900));
  }
  elements.countdownOverlay.classList.add("hidden");
  sounds.playTone(1100, 0.22, "sine", 0.35);
}

function toggleRecordTimer() {
  state.recordTimerCountdown = state.recordTimerCountdown === 0 ? 3 : 0;
  if (elements.timerLabel) {
    elements.timerLabel.textContent = state.recordTimerCountdown > 0 ? "3s" : "Off";
  }
  if (elements.btnRecordTimer) {
    if (state.recordTimerCountdown > 0) {
      elements.btnRecordTimer.classList.add("active-timer");
    } else {
      elements.btnRecordTimer.classList.remove("active-timer");
    }
  }
}

async function flipCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  sounds.init();
  state.cameraFacingMode = state.cameraFacingMode === "user" ? "environment" : "user";

  if (state.mediaStream) {
    state.mediaStream.getTracks().forEach((track) => track.stop());
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: state.cameraFacingMode, width: { ideal: 720 }, height: { ideal: 1280 } },
      audio: false
    });
    state.mediaStream = stream;
    elements.cameraFeed.srcObject = stream;
    await elements.cameraFeed.play();
  } catch (err) {
    console.warn("Camera flip fallback to standard video:", err);
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      state.mediaStream = fallbackStream;
      elements.cameraFeed.srcObject = fallbackStream;
      await elements.cameraFeed.play();
    } catch (e2) {
      console.error("Camera flip failed:", e2);
    }
  }
}

function startFilterRecording() {
  if (state.isRecording) return;
  sounds.init();

  const canvas = elements.recorderCanvas;
  canvas.width = 720;
  canvas.height = 1280;
  recordingCanvasCtx = canvas.getContext("2d");

  state.recordedChunks = [];

  // Capture canvas stream at stable 30 fps
  const stream = canvas.captureStream(30);

  // Connect sounds to recording with continuous silent clock carrier
  if (sounds.ctx) {
    try {
      const dest = sounds.ctx.createMediaStreamDestination();
      sounds.recDest = dest;
      // Continuous silent oscillator ensures WebAudio clock stays synced with video timeline
      const silentOsc = sounds.ctx.createOscillator();
      const silentGain = sounds.ctx.createGain();
      silentGain.gain.value = 0.00001; // inaudible
      silentOsc.connect(silentGain);
      silentGain.connect(dest);
      silentOsc.start();
      sounds.silentOsc = silentOsc;

      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);
    } catch (e) {
      console.warn("Could not attach audio to recording:", e);
    }
  }

  let mimeType = "video/webm;codecs=vp9,opus";
  if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm;codecs=vp8,opus";
  if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";
  if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/mp4";

  try {
    state.mediaRecorder = new MediaRecorder(stream, { mimeType });
  } catch (mrErr) {
    state.mediaRecorder = new MediaRecorder(stream);
  }

  state.mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      state.recordedChunks.push(e.data);
    }
  };

  state.mediaRecorder.onstop = () => {
    const blobType = state.mediaRecorder.mimeType || "video/webm";
    state.recordedBlob = new Blob(state.recordedChunks, { type: blobType });
    const videoUrl = URL.createObjectURL(state.recordedBlob);
    elements.recordedPreview.src = videoUrl;
    elements.recordedPreview.defaultPlaybackRate = 1.0;
    elements.recordedPreview.playbackRate = 1.0;
    elements.videoExportModal.classList.remove("hidden");
  };

  // 1000ms standard chunks to produce clean WebM container timestamps at normal speed
  state.mediaRecorder.start(1000);
  state.isRecording = true;
  elements.btnRecord.classList.add("recording");
  elements.recordingBadge.classList.remove("hidden");

  state.recordStartTime = Date.now();
  updateRecordingTimer();
  state.recordTimerInterval = setInterval(updateRecordingTimer, 1000);

  lastRecordFrameTime = performance.now();
  renderRecordingFrame(lastRecordFrameTime);
}

function updateRecordingTimer() {
  const elapsedSec = Math.floor((Date.now() - state.recordStartTime) / 1000);
  const m = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
  const s = String(elapsedSec % 60).padStart(2, "0");
  elements.recordingTimer.textContent = `${m}:${s}`;
}

function stopFilterRecording() {
  if (!state.isRecording) return;
  state.isRecording = false;
  elements.btnRecord.classList.remove("recording");
  elements.recordingBadge.classList.add("hidden");
  if (state.recordTimerInterval) {
    clearInterval(state.recordTimerInterval);
    state.recordTimerInterval = null;
  }
  if (sounds.silentOsc) {
    try { sounds.silentOsc.stop(); } catch (e) { }
    sounds.silentOsc = null;
  }
  if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
    state.mediaRecorder.stop();
  }
  if (recordingAnimationId) {
    cancelAnimationFrame(recordingAnimationId);
    recordingAnimationId = null;
  }
}

function renderRecordingFrame(timestamp) {
  if (!state.isRecording) return;

  recordingAnimationId = requestAnimationFrame(renderRecordingFrame);

  // Throttle render loop to stable 30fps to prevent fast-forward recording on high-refresh displays
  if (timestamp && lastRecordFrameTime) {
    const elapsed = timestamp - lastRecordFrameTime;
    if (elapsed < RECORD_FRAME_INTERVAL - 4) {
      return;
    }
  }
  lastRecordFrameTime = timestamp || performance.now();

  const ctx = recordingCanvasCtx;
  const canvas = elements.recorderCanvas;
  const video = elements.cameraFeed;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Non-Mirrored Camera Video
  if (video && video.readyState >= 2) {
    ctx.save();
    const vW = video.videoWidth || 720;
    const vH = video.videoHeight || 1280;
    const vAspect = vW / vH;
    const cAspect = canvas.width / canvas.height;
    let sW, sH, sX, sY;
    if (vAspect > cAspect) {
      sH = vH;
      sW = vH * cAspect;
      sX = (vW - sW) / 2;
      sY = 0;
    } else {
      sW = vW;
      sH = vW / cAspect;
      sX = 0;
      sY = (vH - sH) / 2;
    }
    ctx.drawImage(video, sX, sY, sW, sH, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  } else {
    ctx.fillStyle = "#120a14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 2. Ambient top/bottom gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "rgba(0,0,0,0.5)");
  grad.addColorStop(0.2, "rgba(0,0,0,0.05)");
  grad.addColorStop(0.8, "rgba(0,0,0,0.05)");
  grad.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. TikTok Brand Header
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px -apple-system, sans-serif";
  ctx.fillText("🎵 TIKTOK • PINK TILT QUIZ", 36, 68);
  ctx.restore();

  // 4. Render Quiz Card onto Canvas
  if (state.currentQuestion) {
    ctx.save();
    let cardX = canvas.width / 2;
    let cardY = 160;
    let cardScale = 1.0;
    let cardAngle = 0;

    if (state.arForeheadTracking && state.arCurrentX > 0) {
      const scaleX = canvas.width / (elements.appContainer.clientWidth || 390);
      const scaleY = canvas.height / (elements.appContainer.clientHeight || 844);
      cardX = state.arCurrentX * scaleX;
      cardY = (state.arCurrentY - 50) * scaleY;
      cardScale = Math.max(0.7, state.arCurrentScale * 1.05);
      cardAngle = -state.arCurrentAngle * (Math.PI / 180);
    }

    ctx.translate(cardX, cardY);
    ctx.rotate(cardAngle);
    ctx.scale(cardScale, cardScale);

    // Card background frosted
    ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
    ctx.strokeStyle = "rgba(255, 63, 164, 0.65)";
    ctx.lineWidth = 4;
    roundRect(ctx, -270, -110, 540, 210, 28);
    ctx.fill();
    ctx.stroke();

    // Question text
    ctx.fillStyle = "#1e1e24";
    ctx.font = "bold 23px -apple-system, sans-serif";
    ctx.textAlign = "center";
    wrapText(ctx, state.currentQuestion.text, 0, -60, 480, 28);

    // Left option box
    ctx.fillStyle = elements.answerLeft.classList.contains("selected")
      ? (elements.answerLeft.classList.contains("correct") ? "#10b981" : "#ef4444")
      : (elements.answerLeft.classList.contains("tilt-leaning") ? "rgba(255, 63, 164, 0.25)" : "rgba(235, 235, 242, 0.95)");
    roundRect(ctx, -245, 14, 215, 66, 16);
    ctx.fill();
    ctx.fillStyle = elements.answerLeft.classList.contains("selected") ? "#ffffff" : "#1e1e24";
    ctx.font = "bold 20px -apple-system, sans-serif";
    ctx.fillText(state.currentQuestion.leftText, -137, 52);

    // Center divider
    ctx.fillStyle = "#ff3fa4";
    ctx.font = "bold 28px -apple-system, sans-serif";
    ctx.fillText(elements.tiltDivider.textContent || "⚡", 0, 54);

    // Right option box
    ctx.fillStyle = elements.answerRight.classList.contains("selected")
      ? (elements.answerRight.classList.contains("correct") ? "#10b981" : "#ef4444")
      : (elements.answerRight.classList.contains("tilt-leaning") ? "rgba(255, 63, 164, 0.25)" : "rgba(235, 235, 242, 0.95)");
    roundRect(ctx, 30, 14, 215, 66, 16);
    ctx.fill();
    ctx.fillStyle = elements.answerRight.classList.contains("selected") ? "#ffffff" : "#1e1e24";
    ctx.font = "bold 20px -apple-system, sans-serif";
    ctx.fillText(state.currentQuestion.rightText, 137, 52);

    ctx.restore();
  }

  // 5. Bottom Ribbon Progress
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px -apple-system, sans-serif";
  ctx.fillText(`🎀 ${state.completedCount} / ${CONFIG.ROUND_QUESTIONS_COUNT}`, 40, canvas.height - 50);
  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, currY);
      line = words[n] + " ";
      currY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currY);
}

async function shareToTikTok() {
  if (!state.recordedBlob) return;
  const ext = state.recordedBlob.type.includes("mp4") ? "mp4" : "webm";
  const file = new File([state.recordedBlob], `pink-tilt-quiz-tiktok.${ext}`, { type: state.recordedBlob.type });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "Pink Tilt Quiz 🎀 🎵",
        text: "Check out my score on Pink Tilt Quiz! October is Breast Cancer Awareness Month 💗 #PinkTiltQuiz #BreastCancerAwareness #TikTokFilter #HealthCheck"
      });
      return;
    } catch (e) {
      if (e.name !== "AbortError") {
        downloadRecordedVideo();
      }
    }
  } else {
    downloadRecordedVideo();
    alert("Video saved! Ready to upload directly to TikTok with sound 🎵");
  }
}

function shareToInstagram() {
  return shareToTikTok();
}

function downloadRecordedVideo() {
  if (!state.recordedBlob) return;
  const ext = state.recordedBlob.type.includes("mp4") ? "mp4" : "webm";
  const url = URL.createObjectURL(state.recordedBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pink-tilt-quiz-${Date.now()}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function closeExportModal() {
  elements.videoExportModal.classList.add("hidden");
  if (elements.recordedPreview) {
    elements.recordedPreview.pause();
    elements.recordedPreview.src = "";
  }
}

// --- Event Listeners ---
function bindEvents() {
  // Start Buttons
  elements.btnStart.addEventListener("click", () => {
    sounds.init();
    startCamera();
  });

  elements.btnPlayTap.addEventListener("click", () => {
    startTapOnlyMode();
  });



  // Play Again Button
  elements.btnPlayAgain.addEventListener("click", (e) => {
    e.preventDefault();
    sounds.init();
    startNewGameRound();
  });

  // AR Forehead Toggle Button
  if (elements.btnArToggle) {
    elements.btnArToggle.addEventListener("click", () => {
      toggleArMode();
    });
  }

  // Instagram Recording Controls
  if (elements.btnRecord) {
    elements.btnRecord.addEventListener("click", () => {
      toggleRecording();
    });
  }

  if (elements.btnRecordTimer) {
    elements.btnRecordTimer.addEventListener("click", () => {
      toggleRecordTimer();
    });
  }

  if (elements.btnCameraFlip) {
    elements.btnCameraFlip.addEventListener("click", () => {
      flipCamera();
    });
  }

  if (elements.btnShareTikTok) {
    elements.btnShareTikTok.addEventListener("click", () => {
      shareToTikTok();
    });
  } else if (elements.btnShareInsta) {
    elements.btnShareInsta.addEventListener("click", () => {
      shareToTikTok();
    });
  }

  if (elements.btnDownloadVideo) {
    elements.btnDownloadVideo.addEventListener("click", () => {
      downloadRecordedVideo();
    });
  }

  if (elements.btnCloseExport) {
    elements.btnCloseExport.addEventListener("click", () => {
      closeExportModal();
    });
  }

  // Camera Error Modal Actions
  elements.btnRetryCamera.addEventListener("click", () => {
    elements.cameraErrorModal.classList.add("hidden");
    startCamera();
  });

  elements.btnFallbackTap.addEventListener("click", () => {
    startTapOnlyMode();
  });

  // Answer Tapping (Fallback / Direct tap selection)
  elements.answerLeft.addEventListener("click", () => {
    if (state.gameState === "playing") {
      chooseAnswer("left");
    }
  });

  elements.answerRight.addEventListener("click", () => {
    if (state.gameState === "playing") {
      chooseAnswer("right");
    }
  });

  // Dismiss Wrong Modal on Screen Tap (anywhere on the dark modal)
  elements.wrongModal.addEventListener("click", () => {
    dismissWrongModal();
  });

  // Sound Toggle Button
  elements.btnSoundToggle.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    elements.btnSoundToggle.textContent = state.soundEnabled ? "🔊" : "🔇";
    elements.btnSoundToggle.title = state.soundEnabled ? "Mute sound" : "Unmute sound";
  });

  // Ensure camera hardware tracks are released on page unload or visibility hide
  window.addEventListener("beforeunload", () => stopCamera());
  window.addEventListener("pagehide", () => stopCamera());
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  // Warm up MediaPipe assets in background for instant start
  setTimeout(() => {
    initMediaPipe().catch((err) => console.debug("Background model preload:", err));
  }, 400);
});
