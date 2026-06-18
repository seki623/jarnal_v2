function renderCharts() {
    const trades = JSON.parse(localStorage.getItem('dark_trades')) || [];
    const pair = document.getElementById('pairSelector').value;
    const filtered = pair === '全て' ? trades : trades.filter(t => t.pair === pair);

    // 時間帯別集計 (1時間ごと)
    const hourlyData = new Array(24).fill(0);
    filtered.forEach(t => {
        const h = parseInt(t.openTime.split(':')[0]);
        if (!isNaN(h)) hourlyData[h]++;
    });

    const ctx = document.getElementById('timeChart').getContext('2d');
    if (window.timeChart) window.timeChart.destroy();
    
    window.timeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 24}, (_, i) => i + ':00'),
            datasets: [{ label: 'エントリー回数', data: hourlyData, backgroundColor: '#3182ce' }]
        }
    });
}

// 保有時間計算（d/h/m）
function getHoldTimeDisplay(t) {
    const start = new Date(`${t.openDate}T${t.openTime}`);
    const end = new Date(`${t.closeDate}T${t.closeTime}`);
    const diff = end - start;
    if (diff < 0) return "エラー";
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${d}d ${h}h ${m}m`;
}