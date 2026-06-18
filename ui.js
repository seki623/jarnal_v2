// 想定RR・実際RRを一時保管する共有オブジェクト
let currentCalculatedRr = { targetRr: "--", actualRr: "--" };

window.onload = function() {
    // 起動時に当日の日付をセット
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tradeDate').value = today;
    
    updateDstDefault(); 
    setupButtonGroups();
    refreshApp();
};

// タブの切り替え制御
function switchTab(tabName) {
    document.querySelectorAll('.container').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`btn-tab-${tabName}`).classList.add('active');

    if(tabName === 'list' || tabName === 'stats') {
        refreshApp();
    }
}

// 共通ボタングループのトグルイベント設定
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

// ボタングループ内の指定値をアクティブにする（編集時用）
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

// 選択されているボタンの値を格納
function getSelectedVal(groupId) {
    const activeBtn = document.querySelector(`#${groupId} .select-btn.active`);
    return activeBtn ? activeBtn.getAttribute('data-val') : "";
}

// 新規記録へ戻るボタン用
function clearFormAndGoToRecord() {
    setFormToNewMode();
    switchTab('record');
}