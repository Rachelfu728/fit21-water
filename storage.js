/**
 * Fit21 水水小助理 - 本地存儲與紀錄管理模組 (LocalStorage)
 */

const STORAGE_KEYS = {
  SETTINGS: 'fit21_settings_v1',
  LOGS: 'fit21_daily_logs_v1',
  HISTORY_CACHE: 'fit21_history_cache_v1',
  REMINDER_STATUS: 'fit21_reminder_sent_v1'
};

const DEFAULT_SETTINGS = {
  onboarded: false,
  weight: 60,
  lifestyle: 'daily', // 'daily' | 'weight_mgmt' | 'active'
  goal: 2000,
  reminders: {
    firstTime: "11:30",
    secondTime: "17:00",
    enabled: true
  },
  soundEnabled: true,
  vibrationEnabled: true,
  quickButtons: [200, 300, 500]
};

/**
 * 取得今天日期的 YYYY-MM-DD 字串 (以使用者本地時區為準)
 */
export function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 讀取設定
 */
export function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Failed to load settings:", e);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * 儲存設定
 */
export function saveSettings(newSettings) {
  try {
    const current = getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to save settings:", e);
    return newSettings;
  }
}

/**
 * 讀取所有日期的紀錄集合
 */
function getAllLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to load logs:", e);
    return {};
  }
}

/**
 * 取得今天的喝水紀錄
 */
export function getTodayData() {
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

/**
 * 新增一筆喝水紀錄
 * @param {number} amount 喝水量 (mL)
 * @returns {{ record: object, total: number, isGoalReachedNow: boolean }}
 */
export function addWaterLog(amount) {
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
  allLogs[todayKey].goal = settings.goal; // 同步最新目標

  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(allLogs));
  } catch (e) {
    console.error("Failed to write log:", e);
  }

  const currentTotal = prevTotal + Number(amount);
  const isGoalReachedNow = prevTotal < settings.goal && currentTotal >= settings.goal;

  return {
    record: newLog,
    total: currentTotal,
    isGoalReachedNow
  };
}

/**
 * 復原上一筆紀錄 (Undo)
 * @returns {{ undoneRecord: object|null, newTotal: number }}
 */
export function undoLastWaterLog() {
  const todayKey = getLocalDateString();
  const allLogs = getAllLogs();

  if (!allLogs[todayKey] || !allLogs[todayKey].logs || allLogs[todayKey].logs.length === 0) {
    return { undoneRecord: null, newTotal: 0 };
  }

  const undoneRecord = allLogs[todayKey].logs.pop();
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(allLogs));
  } catch (e) {
    console.error("Failed to undo log:", e);
  }

  const newTotal = (allLogs[todayKey].logs || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  return { undoneRecord, newTotal };
}

/**
 * 取得最近 7 天紀錄 (從 6 天前到今天)
 * 格式包含：日期、星期幾 (一~日)、總量、目標、是否完成
 */
export function getRecent7DaysHistory() {
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

/**
 * 提醒通知狀態管理 (記錄今日是否已推播過第1次或第2次)
 */
export function getReminderSentStatus() {
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

export function markReminderSent(reminderType) {
  const status = getReminderSentStatus();
  if (reminderType === 'first') status.firstSent = true;
  if (reminderType === 'second') status.secondSent = true;
  localStorage.setItem(STORAGE_KEYS.REMINDER_STATUS, JSON.stringify(status));
}
