document.addEventListener('DOMContentLoaded', () => {
    // ===== 要素の取得 =====
    const planTaskInput = document.getElementById('plan-task-input');
    const planDurationInput = document.getElementById('plan-duration-input');
    const addPlanForm = document.getElementById('add-plan-form');
    const planList = document.getElementById('plan-list');
    const urgentTaskInput = document.getElementById('urgent-task-input');
    const urgentDurationInput = document.getElementById('urgent-duration-input');
    const addUrgentForm = document.getElementById('add-urgent-form');
    const boxAList = document.getElementById('box-a-list');
    const deleteDayDataBtn = document.getElementById('delete-day-data-btn');
    const dropZones = document.querySelectorAll('.drop-zone');
    const saveDailyBtn = document.getElementById('save-daily-btn');
    const saveConfirmMsg = document.getElementById('save-confirm-msg');
    const 実績List = document.getElementById('実績-list');
    // CSV出力ボタン
    const exportPlanBtn = document.getElementById('export-plan-btn');
    const export実績Btn = document.getElementById('export-実績-btn');
    
    // 実行パネル
    const currentTaskDisplay = document.getElementById('current-task-display');
    const timerClock = document.getElementById('timer-clock');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const completeBtn = document.getElementById('complete-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    // 通知関連
    const notificationSound = document.getElementById('notification-sound');
    const timesUpModal = document.getElementById('times-up-modal');
    const modalTaskName = document.getElementById('modal-task-name');
    const modalCompleteBtn = document.getElementById('modal-complete-btn');
    const modalExtendBtn = document.getElementById('modal-extend-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // ===== アプリの状態を管理する変数 =====
    let currentSelectedTask = null;
    let timerInterval = null;
    let timerSeconds = 0;
    let plannedSeconds = 0; // 計画時間(秒)
    let startTime = 0;      // タイマー開始時刻(ミリ秒)
    let pauseTime = 0;      // 一時停止した時点での経過時間
    let wasExtended = false;
    let originalTitle = document.title;
    
    // =======================================================
    // ===== イベントリスナー =====
    // =======================================================

    addPlanForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateInput(planTaskInput)) {
            createTaskElement(planTaskInput.value.trim(), planDurationInput.value, planList, '計画');
            planTaskInput.value = '';
            planTaskInput.focus();
        }
    });

    addUrgentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateInput(urgentTaskInput)) {
            createTaskElement(urgentTaskInput.value.trim(), urgentDurationInput.value, boxAList, '緊急＆重要');
            urgentTaskInput.value = '';
        }
    });

    deleteDayDataBtn.addEventListener('click', () => {
        if (confirm('この日のすべてのデータをリセットしますか？')) {
            document.querySelectorAll('.task-list').forEach(list => list.innerHTML = '');
            document.getElementById('daily-goal').value = '';
            document.getElementById('daily-journal').value = '';
            resetExecutionPanel();
            alert('データをリセットしました。');
        }
    });
    
    saveDailyBtn.addEventListener('click', () => {
        saveConfirmMsg.textContent = '保存しました！';
        saveConfirmMsg.classList.add('show');
        setTimeout(() => saveConfirmMsg.classList.remove('show'), 2000);
    });
    
    // ★★★ CSV出力ボタンのイベントリスナーを追加 ★★★
    exportPlanBtn.addEventListener('click', exportPlanToCsv);
    export実績Btn.addEventListener('click', export実績ToCsv);

    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    completeBtn.addEventListener('click', () => completeTask('完了'));
    cancelBtn.addEventListener('click', () => completeTask('中止'));

    modalCompleteBtn.addEventListener('click', () => completeTask('完了'));
    modalExtendBtn.addEventListener('click', extendTimer);
    modalCancelBtn.addEventListener('click', () => completeTask('中止'));

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', e => e.preventDefault());
        zone.addEventListener('dragenter', e => { if (e.target.closest('.drop-zone')) e.target.closest('.drop-zone').classList.add('drag-over'); });
        zone.addEventListener('dragleave', e => { if (e.target.closest('.drop-zone')) e.target.closest('.drop-zone').classList.remove('drag-over'); });
        zone.addEventListener('drop', handleDrop);
    });

    // =======================================================
    // ===== 関数定義 =====
    // =======================================================
    
    function createTaskElement(name, duration, listElement, priority) {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.draggable = true;
        li.dataset.name = name;
        li.dataset.duration = duration;
        li.dataset.priority = priority;

        li.innerHTML = `<span class="task-name">${name}</span><span class="task-duration">${duration}分</span><button class="delete-btn" title="削除">×</button>`;
        li.addEventListener('click', () => selectTask(li));
        li.querySelector('.delete-btn').addEventListener('click', (e) => { e.stopPropagation(); deleteTask(li); });
        li.addEventListener('dragstart', e => { if (!timerInterval) { e.dataTransfer.setData('text/plain', e.target.id); e.target.classList.add('dragging'); } else { e.preventDefault(); } });
        li.addEventListener('dragend', e => e.target.classList.remove('dragging'));
        listElement.appendChild(li);
    }
    
    function deleteTask(taskElement) {
        if (confirm(`タスク「${taskElement.dataset.name}」を削除しますか？`)) {
            if (taskElement === currentSelectedTask) resetExecutionPanel();
            taskElement.remove();
        }
    }
    
    function selectTask(taskElement) {
        if (timerInterval) { alert('他のタスクを実行中です。'); return; }
        if (currentSelectedTask) currentSelectedTask.classList.remove('selected');
        currentSelectedTask = taskElement;
        currentSelectedTask.classList.add('selected');
        currentTaskDisplay.innerHTML = `<strong>${currentSelectedTask.dataset.name}</strong>（予定: ${currentSelectedTask.dataset.duration}分）`;
        
        plannedSeconds = parseInt(currentSelectedTask.dataset.duration, 10) * 60;
        wasExtended = false;
        resetTimer();
        updateExecutionButtons(true, false);
    }
    
    function startTimer() {
        if (!currentSelectedTask) return;
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
        updateExecutionButtons(false, true);
    }
    
    function pauseTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        pauseTime = timerSeconds;
        updateExecutionButtons(true, false);
    }
    
    function updateTimer() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerSeconds = pauseTime + elapsed;
        
        const h = Math.floor(timerSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((timerSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (timerSeconds % 60).toString().padStart(2, '0');
        timerClock.textContent = `${h}:${m}:${s}`;
        
        if (plannedSeconds > 0 && timerSeconds >= plannedSeconds && !timesUpModal.style.display.includes('flex')) {
            handleTimesUp();
        }
    }
    
    function handleTimesUp() {
        pauseTimer();
        notificationSound.play();
        timerClock.classList.add('timer-flash');
        document.title = "⏰ 時間です！";
        modalTaskName.textContent = `タスク「${currentSelectedTask.dataset.name}」の予定時間です。どうしますか？`;
        timesUpModal.style.display = 'flex';
    }
    
    function extendTimer() {
        const extraMinutes = parseInt(prompt("何分延長しますか？", "10"), 10);
        if (!isNaN(extraMinutes) && extraMinutes > 0) {
            plannedSeconds += extraMinutes * 60;
            wasExtended = true;
            hideModal();
            startTimer();
        }
    }
    
    function completeTask(status) {
        if (!currentSelectedTask) return;
        
        pauseTimer();
        const actualMinutes = Math.round(timerSeconds / 60);
        const plannedMinutes = parseInt(currentSelectedTask.dataset.duration, 10);
        const diff = plannedMinutes - actualMinutes;
        
        let finalStatus;
        if (status === '中止') {
            finalStatus = { text: '中止', class: 'status-canceled' };
        } else if (wasExtended) {
            finalStatus = { text: '延長', class: 'status-extended' };
        } else if (diff > 0) {
            finalStatus = { text: '短縮', class: 'status-shortened' };
        } else {
            finalStatus = { text: '計画通り', class: 'status-ontime' };
        }
        
        addResultToList(currentSelectedTask.dataset, actualMinutes, diff, finalStatus);
        
        currentSelectedTask.remove();
        resetExecutionPanel();
    }
    
    function addResultToList(data, actualMinutes, diff, status) {
        const li = document.createElement('li');
        li.className = 'result-item';
        // CSV出力用に実績データをdata属性に保存
        li.dataset.priority = data.priority;
        li.dataset.name = data.name;
        li.dataset.status = status.text;
        li.dataset.planned = data.duration;
        li.dataset.actual = actualMinutes;
        li.dataset.diff = diff;
        
        const priorityMap = { '緊急＆重要': '#f5222d', '重要＆非緊急': '#1890ff', '緊急＆非重要': '#faad14', '非緊急 & 非重要': '#bfbfbf', '計画': '#595959' };
        const priorityColor = priorityMap[data.priority] || '#595959';
        
        li.innerHTML = `
            <span class="result-priority" style="background-color:${priorityColor}">${data.priority}</span>
            <span class="result-name">${data.name}</span>
            <span class="result-status ${status.class}">${status.text}</span>
            <span class="result-times">計画: ${data.duration}分 / 実績: ${actualMinutes}分</span>
            <span class="result-diff">時間差: ${diff >= 0 ? '+' : ''}${diff}分</span>
        `;
        実績List.appendChild(li);
    }
    
    // ★★★ 計画CSV出力の関数 ★★★
    function exportPlanToCsv() {
        const tasks = document.querySelectorAll('#plan-list .task-item, .priority-grid .task-item');
        if (tasks.length === 0) {
            alert('出力する計画タスクがありません。');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM付きUTF-8
        csvContent += "優先度,タスク名,予定時間(分)\r\n";

        tasks.forEach(task => {
            const priority = task.dataset.priority;
            const name = task.dataset.name.replace(/"/g, '""'); // ダブルクォートのエスケープ
            const duration = task.dataset.duration;
            csvContent += `"${priority}","${name}","${duration}"\r\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const fileName = `計画_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ★★★ 実績CSV出力の関数 ★★★
    function export実績ToCsv() {
        const results = document.querySelectorAll('#実績-list .result-item');
        if (results.length === 0) {
            alert('出力する実績がありません。');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM付きUTF-8
        csvContent += "優先度,タスク名,ステータス,計画時間(分),実績時間(分),時間差(分)\r\n";

        results.forEach(result => {
            const priority = result.dataset.priority;
            const name = result.dataset.name.replace(/"/g, '""');
            const status = result.dataset.status;
            const planned = result.dataset.planned;
            const actual = result.dataset.actual;
            const diff = result.dataset.diff;
            csvContent += `"${priority}","${name}","${status}","${planned}","${actual}","${diff}"\r\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const fileName = `実績_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    function resetExecutionPanel() {
        if (currentSelectedTask) currentSelectedTask.classList.remove('selected');
        currentSelectedTask = null;
        currentTaskDisplay.innerHTML = `<p>実行するタスクをクリックで選択</p>`;
        resetTimer();
        updateExecutionButtons(false, false);
        hideModal();
    }

    function resetTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        timerSeconds = 0;
        pauseTime = 0;
        timerClock.textContent = '00:00:00';
    }

    function updateExecutionButtons(canStart, canPause) {
        startBtn.disabled = !canStart;
        pauseBtn.disabled = !canPause;
        completeBtn.disabled = !(canStart || canPause);
        cancelBtn.disabled = !(canStart || canPause);
    }
    
    function hideModal() {
        timesUpModal.style.display = 'none';
        timerClock.classList.remove('timer-flash');
        document.title = originalTitle;
    }
    
    function handleDrop(e) {
        e.preventDefault();
        const dropZone = e.target.closest('.drop-zone');
        const draggedId = e.dataTransfer.getData('text/plain');
        const draggedItem = document.getElementById(draggedId) || document.querySelector('.dragging');

        if (dropZone && draggedItem) {
            const priorityBox = draggedItem.closest('.priority-box');
            if (priorityBox) {
                // ドロップ先の優先度を取得
                const newPriority = dropZone.querySelector('h3').textContent.trim();
                draggedItem.dataset.priority = newPriority;
            } else if (dropZone.id === 'plan-list') {
                draggedItem.dataset.priority = '計画';
            }
            
            const targetList = dropZone.querySelector('.task-list') || dropZone;
            targetList.appendChild(draggedItem);
            dropZone.classList.remove('drag-over');
        }
    }
    
    function validateInput(input) {
        input.classList.remove('input-error');
        if (input.value.trim() === '') {
            input.classList.add('input-error');
            input.placeholder = "タスク名を入力してください";
            return false;
        }
        return true;
    }

    console.log('業務管理アプリが初期化されました。Ver.5.1 (CSV Export Fixed)');
});
