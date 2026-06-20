function isUSDaylightSavingTime(dateString) {
    if (!dateString) return false;
    const d = new Date(dateString + 'T00:00:00');
    if (isNaN(d.getTime())) return false;
    const year = d.getFullYear();
    let marchSecondSunday = new Date(year, 2, 8); 
    while (marchSecondSunday.getDay() !== 0) {
        marchSecondSunday.setDate(marchSecondSunday.getDate() + 1);
    }
    let novemberFirstSunday = new Date(year, 10, 1); 
    while (novemberFirstSunday.getDay() !== 0) {
        novemberFirstSunday.setDate(novemberFirstSunday.getDate() + 1);
    }
    const targetTime = d.getTime();
    return targetTime >= marchSecondSunday.getTime() && targetTime < novemberFirstSunday.getTime();
}

function updateDstDefault() {
    const editingId = document.getElementById('editingId').value;
    if (!editingId) {
        const dateVal = document.getElementById('tradeDate').value;
        document.getElementById('isSummerTime').checked = isUSDaylightSavingTime(dateVal);
    }
}

function setupButtonGroups() {
    document.querySelectorAll('.btn-group').forEach(group => {
        group.addEventListener('click', e => {
            if (e.target.classList.contains('select-btn')) {
                if (e.target.classList.contains('active')) {
                    e.target.classList.remove('active');
                } else {
                    group.querySelectorAll('.select-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                }
                
                if (e.target.getAttribute('data-type') === 'pair') {
                    const customInput = document.getElementById('customPairInput');
                    if (e.target.getAttribute('data-val') === 'その他' && e.target.classList.contains('active')) {
                        customInput.style.display = 'block';
                    } else {
                        customInput.style.display = 'none';
                    }
                }
                autoCalculateAllMetrics();
            }
        });
    });
}

function activateButtonInGroup(groupId, value) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('.select-btn').forEach(btn => {
        if(value && btn.getAttribute('data-val') === value) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function getSelectedVal(groupId) {
    const activeBtn = document.querySelector(`#${groupId} .select-btn.active`);
    return activeBtn ? activeBtn.getAttribute('data-val') : "";
}

function autoCalculateAllMetrics() {
    const openVal = document.getElementById('openPriceInput').value;
    const closeVal = document.getElementById('closePriceInput').value;
    const tpVal = document.getElementById('tpPriceInput').value;
    const slVal = document.getElementById('slPriceInput').value;
    const lotVal = document.getElementById('lotInput').value;
    
    const result = getSelectedVal('resultGroup');
    const side = getSelectedVal('sideGroup');

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

    let targetRrText = "--";
    let actualRrText = "--";

    if (openVal !== "" && slVal !== "") {
        const openP = parseFloat(openVal);
        const slP = parseFloat(slVal);
        let riskWidth = (side === "Short") ? (slP - openP) : (openP - slP);

        if (riskWidth !== 0) {
            if (tpVal !== "") {
                const tpP = parseFloat(tpVal);
                let targetRewardWidth = (side === "Short") ? (openP - tpP) : (tpP - openP);
                targetRrText = (targetRewardWidth / riskWidth).toFixed(2);
            }
            if (closeVal !== "") {
                const closeP = parseFloat(closeVal);
                let actualRewardWidth = (side === "Short") ? (openP - closeP) : (closeP - openP);
                actualRrText = (actualRewardWidth / riskWidth).toFixed(2);
            }
        }
    }

    currentCalculatedRr = { targetRr: targetRrText, actualRr: actualRrText };
    document.getElementById('liveRrBox').innerHTML = `
        <span>想定 RR 1 : ${targetRrText}</span>
        <span>実際 RR 1 : ${actualRrText}</span>
    `;
}

function runTimeConverter() {
    const timeStr = document.getElementById('foreignTimeInput').value.trim();
    const isSummer = document.getElementById('isSummerTime').checked;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    
    if (!timeRegex.test(timeStr)) {
        alert("お時間は「7:41」のように半角コロンで区切って入力してくださいね。");
        return;
    }

    const [hours, minutes] = timeStr.split(':').map(Number);
    let jstHours = (hours + 6) % 24;
    const formattedTime = `${String(jstHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    document.getElementById('tradeTime').value = formattedTime;

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
}

function saveTradeLog() {
    const date = document.getElementById('tradeDate').value;
    const time = document.getElementById('tradeTime').value.trim();
    let pair = getSelectedVal('pairGroup');
    
    if (!date || !time || !pair) {
        alert("日にち、時間、通貨ペアは必ず選んで入力してくださいね。");
        return;
    }

    if (pair === 'その他') {
        pair = document.getElementById('customPairInput').value.trim() || "その他";
    }

    const editingId = document.getElementById('editingId').value;
    const pips = document.getElementById('pipsInput').value;
    const pnl = document.getElementById('pnlInput').value;

    const logData = {
        date, time,
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
        trades = trades.map(t => (t.id === parseInt(editingId) ? { ...t, ...logData } : t));
        alert("記録を更新いたしましたわ！");
    } else {
        logData.id = Date.now();
        trades.unshift(logData);
        alert("トレードを保存いたしましたわ！");
    }

    localStorage.setItem('dark_trades', JSON.stringify(trades));
    setFormToNewMode();
    if (typeof refreshApp === "function") refreshApp();
    switchTab('list');
}

function setFormToNewMode() {
    document.getElementById('editingId').value = "";
    document.getElementById('formTitle').innerText = "📊 新規トレード記録";
    document.getElementById('submitBtn').innerText = "このトレードを保存する";

    document.getElementById('tradeTime').value = "";
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
    document.getElementById('liveRrBox').innerHTML = `<span>想定 RR 1 : --</span><span>実際 RR 1 : --</span>`;
}