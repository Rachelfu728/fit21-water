/**
 * Fit21 水水小助理 - 智慧提醒與推播通知模組
 */

import { getSmartReminderState } from './waterConfig.js';
import { getTodayData, getSettings, getReminderSentStatus, markReminderSent } from './storage.js';

/**
 * 檢查瀏覽器是否支援通知
 */
export function isNotificationSupported() {
  return 'Notification' in window;
}

/**
 * 取得當前通知權限狀態
 * @returns {'granted'|'denied'|'default'|'unsupported'}
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * 請求通知權限
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.error("Failed to request notification permission:", err);
    return false;
  }
}

/**
 * 發送一則溫柔推播通知
 */
export function sendLocalNotification(title, body, tag = 'fit21-water') {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const options = {
      body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag,
      renotify: false,
      silent: false
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
    console.warn("Notification trigger failed:", e);
    return false;
  }
}

/**
 * 檢查並依據「一天兩次不打擾邏輯」觸發系統提醒
 */
export function checkAndTriggerReminders() {
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

  // 若今日已達標，當天絕對不打擾
  if (today.total >= today.goal) {
    return;
  }

  // 第一次提醒判定 (到達時間且今日尚未發送第一次)
  if (currentHM === firstTime && !sentStatus.firstSent) {
    if (reminderState.canDisturb) {
      sendLocalNotification(
        "💧 Fit21 水水小助理",
        reminderState.message,
        'fit21-first-reminder'
      );
    }
    markReminderSent('first');
  }

  // 第二次提醒判定 (到達時間且今日尚未發送第二次)
  if (currentHM === secondTime && !sentStatus.secondSent) {
    if (reminderState.canDisturb) {
      sendLocalNotification(
        "💧 Fit21 水水小助理",
        reminderState.message,
        'fit21-second-reminder'
      );
    }
    markReminderSent('second');
  }
}

/**
 * 發送測試提醒 (讓使用者在設定頁親身體驗效果)
 */
export function sendTestNotification() {
  const settings = getSettings();
  const today = getTodayData();
  const reminderState = getSmartReminderState(today.total, today.goal, new Date(), settings.reminders);

  return sendLocalNotification(
    "💧 Fit21 水水小助理（測試提醒）",
    reminderState.message || "這是一則溫柔提醒測試！喝水小助理在此陪你 💧",
    'fit21-test-reminder'
  );
}
