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
  
  // 実行パネルの要素
  const currentTaskDisplay = document.getElementById('current-task-display');
  const timerClock = document.getElementById('timer-clock');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const completeBtn = document.getElementById('complete-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const実績List = document.getElementById('実績-list');

  // ===== アプリの状態を管理する変数 =====
  let currentSelectedTask = null; // 現在選択中のタスク要素(li)
  let timerInterval = null;       // setIntervalのID
  let timerSeconds = 0;           // タイマーの秒数

  // =======================================================
  // ===== イベントリスナーの設定 =====
  // =======================================================

  // 計画タスク追加フォーム
  addPlanForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateInput(planTaskInput)) {
      createTaskElement(planTaskInput.value.trim(), planDurationInput.value, planList);
      planTaskInput.value = '';
      planTaskInput.focus();
      // TODO: Firebaseへのデータ保存
    }
  });

  // 割り込みタスク追加フォーム
  addUrgentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateInput(urgentTaskInput)) {
      createTaskElement(urgentTaskInput.value.trim(), urgentDurationInput.value, boxAList);
      urgentTaskInput.value = '';
      // TODO: Firebaseへのデータ保存
    }
  });

  // 全データリセットボタン
  deleteDayDataBtn.addEventListener('click', () => {
    if (confirm('この日のすべてのデータをリセットします。本当によろしいですか？')) {
      document.querySelectorAll('.task-list').forEach(list => list.innerHTML = '');
      document.getElementById('daily-goal').value = '';
      document.getElementById('daily-journal').value = '';
      resetExecutionPanel();
      alert('データをリセットしました。');
      // TODO: Firebaseのデータ削除
    }
  });
  
  // 実行パネルのボタン
  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  completeBtn.addEventListener('click', completeTask);
  cancelBtn.addEventListener('click', cancelTask);

  // ドラッグ＆ドロップ用
  dropZones.forEach(zone => {
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragenter', handleDragEnter);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);
  });
  

  // =======================================================
  // ===== 関数定義 =====
  // =======================================================

  /**
   * タスク要素を生成してリストに追加する
   */
  function createTaskElement(name, duration, listElement) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.draggable = true;
    li.dataset.name = name; // データを要素に保持
    li.dataset.duration = duration;

    li.innerHTML = `
      <span class="task-name">${name}</span>
      <span class="task-duration">${duration}分</span>
      <button class="delete-btn" title="このタスクを削除">×</button>
    `;

    // --- 各イベントリスナーを設定 ---
    // タスク全体をクリックしたら実行対象として選択
    li.addEventListener('click', () => selectTask(li));
    // 削除ボタンをクリックしたらタスクを削除
    li.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation(); // 親要素(li)のクリックイベントが発火しないようにする
      deleteTask(li);
    });
    // ドラッグ＆ドロップイベント
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragend', handleDragEnd);

    listElement.appendChild(li);
  }
  
  /**
   * 個別のタスクを削除する
   */
  function deleteTask(taskElement) {
    if (confirm(`タスク「${taskElement.dataset.name}」を削除しますか？`)) {
      if (taskElement === currentSelectedTask) {
        resetExecutionPanel();
      }
      taskElement.remove();
      // TODO: Firebaseからこのタスクを削除
    }
  }

  /**
   * タスクを実行対象として選択する
   */
  function selectTask(taskElement) {
    // 既にタイマーが動いていたら選択できないようにする
    if (timerInterval) {
      alert('他のタスクを実行中です。完了または中止してください。');
      return;
    }
    
    // 以前に選択されていたタスクのハイライトを解除
    if (currentSelectedTask) {
      currentSelectedTask.classList.remove('selected');
    }

    // 新しいタスクを選択状態にする
    currentSelectedTask = taskElement;
    currentSelectedTask.classList.add('selected');
    
    // 実行パネルを更新
    currentTaskDisplay.innerHTML = `<strong>${currentSelectedTask.dataset.name}</strong>（予定: ${currentSelectedTask.dataset.duration}分）`;
    resetTimer();
    updateExecutionButtons(true);
  }

  // --- タイマー関連の関数 ---

  function startTimer() {
    if (!currentSelectedTask) return;
    
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    timerInterval = setInterval(() => {
      timerSeconds++;
      updateTimerDisplay();
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }
  
  function resetTimer() {
      clearInterval(timerInterval);
      timerInterval = null;
      timerSeconds = 0;
      updateTimerDisplay();
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const seconds = (timerSeconds % 60).toString().padStart(2, '0');
    timerClock.textContent = `${minutes}:${seconds}`;
  }
  
  // --- タスク完了/中止の関数 ---

  function completeTask() {
    if (!currentSelectedTask) return;
    
    pauseTimer(); // タイマーを止める
    const actualDuration = Math.round(timerSeconds / 60); // 実績時間(分)

    // 実績リストに要素を追加
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
      <span class="task-name">${currentSelectedTask.dataset.name}</span>
      <span>(予定:${currentSelectedTask.dataset.duration}分 / 実績:${actualDuration}分)</span>
    `;
    実績List.appendChild(li);
    // TODO: Firebaseに実績を保存

    // 元のタスクを削除
    currentSelectedTask.remove();
    
    // 実行パネルをリセット
    resetExecutionPanel();
  }
  
  function cancelTask() {
    resetExecutionPanel();
  }
  
  // --- UI更新/リセット用の関数 ---
  
  /**
   * 実行パネル全体を初期状態に戻す
   */
  function resetExecutionPanel() {
    if (currentSelectedTask) {
      currentSelectedTask.classList.remove('selected');
    }
    currentSelectedTask = null;
    currentTaskDisplay.innerHTML = `<p>実行するタスクをクリックで選択</p>`;
    resetTimer();
    updateExecutionButtons(false);
  }

  /**
   * 実行パネルのボタンの有効/無効を切り替える
   */
  function updateExecutionButtons(isTaskSelected) {
    startBtn.disabled = !isTaskSelected;
    pauseBtn.disabled = true; // 最初は常に無効
    completeBtn.disabled = !isTaskSelected;
    cancelBtn.disabled = !isTaskSelected;
  }
  
  /**
   * 入力値のバリデーション
   */
  function validateInput(inputElement) {
    inputElement.classList.remove('input-error');
    if (inputElement.value.trim() === '') {
      inputElement.classList.add('input-error');
      inputElement.placeholder = "タスク名を入力してください";
      return false;
    }
    inputElement.placeholder = "タスク名";
    return true;
  }
  
  // --- ドラッグ＆ドロップ関連の関数 ---
  let draggedItem = null;

  function handleDragStart(e) {
    // タイマー作動中はドラッグ不可にする
    if (timerInterval) {
        e.preventDefault();
        return;
    }
    draggedItem = e.target;
    setTimeout(() => e.target.classList.add('dragging'), 0);
  }

  function handleDragEnd(e) {
    e.target.classList.remove('dragging');
  }
  
  function handleDragOver(e) { e.preventDefault(); }
  function handleDragEnter(e) { if(e.target.classList.contains('drop-zone')) e.target.classList.add('drag-over'); }
  function handleDragLeave(e) { if(e.target.classList.contains('drop-zone')) e.target.classList.remove('drag-over'); }

  function handleDrop(e) {
    e.preventDefault();
    const dropZone = e.target.closest('.drop-zone');
    if (dropZone && draggedItem) {
      const targetList = dropZone.querySelector('.task-list') || dropZone;
      targetList.appendChild(draggedItem);
      dropZone.classList.remove('drag-over');
      // TODO: Firebase上のタスクの所属リストを更新
    }
  }

  console.log('業務管理アプリが初期化されました。Ver.4.1');
});
