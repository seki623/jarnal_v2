function switchTab(tabName) {
    document.querySelectorAll('.container').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`btn-tab-${tabName}`).classList.add('active');

    if(tabName === 'stats') {
        renderCharts(); // stats.jsで定義
    }
}