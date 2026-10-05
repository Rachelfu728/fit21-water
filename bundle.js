/**
 * Fit21 水水小助理 - 單檔自包含執行腳本 (支援 file:// 與本機直接執行)
 */

// 1. WATER_CONFIG & 計算邏輯
const WATER_CONFIG = {
  calculation: {
    multipliers: {
      daily: 33,
      weight_mgmt: 36,
      active: 40
    },
    roundTo: 100,
    minLimit: 1200,
    maxLimit: 3800,
    defaultWeight: 60,
    defaultGoal: 2000
  },
  defaultQuickButtons: [200, 300, 500],
  reminders: {
    firstTime: "11:30",
    secondTime: "17:00",
    enabled: true
  },
  encouragements: [
    "收到 💧",
    "又完成一杯！",
    "慢慢喝，很棒。",
    "咕嚕咕嚕，多了一杯好水 💧",
    "休息一下，喝口水真好。",
    "剛剛好的節奏，很舒服 🌿",
    "今天也有好好照顧自己 ✨",
    "水潤水潤，繼續保持 💧"
  ],
  knowledgeTips: [
    "水分是維持身體正常新陳代謝與生理機能的重要元素。",
    "少量、規律多次補充，比忙了一整天才一口氣灌水更容易吸收。",
    "不要等到非常口渴才想起喝水，口渴時通常身體已經有些缺水了。",
    "每天把水瓶放在視線看得見的地方，就是最自然的喝水提醒。",
    "活動量增加或天氣悶熱流汗時，記得適度多補充水分。",
    "早晨起床先喝一杯溫開水，能溫和喚醒腸胃與新陳代謝。",
    "建立固定的喝水節奏，可以大大減少「忙到忘記喝水」的狀況。",
    "喝水建議小口慢飲，讓水分更舒適地被身體吸收利用。",
    "常溫水或溫開水對腸胃最溫和，喝起來也最無負擔。",
    "餐前半小時適度喝點水，能潤滑消化道，讓用餐更舒緩。",
    "下午感到疲累或注意力不集中時，先喝幾口水讓頭腦清醒一下。",
    "長時間待在冷氣房或乾燥環境中，皮膚和呼吸道也需要水分滋潤。",
    "喝水不求快，像小助理常說的：「慢慢喝，剛剛好就好。」",
    "多喝水有助於維持良好的排便與新陳代謝節奏。",
    "睡前一小時只需稍微抿幾口水潤喉即可，不需要大量喝水影響睡眠。",
    "每次去洗手間後，順手倒半杯水補充，也是很棒的微習慣。",
    "工作用電腦或看電視一段時間，站起來走走並喝兩口水休息一下。",
    "湯品、蔬菜水果中也含有水分，都是日常水分來源的好夥伴。",
    "若剛運動完滿頭大汗，記得分次慢慢補水，不要一口氣喝太急。",
    "規律補充水分有助於維持思緒清晰與精神飽滿。",
    "如果覺得白開水單調，偶爾加一片檸檬或薄荷葉提味也很舒爽。",
    "生病或感冒不舒服時，多補充溫開水能幫助身體舒緩修復。",
    "觀察小便顏色：淡淡的淺黃色通常代表體內水分充足喔！",
    "搭乘長途車或飛機時空氣乾燥，別忘了隨身準備水壺隨時補充。",
    "不需要和別人比較喝水量，找到適合自己體質與節奏的量最舒適。",
    "洗完熱水澡後，毛孔張開流失水分，喝一杯溫水感覺格外舒暢。",
    "養成帶著水壺出門的習慣，不知不覺就能少喝許多含糖飲料。",
    "有心臟或腎臟特殊狀況的朋友，請務必遵循醫師吩咐的水分限制。",
    "今天若沒喝到預期目標不用焦慮，身體每天感受不同，明天再早點開始就好。",
    "每一口乾淨純粹的好水，都是今天對自己身體最溫柔的疼惜。"
  ]
};

function calculateSuggestedWater(weight, lifestyle = 'daily') {
  const cfg = WATER_CONFIG.calculation;
  const numWeight = Number(weight) || cfg.defaultWeight;
  const multiplier = cfg.multipliers[lifestyle] || cfg.multipliers.daily;
  let raw = numWeight * multiplier;
  let rounded = Math.round(raw / cfg.roundTo) * cfg.roundTo;
  if (rounded < cfg.minLimit) rounded = cfg.minLimit;
  if (rounded > cfg.maxLimit) rounded = cfg.maxLimit;
  return rounded;
}

function getSmartReminderState(currentWater, targetWater, now = new Date(), reminderTimes = WATER_CONFIG.reminders) {
  const goal = Math.max(1, targetWater || WATER_CONFIG.calculation.defaultGoal);
  const ratio = (currentWater || 0) / goal;
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTimeVal = hours * 60 + minutes;

  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const t1 = parseTime(reminderTimes.firstTime || "11:30");
  const t2 = parseTime(reminderTimes.secondTime || "17:00");
  const nightTime = 20 * 60;

  if (ratio >= 1.0) {
    return {
      type: 'completed',
      title: '今天的喝水目標完成了 🎉',
      message: '今天的喝水目標完成了 🎉 很棒，今天不再打擾你。',
      shouldNotify: false,
      canDisturb: false
    };
  }

  if (currentTimeVal >= nightTime) {
    return {
      type: 'night_rest',
      title: '今晚好好休息 💧',
      message: '今天沒有完成也沒關係，不需要為了達標一次喝大量的水。明天我們早一點開始 💧',
      shouldNotify: false,
      canDisturb: false
    };
  }

  if (currentTimeVal >= t2) {
    if (ratio < 0.6) {
      return {
        type: 'second_low',
        title: '傍晚溫柔提醒 💧',
        message: '今天還有一些水量沒有完成，不用急，晚餐前慢慢補一杯就好 💧',
        shouldNotify: true,
        canDisturb: true
      };
    } else {
      return {
        type: 'second_near',
        title: '接近目標囉 💧',
        message: '今天已經快完成囉 💧 按照自己的節奏慢慢喝就好。',
        shouldNotify: true,
        canDisturb: true
      };
    }
  }

  if (currentTimeVal >= t1) {
    if (ratio < 0.25) {
      return {
        type: 'first_low',
        title: '上午喝水提醒 💧',
        message: '💧 上午忙到忘記喝水了嗎？有空時補一杯就好。',
        shouldNotify: true,
        canDisturb: true
      };
    } else if (ratio < 0.5) {
      return {
        type: 'first_normal',
        title: '喝水節奏不錯 💧',
        message: '今天喝水的節奏不錯 💧 繼續保持就好。',
        shouldNotify: true,
        canDisturb: false
      };
    } else {
      return {
        type: 'first_good',
        title: '節奏很棒 👍',
        message: '今天喝得很有節奏 👍',
        shouldNotify: false,
        canDisturb: false
      };
    }
  }

  return {
    type: 'morning',
    title: '早安 💧',
    message: '早安！早晨先來一杯溫開水，開啟舒暢的一天。',
    shouldNotify: false,
    canDisturb: false
  };
}

// 2. 本地存儲
const STORAGE_KEYS = {
  SETTINGS: 'fit21_settings_v1',
  LOGS: 'fit21_daily_logs_v1',
  REMINDER_STATUS: 'fit21_reminder_sent_v1'
};

const DEFAULT_SETTINGS = {
  onboarded: false,
  weight: 60,
  lifestyle: 'daily',
  goal: 2000,
  reminders: { firstTime: "11:30", secondTime: "17:00", enabled: true },
  soundEnabled: true,
  vibrationEnabled: true,
  quickButtons: [200, 300, 500]
};

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(newSettings) {
  try {
    const current = getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return newSettings;
  }
}

function getAllLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function getTodayData() {
  const todayKey = getLocalDateString();
  const allLogs = getAllLogs();
  const todayRecord = allLogs[todayKey] || {
    date: todayKey,
    logs: [],
    goal: getSettings().goal
  };
  const total = (todayRecord.logs || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  return {
    date: todayKey,
    goal: todayRecord.goal || getSettings().goal,
    logs: todayRecord.logs || [],
    total
  };
}

function addWaterLog(amount) {
  const todayKey = getLocalDateString();
  const allLogs = getAllLogs();
  const settings = getSettings();

  if (!allLogs[todayKey]) {
    allLogs[todayKey] = {
      date: todayKey,
      goal: settings.goal,
      logs: []
    };
  }

  const prevTotal = (allLogs[todayKey].logs || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const newLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    amount: Number(amount),
    timestamp: Date.now()
  };

  allLogs[todayKey].logs.push(newLog);
  allLogs[todayKey].goal = settings.goal;

  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(allLogs));
  } catch (e) {}

  const currentTotal = prevTotal + Number(amount);
  const isGoalReachedNow = prevTotal < settings.goal && currentTotal >= settings.goal;

  return { record: newLog, total: currentTotal, isGoalReachedNow };
}

function undoLastWaterLog() {
  const todayKey = getLocalDateString();
  const allLogs = getAllLogs();

  if (!allLogs[todayKey] || !allLogs[todayKey].logs || allLogs[todayKey].logs.length === 0) {
    return { undoneRecord: null, newTotal: 0 };
  }

  const undoneRecord = allLogs[todayKey].logs.pop();
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(allLogs));
  } catch (e) {}

  const newTotal = (allLogs[todayKey].logs || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  return { undoneRecord, newTotal };
}

function getRecent7DaysHistory() {
  const allLogs = getAllLogs();
  const currentSettings = getSettings();
  const weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];
  const results = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - i);
    const dateKey = getLocalDateString(targetDate);
    const dayOfWeek = weekDayNames[targetDate.getDay()];
    const isToday = i === 0;

    const record = allLogs[dateKey];
    let total = 0;
    let goal = currentSettings.goal;

    if (record) {
      goal = record.goal || currentSettings.goal;
      total = (record.logs || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }

    const completed = goal > 0 && total >= goal;

    results.push({
      dateKey,
      dayNumber: targetDate.getDate(),
      dayOfWeek,
      total,
      goal,
      completed,
      isToday,
      percentage: goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0
    });
  }

  return results;
}

function getReminderSentStatus() {
  const todayKey = getLocalDateString();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REMINDER_STATUS);
    if (!raw) return { date: todayKey, firstSent: false, secondSent: false };
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayKey) {
      return { date: todayKey, firstSent: false, secondSent: false };
    }
    return parsed;
  } catch (e) {
    return { date: todayKey, firstSent: false, secondSent: false };
  }
}

function markReminderSent(reminderType) {
  const status = getReminderSentStatus();
  if (reminderType === 'first') status.firstSent = true;
  if (reminderType === 'second') status.secondSent = true;
  localStorage.setItem(STORAGE_KEYS.REMINDER_STATUS, JSON.stringify(status));
}

// 3. Web Audio 音效與觸覺
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playWaterDropSound(soundEnabled = true) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1450, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.18);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
  } catch (err) {}
}

function playSuccessChime(soundEnabled = true) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const startTime = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteStart = startTime + idx * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteStart);
      osc.stop(noteStart + 0.7);
    });
  } catch (err) {}
}

function triggerHaptic(vibrationEnabled = true, type = 'light') {
  if (!vibrationEnabled) return;
  if ('vibrate' in navigator) {
    try {
      if (type === 'light') navigator.vibrate(15);
      else if (type === 'success') navigator.vibrate([20, 50, 30]);
    } catch (e) {}
  }
}

// 4. 通知模組
function isNotificationSupported() {
  return 'Notification' in window;
}

async function requestNotificationPermission() {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    return false;
  }
}

function sendLocalNotification(title, body, tag = 'fit21-water') {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return false;
  try {
    const options = {
      body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag,
      renotify: false
    };
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, options);
      }).catch(() => {
        new Notification(title, options);
      });
    } else {
      new Notification(title, options);
    }
    return true;
  } catch (e) {
    return false;
  }
}

function checkAndTriggerReminders() {
  const settings = getSettings();
  if (!settings.reminders || !settings.reminders.enabled) return;
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const today = getTodayData();
  const sentStatus = getReminderSentStatus();
  const now = new Date();
  const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const firstTime = settings.reminders.firstTime || "11:30";
  const secondTime = settings.reminders.secondTime || "17:00";
  const reminderState = getSmartReminderState(today.total, today.goal, now, settings.reminders);

  if (today.total >= today.goal) return;

  if (currentHM === firstTime && !sentStatus.firstSent) {
    if (reminderState.canDisturb) {
      sendLocalNotification("💧 Fit21 水水小助理", reminderState.message, 'fit21-first');
    }
    markReminderSent('first');
  }

  if (currentHM === secondTime && !sentStatus.secondSent) {
    if (reminderState.canDisturb) {
      sendLocalNotification("💧 Fit21 水水小助理", reminderState.message, 'fit21-second');
    }
    markReminderSent('second');
  }
}

function sendTestNotification() {
  const settings = getSettings();
  const today = getTodayData();
  const reminderState = getSmartReminderState(today.total, today.goal, new Date(), settings.reminders);

  return sendLocalNotification(
    "💧 Fit21 水水小助理（測試提醒）",
    reminderState.message || "這是一則溫柔提醒測試！喝水小助理在此陪你 💧",
    'fit21-test'
  );
}

// 5. 主應用程式 UI 邏輯
(function() {
  let toastTimer = null;
  let currentTipIndex = Math.floor(Math.random() * WATER_CONFIG.knowledgeTips.length);
  let deferredPrompt = null;
  let tempOnboardData = {
    weight: 60,
    lifestyle: 'daily',
    goal: 2000,
    reminders: { firstTime: "11:30", secondTime: "17:00", enabled: true }
  };

  let DOM = {};

  function initApp() {
    DOM = {
      appContainer: document.getElementById('app-container'),
      avatarInteractBtn: document.getElementById('avatarInteractBtn'),
      openSettingsBtn: document.getElementById('openSettingsBtn'),
      smartReminderCard: document.getElementById('smartReminderCard'),
      reminderCardTitle: document.getElementById('reminderCardTitle'),
      reminderCardBadge: document.getElementById('reminderCardBadge'),
      reminderCardText: document.getElementById('reminderCardText'),
      glassContainer: document.getElementById('glassContainer'),
      waterFill: document.getElementById('waterFill'),
      glassPercent: document.getElementById('glassPercent'),
      currentAmountDisplay: document.getElementById('currentAmountDisplay'),
      targetAmountDisplay: document.getElementById('targetAmountDisplay'),
      statusPercentBadge: document.getElementById('statusPercentBadge'),
      undoBtn: document.getElementById('undoBtn'),
      undoBtnText: document.getElementById('undoBtnText'),
      quickBtns: [
        document.getElementById('quickBtn0'),
        document.getElementById('quickBtn1'),
        document.getElementById('quickBtn2')
      ],
      quickAmounts: [
        document.getElementById('quickAmount0'),
        document.getElementById('quickAmount1'),
        document.getElementById('quickAmount2')
      ],
      openCustomModalBtn: document.getElementById('openCustomModalBtn'),
      historyDropsRow: document.getElementById('historyDropsRow'),
      refreshKnowledgeBtn: document.getElementById('refreshKnowledgeBtn'),
      knowledgeTipText: document.getElementById('knowledgeTipText'),
      toastBubble: document.getElementById('toastBubble'),
      toastIcon: document.getElementById('toastIcon'),
      toastMessage: document.getElementById('toastMessage'),
      celebrationModal: document.getElementById('celebrationModal'),
      celebrateStatVal: document.getElementById('celebrateStatVal'),
      closeCelebrationBtn: document.getElementById('closeCelebrationBtn'),
      customAmountModal: document.getElementById('customAmountModal'),
      closeCustomModalBtn: document.getElementById('closeCustomModalBtn'),
      customMinusBtn: document.getElementById('customMinusBtn'),
      customPlusBtn: document.getElementById('customPlusBtn'),
      customInput: document.getElementById('customInput'),
      submitCustomAmountBtn: document.getElementById('submitCustomAmountBtn'),
      settingsModal: document.getElementById('settingsModal'),
      closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
      settingGoalMinus: document.getElementById('settingGoalMinus'),
      settingGoalPlus: document.getElementById('settingGoalPlus'),
      settingGoalVal: document.getElementById('settingGoalVal'),
      settingWeightMinus: document.getElementById('settingWeightMinus'),
      settingWeightPlus: document.getElementById('settingWeightPlus'),
      settingWeightVal: document.getElementById('settingWeightVal'),
      settingLifestyleSelect: document.getElementById('settingLifestyleSelect'),
      settingReminderToggle: document.getElementById('settingReminderToggle'),
      settingTime1: document.getElementById('settingTime1'),
      settingTime2: document.getElementById('settingTime2'),
      testNotificationBtn: document.getElementById('testNotificationBtn'),
      settingSoundToggle: document.getElementById('settingSoundToggle'),
      settingVibrationToggle: document.getElementById('settingVibrationToggle'),
      saveAndCloseSettingsBtn: document.getElementById('saveAndCloseSettingsBtn'),
      restartOnboardingBtn: document.getElementById('restartOnboardingBtn'),
      onboardingScreen: document.getElementById('onboardingScreen'),
      onboardingSteps: [
        document.getElementById('onboardingStep1'),
        document.getElementById('onboardingStep2'),
        document.getElementById('onboardingStep3'),
        document.getElementById('onboardingStep4'),
        document.getElementById('onboardingStep5')
      ],
      onboardNext1: document.getElementById('onboardNext1'),
      obWeightMinus: document.getElementById('obWeightMinus'),
      obWeightPlus: document.getElementById('obWeightPlus'),
      obWeightInput: document.getElementById('obWeightInput'),
      onboardNext2: document.getElementById('onboardNext2'),
      lifestyleCards: document.querySelectorAll('.lifestyle-card'),
      obSuggestedDisplay: document.getElementById('obSuggestedDisplay'),
      onboardNext3: document.getElementById('onboardNext3'),
      obGoalMinus: document.getElementById('obGoalMinus'),
      obGoalPlus: document.getElementById('obGoalPlus'),
      obGoalInput: document.getElementById('obGoalInput'),
      onboardNext4: document.getElementById('onboardNext4'),
      obTime1: document.getElementById('obTime1'),
      obTime2: document.getElementById('obTime2'),
      obReminderToggle: document.getElementById('obReminderToggle'),
      onboardFinishBtn: document.getElementById('onboardFinishBtn'),
      pwaBanner: document.getElementById('pwaBanner'),
      pwaBannerDesc: document.getElementById('pwaBannerDesc'),
      pwaInstallBtn: document.getElementById('pwaInstallBtn')
    };

    const settings = getSettings();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }

    if (!settings.onboarded) {
      startOnboarding();
    } else {
      DOM.onboardingScreen.classList.add('hidden');
      renderHomePage();
    }

    bindEvents();
    displayKnowledgeTip();

    setInterval(() => {
      checkAndTriggerReminders();
      updateSmartReminderUI();
    }, 30000);

    initPwaInstall();
  }

  function renderHomePage() {
    const settings = getSettings();
    const today = getTodayData();
    const goal = today.goal || settings.goal || 2000;
    const total = today.total || 0;
    const ratio = Math.min(1.2, total / goal);
    const percentage = Math.round((total / goal) * 100);

    const fillHeight = Math.min(100, Math.round(ratio * 100));
    DOM.waterFill.style.height = `${fillHeight}%`;

    DOM.glassPercent.textContent = `${percentage}%`;
    DOM.currentAmountDisplay.textContent = total.toLocaleString();
    DOM.targetAmountDisplay.textContent = goal.toLocaleString();

    if (total >= goal) {
      DOM.statusPercentBadge.textContent = `🎉 今日已達標 (${percentage}%)`;
      DOM.statusPercentBadge.style.background = "#E4F1EC";
      DOM.statusPercentBadge.style.color = "#0F6E56";
    } else {
      DOM.statusPercentBadge.textContent = `今天已經完成 ${percentage}%`;
      DOM.statusPercentBadge.style.background = "#EBF5FB";
      DOM.statusPercentBadge.style.color = "#2F88C0";
    }

    const quicks = settings.quickButtons || WATER_CONFIG.defaultQuickButtons;
    DOM.quickAmounts.forEach((el, idx) => {
      if (quicks[idx] !== undefined) {
        el.textContent = `＋${quicks[idx]}`;
      }
    });

    if (today.logs && today.logs.length > 0) {
      DOM.undoBtn.disabled = false;
      const lastAmount = today.logs[today.logs.length - 1].amount;
      DOM.undoBtnText.textContent = `復原上一筆 (+${lastAmount} mL)`;
    } else {
      DOM.undoBtn.disabled = true;
      DOM.undoBtnText.textContent = `復原上一筆`;
    }

    updateSmartReminderUI();
    renderHistoryDrops();
  }

  function updateSmartReminderUI() {
    const settings = getSettings();
    const today = getTodayData();
    const state = getSmartReminderState(today.total, today.goal, new Date(), settings.reminders);

    DOM.reminderCardTitle.textContent = state.title;
    DOM.reminderCardText.textContent = state.message;

    DOM.smartReminderCard.classList.remove('completed', 'night-rest');
    if (state.type === 'completed') {
      DOM.smartReminderCard.classList.add('completed');
      DOM.reminderCardBadge.textContent = '今日達標';
    } else if (state.type === 'night-rest') {
      DOM.smartReminderCard.classList.add('night-rest');
      DOM.reminderCardBadge.textContent = '晚間休息';
    } else {
      DOM.reminderCardBadge.textContent = '溫柔陪伴';
    }
  }

  function handleLogWater(amount) {
    const settings = getSettings();
    const { total, isGoalReachedNow } = addWaterLog(amount);

    playWaterDropSound(settings.soundEnabled);
    triggerHaptic(settings.vibrationEnabled, 'light');

    DOM.glassContainer.style.transform = 'scale(0.96)';
    setTimeout(() => {
      DOM.glassContainer.style.transform = 'scale(1)';
    }, 150);

    const randomMsg = WATER_CONFIG.encouragements[Math.floor(Math.random() * WATER_CONFIG.encouragements.length)];
    showToast(randomMsg);
    renderHomePage();

    if (isGoalReachedNow) {
      setTimeout(() => {
        triggerCelebration(total, settings.goal);
      }, 400);
    }
  }

  function triggerCelebration(total, goal) {
    const settings = getSettings();
    playSuccessChime(settings.soundEnabled);
    triggerHaptic(settings.vibrationEnabled, 'success');

    DOM.celebrateStatVal.textContent = `${total.toLocaleString()} / ${goal.toLocaleString()} mL`;
    DOM.celebrationModal.classList.add('active');
  }

  function renderHistoryDrops() {
    const history = getRecent7DaysHistory();
    DOM.historyDropsRow.innerHTML = '';

    history.forEach(day => {
      const item = document.createElement('div');
      item.className = `history-day-item ${day.isToday ? 'today' : ''}`;
      
      const dropSvg = `
        <svg class="drop-svg ${day.completed ? 'completed' : 'incomplete'}" viewBox="0 0 32 40">
          <path d="M16 2 C16 2 4 18 4 26 C4 33 9.5 38 16 38 C22.5 38 28 33 28 26 C28 18 16 2 16 2 Z"/>
        </svg>
      `;

      item.innerHTML = `
        <span class="day-label">${day.dayOfWeek}</span>
        <div class="drop-icon-wrapper" title="${day.dateKey}：${day.total} / ${day.goal} mL">
          ${dropSvg}
          <span class="drop-percent-badge">${day.isToday ? '今天' : `${day.percentage}%`}</span>
        </div>
      `;

      item.addEventListener('click', () => {
        showToast(`${day.dayOfWeek}（${day.dayNumber}日）：喝了 ${day.total} mL ${day.completed ? '💧 達標！' : ''}`);
      });

      DOM.historyDropsRow.appendChild(item);
    });
  }

  function displayKnowledgeTip(increment = 0) {
    if (increment !== 0) {
      currentTipIndex = (currentTipIndex + increment + WATER_CONFIG.knowledgeTips.length) % WATER_CONFIG.knowledgeTips.length;
    }
    const tip = WATER_CONFIG.knowledgeTips[currentTipIndex];
    DOM.knowledgeTipText.style.opacity = '0';
    setTimeout(() => {
      DOM.knowledgeTipText.textContent = tip;
      DOM.knowledgeTipText.style.opacity = '1';
    }, 150);
  }

  function showToast(message, icon = '💧') {
    if (toastTimer) clearTimeout(toastTimer);
    DOM.toastIcon.textContent = icon;
    DOM.toastMessage.textContent = message;
    DOM.toastBubble.classList.add('show');
    toastTimer = setTimeout(() => {
      DOM.toastBubble.classList.remove('show');
    }, 2200);
  }

  function startOnboarding() {
    DOM.onboardingScreen.classList.remove('hidden');
    showOnboardingStep(0);
    tempOnboardData = {
      weight: 60,
      lifestyle: 'daily',
      goal: 2000,
      reminders: { firstTime: "11:30", secondTime: "17:00", enabled: true }
    };
    DOM.obWeightInput.value = tempOnboardData.weight;
    updateOnboardingCalculation();
  }

  function showOnboardingStep(stepIndex) {
    DOM.onboardingSteps.forEach((step, idx) => {
      if (idx === stepIndex) step.classList.add('active');
      else step.classList.remove('active');
    });
  }

  function updateOnboardingCalculation() {
    const suggested = calculateSuggestedWater(tempOnboardData.weight, tempOnboardData.lifestyle);
    DOM.obSuggestedDisplay.textContent = `${suggested.toLocaleString()} mL`;
    tempOnboardData.goal = suggested;
    DOM.obGoalInput.value = suggested;
  }

  function bindEvents() {
    DOM.avatarInteractBtn.addEventListener('click', () => {
      playWaterDropSound(getSettings().soundEnabled);
      const greetingList = [
        "嗨！我是你的 Fit21 水水小助理 💧",
        "今天也記得對自己溫柔一點，慢慢喝口水。",
        "有我陪著你，喝水變成每天最舒心的小事 🌿",
        "今天過得還順心嗎？先喝口水潤潤喉吧 ✨"
      ];
      const greeting = greetingList[Math.floor(Math.random() * greetingList.length)];
      showToast(greeting);
    });

    DOM.glassContainer.addEventListener('click', () => {
      playWaterDropSound(getSettings().soundEnabled);
      showToast("咕嚕咕嚕，多喝好水真舒服 💧");
    });

    DOM.quickBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const currentSettings = getSettings();
        const quicks = currentSettings.quickButtons || WATER_CONFIG.defaultQuickButtons;
        const amount = quicks[index] || 200;
        handleLogWater(amount);
      });
    });

    DOM.undoBtn.addEventListener('click', () => {
      const { undoneRecord } = undoLastWaterLog();
      if (undoneRecord) {
        triggerHaptic(getSettings().vibrationEnabled, 'light');
        showToast(`已復原上一筆記錄 (-${undoneRecord.amount} mL)`);
        renderHomePage();
      }
    });

    DOM.openCustomModalBtn.addEventListener('click', () => {
      DOM.customAmountModal.classList.add('active');
    });

    DOM.closeCustomModalBtn.addEventListener('click', () => {
      DOM.customAmountModal.classList.remove('active');
    });

    DOM.customMinusBtn.addEventListener('click', () => {
      let val = Number(DOM.customInput.value) || 250;
      val = Math.max(50, val - 50);
      DOM.customInput.value = val;
    });

    DOM.customPlusBtn.addEventListener('click', () => {
      let val = Number(DOM.customInput.value) || 250;
      val = Math.min(2000, val + 50);
      DOM.customInput.value = val;
    });

    document.querySelectorAll('.preset-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset');
        DOM.customInput.value = preset;
      });
    });

    DOM.submitCustomAmountBtn.addEventListener('click', () => {
      const amount = Number(DOM.customInput.value);
      if (amount > 0) {
        handleLogWater(amount);
        DOM.customAmountModal.classList.remove('active');
      }
    });

    DOM.closeCelebrationBtn.addEventListener('click', () => {
      DOM.celebrationModal.classList.remove('active');
    });

    DOM.refreshKnowledgeBtn.addEventListener('click', () => {
      displayKnowledgeTip(1);
    });

    DOM.openSettingsBtn.addEventListener('click', openSettingsSheet);

    DOM.closeSettingsModalBtn.addEventListener('click', () => {
      DOM.settingsModal.classList.remove('active');
    });

    DOM.settingGoalMinus.addEventListener('click', () => {
      const s = getSettings();
      const newGoal = Math.max(500, (s.goal || 2000) - 100);
      saveSettings({ goal: newGoal });
      DOM.settingGoalVal.textContent = `${newGoal} mL`;
      renderHomePage();
    });

    DOM.settingGoalPlus.addEventListener('click', () => {
      const s = getSettings();
      const newGoal = Math.min(5000, (s.goal || 2000) + 100);
      saveSettings({ goal: newGoal });
      DOM.settingGoalVal.textContent = `${newGoal} mL`;
      renderHomePage();
    });

    DOM.settingWeightMinus.addEventListener('click', () => {
      const s = getSettings();
      const newWeight = Math.max(30, (s.weight || 60) - 1);
      saveSettings({ weight: newWeight });
      DOM.settingWeightVal.textContent = `${newWeight} kg`;
    });

    DOM.settingWeightPlus.addEventListener('click', () => {
      const s = getSettings();
      const newWeight = Math.min(200, (s.weight || 60) + 1);
      saveSettings({ weight: newWeight });
      DOM.settingWeightVal.textContent = `${newWeight} kg`;
    });

    DOM.settingLifestyleSelect.addEventListener('change', (e) => {
      saveSettings({ lifestyle: e.target.value });
    });

    DOM.settingReminderToggle.addEventListener('change', async (e) => {
      const enabled = e.target.checked;
      if (enabled && isNotificationSupported()) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          showToast("已開啟 App 內提醒 (瀏覽器推播未授權)");
        } else {
          showToast("已成功開啟每日兩次溫柔提醒 💧");
        }
      }
      const current = getSettings();
      saveSettings({
        reminders: { ...current.reminders, enabled }
      });
      updateSmartReminderUI();
    });

    DOM.testNotificationBtn.addEventListener('click', async () => {
      if (isNotificationSupported()) {
        await requestNotificationPermission();
      }
      const sent = sendTestNotification();
      if (sent) {
        showToast("測試提醒已發送！請查看手機通知 🔔");
      } else {
        showToast("若未收到，請在瀏覽器設定中允許通知 💧");
      }
    });

    DOM.settingSoundToggle.addEventListener('change', (e) => {
      saveSettings({ soundEnabled: e.target.checked });
      if (e.target.checked) playWaterDropSound(true);
    });

    DOM.settingVibrationToggle.addEventListener('change', (e) => {
      saveSettings({ vibrationEnabled: e.target.checked });
      if (e.target.checked) triggerHaptic(true, 'light');
    });

    DOM.saveAndCloseSettingsBtn.addEventListener('click', () => {
      const updated = {
        reminders: {
          enabled: DOM.settingReminderToggle.checked,
          firstTime: DOM.settingTime1.value || "11:30",
          secondTime: DOM.settingTime2.value || "17:00"
        }
      };
      saveSettings(updated);
      DOM.settingsModal.classList.remove('active');
      renderHomePage();
      showToast("設定已儲存 💧");
    });

    DOM.restartOnboardingBtn.addEventListener('click', () => {
      DOM.settingsModal.classList.remove('active');
      startOnboarding();
    });

    DOM.onboardNext1.addEventListener('click', () => {
      showOnboardingStep(1);
    });

    DOM.obWeightMinus.addEventListener('click', () => {
      let w = Number(DOM.obWeightInput.value) || 60;
      w = Math.max(30, w - 1);
      DOM.obWeightInput.value = w;
      tempOnboardData.weight = w;
      updateOnboardingCalculation();
    });

    DOM.obWeightPlus.addEventListener('click', () => {
      let w = Number(DOM.obWeightInput.value) || 60;
      w = Math.min(200, w + 1);
      DOM.obWeightInput.value = w;
      tempOnboardData.weight = w;
      updateOnboardingCalculation();
    });

    DOM.obWeightInput.addEventListener('input', () => {
      const w = Number(DOM.obWeightInput.value) || 60;
      tempOnboardData.weight = w;
      updateOnboardingCalculation();
    });

    DOM.onboardNext2.addEventListener('click', () => {
      showOnboardingStep(2);
    });

    DOM.lifestyleCards.forEach(card => {
      card.addEventListener('click', () => {
        DOM.lifestyleCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        tempOnboardData.lifestyle = card.getAttribute('data-lifestyle');
        updateOnboardingCalculation();
      });
    });

    DOM.onboardNext3.addEventListener('click', () => {
      showOnboardingStep(3);
    });

    DOM.obGoalMinus.addEventListener('click', () => {
      let g = Number(DOM.obGoalInput.value) || 2000;
      g = Math.max(500, g - 100);
      DOM.obGoalInput.value = g;
      tempOnboardData.goal = g;
    });

    DOM.obGoalPlus.addEventListener('click', () => {
      let g = Number(DOM.obGoalInput.value) || 2000;
      g = Math.min(5000, g + 100);
      DOM.obGoalInput.value = g;
      tempOnboardData.goal = g;
    });

    DOM.obGoalInput.addEventListener('input', () => {
      tempOnboardData.goal = Number(DOM.obGoalInput.value) || 2000;
    });

    DOM.onboardNext4.addEventListener('click', () => {
      showOnboardingStep(4);
    });

    DOM.onboardFinishBtn.addEventListener('click', async () => {
      const isReminderEnabled = DOM.obReminderToggle.checked;
      if (isReminderEnabled && isNotificationSupported()) {
        await requestNotificationPermission();
      }

      const finalSettings = {
        onboarded: true,
        weight: tempOnboardData.weight,
        lifestyle: tempOnboardData.lifestyle,
        goal: tempOnboardData.goal,
        reminders: {
          enabled: isReminderEnabled,
          firstTime: DOM.obTime1.value || "11:30",
          secondTime: DOM.obTime2.value || "17:00"
        }
      };

      saveSettings(finalSettings);
      DOM.onboardingScreen.classList.add('hidden');
      renderHomePage();
      playSuccessChime(true);
      showToast("設定完成！水水小助理陪你開始喝水 💧");
    });
  }

  function openSettingsSheet() {
    const s = getSettings();
    DOM.settingGoalVal.textContent = `${s.goal || 2000} mL`;
    DOM.settingWeightVal.textContent = `${s.weight || 60} kg`;
    DOM.settingLifestyleSelect.value = s.lifestyle || 'daily';
    DOM.settingReminderToggle.checked = s.reminders ? s.reminders.enabled : true;
    DOM.settingTime1.value = s.reminders?.firstTime || "11:30";
    DOM.settingTime2.value = s.reminders?.secondTime || "17:00";
    DOM.settingSoundToggle.checked = s.soundEnabled !== false;
    DOM.settingVibrationToggle.checked = s.vibrationEnabled !== false;
    DOM.settingsModal.classList.add('active');
  }

  function initPwaInstall() {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isIos && !isStandalone) {
      DOM.pwaBanner.style.display = 'flex';
      DOM.pwaBannerDesc.textContent = '請點下方「分享」➔「加入主畫面」';
      DOM.pwaInstallBtn.textContent = '了解';
      DOM.pwaInstallBtn.addEventListener('click', () => {
        showToast('在 Safari 底部點選「分享按鈕」➔ 選擇「加入主畫面」即可安裝 💧');
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      DOM.pwaBanner.style.display = 'flex';
      DOM.pwaInstallBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            DOM.pwaBanner.style.display = 'none';
          }
          deferredPrompt = null;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
