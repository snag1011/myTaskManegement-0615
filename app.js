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

  // ===== 機能1: 入力バリデーションとタスク追加 =====

  // 計画タスクの追加
  addPlanForm.addEventListener('submit', (e) => {
    e.preventDefault(); // フォームのデフォルト送信をキャンセル
    const taskName = planTaskInput.value.trim();
    const duration = planDurationInput.value;
    
    // 入力バリデーション
    if (!validateInput(planTaskInput)) {
        return;
    }
    
    createTaskElement(taskName, duration, planList);
    planTaskInput.value = '';
    planTaskInput.focus();

    // ここにFirebaseへのデータ保存処理を記述
  });

  // 割り込みタスクの追加
  addUrgentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskName = urgentTaskInput.value.trim();
    const duration = urgentDurationInput.value;

    if (!validateInput(urgentTaskInput)) {
        return;
    }
    
    createTaskElement(taskName, duration, boxAList); // Box A (緊急&重要)に直接追加
    urgentTaskInput.value = '';

    // ここにFirebaseへのデータ保存処理を記述
  });

  /**
   * 入力値が空でないか検証し、空ならエラー表示する
   * @param {HTMLInputElement} inputElement - 検証対象のinput要素
   * @returns {boolean} - 検証結果 (true: OK, false: NG)
   */
  function validateInput(inputElement) {
    // 古いエラー表示を消す
    inputElement.classList.remove('input-error');

    if (inputElement.value.trim() === '') {
      // エラー表示
      inputElement.classList.add('input-error');
      inputElement.placeholder = "タスク名を入力してください";
      return false;
    }
    return true;
  }

  /**
   * タスク要素を生成してリストに追加する
   * @param {string} name - タスク名
   * @param {string} duration - 予定時間
   * @param {HTMLElement} listElement - 追加先のul要素
   */
  function createTaskElement(name, duration, listElement) {
    const taskId = `task-${Date.now()}`; // ユニークなIDを生成
    const li = document.createElement('li');
    li.className = 'task-item';
    li.id = taskId;
    li.draggable = true; // ドラッグ可能にする

    li.innerHTML = `
      <span class="task-name">${name}</span>
      <span class="task-duration">${duration}分</span>
    `;

    // ドラッグイベントのリスナーを追加
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragend', handleDragEnd);

    listElement.appendChild(li);
  }


  // ===== 機能2: 全データリセット時の確認ダイアログ =====
  deleteDayDataBtn.addEventListener('click', () => {
    // 確認ダイアログを表示
    const isConfirmed = confirm('この日のすべての計画タスク、実績、目標、ジャーナルをリセットします。本当によろしいですか？');

    if (isConfirmed) {
      // OKが押されたらリセット処理を実行
      console.log('データリセットを実行します。');
      // ここにFirebaseのデータ削除処理などを記述
      
      // UI上のリストをクリア
      document.querySelectorAll('.task-list').forEach(list => list.innerHTML = '');
      document.getElementById('daily-goal').value = '';
      document.getElementById('daily-journal').value = '';
      
      alert('データをリセットしました。');
    } else {
      console.log('データリセットはキャンセルされました。');
    }
  });


  // ===== 機能3: タスクのドラッグ＆ドロップ =====
  let draggedItem = null;

  function handleDragStart(e) {
    draggedItem = this;
    // スムーズなアニメーションのために少し遅延させる
    setTimeout(() => {
        this.classList.add('dragging');
    }, 0);
    // ドラッグするデータの種類と値を設定
    e.dataTransfer.setData('text/plain', this.id);
  }

  function handleDragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;
  }

  dropZones.forEach(zone => {
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragenter', handleDragEnter);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);
  });

  function handleDragOver(e) {
    e.preventDefault(); // ドロップを許可するために必須
  }
  
  function handleDragEnter(e) {
    e.preventDefault();
    // thisはイベントリスナーが設定された要素(drop-zone)
    this.classList.add('drag-over');
  }
  
  function handleDragLeave(e) {
    this.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const id = e.dataTransfer.getData('text/plain');
    const draggable = document.getElementById(id);
    
    // ドロップ先のul要素を取得 (priority-box内か、直下か)
    const targetList = this.classList.contains('task-list') ? this : this.querySelector('.task-list');

    if (targetList && draggable) {
      targetList.appendChild(draggable);
      // ここにFirebaseのデータ更新処理（タスクの所属リスト変更）を記述
      console.log(`タスク ${draggable.id} を ${targetList.id} に移動しました。`);
    }
  }

  // --- その他の機能（タイマー、Firebase連携など）はここに記述 ---
  console.log('業務管理アプリが初期化されました。');

});
