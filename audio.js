/**
 * Fit21 水水小助理 - 音效與觸覺回饋模組
 * 使用 Web Audio API 合成溫和的水滴聲 (Plop) 與達標和弦，零外鏈依賴且極速流暢
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * 播放清脆溫潤的水滴聲 (Water Plop)
 */
export function playWaterDropSound(soundEnabled = true) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 正弦波頻率滑動製造水滴 "plop" 效果
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // 頻率從 600Hz 快速往上滑到 1400Hz 再落下
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1450, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.18);

    // 音量包絡：快速淡入、溫和淡出
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
  } catch (err) {
    console.warn("Audio playback not allowed yet or error:", err);
  }
}

/**
 * 播放達標溫馨和弦 (柔和的三度/五度和弦)
 */
export function playSuccessChime(soundEnabled = true) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
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
  } catch (err) {
    console.warn("Chime playback error:", err);
  }
}

/**
 * 觸覺震動 (短促溫和)
 */
export function triggerHaptic(vibrationEnabled = true, type = 'light') {
  if (!vibrationEnabled) return;
  if ('vibrate' in navigator) {
    try {
      if (type === 'light') {
        navigator.vibrate(15);
      } else if (type === 'success') {
        navigator.vibrate([20, 50, 30]);
      }
    } catch (e) {
      // Ignore vibration errors if not supported or blocked
    }
  }
}
