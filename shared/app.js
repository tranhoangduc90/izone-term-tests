(function () {
  'use strict';

  const testConfig = window.TERM_TEST_CONFIG;
  const appConfig = window.TERM_TEST_APP_CONFIG;
  const root = document.getElementById('app');
  const query = new URLSearchParams(window.location.search);
  const classCode = (query.get('class') || '').trim().toUpperCase();
  const requestedDemo = query.get('demo') || '';
  const demoMode = window.TERM_TEST_CONTENT?.variant === 'semantic-html'
    && ['complete', 'listening-only'].includes(requestedDemo)
    ? requestedDemo
    : '';

  if (!testConfig || !appConfig || !root) return;

  const storageKey = `izone-test:${testConfig.slug}:${classCode}`;
  const state = {
    stage: 'loading',
    roster: [],
    className: classCode,
    studentRef: '',
    studentName: '',
    clientSubmissionId: '',
    attemptToken: '',
    completed: false,
    drafts: { listening: {}, reading: {} },
    result: null,
    ...readSession()
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
      drafts: state.drafts
    }));
  }

  root.innerHTML = `
    <header class="topbar">
      <p class="eyebrow">IZONE · IELTS 6–7</p>
      <h1>${testConfig.title}</h1>
      <p>${testConfig.intro || 'Nhập đáp án từ answer sheet giấy. Listening được lưu trước, sau đó hệ thống mở Reading và chấm toàn bộ khi hoàn tất.'}</p>
    </header>
    <main class="page-shell">
      <div class="progress" aria-label="Tiến độ bài test">
        <div class="progress-step" data-progress="listening">1. Listening</div>
        <div class="progress-step" data-progress="reading">2. Reading</div>
        <div class="progress-step" data-progress="result">3. Kết quả</div>
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

      <section class="panel transition-card" id="resultReadyView" hidden>
        <div class="transition-icon">✓</div>
        <p class="eyebrow">Đã chấm xong</p>
        <h2>Kết quả của bạn đã sẵn sàng</h2>
        <p>Cả Listening và Reading đã được lưu, chấm và phân tích theo từng dạng bài.</p>
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
        <div id="questionDetails"></div>
        <div class="analysis-grid">
          <article class="analysis-card best">
            <h3>Dạng làm tốt nhất</h3>
            <ul class="analysis-list" id="bestList"></ul>
          </article>
          <article class="analysis-card improve">
            <h3>Dạng cần cải thiện</h3>
            <ul class="analysis-list" id="improveList"></ul>
          </article>
        </div>
        <div class="detail-table-wrap">
          <table class="performance-table">
            <thead><tr><th>Dạng bài</th><th>Đúng</th><th>Tổng</th><th>Tỷ lệ</th></tr></thead>
            <tbody id="performanceBody"></tbody>
          </table>
        </div>
      </section>
    </main>
  `;

  const elements = Object.fromEntries([
    'notice', 'loadingView', 'identityView', 'identityTitle', 'classLabel', 'studentSelect',
    'listeningView', 'listeningTitle', 'listeningInstructions', 'listeningQuestions', 'listeningCount', 'submitListening',
    'listeningSavedView', 'viewListeningResult', 'startReading', 'readingView', 'readingTitle', 'readingInstructions',
    'readingQuestions', 'readingCount', 'readingStudentName', 'submitReading', 'resultReadyView',
    'viewResult', 'resultView', 'resultStudentName', 'resultMeta', 'summaryGrid', 'bestList',
    'improveList', 'performanceBody', 'questionDetails', 'resultStatus', 'continueReadingFromResult'
  ].map(id => [id, document.getElementById(id)]));

  const progressSteps = [...document.querySelectorAll('[data-progress]')];
  const views = [
    elements.loadingView,
    elements.identityView,
    elements.listeningView,
    elements.listeningSavedView,
    elements.readingView,
    elements.resultReadyView,
    elements.resultView
  ];

  function showNotice(message, kind = '') {
    elements.notice.textContent = message;
    elements.notice.className = `notice${kind ? ` ${kind}` : ''}`;
  }

  function setStage(stage) {
    state.stage = stage;
    for (const view of views) view.hidden = true;
    const activeProgress = stage === 'listening' || stage === 'listening-saved'
      ? 'listening'
      : stage === 'reading' ? 'reading' : stage === 'result-ready' || stage === 'result' ? 'result' : '';
    const order = ['listening', 'reading', 'result'];
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

  function getAverageBand(result) {
    if (typeof result.summary?.averageBand === 'number' && Number.isFinite(result.summary.averageBand)) {
      return result.summary.averageBand;
    }
    const bands = [result.listening?.band, result.reading?.band];
    return bands.every(band => typeof band === 'number' && Number.isFinite(band))
      ? (bands[0] + bands[1]) / 2
      : null;
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
    const averageBand = getAverageBand(result);
    elements.summaryGrid.replaceChildren(
      addSummaryCard('Listening', `${result.listening.correct}/${result.listening.total} · Band ${result.listening.band}`),
      addSummaryCard('Reading', hasReading ? `${result.reading.correct}/${result.reading.total} · Band ${result.reading.band}` : 'Chưa nộp'),
      addSummaryCard('Tổng điểm', averageBand === null ? 'Chưa đủ hai kỹ năng' : `Band ${averageBand.toFixed(2)}`)
    );
    elements.resultStatus.textContent = hasReading
      ? 'Bạn đã hoàn thành cả Listening và Reading. Phân tích dưới đây tổng hợp cả hai kỹ năng.'
      : 'Listening đã được chấm và lưu riêng. Phân tích dưới đây chỉ dùng bài Listening; Reading chưa bị tính là 0 điểm.';
    elements.continueReadingFromResult.hidden = hasReading || Boolean(demoMode);
    renderAnalysisList(elements.bestList, result.performance.best, 'Chưa có dạng nổi trội riêng.');
    renderAnalysisList(elements.improveList, result.performance.needsImprovement, 'Các dạng đang có kết quả ngang nhau.');
    elements.performanceBody.replaceChildren(...(result.typeStats || []).map(item => {
      const row = document.createElement('tr');
      for (const value of [item.type, item.correct, item.total, `${Math.round(item.percentage * 100)}%`]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      return row;
    }));
    const detailBlocks = [renderDetailBlock('Listening', result.listening.details)];
    if (hasReading) detailBlocks.push(renderDetailBlock('Reading', result.reading.details));
    elements.questionDetails.replaceChildren(...detailBlocks);
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
      setStage(state.completed ? 'result-ready' : 'listening-saved');
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
    const answers = collectAnswers(elements.readingQuestions);
    const answered = Object.values(answers).filter(Boolean).length;
    if (!confirmIncomplete(answered, 'Reading')) return;
    state.drafts.reading = answers;
    saveSession();
    setBusy(elements.submitReading, true, 'Đang lưu và chấm...', 'Nộp bài Reading');
    try {
      const response = await apiRequest(`/api/term-tests/${testConfig.slug}/reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptToken: state.attemptToken, answers })
      });
      state.completed = true;
      saveSession();
      showNotice(portalNotice(response.portalSyncStatus, true), response.portalSyncStatus === 'pending' ? '' : 'success');
      setStage('result-ready');
    } catch (error) {
      showNotice(`Không thể lưu Reading: ${error.message}`, 'error');
    } finally {
      setBusy(elements.submitReading, false, 'Đang lưu và chấm...', 'Nộp bài Reading');
    }
  });

  elements.viewListeningResult.dataset.normalText = 'Xem kết quả Listening';
  elements.viewResult.dataset.normalText = 'Xem kết quả';
  elements.viewListeningResult.addEventListener('click', () => loadResult(elements.viewListeningResult));
  elements.viewResult.addEventListener('click', () => loadResult(elements.viewResult));

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

    if (demoMode) {
      renderResult(buildDemoPayload(demoMode));
      showNotice(demoMode === 'complete'
        ? 'Bản demo: học viên đã nộp cả Listening và Reading.'
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
        setStage('result-ready');
        showNotice('Lượt làm đã hoàn tất. Nhấn “Xem kết quả” để mở lại.', 'success');
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
