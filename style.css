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
            document.getElementById('daily-journal').valuespan id="notification-status"></span>
        <button id="request-notification-btn" style="display: none;">デスクトップ通知を許可</button>
      </div>
      <div class="auth-bar">
        <span id="user-info"></span>
        <button id="login-btn">Googleアカウントでログイン</button>
        <button id="logout-btn" style="display: none;">ログアウト</button>
      </div>
    </header>

    <!-- ===== メインコンテンツ ===== -->
    <main id="main-content" class="main-content">
      <h1>🚀【Pro版 Ver.5.2】業務管理アプリ</h1>
      <div class="date-selector-panel">
        <input type="date" id="main-date-picker" />
      </div>

      <div class="main-grid">
        <!-- ===== 左カラム: 計画と実績 ===== -->
        <div class="planning-column">
          <!-- 本日のフォーカス -->
          <section id="focus-panel" class="panel">
            <h2>本日のフォーカス</h2>
            <label for="daily-goal"><strong>本日の目標</strong></label>
            <input type="text" id="daily-goal" class="daily-input" placeholder="今日達成したい最も重要なこと" />
            <label for="daily-journal"><strong>本日のジャーナル</strong></label>
            <textarea id="daily-journal" class="daily-input" rows="4" placeholder="一日の終わりに振り返りを記録しよう"></textarea>
            <button id="save-daily-btn">目標とジャーナルを保存</button>
            <span id="save-confirm-msg" class="save-confirm-msg"></span>
          </section>

          <!-- 計画タスク -->
          <section id="plan-panel" class="panel">
            <h2>計画タスク</h2>
            <form id="add-plan-form" class="input-form">
              <input type="text" id="plan-task-input" placeholder="タスク名" />
              <div class="duration-input-wrapper">
                <!-- ★ 変更点: デフォルト値と単位を秒に変更 -->
                <input type="number" id="plan-duration-input" value="1800" min="1" title="予定時間(秒)" />
                <span>秒</span>
              </div>
              <button id="add-plan-btn" type="submit">追加</button>
            </form>
            <ul id="plan-list" class="task-list drop-zone"></ul>
            <div class="panel-actions">
              <button id="export-plan-btn" class="export-button">📋 計画をCSV出力</button>
              <button id="delete-day-data-btn" class="export-button button-danger">🗑️ この日の全データをリセット</button>
            </div>
          </section>

          <!-- 実績 -->
          <section id="result-panel" class="panel">
            <h2>実績</h2>
            <ul id="実績-list" class="task-list"></ul>
            <div class="panel-actions">
              <button id="export-実績-btn" class="export-button">📈 実績をCSV出力</button>
            </div>
          </section>
        </div>

        <!-- ===== 右カラム: 実行と分類 ===== -->
        <div class="execution-column">
          <section id="execution-panel" class="panel">
            <h2>実行と分類</h2>
            <div class="execution-top">
              <div id="current-task-display"><p>実行するタスクをクリックで選択</p></div>
              <div id="timer-clock">00:00:00</div>
            </div>
            <div class="execution-controls">
              <button id="start-btn" disabled aria-label="開始/再開">▶️ 開始/再開</button>
              <button id="pause-btn" disabled aria-label="一時停止">⏸️ 一時停止</button>
              <button id="complete-btn" disabled aria-label="完了">✅ 完了</button>
              <button id="cancel-btn" disabled aria-label="中止">⏹️ 中止</button>
            </div>
            <hr />
            <!-- 割り込みタスク -->
            <div id="urgent-task-panel">
              <h3>割り込みタスク</h3>
              <form id="add-urgent-form" class="input-form">
                <input type="text" id="urgent-task-input" placeholder="緊急タスク名" />
                <div class="duration-input-wrapper">
                    <!-- ★ 変更点: デフォルト値と単位を秒に変更 -->
                    <input type="number" id="urgent-duration-input" value="900" min="1" />
                    <span>秒</span>
                </div>
                <button id="add-urgent-btn" type="submit">最優先に追加</button>
              </form>
            </div>
            <!-- 優先度マトリックス -->
            <div class="priority-grid">
                <div id="box-a" class="priority-box drop-zone" aria-labelledby="box-a-heading">
                    <h3 id="box-a-heading">🔥 緊急＆重要</h3><small>(今すぐ取り組むべき)</small>
                    <ul id="box-a-list" class="task-list"></ul>
                </div>
                <div id="box-b" class="priority-box drop-zone" aria-labelledby="box-b-heading">
                    <h3 id="box-b-heading">🌱 重要＆非緊急</h3><small>(計画的に取り組むべき)</small>
                    <ul id="box-b-list" class="task-list"></ul>
                </div>
                <div id="box-c" class="priority-box drop-zone" aria-labelledby="box-c-heading">
                    <h3 id="box-c-heading">⚡️ 緊急＆非重要</h3><small>(移譲・効率化すべき)</small>
                    <ul id="box-c-list" class="task-list"></ul>
                </div>
                <div id="box-d" class="priority-box drop-zone" aria-labelledby="box-d-heading">
                    <h3 id="box-d-heading">🗑️ 非緊急 & 非重要</h3><small>(やめるべき)</small>
                    <ul id="box-d-list" class="task-list"></ul>
                </div>
            </div>
          </section>
        </div>
      </div>
    </main>

    <!-- ===== 時間切れ通知モーダル ===== -->
    <div id="times-up-modal" class="modal-overlay" style="display: none;">
      <div class="modal-content">
        <h2>⏰ 時間です！</h2>
        <p id="modal-task-name">タスクの予定時間になりました。どうしますか？</p>
        <div class="modal-actions">
          <button id="modal-complete-btn" class="button-success">✅ 完了する</button>
          <button id="modal-extend-btn">🕰️ 延長する</button>
          <button id="modal-cancel-btn" class="button-danger">⏹️ 中止する</button>
        </div>
      </div>
    </div>
    
    <!-- ===== 通知音再生用 ===== -->
    <audio id="notification-sound" src="notification.mp3" preload="auto"></audio>
  </div>

  <script src="app.js"></script>
</body>
</html>
