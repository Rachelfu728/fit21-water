/**
 * Fit21 水水小助理 - 核心設定與計算模組
 * 包含：飲水量建議計算公式、智慧提醒文案與不打擾邏輯、25~30則溫和喝水小知識
 */

export const WATER_CONFIG = {
  // 飲水量計算公式設定 (可靈活微調)
  calculation: {
    // 依生活型態乘數 (mL / kg) - 依一般衛福部與營養學合理起始參考
    multipliers: {
      daily: 33,        // 日常健康: 約 33 mL / kg
      weight_mgmt: 36,  // 體重管理: 約 36 mL / kg
      active: 40        // 規律運動: 約 40 mL / kg
    },
    roundTo: 100,       // 四捨五入至最近的 100 mL
    minLimit: 1200,     // 建議下限保護
    maxLimit: 3800,     // 建議上限保護
    defaultWeight: 60,  // 預設體重 (kg)
    defaultGoal: 2000    // 預設目標 (mL)
  },

  // 預設快速喝水按鈕 (mL)
  defaultQuickButtons: [200, 300, 500],

  // 預設提醒設定
  reminders: {
    firstTime: "11:30",
    secondTime: "17:00",
    enabled: true
  },

  // 喝水後的隨機鼓勵語句 (簡短、溫和、不施壓)
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

  // 30則溫和、科學、無誇大不實的喝水生活小知識
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

/**
 * 依據體重與生活型態計算每日建議飲水量 (mL)
 * @param {number} weight 體重 (kg)
 * @param {'daily'|'weight_mgmt'|'active'} lifestyle 生活狀態
 * @returns {number} 建議飲水量 (mL)
 */
export function calculateSuggestedWater(weight, lifestyle = 'daily') {
  const cfg = WATER_CONFIG.calculation;
  const numWeight = Number(weight) || cfg.defaultWeight;
  const multiplier = cfg.multipliers[lifestyle] || cfg.multipliers.daily;
  
  let raw = numWeight * multiplier;
  // 四捨五入至最近的 roundTo (例如 100 mL)
  let rounded = Math.round(raw / cfg.roundTo) * cfg.roundTo;
  
  // 限制上下限保護
  if (rounded < cfg.minLimit) rounded = cfg.minLimit;
  if (rounded > cfg.maxLimit) rounded = cfg.maxLimit;
  
  return rounded;
}

/**
 * 取得智慧提醒文案與目前狀態
 * @param {number} currentWater 目前喝水量 (mL)
 * @param {number} targetWater 目標喝水量 (mL)
 * @param {Date} [now] 當前時間，預設為現在
 * @param {Object} [reminderTimes] 提醒時間設定 { firstTime: "11:30", secondTime: "17:00" }
 * @returns {{ type: string, message: string, shouldNotify: boolean, canDisturb: boolean, title: string }}
 */
export function getSmartReminderState(currentWater, targetWater, now = new Date(), reminderTimes = WATER_CONFIG.reminders) {
  const goal = Math.max(1, targetWater || WATER_CONFIG.calculation.defaultGoal);
  const ratio = (currentWater || 0) / goal;
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTimeVal = hours * 60 + minutes;

  // 解析提醒時間
  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const t1 = parseTime(reminderTimes.firstTime || "11:30");
  const t2 = parseTime(reminderTimes.secondTime || "17:00");
  const nightTime = 20 * 60; // 晚上 20:00

  // 1. 已達標：當天停止所有喝水提醒，絕不打擾
  if (ratio >= 1.0) {
    return {
      type: 'completed',
      title: '今天的喝水目標完成了 🎉',
      message: '今天的喝水目標完成了 🎉 很棒，今天不再打擾你。',
      shouldNotify: false,
      canDisturb: false
    };
  }

  // 2. 晚上 20:00 後的不打擾邏輯：絕不催促
  if (currentTimeVal >= nightTime) {
    return {
      type: 'night_rest',
      title: '今晚好好休息 💧',
      message: '今天沒有完成也沒關係，不需要為了達標一次喝大量的水。明天我們早一點開始 💧',
      shouldNotify: false,
      canDisturb: false
    };
  }

  // 3. 第二次提醒時段 (t2 之後 ~ 晚上 20:00 前)
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

  // 4. 第一次提醒時段 (t1 ~ t2 前)
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
        canDisturb: false // 正常節奏不一定要發震耳通知
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

  // 5. 清晨 / 早上 (t1 之前)
  return {
    type: 'morning',
    title: '早安 💧',
    message: '早安！早晨先來一杯溫開水，開啟舒暢的一天。',
    shouldNotify: false,
    canDisturb: false
  };
}
