function calculateStatistics(trades) {
    const total = trades.length;
    document.getElementById('statTotalTrades').innerText = total;

    if(total === 0) {
        document.getElementById('statWinRate').innerText = "0%";
        document.getElementById('statWLD').innerText = "0勝 0敗 0分";
        document.getElementById('statTotalPnl').innerText = "0 USD";
        document.getElementById('statTotalPips').innerText = "0 pips";
        document.getElementById('emotionStatList').innerHTML = "データがありません";
        document.getElementById('pairStatList').innerHTML = "データがありません";
        return;
    }

    let wins = 0, loses = 0, draws = 0;
    let totalPnl = 0, totalPips = 0;
    let emotions = { 冷静: 0, 焦り: 0, 不安: 0, "-": 0 };
    let pairs = {};

    trades.forEach(t => {
        if (t.result === '勝ち') wins++;
        else if (t.result === '負け') loses++;
        else if (t.result === '建値') draws++;

        totalPnl += t.pnl;
        totalPips += t.pips;

        if(emotions[t.emotion] !== undefined) emotions[t.emotion]++;

        if(!pairs[t.pair]) {
            pairs[t.pair] = { total: 0, wins: 0, loses: 0, draws: 0 };
        }
        pairs[t.pair].total++;
        if (t.result === '勝ち') pairs[t.pair].wins++;
        else if (t.result === '負け') pairs[t.pair].loses++;
        else if (t.result === '建値') pairs[t.pair].draws++;
    });

    const winRate = ((wins / (wins + loses || 1)) * 100).toFixed(1);
    document.getElementById('statWinRate').innerText = `${winRate}%`;
    document.getElementById('statWLD').innerText = `${wins}勝 ${loses}敗 ${draws}分`;
    
    document.getElementById('statTotalPnl').innerText = `${totalPnl.toFixed(2)} USD`;
    document.getElementById('statTotalPnl').style.color = totalPnl >= 0 ? 'var(--color-win)' : 'var(--color-lose)';
    document.getElementById('statTotalPips').innerText = `${totalPips.toFixed(1)} pips`;
    document.getElementById('statTotalPips').style.color = totalPips >= 0 ? 'var(--color-win)' : 'var(--color-lose)';

    const emotionContainer = document.getElementById('emotionStatList');
    emotionContainer.innerHTML = "";
    let validEmotionTotal = total - emotions["-"];
    for (let key in emotions) {
        if(key === "-") continue;
        const count = emotions[key];
        const rate = validEmotionTotal > 0 ? ((count / validEmotionTotal) * 100).toFixed(1) : "0.0";
        const item = document.createElement('div');
        item.className = 'stat-item';
        item.innerHTML = `<span>${key}</span><span>${rate}% (${count}回)</span>`;
        emotionContainer.appendChild(item);
    }

    const pairContainer = document.getElementById('pairStatList');
    pairContainer.innerHTML = "";
    for (let p in pairs) {
        const pData = pairs[p];
        const pRate = ((pData.wins / (pData.wins + pData.loses || 1)) * 100).toFixed(1);
        const item = document.createElement('div');
        item.className = 'stat-item';
        item.innerHTML = `
            <span style="font-weight:bold;">${p}</span>
            <span>勝率 ${pRate}% <small style="color:var(--text-muted)">(${pData.wins}勝 ${pData.loses}敗 ${pData.draws}分)</small></span>
        `;
        pairContainer.appendChild(item);
    }
}