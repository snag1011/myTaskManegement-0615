// app.js
document.addEventListener('DOMContentLoaded', () => {
    // =======================================================
    // ===== 1. Firebaseの初期設定と認証 ======================
    // =======================================================

    // Firebase SDKのインポート
    //import { initializeApp } from "firebase/app";
   // import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
   // import { getFirestore } from "firebase/firestore"; // Firestoreを使用する場合
   // import { getAnalytics } from "firebase/analytics";

    // Firebase設定
   // const firebaseConfig = {
   //     apiKey: "AIzaSyD2wKyop5H1UPxbK0VULfpUNAJ5tu4Ia88",
   //     authDomain: "my-private-task-manegment.firebaseapp.com",
   //     projectId: "my-private-task-manegment",
   //     storageBucket: "my-private-task-manegment.firebasestorage.app",
   //     messagingSenderId: "272952129117",
   //     appId: "1:272952129117:web:e5ec8adbb79ed76291ffb4",
   //     measurementId: "G-NRTVNKPLF6"
   // };

//

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdMv_zeq5WdA3l2JsEPe3uQLFG_4Jp4To",
  authDomain: "my-task-manegment.firebaseapp.com",
  projectId: "my-task-manegment",
  storageBucket: "my-task-manegment.firebasestorage.app",
  messagingSenderId: "1081004250364",
  appId: "1:1081004250364:web:fe78d16366ddbe953f3379"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
    
//

    
    // Firebase初期化
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    const db = getFirestore(app); // Firestoreインスタンス

    // 認証関連のDOM要素
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const userPhoto = document.getElementById('user-photo');
    const mainContent = document.getElementById('main-content');

    // ログイン処理
    const signIn = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Googleログインに失敗しました:", error);
            let errorMessage = "ログインに失敗しました。";
            if (error.code === "auth/popup-closed-by-user") {
                errorMessage = "ログインウィンドウが閉じられました。";
            } else if (error.code === "auth/network-request-failed") {
                errorMessage = "ネットワークエラーが発生しました。";
            }
            alert(errorMessage);
        }
    };

    // ログアウト処理
    const signOutUser = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("ログアウトに失敗しました:", error);
            alert("ログアウトに失敗しました。");
        }
    };

    loginBtn.addEventListener('click', signIn);
    logoutBtn.addEventListener('click', signOutUser);

    // 認証状態の監視
    onAuthStateChanged(auth, user => {
        if (user) {
            userName.textContent = user.displayName;
            userPhoto.src = user.photoURL;
            userInfo.style.display = 'flex';
            logoutBtn.style.display = 'block';
            loginBtn.style.display = 'none';
            mainContent.style.display = 'block';
            // Firestoreデータ読み込み例: loadDataForUser(user.uid);
        } else {
            userInfo.style.display = 'none';
            logoutBtn.style.display = 'none';
            loginBtn.style.display = 'block';
            mainContent.style.display = 'none';
            document.querySelectorAll('.task-list').forEach(list => list.innerHTML = '');
            document.getElementById('daily-goal').value = '';
            document.getElementById('daily-journal').value = '';
            resetExecutionPanel();
        }
    });

    // =======================================================
    // ===== 2. タスク管理・タイマー機能 =======================
    // =======================================================

    // 要素の取得
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
    const resultList = document.getElementById('result-list'); // 変数名を英語に変更
    const exportPlanBtn = document.getElementById('export-plan-btn');
    const exportResultBtn = document.getElementById('export-result-btn'); // 変数名を英語に変更

    const currentTaskDisplay = document.getElementById('current-task-display');
    const timerClock = document.getElementById('timer-clock');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const completeBtn = document.getElementById('complete-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    const notificationSound = document.getElementById('notification-sound');
    const timesUpModal = document.getElementById('times-up-modal');
    const modalTaskName = document.getElementById('modal-task-name');
    const modalCompleteBtn = document.getElementById('modal-complete-btn');
    const modalExtendBtn = document.getElementById('modal-extend-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // 通知許可ボタン
    const notificationBtn = document.getElementById('notification-btn');
    notificationBtn.addEventListener('click', () => {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                alert('デスクトップ通知が許可されました。');
            } else {
                alert('デスクトップ通知が拒否されました。');
            }
        });
    });

    // アプリの状態を管理する変数
    let currentSelectedTask = null;
    let timerInterval = null;
    let timerSeconds = 0;
    let plannedSeconds = 0;
    let startTime = 0;
    let pauseTime = 0;
    let wasExtended = false;
    let originalTitle = document.title;

    // イベントリスナー（タスク管理）
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
        if (confirm('この日のすべてのデータをリセットしますか？（この操作は元に戻せません）')) {
            document.querySelectorAll('.task-list').forEach(list => list.innerHTML = '');
            document.getElementById('daily-goal').value = '';
            document.getElementById('daily-journal').value = '';
            resetExecutionPanel();
            alert('UI上のデータをリセットしました。');
        }
    });
    saveDailyBtn.addEventListener('click', () => {
        saveConfirmMsg.textContent = '保存しました！';
        saveConfirmMsg.classList.add('show');
        setTimeout(() => saveConfirmMsg.classList.remove('show'), 2000);
        // Firestore保存処理例: saveDailyData();
    });
    exportPlanBtn.addEventListener('click', exportPlanToCsv);
    exportResultBtn.addEventListener('click', exportResultToCsv); // 変数名変更
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    completeBtn.addEventListener('click', () => completeTask('完了'));
    cancelBtn.addEventListener('click', () => completeTask('中止'));
    modalCompleteBtn.addEventListener('click', () => completeTask('完了'));
    modalExtendBtn.addEventListener('click', extendTimer);
    modalCancelBtn.addEventListener('click', () => completeTask('中止'));
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', e => e.preventDefault());
        zone.addEventListener('dragenter', e => {
            if (e.target.closest('.drop-zone')) e.target.closest('.drop-zone').classList.add('drag-over');
        });
        zone.addEventListener('dragleave', e => {
            if (e.target.closest('.drop-zone')) e.target.closest('.drop-zone').classList.remove('drag-over');
        });
        zone.addEventListener('drop', handleDrop);
    });

    // 関数定義（タスク管理）
    function createTaskElement(name, durationInSeconds, listElement, priority) {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.draggable = true;
        li.dataset.name = name;
        li.dataset.duration = durationInSeconds;
        li.dataset.priority = priority;

        li.innerHTML = `<span class="task-name">${name}</span><span class="task-duration">${durationInSeconds}秒</span><button class="delete-btn" title="削除">×</button>`;
        li.addEventListener('click', () => selectTask(li));
        li.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(li);
        });
        li.addEventListener('dragstart', e => {
            if (timerInterval) {
                alert('タイマー実行中のタスクは移動できません。');
                e.preventDefault();
                return;
            }
            e.target.id = `task-${Date.now()}`;
            e.dataTransfer.setData('text/plain', e.target.id);
            e.target.classList.add('dragging');
        });
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
        if (timerInterval) {
            alert('他のタスクを実行中です。');
            return;
        }
        if (currentSelectedTask) currentSelectedTask.classList.remove('selected');
        currentSelectedTask = taskElement;
        currentSelectedTask.classList.add('selected');

        const durationInSeconds = parseInt(currentSelectedTask.dataset.duration, 10);
        currentTaskDisplay.innerHTML = `<strong>${currentSelectedTask.dataset.name}</strong>（予定: ${durationInSeconds}秒）`;

        plannedSeconds = durationInSeconds;
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
        if (Notification.permission === 'granted') {
            new Notification(`タスク「${currentSelectedTask.dataset.name}」の予定時間です！`);
        }
        timerClock.classList.add('timer-flash');
        document.title = "⏰ 時間です！";
        modalTaskName.textContent = `タスク「${currentSelectedTask.dataset.name}」の予定時間です。どうしますか？`;
        timesUpModal.style.display = 'flex';
    }

    function extendTimer() {
        const extraSeconds = parseInt(prompt("何秒延長しますか？", "600"), 10);
        if (!isNaN(extraSeconds) && extraSeconds > 0) {
            plannedSeconds += extraSeconds;
            wasExtended = true;
            hideModal();
            startTimer();
        }
    }

    function completeTask(status) {
        if (!currentSelectedTask) return;
        pauseTimer();

        const actualSeconds = timerSeconds;
        const plannedSecondsValue = parseInt(currentSelectedTask.dataset.duration, 10);
        const diffSeconds = plannedSecondsValue - actualSeconds;

        let finalStatus;
        if (status === '中止') { finalStatus = { text: '中止', class: 'status-canceled' }; }
        else if (wasExtended) { finalStatus = { text: '延長', class: 'status-extended' }; } // 修正済み
        else if (diffSeconds > 0) { finalStatus = { text: '短縮', class: 'status-shortened' }; } // 修正済み
        else { finalStatus = { text: '計画通り', class: 'status-ontime' }; }

        addResultToList(currentSelectedTask.dataset, actualSeconds, diffSeconds, finalStatus);

        currentSelectedTask.remove();
        resetExecutionPanel();
    }

    function addResultToList(data, actualSeconds, diffSeconds, status) {
        const li = document.createElement('li');
        li.className = 'result-item';
        li.dataset.priority = data.priority;
        li.dataset.name = data.name;
        li.dataset.status = status.text;
        li.dataset.planned = data.duration;
        li.dataset.actual = actualSeconds;
        li.dataset.diff = diffSeconds;

        const priorityMap = {
            '緊急＆重要': '#f5222d',
            '重要＆非緊急': '#1890ff',
            '緊急＆非重要': '#faad14',
            '非緊急 & 非重要': '#bfbfbf',
            '計画': '#595959'
        };
        const priorityColor = priorityMap[data.priority] || '#595959';

        li.innerHTML = `
            <span class="result-priority" style="background-color:${priorityColor}">${data.priority}</span>
            <span class="result-name">${data.name}</span>
            <span class="result-status ${status.class}">${status.text}</span>
            <span class="result-times">計画: ${data.duration}秒 / 実績: ${actualSeconds}秒</span>
            <span class="result-diff">時間差: ${diffSeconds >= 0 ? '+' : ''}${diffSeconds}秒</span>
        `;
        resultList.appendChild(li); // 変数名変更
    }

    function exportPlanToCsv() {
        const tasks = document.querySelectorAll('#plan-list .task-item, .priority-grid .task-item');
        if (tasks.length === 0) {
            alert('出力する計画タスクがありません。');
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "優先度,タスク名,予定時間(秒)\r\n";
        tasks.forEach(task => {
            const priority = task.dataset.priority;
            const name = task.dataset.name.replace(/"/g, '""');
            const duration = task.dataset.duration;
            csvContent += `"${priority}","${name}","${duration}"\r\n`;
        });
        downloadCsv(csvContent, '計画');
    }

    async function saveDailyData() {
    const user = auth.currentUser;
    if (!user) return;
    const dailyData = {
        goal: document.getElementById('daily-goal').value,
        journal: document.getElementById('daily-journal').value,
        timestamp: new Date()
    };
    try {
        await setDoc(doc(db, 'users', user.uid, 'daily', new Date().toISOString().split('T')[0]), dailyData);
        console.log('データ保存成功');
    } catch (error) {
        console.error('データ保存失敗:', error);
        alert('データの保存に失敗しました。');
    }
}

    function exportResultToCsv() { // 関数名変更
        const results = document.querySelectorAll('#result-list .result-item'); // セレクタ変更
        if (results.length === 0) {
            alert('出力する実績がありません。');
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "優先度,タスク名,ステータス,計画時間(秒),実績時間(秒),時間差(秒)\r\n";
        results.forEach(result => {
            const priority = result.dataset.priority;
            const name = result.dataset.name.replace(/"/g, '""');
            const status = result.dataset.status;
            const planned = result.dataset.planned;
            const actual = result.dataset.actual;
            const diff = result.dataset.diff;
            csvContent += `"${priority}","${name}","${status}","${planned}","${actual}","${diff}"\r\n`;
        });
        downloadCsv(csvContent, '実績');
    }

    function downloadCsv(content, prefix) {
        const encodedUri = encodeURI(content);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const fileName = `${prefix}_${new Date().toISOString().split('T')[0]}.csv`;
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
        timerClock.classList.remove('timer-flash'); // アニメーションリセット
        document.title = originalTitle; // タイトルリセット
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
        const draggedItem = document.getElementById(draggedId);

        if (dropZone && draggedItem) {
            const priorityBox = dropZone.closest('.priority-box');
            let newPriority = '計画';
            if (priorityBox) {
                newPriority = priorityBox.querySelector('h3').textContent.trim();
            }
            draggedItem.dataset.priority = newPriority;

            const targetList = dropZone.querySelector('.task-list') || dropZone;
            if (targetList !== draggedItem.parentElement) { // 同一リスト内移動を防止
                targetList.appendChild(draggedItem);
            }
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

    console.log('業務管理アプリが初期化されました。Ver.6.2 (Fixed Firebase, Notifications, and Drag-Drop)');
});
