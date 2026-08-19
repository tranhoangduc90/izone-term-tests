(function () {
  'use strict';

  const testConfig = window.TERM_TEST_CONFIG;
  const appConfig = window.TERM_TEST_APP_CONFIG;
  const root = document.getElementById('app');
  const query = new URLSearchParams(window.location.search);
  const classCode = (query.get('class') || '').trim().toUpperCase();
  const requestedDemo = query.get('demo') || '';
  const writingConfig = window.TERM_TEST_CONTENT?.writing || null;
  const demoMode = window.TERM_TEST_CONTENT?.variant === 'semantic-html'
    && ['complete', 'listening-only', 'writing-prep', 'writing'].includes(requestedDemo)
    ? requestedDemo
    : '';

  if (!testConfig || !appConfig || !root) return;

  const storageKey = `izone-test:${testConfig.slug}:${classCode}`;
  const restoredSession = readSession();
  const state = {
    stage: 'loading',
    roster: [],
    className: classCode,
    studentRef: '',
    studentName: '',
    clientSubmissionId: '',
    attemptToken: '',
    completed: false,
    writingStarted: false,
    writingSubmitted: false,
    drafts: { listening: {}, reading: {}, writing: { task1: '', task2: '' } },
    writingLayout: { activeTask: 'task1', splits: {} },
    result: null,
    ...restoredSession,
    drafts: {
      listening: { ...(restoredSession.drafts?.listening || {}) },
      reading: { ...(restoredSession.drafts?.reading || {}) },
      writing: {
        task1: String(restoredSession.drafts?.writing?.task1 || ''),
        task2: String(restoredSession.drafts?.writing?.task2 || '')
      }
    },
    writingLayout: {
      activeTask: String(restoredSession.writingLayout?.activeTask || 'task1'),
      splits: { ...(restoredSession.writingLayout?.splits || {}) }
    }
  };

  function readSession() {
    try {
      return JSON.parse(sessionStorage.getItem(storageKey) || '{}');
    } catch {
      return {};
    }
  }

  function saveSession() {
    sessionStorage.setItem(storageKey, JSON.stringify({
      studentRef: state.studentRef,
      studentName: state.studentName,
      clientSubmissionId: state.clientSubmissionId,
      attemptToken: state.attemptToken,
      completed: state.completed,
      writingStarted: state.writingStarted,
      writingSubmitted: state.writingSubmitted,
      drafts: state.drafts,
      writingLayout: state.writingLayout
    }));
  }

  const progressMarkup = writingConfig
    ? `<div class="progress-step" data-progress="listening">1. Listening</div>
        <div class="progress-step" data-progress="reading">2. Reading</div>
        <div class="progress-step" data-progress="writing">3. Writing</div>
        <div class="progress-step" data-progress="result">4. Kết quả</div>`
    : `<div class="progress-step" data-progress="listening">1. Listening</div>
        <div class="progress-step" data-progress="reading">2. Reading</div>
        <div class="progress-step" data-progress="result">3. Kết quả</div>`;

  const writingMarkup = writingConfig ? `
      <section class="panel transition-card writing-prep-card" id="writingPrepView" hidden>
        <div class="transition-icon">✓</div>
        <p class="eyebrow">Reading đã được ghi nhận</p>
        <h2>Chuẩn bị phần Writing</h2>
        <p>Kết quả Listening và Reading đang được giữ kín. Khi sẵn sàng, hãy bắt đầu Writing và hoàn thành cả hai Task.</p>
        <ul class="writing-prep-list">
          <li>Task 1: nên dành khoảng 20 phút và viết ít nhất 150 từ.</li>
          <li>Task 2: nên dành khoảng 40 phút và viết ít nhất 250 từ.</li>
          <li>Bài viết được tự lưu trong tab này; không đóng tab trước khi nộp.</li>
        </ul>
        <button class="button button-primary" id="startWriting" type="button">Bắt đầu Writing</button>
      </section>

      <form class="panel writing-exam-view" id="writingView" hidden>
        <header class="writing-exam-header">
          <div>
            <p class="eyebrow">Phần 3 · Academic Writing</p>
            <h2>Writing Task 1 &amp; Task 2</h2>
          </div>
          <nav class="writing-task-tabs" id="writingTaskTabs" aria-label="Chọn Writing Task"></nav>
          <button class="button button-primary writing-submit" id="submitWriting" type="submit">Nộp bài Writing</button>
        </header>
        <div class="writing-workspace" id="writingWorkspace"></div>
        <footer class="writing-task-footer">
          <button class="button button-secondary" id="previousWritingTask" type="button">← Previous Task</button>
          <span id="writingTaskPosition">Task 1 / 2</span>
          <button class="button button-primary" id="nextWritingTask" type="button">Next Task →</button>
        </footer>
      </form>
  ` : '';

  root.innerHTML = `
    <header class="topbar">
      <p class="eyebrow">IZONE · IELTS 6–7</p>
      <h1>${testConfig.title}</h1>
      <p>${testConfig.intro || 'Nhập đáp án từ answer sheet giấy. Listening được lưu trước, sau đó hệ thống mở Reading và chấm toàn bộ khi hoàn tất.'}</p>
    </header>
    <main class="page-shell">
      <div class="progress" aria-label="Tiến độ bài test">
        ${progressMarkup}
      </div>
      <div class="notice" id="notice" role="status">Đang tải danh sách lớp...</div>

      <section class="panel loading-card" id="loadingView">
        <div class="spinner" aria-hidden="true"></div>
        <strong>Đang chuẩn bị answer sheet...</strong>
      </section>

      <section class="panel identity-panel" id="identityView" hidden>
        <div class="identity-copy">
          <p class="eyebrow">Thông tin học viên</p>
          <h2 id="identityTitle">Chọn họ và tên</h2>
          <p id="classLabel"></p>
        </div>
        <label>
          Họ và tên
          <select id="studentSelect" required>
            <option value="">Nhấn để chọn</option>
          </select>
        </label>
      </section>

      <form class="panel test-panel" id="listeningView" hidden>
        <div class="section-heading">
          <div>
            <p class="eyebrow">Phần 1</p>
            <h2 id="listeningTitle"></h2>
            <ul class="instructions" id="listeningInstructions"></ul>
          </div>
          <span class="answer-count" id="listeningCount">0/${testConfig.listening.controls.length} đã nhập</span>
        </div>
        <div class="questions-grid" id="listeningQuestions"></div>
        <div class="form-actions">
          <button class="button button-primary" id="submitListening" type="submit">Nộp bài Listening</button>
        </div>
      </form>

      <section class="panel transition-card" id="listeningSavedView" hidden>
        <div class="transition-icon">✓</div>
        <p class="eyebrow">Đã chấm bài Listening</p>
        <h2>Điểm Listening đã được ghi độc lập</h2>
        <p>Reading chưa cần nộp ngay. Bạn có thể xem đầy đủ điểm và phân tích Listening, hoặc tiếp tục làm Reading.</p>
        <div class="form-actions transition-actions">
          <button class="button button-secondary" id="viewListeningResult" type="button">Xem kết quả Listening</button>
          <button class="button button-primary" id="startReading" type="button">Bắt đầu bài Reading</button>
        </div>
      </section>

      <form class="panel test-panel" id="readingView" hidden>
        <div class="section-heading">
          <div>
            <p class="eyebrow">Phần 2 · <span id="readingStudentName"></span></p>
            <h2 id="readingTitle"></h2>
            <ul class="instructions" id="readingInstructions"></ul>
          </div>
          <span class="answer-count" id="readingCount">0/${testConfig.reading.controls.length} đã nhập</span>
        </div>
        <div class="questions-grid" id="readingQuestions"></div>
        <div class="form-actions">
          <button class="button button-primary" id="submitReading" type="submit">Nộp bài Reading</button>
        </div>
      </form>

      ${writingMarkup}

      <section class="panel transition-card" id="resultReadyView" hidden>
        <div class="transition-icon">✓</div>
        <p class="eyebrow">${writingConfig ? 'Đã nộp Writing' : 'Đã chấm xong'}</p>
        <h2>Kết quả của bạn đã sẵn sàng</h2>
        <p>${writingConfig
          ? 'Listening và Reading đã được chấm, phân tích; hai bài Writing được giữ nguyên để bạn sao chép.'
          : 'Cả Listening và Reading đã được lưu, chấm và phân tích theo từng dạng bài.'}</p>
        <button class="button button-primary" id="viewResult" type="button">Xem kết quả</button>
      </section>

      <section class="panel result-panel" id="resultView" hidden>
        <div class="result-heading">
          <div>
            <p class="eyebrow">Kết quả cá nhân</p>
            <h2 id="resultStudentName"></h2>
            <p id="resultMeta"></p>
          </div>
        </div>
        <div class="summary-grid" id="summaryGrid"></div>
        <p class="result-status" id="resultStatus"></p>
        <div class="form-actions result-actions">
          <button class="button button-primary" id="continueReadingFromResult" type="button" hidden>Tiếp tục làm Reading</button>
        </div>
        <div id="writingSubmissionResult" hidden></div>
        <div id="questionDetails"></div>
        <div class="skill-performance-list" id="skillPerformanceSections"></div>
      </section>
    </main>
  `;

  const elements = Object.fromEntries([
    'notice', 'loadingView', 'identityView', 'identityTitle', 'classLabel', 'studentSelect',
    'listeningView', 'listeningTitle', 'listeningInstructions', 'listeningQuestions', 'listeningCount', 'submitListening',
    'listeningSavedView', 'viewListeningResult', 'startReading', 'readingView', 'readingTitle', 'readingInstructions',
    'readingQuestions', 'readingCount', 'readingStudentName', 'submitReading', 'resultReadyView',
    'viewResult', 'resultView', 'resultStudentName', 'resultMeta', 'summaryGrid',
    'skillPerformanceSections', 'questionDetails', 'resultStatus', 'continueReadingFromResult',
    'writingPrepView', 'startWriting', 'writingView', 'writingTaskTabs', 'writingWorkspace', 'submitWriting',
    'previousWritingTask', 'nextWritingTask', 'writingTaskPosition', 'writingSubmissionResult'
  ].map(id => [id, document.getElementById(id)]));

  const progressSteps = [...document.querySelectorAll('[data-progress]')];
  const views = [
    elements.loadingView,
    elements.identityView,
    elements.listeningView,
    elements.listeningSavedView,
    elements.readingView,
    elements.writingPrepView,
    elements.writingView,
    elements.resultReadyView,
    elements.resultView
  ].filter(Boolean);

  function showNotice(message, kind = '') {
    elements.notice.textContent = message;
    elements.notice.className = `notice${kind ? ` ${kind}` : ''}`;
  }

  function setStage(stage) {
    state.stage = stage;
    for (const view of views) view.hidden = true;
    const activeProgress = stage === 'listening' || stage === 'listening-saved'
      ? 'listening'
      : stage === 'reading' ? 'reading'
        : stage === 'writing-prep' || stage === 'writing' ? 'writing'
          : stage === 'result-ready' || stage === 'result' ? 'result' : '';
    const order = writingConfig ? ['listening', 'reading', 'writing', 'result'] : ['listening', 'reading', 'result'];
    const activeIndex = order.indexOf(activeProgress);
    for (const step of progressSteps) {
      const index = order.indexOf(step.dataset.progress);
      step.classList.toggle('active', index === activeIndex);
      step.classList.toggle('done', activeIndex > index);
    }

    if (stage === 'loading') elements.loadingView.hidden = false;
    if (stage === 'listening') {
      elements.identityView.hidden = false;
      elements.listeningView.hidden = false;
    }
    if (stage === 'listening-saved') elements.listeningSavedView.hidden = false;
    if (stage === 'reading') elements.readingView.hidden = false;
    if (stage === 'writing-prep' && elements.writingPrepView) elements.writingPrepView.hidden = false;
    if (stage === 'writing' && elements.writingView) elements.writingView.hidden = false;
    if (stage === 'result-ready') elements.resultReadyView.hidden = false;
    if (stage === 'result') elements.resultView.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function appendInstructions(list, instructions) {
    list.replaceChildren(...instructions.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
  }

  function renderQuestionControls(section, container, skill) {
    container.style.setProperty('--question-rows', String(Math.ceil(section.controls.length / 2)));
    const controls = section.controls.map(control => {
      const wrapper = document.createElement('label');
      wrapper.className = 'question';
      const number = document.createElement('span');
      number.className = 'question-number';
      number.textContent = `Câu ${control.number}`;
      let field;
      if (control.kind === 'select') {
        field = document.createElement('select');
        const blank = document.createElement('option');
        blank.value = '';
        blank.textContent = 'Nhấn để chọn';
        field.append(blank, ...control.options.map(value => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = value;
          return option;
        }));
      } else {
        field = document.createElement('input');
        field.type = 'text';
        field.autocomplete = 'off';
        field.maxLength = 120;
        field.placeholder = 'Câu trả lời của bạn';
      }
      field.name = `question-${control.number}`;
      field.dataset.number = String(control.number);
      field.value = state.drafts?.[skill]?.[String(control.number)] || '';
      field.addEventListener('input', () => {
        state.drafts[skill][String(control.number)] = field.value;
        saveSession();
        updateAnswerCount(skill);
      });
      wrapper.append(number, field);
      return wrapper;
    });
    container.replaceChildren(...controls);
  }

  function collectAnswers(container) {
    return Object.fromEntries([...container.querySelectorAll('[data-number]')].map(field => [
      field.dataset.number,
      field.value.trim()
    ]));
  }

  function updateAnswerCount(skill) {
    const container = skill === 'listening' ? elements.listeningQuestions : elements.readingQuestions;
    const counter = skill === 'listening' ? elements.listeningCount : elements.readingCount;
    const answered = Object.values(collectAnswers(container)).filter(Boolean).length;
    const total = skill === 'listening' ? testConfig.listening.controls.length : testConfig.reading.controls.length;
    counter.textContent = `${answered}/${total} đã nhập`;
    return answered;
  }

  async function apiRequest(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(`${appConfig.API_BASE_URL}${path}`, {
        ...options,
        signal: controller.signal,
        headers: { ...(options.headers || {}) }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Lỗi HTTP ${response.status}`);
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Máy chủ phản hồi quá chậm. Vui lòng thử lại.');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  function populateRoster(data) {
    state.roster = data.students || [];
    state.className = data.class.name;
    elements.classLabel.textContent = `Lớp ${state.className}`;
    const options = [document.createElement('option')];
    options[0].value = '';
    options[0].textContent = 'Nhấn để chọn';
    for (const student of state.roster) {
      const option = document.createElement('option');
      option.value = student.ref;
      option.textContent = student.name;
      options.push(option);
    }
    elements.studentSelect.replaceChildren(...options);
    if (state.studentRef && state.roster.some(student => student.ref === state.studentRef)) {
      elements.studentSelect.value = state.studentRef;
    } else {
      state.studentRef = '';
      state.studentName = '';
      saveSession();
    }
  }

  function confirmIncomplete(answered, skillLabel) {
    const total = skillLabel === 'Listening' ? testConfig.listening.controls.length : testConfig.reading.controls.length;
    if (answered === total) return true;
    return window.confirm(`${skillLabel} hiện có ${answered}/${total} câu đã nhập. Bạn vẫn muốn nộp bài?`);
  }

  function setBusy(button, busy, busyText, normalText) {
    button.disabled = busy;
    button.textContent = busy ? busyText : normalText;
  }

  function countWords(value) {
    const normalized = String(value || '').trim();
    return normalized ? normalized.split(/\s+/u).length : 0;
  }

  function setupWritingExam() {
    const tasks = Array.from(writingConfig?.tasks || []);
    if (!tasks.length || !elements.writingWorkspace || !elements.writingTaskTabs) return;

    const panels = [];
    const tabs = [];

    function activateTask(index, focusEditor = false) {
      const safeIndex = Math.min(tasks.length - 1, Math.max(0, Number(index) || 0));
      const activeTask = tasks[safeIndex];
      state.writingLayout.activeTask = activeTask.id;
      panels.forEach((panel, panelIndex) => { panel.hidden = panelIndex !== safeIndex; });
      tabs.forEach((tab, tabIndex) => {
        const active = tabIndex === safeIndex;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-current', active ? 'true' : 'false');
      });
      elements.previousWritingTask.disabled = safeIndex === 0;
      elements.nextWritingTask.disabled = safeIndex === tasks.length - 1;
      elements.writingTaskPosition.textContent = `Task ${safeIndex + 1} / ${tasks.length}`;
      saveSession();
      if (focusEditor) panels[safeIndex].querySelector('textarea')?.focus();
    }

    tasks.forEach((task, index) => {
      const tab = makeWritingTab(task, index);
      const panel = makeWritingPanel(task);
      tab.addEventListener('click', () => activateTask(index, true));
      tabs.push(tab);
      panels.push(panel);
      elements.writingTaskTabs.append(tab);
      elements.writingWorkspace.append(panel);
    });

    function makeWritingTab(task, index) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'writing-task-tab';
      button.textContent = task.label || `Task ${index + 1}`;
      return button;
    }

    function makeWritingPanel(task) {
      const panel = document.createElement('section');
      panel.className = 'writing-task-panel';
      panel.dataset.writingTaskPanel = task.id;

      const split = document.createElement('div');
      split.className = 'writing-split';
      const initialSplit = Number(state.writingLayout.splits[task.id] || task.initialSplit || 50);

      const promptPane = document.createElement('article');
      promptPane.className = 'writing-prompt-pane';
      const promptHeader = document.createElement('header');
      promptHeader.className = 'writing-pane-header';
      const promptLabel = document.createElement('span');
      promptLabel.textContent = task.label;
      const promptTitle = document.createElement('strong');
      promptTitle.textContent = 'Đề bài';
      promptHeader.append(promptLabel, promptTitle);
      const promptBody = document.createElement('div');
      promptBody.className = 'writing-prompt-body';
      const guidance = document.createElement('p');
      guidance.className = 'writing-guidance';
      guidance.textContent = `You should spend about ${task.recommendedMinutes} minutes on this task.`;
      const instruction = document.createElement('p');
      instruction.className = 'writing-instruction';
      instruction.textContent = task.prompt;
      promptBody.append(guidance, instruction);
      if (task.followUp) {
        const followUp = document.createElement('p');
        followUp.className = 'writing-follow-up';
        followUp.textContent = task.followUp;
        promptBody.append(followUp);
      }
      if (task.image) {
        const figure = document.createElement('figure');
        figure.className = 'writing-task-figure';
        const image = document.createElement('img');
        image.src = task.image.src;
        image.alt = task.image.alt;
        figure.append(image);
        promptBody.append(figure);
      }
      const minimum = document.createElement('p');
      minimum.className = 'writing-minimum';
      minimum.textContent = `Write at least ${task.minimumWords} words.`;
      promptBody.append(minimum);
      promptPane.append(promptHeader, promptBody);

      const separator = document.createElement('button');
      separator.type = 'button';
      separator.className = 'writing-separator';
      separator.setAttribute('role', 'separator');
      separator.setAttribute('aria-orientation', 'vertical');
      separator.setAttribute('aria-label', `Kéo để đổi độ rộng đề và bài làm ${task.label}`);
      separator.setAttribute('aria-valuemin', '28');
      separator.setAttribute('aria-valuemax', '70');
      separator.title = 'Kéo ngang để đổi độ rộng hai khung';
      separator.innerHTML = '<span aria-hidden="true">⋮⋮</span>';

      const answerPane = document.createElement('section');
      answerPane.className = 'writing-answer-pane';
      const answerHeader = document.createElement('header');
      answerHeader.className = 'writing-pane-header';
      const answerLabel = document.createElement('span');
      answerLabel.textContent = task.label;
      const answerTitle = document.createElement('strong');
      answerTitle.textContent = 'Bài làm của bạn';
      answerHeader.append(answerLabel, answerTitle);
      const editor = document.createElement('textarea');
      editor.className = 'writing-editor';
      editor.dataset.writingTask = task.id;
      editor.value = state.drafts.writing[task.id] || '';
      editor.spellcheck = false;
      editor.autocomplete = 'off';
      editor.setAttribute('autocapitalize', 'off');
      editor.setAttribute('autocorrect', 'off');
      editor.setAttribute('aria-label', `Bài làm ${task.label}`);
      const editorMeta = document.createElement('footer');
      editorMeta.className = 'writing-editor-meta';
      const autosave = document.createElement('span');
      autosave.textContent = 'Tự lưu trong tab này';
      const wordCount = document.createElement('strong');
      wordCount.textContent = `${countWords(editor.value)} từ`;
      editorMeta.append(autosave, wordCount);
      editor.addEventListener('input', () => {
        state.drafts.writing[task.id] = editor.value;
        wordCount.textContent = `${countWords(editor.value)} từ`;
        saveSession();
      });
      answerPane.append(answerHeader, editor, editorMeta);
      split.append(promptPane, separator, answerPane);
      panel.append(split);

      function applySplit(value) {
        const percentage = Math.min(70, Math.max(28, Math.round(Number(value) * 10) / 10));
        split.style.setProperty('--writing-left', `${percentage}%`);
        separator.setAttribute('aria-valuenow', String(Math.round(percentage)));
        state.writingLayout.splits[task.id] = percentage;
        saveSession();
      }

      separator.addEventListener('pointerdown', event => {
        separator.setPointerCapture(event.pointerId);
        separator.classList.add('is-dragging');
      });
      separator.addEventListener('pointermove', event => {
        if (!separator.hasPointerCapture(event.pointerId)) return;
        const bounds = split.getBoundingClientRect();
        applySplit((event.clientX - bounds.left) * 100 / bounds.width);
      });
      const stopDragging = event => {
        if (separator.hasPointerCapture(event.pointerId)) separator.releasePointerCapture(event.pointerId);
        separator.classList.remove('is-dragging');
      };
      separator.addEventListener('pointerup', stopDragging);
      separator.addEventListener('pointercancel', stopDragging);
      separator.addEventListener('keydown', event => {
        const current = Number(separator.getAttribute('aria-valuenow')) || initialSplit;
        if (event.key === 'ArrowLeft') applySplit(current - 2);
        else if (event.key === 'ArrowRight') applySplit(current + 2);
        else if (event.key === 'Home') applySplit(28);
        else if (event.key === 'End') applySplit(70);
        else return;
        event.preventDefault();
      });
      applySplit(initialSplit);
      return panel;
    }

    const initialIndex = Math.max(0, tasks.findIndex(task => task.id === state.writingLayout.activeTask));
    activateTask(initialIndex, false);
    elements.previousWritingTask.addEventListener('click', () => {
      const index = tasks.findIndex(task => task.id === state.writingLayout.activeTask);
      activateTask(index - 1, true);
    });
    elements.nextWritingTask.addEventListener('click', () => {
      const index = tasks.findIndex(task => task.id === state.writingLayout.activeTask);
      activateTask(index + 1, true);
    });
  }

  async function copyWritingText(value) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return;
      } catch {
        // Một số trình duyệt chặn Clipboard API; dùng ô tạm trong cùng thao tác bấm nút.
      }
    }
    const fallback = document.createElement('textarea');
    fallback.value = value;
    fallback.style.position = 'fixed';
    fallback.style.opacity = '0';
    document.body.append(fallback);
    fallback.select();
    const copied = document.execCommand('copy');
    fallback.remove();
    if (!copied) throw new Error('COPY_FAILED');
  }

  function renderWritingSubmission() {
    if (!writingConfig || !elements.writingSubmissionResult) return;
    elements.writingSubmissionResult.hidden = !state.writingSubmitted;
    if (!state.writingSubmitted) {
      elements.writingSubmissionResult.replaceChildren();
      return;
    }

    const section = document.createElement('section');
    section.className = 'writing-result-section';
    const heading = document.createElement('header');
    heading.className = 'writing-result-heading';
    const headingCopy = document.createElement('div');
    const eyebrow = document.createElement('span');
    eyebrow.textContent = 'Bản nộp nguyên văn';
    const title = document.createElement('h3');
    title.textContent = 'Bài làm Writing';
    headingCopy.append(eyebrow, title);
    const note = document.createElement('p');
    note.textContent = 'Phần này chưa chấm điểm. Dùng nút riêng của từng Task để sao chép nội dung.';
    heading.append(headingCopy, note);

    const cards = document.createElement('div');
    cards.className = 'writing-result-grid';
    for (const task of Array.from(writingConfig.tasks || [])) {
      const value = state.drafts.writing[task.id] || '';
      const card = document.createElement('article');
      card.className = 'writing-result-card';
      const cardHeader = document.createElement('header');
      const cardTitle = document.createElement('div');
      const label = document.createElement('h4');
      label.textContent = task.label;
      const words = document.createElement('span');
      words.textContent = `${countWords(value)} từ`;
      cardTitle.append(label, words);
      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'button button-secondary writing-copy-button';
      copyButton.textContent = `Sao chép ${task.label}`;
      copyButton.addEventListener('click', async () => {
        const normalText = copyButton.textContent;
        try {
          await copyWritingText(value);
          copyButton.textContent = 'Đã sao chép ✓';
          window.setTimeout(() => { copyButton.textContent = normalText; }, 1800);
        } catch {
          copyButton.textContent = 'Không sao chép được';
          window.setTimeout(() => { copyButton.textContent = normalText; }, 2200);
        }
      });
      cardHeader.append(cardTitle, copyButton);
      const essay = document.createElement('div');
      essay.className = 'writing-result-text';
      essay.textContent = value || 'Học viên không nhập nội dung.';
      card.append(cardHeader, essay);
      cards.append(card);
    }
    section.append(heading, cards);
    elements.writingSubmissionResult.replaceChildren(section);
  }

  function addSummaryCard(label, value) {
    const card = document.createElement('article');
    card.className = 'summary-card';
    const labelNode = document.createElement('span');
    labelNode.textContent = label;
    const valueNode = document.createElement('strong');
    valueNode.textContent = value;
    card.append(labelNode, valueNode);
    return card;
  }

  function renderAnalysisList(container, items, emptyText) {
    const rows = items?.length ? items : [{ type: emptyText, correct: 0, total: 0, percentage: 0 }];
    container.replaceChildren(...rows.map(item => {
      const node = document.createElement('li');
      node.textContent = item.total
        ? `${item.type}: ${item.correct}/${item.total} (${Math.round(item.percentage * 100)}%)`
        : item.type;
      return node;
    }));
  }

  function splitSkillPerformance(stats) {
    const sorted = [...(stats || [])].sort((left, right) =>
      right.percentage - left.percentage || left.type.localeCompare(right.type, 'vi')
    );
    if (!sorted.length) return { best: [], needsImprovement: [] };
    const highest = sorted[0].percentage;
    const lowest = sorted.at(-1).percentage;
    return {
      best: sorted.filter(item => item.percentage === highest),
      needsImprovement: lowest === highest ? [] : sorted.filter(item => item.percentage === lowest)
    };
  }

  function renderSkillPerformance(label, section) {
    const wrapper = document.createElement('section');
    wrapper.className = 'skill-performance-section';
    wrapper.dataset.skillPerformance = label.toLowerCase();

    const heading = document.createElement('header');
    heading.className = 'skill-performance-heading';
    const headingCopy = document.createElement('div');
    const eyebrow = document.createElement('span');
    eyebrow.textContent = 'Phân tích riêng';
    const title = document.createElement('h3');
    title.textContent = label;
    headingCopy.append(eyebrow, title);
    const score = document.createElement('strong');
    score.textContent = `${section.correct}/${section.total} · Band ${section.band}`;
    heading.append(headingCopy, score);

    const analysis = splitSkillPerformance(section.typeStats);
    const cards = document.createElement('div');
    cards.className = 'analysis-grid';
    const bestCard = document.createElement('article');
    bestCard.className = 'analysis-card best';
    const bestTitle = document.createElement('h4');
    bestTitle.textContent = 'Dạng làm tốt nhất';
    const bestList = document.createElement('ul');
    bestList.className = 'analysis-list';
    bestCard.append(bestTitle, bestList);
    renderAnalysisList(bestList, analysis.best, 'Chưa có dữ liệu dạng bài.');

    const improveCard = document.createElement('article');
    improveCard.className = 'analysis-card improve';
    const improveTitle = document.createElement('h4');
    improveTitle.textContent = 'Dạng cần cải thiện';
    const improveList = document.createElement('ul');
    improveList.className = 'analysis-list';
    improveCard.append(improveTitle, improveList);
    renderAnalysisList(improveList, analysis.needsImprovement, 'Các dạng đang có kết quả ngang nhau.');
    cards.append(bestCard, improveCard);

    const tableWrap = document.createElement('div');
    tableWrap.className = 'detail-table-wrap';
    const table = document.createElement('table');
    table.className = 'performance-table';
    const head = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const value of ['Dạng bài', 'Đúng', 'Tổng', 'Tỷ lệ']) {
      const cell = document.createElement('th');
      cell.textContent = value;
      headerRow.append(cell);
    }
    head.append(headerRow);
    const body = document.createElement('tbody');
    for (const item of section.typeStats || []) {
      const row = document.createElement('tr');
      for (const value of [item.type, item.correct, item.total, `${Math.round(item.percentage * 100)}%`]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      body.append(row);
    }
    table.append(head, body);
    tableWrap.append(table);
    wrapper.append(heading, cards, tableWrap);
    return wrapper;
  }

  function renderDetailBlock(title, details) {
    const block = document.createElement('details');
    block.className = 'detail-block';
    const summary = document.createElement('summary');
    const detailRows = details || [];
    summary.textContent = detailRows.length
      ? `${title} · xem chi tiết ${detailRows.length} câu`
      : `${title} · chưa có dữ liệu từng câu`;
    const wrap = document.createElement('div');
    wrap.className = 'detail-table-wrap';
    const table = document.createElement('table');
    table.className = 'detail-table';
    const head = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const label of ['Câu', 'Bài làm', 'Đáp án đúng', 'Kết quả']) {
      const cell = document.createElement('th');
      cell.textContent = label;
      headerRow.append(cell);
    }
    head.append(headerRow);
    const body = document.createElement('tbody');
    for (const detail of detailRows) {
      const row = document.createElement('tr');
      const resultMeta = {
        correct: { icon: '✓', label: 'Đúng' },
        incorrect: { icon: '✕', label: 'Sai' },
        blank: { icon: '–', label: 'Bỏ trống' }
      }[detail.result] || { icon: '?', label: detail.result || 'Chưa xác định' };
      row.className = `detail-row detail-row-${detail.result || 'unknown'}`;
      const labels = [
        `${String(detail.number).padStart(2, '0')}.`,
        detail.studentAnswer || '—',
        detail.correctAnswer || '—'
      ];
      labels.forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      const resultCell = document.createElement('td');
      resultCell.className = `detail-result-cell result-${detail.result}`;
      const resultIcon = document.createElement('span');
      resultIcon.className = 'detail-result-icon';
      resultIcon.setAttribute('aria-hidden', 'true');
      resultIcon.textContent = resultMeta.icon;
      const resultLabel = document.createElement('span');
      resultLabel.textContent = resultMeta.label;
      resultCell.append(resultIcon, resultLabel);
      row.append(resultCell);
      body.append(row);
    }
    table.append(head, body);
    wrap.append(table);
    block.append(summary, wrap);
    return block;
  }

  function renderResult(payload) {
    const result = payload.result;
    const hasReading = Boolean(result.reading);
    state.result = payload;
    elements.resultStudentName.textContent = payload.studentName;
    elements.resultMeta.textContent = `${payload.className} · ${result.testTitle || testConfig.title}`;
    elements.summaryGrid.replaceChildren(
      addSummaryCard('Listening', `${result.listening.correct}/${result.listening.total} · Band ${result.listening.band}`),
      addSummaryCard('Reading', hasReading ? `${result.reading.correct}/${result.reading.total} · Band ${result.reading.band}` : 'Chưa nộp')
    );
    elements.resultStatus.textContent = hasReading
      ? 'Bạn đã hoàn thành cả Listening và Reading. Kết quả và phân tích được tách riêng theo từng kỹ năng ở bên dưới.'
      : 'Listening đã được chấm và lưu riêng. Phân tích dưới đây chỉ dùng bài Listening; Reading chưa bị tính là 0 điểm.';
    elements.continueReadingFromResult.hidden = hasReading || Boolean(demoMode);
    renderWritingSubmission();
    const detailBlocks = [renderDetailBlock('Listening', result.listening.details)];
    if (hasReading) detailBlocks.push(renderDetailBlock('Reading', result.reading.details));
    elements.questionDetails.replaceChildren(...detailBlocks);
    const performanceSections = [renderSkillPerformance('Listening', result.listening)];
    if (hasReading) performanceSections.push(renderSkillPerformance('Reading', result.reading));
    elements.skillPerformanceSections.replaceChildren(...performanceSections);
  }

  function portalNotice(status, completed) {
    if (status === 'not_applicable') {
      return completed
        ? 'Bài đã được chấm và phân tích đầy đủ.'
        : 'Listening đã được chấm và phân tích đầy đủ.';
    }
    if (status === 'pending') {
      return completed
        ? 'Bài đã được chấm. Portal đang bận; hệ thống sẽ tự thử ghi lại khi bạn mở kết quả.'
        : 'Listening đã được chấm. Portal đang bận; hệ thống sẽ tự thử ghi lại khi bạn mở kết quả.';
    }
    return completed
      ? 'Cả Listening và Reading đã được chấm và ghi vào Portal.'
      : 'Listening đã được chấm, phân tích và ghi vào Portal.';
  }

  async function loadResult(button) {
    setBusy(button, true, 'Đang tải kết quả...', button.dataset.normalText || button.textContent);
    try {
      const payload = await apiRequest('/api/term-tests/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptToken: state.attemptToken })
      });
      renderResult(payload);
      showNotice(portalNotice(payload.portalSyncStatus, payload.completed), payload.portalSyncStatus === 'pending' ? '' : 'success');
      setStage('result');
    } catch (error) {
      showNotice(`Không thể tải kết quả: ${error.message}`, 'error');
    } finally {
      setBusy(button, false, 'Đang tải kết quả...', button.dataset.normalText || 'Xem kết quả');
    }
  }

  elements.studentSelect.addEventListener('change', () => {
    const student = state.roster.find(item => item.ref === elements.studentSelect.value);
    state.studentRef = student?.ref || '';
    state.studentName = student?.name || '';
    saveSession();
  });

  elements.listeningView.addEventListener('submit', async event => {
    event.preventDefault();
    if (!state.studentRef) {
      elements.studentSelect.reportValidity();
      showNotice('Hãy chọn đúng họ và tên trước khi nộp Listening.', 'error');
      return;
    }
    const answers = collectAnswers(elements.listeningQuestions);
    const answered = Object.values(answers).filter(Boolean).length;
    if (!confirmIncomplete(answered, 'Listening')) return;
    state.clientSubmissionId ||= crypto.randomUUID();
    state.drafts.listening = answers;
    saveSession();
    setBusy(elements.submitListening, true, 'Đang lưu Listening...', 'Nộp bài Listening');
    try {
      const response = await apiRequest(`/api/term-tests/${testConfig.slug}/listening`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classCode,
          studentRef: state.studentRef,
          clientSubmissionId: state.clientSubmissionId,
          answers
        })
      });
      state.attemptToken = response.attemptToken;
      state.studentName = response.studentName;
      state.completed = Boolean(response.completed);
      saveSession();
      showNotice(portalNotice(response.portalSyncStatus, state.completed), response.portalSyncStatus === 'pending' ? '' : 'success');
      if (state.completed && writingConfig && !state.writingSubmitted) {
        setStage(state.writingStarted ? 'writing' : 'writing-prep');
      } else {
        setStage(state.completed ? 'result-ready' : 'listening-saved');
      }
    } catch (error) {
      showNotice(`Không thể lưu Listening: ${error.message}`, 'error');
    } finally {
      setBusy(elements.submitListening, false, 'Đang lưu Listening...', 'Nộp bài Listening');
    }
  });

  elements.startReading.addEventListener('click', () => {
    elements.readingStudentName.textContent = state.studentName;
    showNotice('Bạn đang làm phần Reading. Bài Listening đã được lưu.', 'success');
    setStage('reading');
  });

  elements.continueReadingFromResult.addEventListener('click', () => {
    elements.readingStudentName.textContent = state.studentName;
    showNotice('Điểm Listening đã được lưu. Bạn đang tiếp tục phần Reading.', 'success');
    setStage('reading');
  });

  elements.readingView.addEventListener('submit', async event => {
    event.preventDefault();
    const automatic = event.submitter?.dataset.autoSubmit === 'true'
      || elements.readingView.dataset.readingTimeExpired === 'true';
    const answers = collectAnswers(elements.readingQuestions);
    const answered = Object.values(answers).filter(Boolean).length;
    if (!automatic && !confirmIncomplete(answered, 'Reading')) return;
    elements.readingView.dataset.readingSubmitting = 'true';
    state.drafts.reading = answers;
    saveSession();
    setBusy(elements.submitReading, true, 'Đang lưu và chấm...', 'Nộp bài Reading');
    if (automatic) {
      showNotice('Đã hết 60 phút. Hệ thống đang tự thu và chấm bài Reading...');
    }
    try {
      const response = await apiRequest(`/api/term-tests/${testConfig.slug}/reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptToken: state.attemptToken, answers })
      });
      state.completed = true;
      saveSession();
      elements.readingView.dispatchEvent(new CustomEvent('term-test:reading-submitted'));
      if (writingConfig) {
        setStage('writing-prep');
        const portalMessage = portalNotice(response.portalSyncStatus, true);
        showNotice(`${portalMessage} Kết quả sẽ mở sau khi bạn nộp Writing.`, response.portalSyncStatus === 'pending' ? '' : 'success');
      } else {
        showNotice(portalNotice(response.portalSyncStatus, true), response.portalSyncStatus === 'pending' ? '' : 'success');
        setStage('result-ready');
        if (automatic) await loadResult(elements.viewResult);
      }
    } catch (error) {
      showNotice(automatic
        ? `Hết giờ nhưng chưa thể nộp Reading: ${error.message}. Hệ thống sẽ tự thử lại; không làm mới trang.`
        : `Không thể lưu Reading: ${error.message}`, 'error');
    } finally {
      delete elements.readingView.dataset.readingSubmitting;
      setBusy(elements.submitReading, false, 'Đang lưu và chấm...', 'Nộp bài Reading');
    }
  });

  elements.viewListeningResult.dataset.normalText = 'Xem kết quả Listening';
  elements.viewResult.dataset.normalText = 'Xem kết quả';
  elements.viewListeningResult.addEventListener('click', () => loadResult(elements.viewListeningResult));
  elements.viewResult.addEventListener('click', () => loadResult(elements.viewResult));

  if (writingConfig) {
    elements.startWriting.addEventListener('click', () => {
      state.writingStarted = true;
      saveSession();
      showNotice('Writing đã bắt đầu. Bài viết được tự lưu trong tab này.', 'success');
      setStage('writing');
    });

    elements.writingView.addEventListener('submit', async event => {
      event.preventDefault();
      const belowMinimum = Array.from(writingConfig.tasks || []).map(task => ({
        label: task.label,
        words: countWords(state.drafts.writing[task.id]),
        minimum: task.minimumWords
      })).filter(task => task.words < task.minimum);
      if (belowMinimum.length) {
        const summary = belowMinimum.map(task => `${task.label}: ${task.words}/${task.minimum} từ`).join('\n');
        if (!window.confirm(`${summary}\n\nBạn vẫn muốn nộp bài Writing?`)) return;
      }

      state.writingSubmitted = true;
      saveSession();
      if (demoMode) {
        renderResult(buildDemoPayload('complete'));
        showNotice('Bản demo: Writing đã nộp; kết quả Listening và Reading đã được mở.', 'success');
        setStage('result');
        return;
      }
      setStage('result-ready');
      showNotice('Đã nộp Writing. Hệ thống đang mở kết quả Listening và Reading...', 'success');
      await loadResult(elements.viewResult);
    });
  }

  function makeDemoSection(skill, correct, band) {
    const types = skill === 'Listening'
      ? ['Form completion', 'Multiple choice', 'Map labelling']
      : ['True / False / Not Given', 'Matching headings', 'Multiple choice'];
    return {
      correct,
      total: 40,
      answered: 40,
      band,
      details: Array.from({ length: 40 }, (_, index) => ({
        number: index + 1,
        studentAnswer: index < correct ? 'Đáp án mẫu' : 'Phương án khác',
        correctAnswer: 'Đáp án minh họa',
        result: index < correct ? 'correct' : 'incorrect'
      })),
      typeStats: types.map((type, index) => {
        const total = index === 2 ? 14 : 13;
        const typeCorrect = Math.max(0, Math.min(total, Math.round(correct * total / 40) + (index === 0 ? 1 : index === 2 ? -1 : 0)));
        return { type, correct: typeCorrect, total, percentage: typeCorrect / total };
      })
    };
  }

  function buildDemoPayload(mode) {
    const listening = makeDemoSection('Listening', 31, 7);
    const reading = mode === 'complete' ? makeDemoSection('Reading', 28, 6.5) : null;
    const mergedStats = new Map();
    for (const stat of [...listening.typeStats, ...(reading?.typeStats || [])]) {
      const current = mergedStats.get(stat.type) || { type: stat.type, correct: 0, total: 0 };
      current.correct += stat.correct;
      current.total += stat.total;
      mergedStats.set(stat.type, current);
    }
    const typeStats = [...mergedStats.values()].map(stat => ({
      ...stat,
      percentage: stat.total ? stat.correct / stat.total : 0
    }));
    const sorted = [...typeStats].sort((left, right) => right.percentage - left.percentage);
    return {
      studentName: 'Học viên demo',
      className: 'IC-DEMO',
      completed: Boolean(reading),
      portalSyncStatus: 'synced',
      result: {
        testTitle: 'Term Test 2 · Bản minh họa',
        listening,
        reading,
        summary: {
          totalCorrect: listening.correct + (reading?.correct || 0),
          totalQuestions: listening.total + (reading?.total || 0),
          averageBand: reading ? 6.75 : null
        },
        typeStats: sorted,
        performance: {
          best: sorted.slice(0, 1),
          needsImprovement: sorted.slice(-1),
          other: sorted.slice(1, -1)
        }
      }
    };
  }

  async function initialize() {
    elements.listeningTitle.textContent = testConfig.listening.title;
    elements.readingTitle.textContent = testConfig.reading.title;
    appendInstructions(elements.listeningInstructions, testConfig.listening.description);
    appendInstructions(elements.readingInstructions, testConfig.reading.description);
    renderQuestionControls(testConfig.listening, elements.listeningQuestions, 'listening');
    renderQuestionControls(testConfig.reading, elements.readingQuestions, 'reading');
    updateAnswerCount('listening');
    updateAnswerCount('reading');
    setupWritingExam();

    if (demoMode) {
      if ((demoMode === 'writing-prep' || demoMode === 'writing') && writingConfig) {
        state.studentName = 'Học viên demo';
        state.completed = true;
        state.writingStarted = demoMode === 'writing';
        state.writingSubmitted = false;
        showNotice(demoMode === 'writing'
          ? 'Bản demo: học viên đang làm Writing; kết quả vẫn được giữ kín.'
          : 'Bản demo: Reading đã được chấm và ghi Portal; học viên chuẩn bị vào Writing.', 'success');
        setStage(demoMode === 'writing' ? 'writing' : 'writing-prep');
        return;
      }
      if (demoMode === 'complete' && writingConfig) {
        state.writingSubmitted = true;
        state.drafts.writing.task1 = 'This is a sample Task 1 response for demonstrating the final copy-ready Writing area.';
        state.drafts.writing.task2 = 'This is a sample Task 2 response. The live page preserves the student essay exactly as typed and provides a separate copy button for each task.';
      }
      if (demoMode === 'listening-only') state.writingSubmitted = false;
      renderResult(buildDemoPayload(demoMode));
      showNotice(demoMode === 'complete'
        ? 'Bản demo: học viên đã hoàn thành Listening, Reading và Writing.'
        : 'Bản demo: học viên mới nộp Listening; Reading chưa bị tính điểm.', 'success');
      setStage('result');
      return;
    }

    if (!/^[A-Z0-9_-]{2,32}$/.test(classCode)) {
      elements.loadingView.hidden = true;
      showNotice('Link chưa có mã lớp hợp lệ. Hãy dùng dạng ?class=IC2139.', 'error');
      return;
    }

    try {
      const roster = await apiRequest(`/api/term-tests/roster?class=${encodeURIComponent(classCode)}&test=${encodeURIComponent(testConfig.slug)}`);
      populateRoster(roster);
      if (!state.roster.length) throw new Error('Lớp chưa có học viên trong hệ thống matching.');
      elements.readingStudentName.textContent = state.studentName;
      if (state.completed && state.attemptToken) {
        if (writingConfig && !state.writingSubmitted) {
          setStage(state.writingStarted ? 'writing' : 'writing-prep');
          showNotice(state.writingStarted
            ? 'Bài Reading đã được ghi. Tiếp tục hoàn thành Writing để mở kết quả.'
            : 'Bài Reading đã được ghi. Bắt đầu Writing khi bạn sẵn sàng.', 'success');
        } else {
          setStage('result-ready');
          showNotice('Lượt làm đã hoàn tất. Nhấn “Xem kết quả” để mở lại.', 'success');
          if (writingConfig && state.writingSubmitted) await loadResult(elements.viewResult);
        }
      } else if (state.attemptToken) {
        setStage('listening-saved');
        showNotice('Bài Listening đã được lưu. Bạn có thể tiếp tục Reading.', 'success');
      } else {
        setStage('listening');
        showNotice(`Đã tải ${state.roster.length} học viên lớp ${state.className}.`, 'success');
      }
    } catch (error) {
      elements.loadingView.hidden = true;
      showNotice(`Không thể mở bài test: ${error.message}`, 'error');
    }
  }

  initialize();
})();
