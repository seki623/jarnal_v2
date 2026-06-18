// 統計データの集計・表示処理
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
        drawHourlyVChart([]); // 空グラフ
        return;
    }

    let wins = 0, loses = 0, draws = 0;
    let totalPnl = 0, totalPips = 0;
    let emotions = { 冷静: 0, 焦り: 0, 不安: 0, "-": 0 };
    let pairs = {};
    
    // 24時間別のエントリー数をカウントする配列（インデックス 0～23）
    let hourlyCounts = new Array(24).fill(0);

    trades.forEach(t => {
        if (t.result === '勝ち') wins++;
        else if (t.result === '負け') loses++;
        else if (t.result === '建値') draws++;

        totalPnl += t.pnl;
        totalPips += t.pips;

        if(emotions[t.emotion] !== undefined) emotions[t.emotion]++;

        // 通貨ペア成績＆保有時間の集計
        if(!pairs[t.pair]) {
            pairs[t.pair] = { total: 0, wins: 0, loses: 0, draws: 0, totalHoldMinutes: 0 };
        }
        pairs[t.pair].total++;
        if (t.result === '勝ち') pairs[t.pair].wins++;
        else if (t.result === '負け') pairs[t.pair].loses++;
        else if (t.result === '建値') pairs[t.pair].draws++;
        
        if (t.holdMinutes !== undefined) {
            pairs[t.pair].totalHoldMinutes += t.holdMinutes;
        }

        // オープン時間(JST)の時(Hour)を抽出してカウント
        if (t.time && t.time.includes(':')) {
            const hour = parseInt(t.time.split(':')[0]);
            if (!isNaN(hour) && hour >= 0 && hour < 24) {
                hourlyCounts[hour]++;
            }
        }
    });

    const winRate = ((wins / (wins + loses || 1)) * 100).toFixed(1);
    document.getElementById('statWinRate').innerText = `${winRate}%`;
    document.getElementById('statWLD').innerText = `${wins}勝 ${loses}敗 ${draws}分`;
    
    document.getElementById('statTotalPnl').innerText = `${totalPnl.toFixed(2)} USD`;
    document.getElementById('statTotalPnl').style.color = totalPnl >= 0 ? 'var(--color-win)' : 'var(--color-lose)';
    document.getElementById('statTotalPips').innerText = `${totalPips.toFixed(1)} pips`;
    document.getElementById('statTotalPips').style.color = totalPips >= 0 ? 'var(--color-win)' : 'var(--color-lose)';

    // 1. ポジションオープン時間の縦棒グラフを描画
    drawHourlyVChart(hourlyCounts);

    // 2. 感情比率の描画
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

    // 3. 通貨ペア別成績（平均保有時間（分））の描画
    const pairContainer = document.getElementById('pairStatList');
    pairContainer.innerHTML = "";
    for (let p in pairs) {
        const pData = pairs[p];
        const pRate = ((pData.wins / (pData.wins + pData.loses || 1)) * 100).toFixed(1);
        
        // 平均保有分数の計算
        const avgHold = pData.total > 0 ? Math.round(pData.totalHoldMinutes / pData.total) : 0;

        const item = document.createElement('div');
        item.className = 'stat-item';
        item.innerHTML = `
            <span style="font-weight:bold;">${p} <small style="color:var(--text-muted); font-weight:normal; margin-left:8px;">⏱️平均 ${avgHold} 分</small></span>
            <span>勝率 ${pRate}% <small style="color:var(--text-muted)">(${pData.wins}勝 ${pData.loses}敗 ${pData.draws}分)</small></span>
        `;
        pairContainer.appendChild(item);
    }
}

// 24時間の縦の棒グラフを動的に組み立てる関数
function drawHourlyVChart(hourlyCounts) {
    const container = document.getElementById('hourlyVChart');
    container.innerHTML = "";
    
    if (hourlyCounts.length === 0) {
        container.innerHTML = `<div style="position:absolute; width:100%; text-align:center; color:var(--text-muted); top:50%;">データがありません</div>`;
        return;
    }

    // 縦幅の比率を決めるため、カウントの最大値を見つけます
    const maxCount = Math.max(...hourlyCounts, 1);

    for (let h = 0; h < 24; h++) {
        const count = hourlyCounts[h];
        // 最大値を100%としたときの高さをパーセントで算出
        const barHeightPercent = (count / maxCount) * 100;

        const col = document.createElement('div');
        col.className = 'v-chart-column';

        // 柱と回数ラベルのラッパー
        const barWrapper = document.createElement('div');
        barWrapper.className = 'v-chart-bar-wrapper';

        const bar = document.createElement('div');
        bar.className = 'v-chart-bar';
        bar.style.height = count > 0 ? `${barHeightPercent}%` : '2px'; // 0回でも2pxの床線を見せる
        if (count === 0) bar.style.background = '#333'; // 0回は暗めのグレー

        // 0回より多いときだけ柱の上に数字を浮かせます
        if (count > 0) {
            const countLabel = document.createElement('span');
            countLabel.className = 'v-chart-count';
            countLabel.innerText = count;
            bar.appendChild(countLabel);
        }

        barWrapper.appendChild(bar);

        // 時間の軸ラベル (00, 01, ..., 23)
        const label = document.createElement('div');
        label.className = 'v-chart-label';
        label.innerText = String(h).padStart(2, '0');

        col.appendChild(barWrapper);
        col.appendChild(label);
        container.appendChild(col);
    }
}