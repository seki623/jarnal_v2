// 米国夏時間の判定ロジック
function isUSDaylightSavingTime(dateString) {
    if (!dateString) return false;
    const d = new Date(dateString + 'T00:00:00');
    if (isNaN(d.getTime())) return false;

    const year = d.getFullYear();
    let marchSecondSunday = new Date(year, 2, 8); 
    while (marchSecondSunday.getDay() !== 0) { marchSecondSunday.setDate(marchSecondSunday.getDate() + 1); }
    let novemberFirstSunday = new Date(year, 10, 1); 
    while (novemberFirstSunday.getDay() !== 0) { novemberFirstSunday.setDate(novemberFirstSunday.getDate() + 1); }

    const targetTime = d.getTime();
    return targetTime >= marchSecondSunday.getTime() && targetTime < novemberFirstSunday.getTime();
}

// 日付変更時に自動で夏時間チェックを連動
function updateDstDefault() {
    const editingId = document.getElementById('editingId').value;
    if (!editingId) {
        const dateVal = document.getElementById('tradeDate').value;
        document.getElementById('isSummerTime').checked = isUSDaylightSavingTime(dateVal);
    }
}

// 時間文字列(hh:mm)から当日の分数(分)を算出するヘルパー
function timeToMinutes(timeStr) {
    if(!timeStr || !timeStr.includes(':')) return null;
    const [h, m] = timeStr.split(':').map(Number);
    if(isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
}

// リアルタイムPips・損益・RR・保有時間の自動計算
function autoCalculateAllMetrics() {
    const openVal = document.getElementById('openPriceInput').value;
    const closeVal = document.getElementById('closePriceInput').value;
    const tpVal = document.getElementById('tpPriceInput').value;
    const slVal = document.getElementById('slPriceInput').value;
    const lotVal = document.getElementById('lotInput').value;
    
    const result = getSelectedVal('resultGroup');
    const side = getSelectedVal('sideGroup');

    // 1. Pipsと損益の自動計算
    if (openVal !== "" && closeVal !== "") {
        const openPrice = parseFloat(openVal);
        const closePrice = parseFloat(closeVal);
        let pipsValue = Math.abs(closePrice - openPrice) * 10;
        if (result === '負け') {
            pipsValue = -Math.abs(pipsValue);
        }
        document.getElementById('pipsInput').value = parseFloat(pipsValue.toFixed(2));

        if (lotVal !== "") {
            const lot = parseFloat(lotVal);
            let pnlValue = pipsValue * lot * 10;
            document.getElementById('pnlInput').value = parseFloat(pnlValue.toFixed(2));
        } else {
            document.getElementById('pnlInput').value = "";
        }
    }

    // 2. RR（リスクリワード）の計算（ご指定の条件分岐を完全実装）
    let targetRrText = "--";
    let actualRrText = "--";

    if (openVal !== "" && slVal !== "") {
        const openP = parseFloat(openVal);
        const slP = parseFloat(slVal);
        let riskWidth = (side === "Short") ? (slP - openP) : (openP - slP);

        if (riskWidth !== 0) {
            // 想定RRの算出
            if (tpVal !== "") {
                const tpP = parseFloat(tpVal);
                let targetRewardWidth = (side === "Short") ? (openP - tpP) : (tpP - openP);
                targetRrText = (targetRewardWidth / riskWidth).toFixed(2);
            }
            
            // 実際RRの算出（ご指定の絶対値と結果による条件分岐）
            if (closeVal !== "") {
                const closeP = parseFloat(closeVal);
                let rewardWidth = 0;
                
                if (side === "Long") {
                    rewardWidth = Math.abs(closeP - openP);
                    if (result === "勝ち") {
                        // そのまま
                    } else if (result === "負け") {
                        rewardWidth = rewardWidth * -1;
                    }
                } else if (side === "Short") {
                    rewardWidth = Math.abs(openP - closeP);
                    if (result === "勝ち") {
                        // そのまま
                    } else if (result === "負け") {
                        rewardWidth = rewardWidth * -1;
                    }
                }
                
                // 建値決済の場合は0にする、それ以外はリスク幅に対する比率
                if (result === "建値") {
                    actualRrText = "0.00";
                } else {
                    actualRrText = (rewardWidth / Math.abs(riskWidth)).toFixed(2);
                }
            }
        }
    }

    currentCalculatedRr = { targetRr: targetRrText, actualRr: actualRrText };
    
    // 3. 保有時間のリアルタイム計算
    const openMin = timeToMinutes(document.getElementById('tradeTime').value.trim());
    const closeMin = timeToMinutes(document.getElementById('closeTime').value.trim());
    let holdText = "--";
    if (openMin !== null && closeMin !== null) {
        let diff = closeMin - openMin;
        if (diff < 0) diff += 1440; // 日跨ぎ対応
        
        if (diff >= 60) {
            holdText = `${Math.floor(diff / 60)}時間${diff % 60}分`;
        } else {
            holdText = `${diff}分`;
        }
    }

    document.getElementById('liveRrBox').innerHTML = `
        <span>想定 RR 1 : ${targetRrText}</span>
        <span>実際 RR 1 : ${actualRrText}</span>
        <span id="liveHoldTime" style="margin-left: auto;">保有時間: ${holdText}</span>
    `;
}

// 海外時間を変換（プルダウンで指定された入力欄へ流す）
function runTimeConverter() {
    const timeStr = document.getElementById('foreignTimeInput').value.trim();
    const isSummer = document.getElementById('isSummerTime').checked;
    const targetField = document.getElementById('timeTargetSelect').value; // open or close
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(timeStr)) {
        alert("お時間は「7:41」のように半角コロンで区切って入力してくださいね。");
        return;
    }

    const [hours, minutes] = timeStr.split(':').map(Number);
    let jstHours = (hours + 6) % 24;
    const formattedTime = `${String(jstHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    if (targetField === 'open') {
        document.getElementById('tradeTime').value = formattedTime;
        
        // オープン時間入力時のみ、自動で市場判定を連動させますわ
        let market = "";
        let asiaStart = 8, asiaEnd = 16;
        let lonStart = isSummer ? 15 : 16;
        let lonEnd = isSummer ? 23 : 24;

        if (jstHours >= asiaStart && jstHours < asiaEnd) {
            market = "アジア";
        } else if (jstHours >= lonStart && jstHours < lonEnd) {
            market = "ロンドン";
        } else {
            if (isSummer) {
                if (jstHours >= 23 || jstHours < 6) market = "ニューヨーク";
            } else {
                if (jstHours >= 0 && jstHours < 7) market = "ニューヨーク";
            }
        }
        if(!market) market = "アジア"; 
        activateButtonInGroup('marketGroup', market);
    } else {
        document.getElementById('closeTime').value = formattedTime;
    }

    autoCalculateAllMetrics();
}

// データの新規保存・既存編集の保存処理
function saveTradeLog() {
    const date = document.getElementById('tradeDate').value;
    const time = document.getElementById('tradeTime').value.trim();
    const closeTime = document.getElementById('closeTime').value.trim();
    let pair = getSelectedVal('pairGroup');
    
    if (!date || !time || !pair) {
        alert("日にち、オープン時間、通貨ペアは必ず選んで入力してくださいね。");
        return;
    }

    if (pair === 'その他') {
        pair = document.getElementById('customPairInput').value.trim() || "その他";
    }

    const editingId = document.getElementById('editingId').value;
    const pips = document.getElementById('pipsInput').value;
    const pnl = document.getElementById('pnlInput').value;

    // 保有分数(分)の計算を確定させてデータに埋め込みます
    let holdMinutes = 0;
    const openMin = timeToMinutes(time);
    const closeMin = timeToMinutes(closeTime);
    if(openMin !== null && closeMin !== null) {
        holdMinutes = closeMin - openMin;
        if(holdMinutes < 0) holdMinutes += 1440;
    }

    const logData = {
        date,
        time,
        closeTime: closeTime || "-",
        holdMinutes, // 統計計算用の分数数値
        market: getSelectedVal('marketGroup') || "-",
        pair,
        monthly: getSelectedVal('monthlyGroup') || "-",
        weekly: getSelectedVal('weeklyGroup') || "-",
        daily: getSelectedVal('dailyGroup') || "-",
        bias: getSelectedVal('biasGroup') || "-",
        side: getSelectedVal('sideGroup') || "-",
        result: getSelectedVal('resultGroup') || "-",
        openPrice: document.getElementById('openPriceInput').value || "-",
        closePrice: document.getElementById('closePriceInput').value || "-",
        tpPrice: document.getElementById('tpPriceInput').value || "-",
        slPrice: document.getElementById('slPriceInput').value || "-",
        lot: document.getElementById('lotInput').value || "-",
        pips: pips !== "" ? parseFloat(pips) : 0,
        pnl: pnl !== "" ? parseFloat(pnl) : 0,
        emotion: getSelectedVal('emotionGroup') || "-",
        memo: document.getElementById('memoInput').value.trim() || "-",
        targetRr: currentCalculatedRr.targetRr,
        actualRr: currentCalculatedRr.actualRr
    };

    let trades = JSON.parse(localStorage.getItem('dark_trades')) || [];

    if (editingId) {
        trades = trades.map(t => {
            if (t.id === parseInt(editingId)) {
                return { ...t, ...logData };
            }
            return t;
        });
        alert("記録を更新いたしましたわ！");
    } else {
        logData.id = Date.now();
        trades.unshift(logData);
        alert("トレードを保存いたしましたわ！");
    }

    localStorage.setItem('dark_trades', JSON.stringify(trades));
    setFormToNewMode();
    refreshApp();
    switchTab('list');
}

// フォームを新規追加モード用に完全初期化
function setFormToNewMode() {
    document.getElementById('editingId').value = "";
    document.getElementById('formTitle').innerText = "📊 新規トレード記録";
    document.getElementById('submitBtn').innerText = "このトレードを保存する";

    document.getElementById('tradeTime').value = "";
    document.getElementById('closeTime').value = "";
    document.getElementById('foreignTimeInput').value = "";
    document.getElementById('openPriceInput').value = "";
    document.getElementById('closePriceInput').value = "";
    document.getElementById('tpPriceInput').value = "";
    document.getElementById('slPriceInput').value = "";
    document.getElementById('lotInput').value = "";
    document.getElementById('pipsInput').value = "";
    document.getElementById('pnlInput').value = "";
    document.getElementById('memoInput').value = "";
    document.getElementById('customPairInput').value = "";
    document.getElementById('customPairInput').style.display = "none";
    document.querySelectorAll('.select-btn').forEach(btn => btn.classList.remove('active'));
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tradeDate').value = today;
    updateDstDefault(); 

    currentCalculatedRr = { targetRr: "--", actualRr: "--" };
    document.getElementById('liveRrBox').innerHTML = `
        <span>想定 RR 1 : --</span>
        <span>実際 RR 1 : --</span>
        <span id="liveHoldTime" style="margin-left: auto;">保有時間: --</span>
    `;
}