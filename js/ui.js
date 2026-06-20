// グローバル変数
let currentCalculatedRr = { targetRr: "--", actualRr: "--" };

window.onload = function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tradeDate').value = today;
    
    // 他のファイルにある初期化関数を呼び出し
    if (typeof updateDstDefault === "function") updateDstDefault(); 
    if (typeof setupButtonGroups === "function") setupButtonGroups();
    if (typeof refreshApp === "function") refreshApp();
};

// タブメニューの切り替え
function switchTab(tabName) {
    // すべての画面を確実に非表示にする
    document.querySelectorAll('.container').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    // 選んだ画面だけを確実にアクティブ化する
    const targetTab = document.getElementById(`tab-${tabName}`);
    const targetBtn = document.getElementById(`btn-tab-${tabName}`);
    
    if (targetTab && targetBtn) {
        targetTab.classList.add('active');
        targetBtn.classList.add('active');
    }

    if((tabName === 'list' || tabName === 'stats') && typeof refreshApp === "function") {
        refreshApp();
    }
}

function clearFormAndGoToRecord() {
    if (typeof setFormToNewMode === "function") setFormToNewMode();
    switchTab('record');
}