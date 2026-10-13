/**
 * Pink Tilt Quiz - Meta Spark Studio (Spark AR) Script
 * ----------------------------------------------------
 * Interactive head-tilt Breast Cancer Awareness Quiz for Instagram & Facebook Camera.
 * 
 * Target Meta Spark Studio version: v175+ / v180+
 * Compatibility: JavaScript ES6 / Modules
 */

import Scene from 'Scene';
import FaceTracking from 'FaceTracking';
import Diagnostics from 'Diagnostics';
import Time from 'Time';
import TouchGestures from 'TouchGestures';
import Reactive from 'Reactive';

// --- CONFIGURATION ---
const QUESTIONS_PER_ROUND = 5;
const TILT_THRESHOLD_RAD = 0.22; // ~12.5 degrees
const NEUTRAL_THRESHOLD_RAD = 0.12; // ~7 degrees
const REVEAL_DELAY_MS = 1400; // Time to show correct/wrong before next question

// 50 Breast Cancer Awareness Questions [Question, Correct Answer, Wrong Answer]
const QUESTION_BANK = [
  ["Most common type of breast cancer?", "Invasive ductal carcinoma", "Invasive lobular carcinoma"],
  ["HER2-positive means cells make too much of…", "HER2 protein", "Estrogen"],
  ["Trastuzumab (Herceptin) targets…", "HER2", "Estrogen receptors"],
  ["Tamoxifen works by…", "Blocking estrogen's effect", "Killing fast-dividing cells"],
  ["Triple-negative lacks estrogen, progesterone and…", "HER2", "BRCA"],
  ["DCIS is considered…", "Stage 0", "Stage III"],
  ["BRCA1 and BRCA2 normally help to…", "Repair damaged DNA", "Produce breast milk"],
  ["A BRCA1 carrier's lifetime risk is roughly…", "55–70%", "12–13%"],
  ["About 1 in ___ women develop breast cancer.", "8", "25"],
  ["Breast cancer in men makes up roughly…", "1% of cases", "10% of cases"],
  ["On a mammogram, dense tissue appears…", "White", "Black"],
  ["3D mammography is formally called…", "Tomosynthesis", "Elastography"],
  ["Ki-67 is a marker of…", "Cell proliferation", "Tumour size"],
  ["Sentinel lymph node biopsy finds…", "First node cancer reaches", "Every node in body"],
  ["Oncotype DX helps decide…", "If chemo is likely to help", "Mammogram frequency"],
  ["Aromatase inhibitors reduce…", "Estrogen production", "HER2 levels"],
  ["Which is a CDK4/6 inhibitor?", "Palbociclib", "Trastuzumab"],
  ["PARP inhibitors (olaparib) work in…", "BRCA-mutated cancers", "Estrogen cancers only"],
  ["Common spread sites: bone, lung, liver and…", "Brain", "Stomach"],
  ["Paget's disease of the breast affects…", "Nipple skin", "Chest wall"],
  ["Inflammatory breast cancer often shows as…", "Redness and swelling", "One hard lump"],
  ["'Peau d'orange' describes…", "Orange-peel skin texture", "Orange discharge"],
  ["Combined hormone therapy after menopause…", "Slightly raises risk", "Lowers risk"],
  ["Starting periods at an early age is linked to…", "Higher risk", "Lower risk"],
  ["First full-term pregnancy after age 30…", "Slightly higher risk", "Lower risk"],
  ["Li-Fraumeni syndrome mutation in…", "TP53", "CFTR"],
  ["Share of breast cancers hormone-positive?", "About 70%", "About 10%"],
  ["USPSTF screening mammograms start at…", "40", "50"],
  ["BI-RADS category 5 on mammogram means…", "Highly suspicious", "Normal"],
  ["Neoadjuvant therapy is given…", "Before surgery", "After surgery"],
  ["Lumpectomy is usually followed by…", "Radiation therapy", "Hormone replacement"],
  ["Lymphedema is swelling caused by…", "Lymph fluid buildup", "Blood clot"],
  ["Doxorubicin has a known risk to…", "Heart", "Lungs"],
  ["Aromatase inhibitors increase risk of…", "Bone loss", "Blood clots"],
  ["Current guidelines emphasise…", "Breast self-awareness", "Daily self-exams"],
  ["Most hormone-driven breast cancers fuelled by…", "Estrogen", "Testosterone"],
  ["Fulvestrant is a…", "Estrogen receptor degrader", "HER2 antibody"],
  ["Pembrolizumab (immunotherapy) used in…", "Triple-negative", "Only HER2-positive"],
  ["Trastuzumab deruxtecan targets…", "HER2", "BRCA"],
  ["Genetic counselling advised for…", "Family history of early cancer", "Dense breasts alone"],
  ["Risk-reducing mastectomy lowers risk by…", "90% or more", "10%"],
  ["Microcalcifications on mammogram are…", "Calcium deposits", "Fat cells"],
  ["Fat necrosis is…", "Benign lump after trauma", "Aggressive cancer"],
  ["Fibroadenomas are most common in…", "Women in 20s–30s", "Women over 70"],
  ["Global breast cancer cases per year:", "2.3 million", "230,000"],
  ["Inherited gene mutations explain about…", "5–10% of cases", "50% of cases"],
  ["ER/PR on pathology report means…", "Estrogen / progesterone", "Early / recurrent"],
  ["Tumour grade (1–3) describes…", "How abnormal cells look", "How far it spread"],
  ["In TNM staging, 'N' stands for…", "Lymph nodes", "Nipple"],
  ["Scalp cooling is used to reduce…", "Chemo hair loss", "Nausea"]
];

// Game State
let gameState = 'START'; // 'START' | 'ACTIVE' | 'FEEDBACK' | 'COMPLETE'
let roundQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let correctSide = 'left'; // 'left' or 'right'
let awaitingNeutralHead = false;

// Scene References
let textQuestion;
let textLeftOption;
let textRightOption;
let textCounter;
let textScore;
let textFeedback;
let planeLeftCard;
let planeRightCard;
let containerStart;
let containerGame;
let containerEnd;

async function init() {
  try {
    Diagnostics.log('🎀 Initializing Pink Tilt Quiz AR Filter...');

    // Locate Scene Objects
    [
      textQuestion,
      textLeftOption,
      textRightOption,
      textCounter,
      textScore,
      textFeedback,
      planeLeftCard,
      planeRightCard,
      containerStart,
      containerGame,
      containerEnd
    ] = await Promise.all([
      Scene.root.findFirst('txtQuestion'),
      Scene.root.findFirst('txtLeftOption'),
      Scene.root.findFirst('txtRightOption'),
      Scene.root.findFirst('txtCounter'),
      Scene.root.findFirst('txtScore'),
      Scene.root.findFirst('txtFeedback'),
      Scene.root.findFirst('planeLeftCard'),
      Scene.root.findFirst('planeRightCard'),
      Scene.root.findFirst('containerStart'),
      Scene.root.findFirst('containerGame'),
      Scene.root.findFirst('containerEnd')
    ]);

    // Track Face 0
    const face = FaceTracking.face(0);
    const headRotationZ = face.cameraTransform.rotationZ;

    // Head tilt subscription
    headRotationZ.monitor().subscribe((event) => {
      onHeadRotation(event.newValue);
    });

    // Tap to Start / Restart
    TouchGestures.onTap().subscribe(() => {
      if (gameState === 'START' || gameState === 'COMPLETE') {
        startNewGame();
      }
    });

    showStartScreen();
    Diagnostics.log('✨ Pink Tilt Quiz AR ready! Tap screen to start.');
  } catch (err) {
    Diagnostics.warn('Initialization note: some optional scene objects not bound yet: ' + err);
  }
}

function showStartScreen() {
  gameState = 'START';
  if (containerStart) containerStart.hidden = Reactive.val(false);
  if (containerGame) containerGame.hidden = Reactive.val(true);
  if (containerEnd) containerEnd.hidden = Reactive.val(true);
  if (textFeedback) textFeedback.text = 'Tap screen to start!';
}

function startNewGame() {
  gameState = 'ACTIVE';
  score = 0;
  currentQuestionIndex = 0;
  awaitingNeutralHead = false;

  // Pick 5 random questions
  const shuffled = [...QUESTION_BANK].sort(() => 0.5 - Math.random());
  roundQuestions = shuffled.slice(0, QUESTIONS_PER_ROUND);

  if (containerStart) containerStart.hidden = Reactive.val(true);
  if (containerGame) containerGame.hidden = Reactive.val(false);
  if (containerEnd) containerEnd.hidden = Reactive.val(true);

  loadQuestion(0);
}

function loadQuestion(index) {
  if (index >= roundQuestions.length) {
    showEndScreen();
    return;
  }

  currentQuestionIndex = index;
  gameState = 'ACTIVE';

  const [q, correct, wrong] = roundQuestions[index];
  const isCorrectLeft = Math.random() < 0.5;
  correctSide = isCorrectLeft ? 'left' : 'right';

  const leftText = isCorrectLeft ? correct : wrong;
  const rightText = isCorrectLeft ? wrong : correct;

  if (textQuestion) textQuestion.text = q;
  if (textLeftOption) textLeftOption.text = leftText;
  if (textRightOption) textRightOption.text = rightText;
  if (textCounter) textCounter.text = `Question ${index + 1}/${QUESTIONS_PER_ROUND}`;
  if (textFeedback) textFeedback.text = 'Tilt your head 👈 Left or Right 👉';

  resetCardVisuals();
}

function onHeadRotation(rotZ) {
  // Check neutral recovery
  if (Math.abs(rotZ) < NEUTRAL_THRESHOLD_RAD) {
    awaitingNeutralHead = false;
  }

  if (gameState !== 'ACTIVE' || awaitingNeutralHead) {
    return;
  }

  // Camera mirrored coordinate convention:
  // Tilting head to user's left or right
  if (rotZ > TILT_THRESHOLD_RAD) {
    // Left tilt
    handleAnswer('left');
  } else if (rotZ < -TILT_THRESHOLD_RAD) {
    // Right tilt
    handleAnswer('right');
  }
}

function handleAnswer(chosenSide) {
  gameState = 'FEEDBACK';
  awaitingNeutralHead = true;

  const isCorrect = chosenSide === correctSide;
  if (isCorrect) {
    score += 1;
    if (textFeedback) textFeedback.text = '✅ Correct!';
  } else {
    if (textFeedback) textFeedback.text = '❌ Not quite!';
  }

  highlightChosenCard(chosenSide, isCorrect);

  Time.setTimeout(() => {
    loadQuestion(currentQuestionIndex + 1);
  }, REVEAL_DELAY_MS);
}

function highlightChosenCard(side, isCorrect) {
  // Optional card scaling / feedback animation
  const card = side === 'left' ? planeLeftCard : planeRightCard;
  if (card) {
    card.transform.scaleX = Reactive.val(1.12);
    card.transform.scaleY = Reactive.val(1.12);
  }
}

function resetCardVisuals() {
  if (planeLeftCard) {
    planeLeftCard.transform.scaleX = Reactive.val(1.0);
    planeLeftCard.transform.scaleY = Reactive.val(1.0);
  }
  if (planeRightCard) {
    planeRightCard.transform.scaleX = Reactive.val(1.0);
    planeRightCard.transform.scaleY = Reactive.val(1.0);
  }
}

function showEndScreen() {
  gameState = 'COMPLETE';
  if (containerGame) containerGame.hidden = Reactive.val(true);
  if (containerEnd) containerEnd.hidden = Reactive.val(false);

  let message = 'Early detection saves lives! 💖';
  if (score === 5) message = '🌟 Perfect 5/5! Awareness Champion!';
  else if (score >= 3) message = '👏 Great job! Sharing raises awareness!';

  if (textScore) textScore.text = `Score: ${score}/${QUESTIONS_PER_ROUND}\n${message}`;
  if (textFeedback) textFeedback.text = 'Tap screen to play again!';
}

// Start filter script
init();
