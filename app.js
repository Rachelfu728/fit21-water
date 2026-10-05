/**
 * Fit21 水水小助理 - 主要應用程式核心邏輯
 */

import { WATER_CONFIG, calculateSuggestedWater, getSmartReminderState } from './waterConfig.js';
import {
  getSettings,
  saveSettings,
  getTodayData,
  addWaterLog,
  undoLastWaterLog,
  getRecent7DaysHistory
} from './storage.js';
import { playWaterDropSound, playSuccessChime, triggerHaptic } from './audio.js';
import {
  isNotificationSupported,
  requestNotificationPermission,
  sendTestNotification,
  checkAndTriggerReminders
} from './notifications.js';

// DOM 元素快取
const DOM = {
  appContainer: document.getElementById('app-container'),
  
  // Header
  avatarInteractBtn: document.getElementById('avatarInteractBtn'),
  openSettingsBtn: document.getElementById('openSettingsBtn'),

  // Smart Reminder Card
  smartReminderCard: document.getElementById('smartReminderCard'),
  reminderCardTitle: document.getElementById('reminderCardTitle'),
  reminderCardBadge: document.getElementById('reminderCardBadge'),
  reminderCardText: document.getElementById('reminderCardText'),

  // Water Display Card
  glassContainer: document.getElementById('glassContainer'),
  waterFill: document.getElementById('waterFill'),
  glassPercent: document.getElementById('glassPercent'),
  currentAmountDisplay: document.getElementById('currentAmountDisplay'),
  targetAmountDisplay: document.getElementById('targetAmountDisplay'),
  statusPercentBadge: document.getElementById('statusPercentBadge'),

  // Quick Logs
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

  // History & Knowledge
  historyDropsRow: document.getElementById('historyDropsRow'),
  refreshKnowledgeBtn: document.getElementById('refreshKnowledgeBtn'),
  knowledgeTipText: document.getElementById('knowledgeTipText'),

  // Toast
  toastBubble: document.getElementById('toastBubble'),
  toastIcon: document.getElementById('toastIcon'),
  toastMessage: document.getElementById('toastMessage'),

  // Celebration Modal
  celebrationModal: document.getElementById('celebrationModal'),
  celebrateStatVal: document.getElementById('celebrateStatVal'),
  closeCelebrationBtn: document.getElementById('closeCelebrationBtn'),

  // Custom Amount Modal
  customAmountModal: document.getElementById('customAmountModal'),
  closeCustomModalBtn: document.getElementById('closeCustomModalBtn'),
  customMinusBtn: document.getElementById('customMinusBtn'),
  customPlusBtn: document.getElementById('customPlusBtn'),
  customInput: document.getElementById('customInput'),
  submitCustomAmountBtn: document.getElementById('submitCustomAmountBtn'),

  // Settings Modal
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

  // Onboarding Screen
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

  // PWA Banner
  pwaBanner: document.getElementById('pwaBanner'),
  pwaBannerDesc: document.getElementById('pwaBannerDesc'),
  pwaInstallBtn: document.getElementById('pwaInstallBtn')
};

// 狀態變數
let toastTimer = null;
let currentTipIndex = Math.floor(Math.random() * WATER_CONFIG.knowledgeTips.length);
let deferredPrompt = null;
let tempOnboardData = {
  weight: 60,
  lifestyle: 'daily',
  goal: 2000,
  reminders: { firstTime: "11:30", secondTime: "17:00", enabled: true }
};

/**
 * 應用程式初始化
 */
function initApp() {
  const settings = getSettings();

  // 註冊 Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(err => {
      console.warn("SW register fail:", err);
    });
  }

  // 判斷是否為第一次使用
  if (!settings.onboarded) {
    startOnboarding();
  } else {
    DOM.onboardingScreen.classList.add('hidden');
    renderHomePage();
  }

  // 事件綁定
  bindEvents();

  // 隨機初始顯示一則喝水知識
  displayKnowledgeTip();

  // 啟動排程檢查 (每 30 秒確認一次提醒時間)
  setInterval(() => {
    checkAndTriggerReminders();
    updateSmartReminderUI();
  }, 30000);

  // 檢查 PWA 安裝能力
  initPwaInstall();
}

/**
 * 渲染首頁主視覺與所有數值
 */
function renderHomePage() {
  const settings = getSettings();
  const today = getTodayData();
  const goal = today.goal || settings.goal || 2000;
  const total = today.total || 0;
  const ratio = Math.min(1.2, total / goal);
  const percentage = Math.round((total / goal) * 100);

  // 1. 水位高度平滑上升 (限制 0% ~ 100%)
  const fillHeight = Math.min(100, Math.round(ratio * 100));
  DOM.waterFill.style.height = `${fillHeight}%`;

  // 2. 顯示百分比與容量數值
  DOM.glassPercent.textContent = `${percentage}%`;
  DOM.currentAmountDisplay.textContent = total.toLocaleString();
  DOM.targetAmountDisplay.textContent = goal.toLocaleString();

  // 3. 狀態提示 (完全不使用紅色警告)
  if (total >= goal) {
    DOM.statusPercentBadge.textContent = `🎉 今日已達標 (${percentage}%)`;
    DOM.statusPercentBadge.style.background = "#E4F1EC";
    DOM.statusPercentBadge.style.color = "#0F6E56";
  } else {
    DOM.statusPercentBadge.textContent = `今天已經完成 ${percentage}%`;
    DOM.statusPercentBadge.style.background = "#EBF5FB";
    DOM.statusPercentBadge.style.color = "#2F88C0";
  }

  // 4. 快速按鈕標籤更新
  const quicks = settings.quickButtons || WATER_CONFIG.defaultQuickButtons;
  DOM.quickAmounts.forEach((el, idx) => {
    if (quicks[idx] !== undefined) {
      el.textContent = `＋${quicks[idx]}`;
    }
  });

  // 5. 復原按鈕狀態
  if (today.logs && today.logs.length > 0) {
    DOM.undoBtn.disabled = false;
    const lastAmount = today.logs[today.logs.length - 1].amount;
    DOM.undoBtnText.textContent = `復原上一筆 (+${lastAmount} mL)`;
  } else {
    DOM.undoBtn.disabled = true;
    DOM.undoBtnText.textContent = `復原上一筆`;
  }

  // 6. 更新智慧提醒卡片
  updateSmartReminderUI();

  // 7. 更新 7 天水滴歷史
  renderHistoryDrops();
}

/**
 * 更新智慧提醒卡片內容 (遵循核心不打擾邏輯)
 */
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

/**
 * 記錄喝水主處理函式
 */
function handleLogWater(amount) {
  const settings = getSettings();
  const { total, isGoalReachedNow } = addWaterLog(amount);

  // 觸發音效與震動
  playWaterDropSound(settings.soundEnabled);
  triggerHaptic(settings.vibrationEnabled, 'light');

  // 水杯微微晃動動畫
  DOM.glassContainer.style.transform = 'scale(0.96)';
  setTimeout(() => {
    DOM.glassContainer.style.transform = 'scale(1)';
  }, 150);

  // 隨機短促鼓勵語
  const randomMsg = WATER_CONFIG.encouragements[Math.floor(Math.random() * WATER_CONFIG.encouragements.length)];
  showToast(randomMsg);

  // 刷新首頁
  renderHomePage();

  // 若剛好達標，觸發優雅慶祝彈窗
  if (isGoalReachedNow) {
    setTimeout(() => {
      triggerCelebration(total, settings.goal);
    }, 400);
  }
}

/**
 * 達標慶祝彈窗
 */
function triggerCelebration(total, goal) {
  const settings = getSettings();
  playSuccessChime(settings.soundEnabled);
  triggerHaptic(settings.vibrationEnabled, 'success');

  DOM.celebrateStatVal.textContent = `${total.toLocaleString()} / ${goal.toLocaleString()} mL`;
  DOM.celebrationModal.classList.add('active');
}

/**
 * 渲染近 7 天水滴
 */
function renderHistoryDrops() {
  const history = getRecent7DaysHistory();
  DOM.historyDropsRow.innerHTML = '';

  history.forEach(day => {
    const item = document.createElement('div');
    item.className = `history-day-item ${day.isToday ? 'today' : ''}`;
    
    // 水滴 SVG (完成為深水藍實心，未完成為淺米灰)
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

    // 點擊水滴提示當天喝水量
    item.addEventListener('click', () => {
      showToast(`${day.dayOfWeek}（${day.dayNumber}日）：喝了 ${day.total} mL ${day.completed ? '💧 達標！' : ''}`);
    });

    DOM.historyDropsRow.appendChild(item);
  });
}

/**
 * 輪播喝水小知識
 */
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

/**
 * 顯示短促鼓勵浮動吐司
 */
function showToast(message, icon = '💧') {
  if (toastTimer) clearTimeout(toastTimer);
  DOM.toastIcon.textContent = icon;
  DOM.toastMessage.textContent = message;
  DOM.toastBubble.classList.add('show');

  toastTimer = setTimeout(() => {
    DOM.toastBubble.classList.remove('show');
  }, 2200);
}

/**
 * ─────────────────────────────
 * 首次使用設定引導流程 (Onboarding)
 * ─────────────────────────────
 */
function startOnboarding() {
  DOM.onboardingScreen.classList.remove('hidden');
  showOnboardingStep(0);

  // 初始化預設值
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
    if (idx === stepIndex) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });
}

function updateOnboardingCalculation() {
  const suggested = calculateSuggestedWater(tempOnboardData.weight, tempOnboardData.lifestyle);
  DOM.obSuggestedDisplay.textContent = `${suggested.toLocaleString()} mL`;
  tempOnboardData.goal = suggested;
  DOM.obGoalInput.value = suggested;
}

/**
 * ─────────────────────────────
 * 事件綁定管理
 * ─────────────────────────────
 */
function bindEvents() {
  const settings = getSettings();

  // 1. 小助理頭像點擊互動
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

  // 點擊水杯容器也給予回饋
  DOM.glassContainer.addEventListener('click', () => {
    playWaterDropSound(getSettings().soundEnabled);
    showToast("咕嚕咕嚕，多喝好水真舒服 💧");
  });

  // 2. 三大快速喝水按鈕
  DOM.quickBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const currentSettings = getSettings();
      const quicks = currentSettings.quickButtons || WATER_CONFIG.defaultQuickButtons;
      const amount = quicks[index] || 200;
      handleLogWater(amount);
    });
  });

  // 3. 復原上一筆紀錄 (Undo)
  DOM.undoBtn.addEventListener('click', () => {
    const { undoneRecord } = undoLastWaterLog();
    if (undoneRecord) {
      triggerHaptic(getSettings().vibrationEnabled, 'light');
      showToast(`已復原上一筆記錄 (-${undoneRecord.amount} mL)`);
      renderHomePage();
    }
  });

  // 4. 自訂水量彈窗
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

  // 自訂水量快速預設標籤
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

  // 5. 達標慶祝彈窗關閉
  DOM.closeCelebrationBtn.addEventListener('click', () => {
    DOM.celebrationModal.classList.remove('active');
  });

  // 6. 輪播知識刷新
  DOM.refreshKnowledgeBtn.addEventListener('click', () => {
    displayKnowledgeTip(1);
  });

  // 7. 設定彈窗相關
  DOM.openSettingsBtn.addEventListener('click', () => {
    openSettingsSheet();
  });

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
    const s = getSettings();
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

  // 8. 引導流程 (Onboarding) 步進按鈕
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

  // 生活狀態選項卡片點擊
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

/**
 * 開啟設定滑動頁
 */
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

/**
 * PWA 安裝提示支援
 */
function initPwaInstall() {
  // 偵測 iOS Safari
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

  // 偵測 Android Chrome / Edge 的 beforeinstallprompt
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

// 應用程式啟動
document.addEventListener('DOMContentLoaded', initApp);
