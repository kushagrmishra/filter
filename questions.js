// Pink Tilt Quiz - 50 Accessible & Normal Breast Cancer Awareness Questions
// Format: [Question, Correct Answer, Wrong Answer]
var PINK_QUIZ_QUESTIONS = [
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

if (typeof window !== "undefined") {
  window.PINK_QUIZ_QUESTIONS = PINK_QUIZ_QUESTIONS;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = PINK_QUIZ_QUESTIONS;
}
