/*
 * Dữ liệu nhận vào: Google ID token và JSON kết quả lớp từ API đã phân quyền.
 * Xử lý: tải lớp/bài test được phép xem, tạo tab tổng quan và tab cá nhân, rồi dựng lại màn hình kết quả chi tiết.
 * Kết quả: giảng viên thấy Band cả lớp và từng câu đúng/sai mà không nhận ID ERP, email hay token lượt làm.
 * Khi lỗi: trang giữ nguyên dữ liệu cũ nếu có và hiện thông báo rõ để giảng viên đăng nhập lại hoặc thử tải lại.
 */

import { formatBand, getAverageBand, statusLabel, summarizeStudents } from './model.js';

const appConfig = window.TERM_TEST_APP_CONFIG || {};
const initialParams = new URLSearchParams(window.location.search);
const state = {
  idToken: '',
  reviewer: null,
  classes: [],
  tests: [],
  students: [],
  selectedClassId: '',
  selectedTestSlug: '',
  selectedTab: initialParams.get('student') || 'overview',
  connected: false
};

const elements = Object.fromEntries([
  'notice', 'accessView', 'googleSignInButton', 'dashboardView', 'loginBadge', 'refreshButton',
  'classSelect', 'testSelect', 'reviewerName', 'teacherTabs', 'overviewView', 'overviewTitle',
  'resultCount', 'classSummary', 'overviewBody', 'studentView'
].map(id => [id, document.getElementById(id)]));

function showNotice(message, kind = '') {
  elements.notice.textContent = message;
  elements.notice.className = `notice${kind ? ` ${kind}` : ''}`;
}

function createNode(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== '') node.textContent = text;
  return node;
}

function getSelectedClass() {
  return state.classes.find(item => item.id === state.selectedClassId) || null;
}

function getSelectedTest() {
  return state.tests.find(item => item.slug === state.selectedTestSlug) || null;
}

function updateUrl() {
  const url = new URL(window.location.href);
  const selectedClass = getSelectedClass();
  if (selectedClass) url.searchParams.set('class', selectedClass.name);
  if (state.selectedTestSlug) url.searchParams.set('test', state.selectedTestSlug);
  if (state.selectedTab !== 'overview') url.searchParams.set('student', state.selectedTab);
  else url.searchParams.delete('student');
  window.history.replaceState({}, '', url);
}

async function apiRequest(path) {
  if (!appConfig.API_BASE_URL) throw new Error('Chưa cấu hình địa chỉ API.');
  if (!state.idToken) throw new Error('Bạn chưa đăng nhập Google.');
  const response = await fetch(`${appConfig.API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${state.idToken}` }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) throw new Error('Phiên Google đã hết hạn; hãy đăng nhập lại.');
    if (response.status === 403) throw new Error(payload?.message || 'Tài khoản chưa được cấp quyền cho lớp này.');
    throw new Error(payload?.message || `API trả về mã ${response.status}.`);
  }
  if (!payload?.ok) throw new Error(payload?.message || payload?.error || 'API không xác nhận yêu cầu.');
  return payload;
}

function fillSelect(select, items, valueKey, labelKey) {
  select.replaceChildren(...items.map(item => {
    const option = document.createElement('option');
    option.value = item[valueKey];
    option.textContent = item[labelKey];
    return option;
  }));
}

function chooseInitialFilters() {
  const requestedClass = (initialParams.get('class') || '').trim().toUpperCase();
  const requestedTest = (initialParams.get('test') || '').trim();
  const selectedClass = state.classes.find(item => item.name.toUpperCase() === requestedClass || item.id === requestedClass)
    || state.classes[0];
  const selectedTest = state.tests.find(item => item.slug === requestedTest) || state.tests[0];
  state.selectedClassId = selectedClass?.id || '';
  state.selectedTestSlug = selectedTest?.slug || '';
  elements.classSelect.value = state.selectedClassId;
  elements.testSelect.value = state.selectedTestSlug;
}

async function loadOptions() {
  const payload = await apiRequest('/api/term-tests/teacher/options');
  state.reviewer = payload.reviewer;
  state.classes = payload.classes || [];
  state.tests = payload.tests || [];
  if (!state.classes.length) throw new Error('Tài khoản chưa được cấp quyền xem lớp nào.');
  if (!state.tests.length) throw new Error('Chưa có Term Test nào đang hoạt động.');
  fillSelect(elements.classSelect, state.classes, 'id', 'name');
  fillSelect(elements.testSelect, state.tests, 'slug', 'title');
  chooseInitialFilters();
  elements.reviewerName.textContent = state.reviewer.displayName || state.reviewer.email;
  elements.loginBadge.textContent = `Đã đăng nhập: ${state.reviewer.displayName || state.reviewer.email}`;
  elements.refreshButton.hidden = false;
  elements.accessView.hidden = true;
  elements.dashboardView.hidden = false;
  state.connected = true;
}

function addTeacherSummaryCard(label, value) {
  const card = createNode('article', 'teacher-summary-card');
  card.append(createNode('span', '', label), createNode('strong', '', value));
  return card;
}

function renderClassSummary() {
  const summary = summarizeStudents(state.students);
  elements.classSummary.replaceChildren(
    addTeacherSummaryCard('Sĩ số', String(summary.total)),
    addTeacherSummaryCard('Đã hoàn thành', `${summary.completed}/${summary.total}`),
    addTeacherSummaryCard('Listening trung bình', formatBand(summary.listeningAverage, 2)),
    addTeacherSummaryCard('Reading trung bình', formatBand(summary.readingAverage, 2)),
    addTeacherSummaryCard('Band tổng trung bình', formatBand(summary.overallAverage, 2))
  );
}

function renderTabs() {
  const overviewButton = createNode('button', `teacher-tab${state.selectedTab === 'overview' ? ' active' : ''}`, 'Tổng quan');
  overviewButton.type = 'button';
  overviewButton.dataset.tab = 'overview';
  overviewButton.setAttribute('role', 'tab');
  overviewButton.setAttribute('aria-selected', String(state.selectedTab === 'overview'));

  const studentButtons = state.students.map(student => {
    const button = createNode('button', `teacher-tab${state.selectedTab === student.ref ? ' active' : ''}`);
    button.type = 'button';
    button.dataset.tab = student.ref;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(state.selectedTab === student.ref));
    button.append(
      createNode('span', `teacher-tab-status ${student.status}`),
      document.createTextNode(student.name)
    );
    return button;
  });
  elements.teacherTabs.replaceChildren(overviewButton, ...studentButtons);
}

function renderOverviewRows() {
  elements.overviewBody.replaceChildren(...state.students.map(student => {
    const result = student.result;
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.append(createNode('span', 'teacher-student-name', student.name));
    const listeningCell = createNode('td', 'teacher-band', result ? formatBand(result.listening?.band) : '—');
    const readingCell = createNode('td', 'teacher-band', result ? formatBand(result.reading?.band) : '—');
    const overallCell = createNode('td', 'teacher-band', result ? formatBand(getAverageBand(result), 2) : '—');
    const statusCell = document.createElement('td');
    statusCell.append(createNode('span', `teacher-status ${student.status}`, statusLabel(student.status)));
    const actionCell = document.createElement('td');
    const openButton = createNode('button', 'button button-secondary teacher-open-button', 'Xem');
    openButton.type = 'button';
    openButton.dataset.openStudent = student.ref;
    actionCell.append(openButton);
    row.append(nameCell, listeningCell, readingCell, overallCell, statusCell, actionCell);
    return row;
  }));
}

function renderOverview() {
  const selectedClass = getSelectedClass();
  const selectedTest = getSelectedTest();
  elements.overviewTitle.textContent = `${selectedClass?.name || ''} · ${selectedTest?.title || ''}`;
  elements.resultCount.textContent = `${state.students.length} học viên`;
  renderClassSummary();
  renderOverviewRows();
}

function addResultSummaryCard(label, value) {
  const card = createNode('article', 'summary-card');
  card.append(createNode('span', '', label), createNode('strong', '', value));
  return card;
}

function renderAnalysisList(container, items, emptyText) {
  const rows = items?.length ? items : [{ type: emptyText, correct: 0, total: 0, percentage: 0 }];
  container.replaceChildren(...rows.map(item => createNode(
    'li',
    '',
    item.total ? `${item.type}: ${item.correct}/${item.total} (${Math.round(item.percentage * 100)}%)` : item.type
  )));
}

function renderDetailBlock(title, details) {
  const block = createNode('details', 'detail-block');
  const summary = createNode('summary', '', `${title} · xem chi tiết 40 câu`);
  const wrap = createNode('div', 'detail-table-wrap');
  const table = createNode('table', 'detail-table');
  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const label of ['Câu', 'Bài làm', 'Đáp án đúng', 'Kết quả']) {
    headerRow.append(createNode('th', '', label));
  }
  head.append(headerRow);
  const body = document.createElement('tbody');
  for (const detail of details || []) {
    const row = createNode('tr', `detail-row detail-row-${detail.result || 'unknown'}`);
    const resultMeta = {
      correct: { icon: '✓', label: 'Đúng' },
      incorrect: { icon: '✕', label: 'Sai' },
      blank: { icon: '–', label: 'Bỏ trống' }
    }[detail.result] || { icon: '?', label: detail.result || 'Chưa xác định' };
    for (const value of [
      `${String(detail.number).padStart(2, '0')}.`,
      detail.studentAnswer || '—',
      detail.correctAnswer || '—'
    ]) row.append(createNode('td', '', value));
    const resultCell = createNode('td', `detail-result-cell result-${detail.result}`);
    const icon = createNode('span', 'detail-result-icon', resultMeta.icon);
    icon.setAttribute('aria-hidden', 'true');
    resultCell.append(icon, createNode('span', '', resultMeta.label));
    row.append(resultCell);
    body.append(row);
  }
  table.append(head, body);
  wrap.append(table);
  block.append(summary, wrap);
  return block;
}

function formatCompletedAt(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('vi-VN');
}

function renderStudentResult(student) {
  if (!student || student.status !== 'completed' || !student.result) {
    const empty = createNode('section', 'panel teacher-empty');
    empty.append(
      createNode('p', 'eyebrow', 'Kết quả cá nhân'),
      createNode('h2', '', student?.name || 'Học viên'),
      createNode('p', '', student?.status === 'incomplete'
        ? 'Học viên đã gửi Listening nhưng chưa hoàn tất Reading.'
        : 'Học viên chưa nộp bài test này.')
    );
    elements.studentView.replaceChildren(empty);
    return;
  }

  const result = student.result;
  const panel = createNode('section', 'panel result-panel teacher-result-panel');
  const heading = createNode('div', 'result-heading');
  const headingCopy = document.createElement('div');
  headingCopy.append(
    createNode('p', 'eyebrow', 'Kết quả cá nhân'),
    createNode('h2', '', student.name),
    createNode('p', '', `${getSelectedClass()?.name || ''} · ${result.testTitle}${student.completedAt ? ` · ${formatCompletedAt(student.completedAt)}` : ''}`)
  );
  heading.append(headingCopy);

  const summaryGrid = createNode('div', 'summary-grid');
  summaryGrid.append(
    addResultSummaryCard('Listening', `${result.listening.correct}/40 · Band ${result.listening.band}`),
    addResultSummaryCard('Reading', `${result.reading.correct}/40 · Band ${result.reading.band}`),
    addResultSummaryCard('Tổng điểm', `Band ${formatBand(getAverageBand(result), 2)}`)
  );

  const questionDetails = document.createElement('div');
  questionDetails.append(
    renderDetailBlock('Listening', result.listening.details),
    renderDetailBlock('Reading', result.reading.details)
  );

  const analysisGrid = createNode('div', 'analysis-grid');
  const bestCard = createNode('article', 'analysis-card best');
  const bestList = createNode('ul', 'analysis-list');
  bestCard.append(createNode('h3', '', 'Dạng làm tốt nhất'), bestList);
  const improveCard = createNode('article', 'analysis-card improve');
  const improveList = createNode('ul', 'analysis-list');
  improveCard.append(createNode('h3', '', 'Dạng cần cải thiện'), improveList);
  analysisGrid.append(bestCard, improveCard);
  renderAnalysisList(bestList, result.performance?.best, 'Chưa có dạng nổi trội riêng.');
  renderAnalysisList(improveList, result.performance?.needsImprovement, 'Các dạng đang có kết quả ngang nhau.');

  const performanceWrap = createNode('div', 'detail-table-wrap');
  const performanceTable = createNode('table', 'performance-table');
  const performanceHead = document.createElement('thead');
  const performanceHeader = document.createElement('tr');
  for (const label of ['Dạng bài', 'Đúng', 'Tổng', 'Tỷ lệ']) performanceHeader.append(createNode('th', '', label));
  performanceHead.append(performanceHeader);
  const performanceBody = document.createElement('tbody');
  for (const item of result.typeStats || []) {
    const row = document.createElement('tr');
    for (const value of [item.type, item.correct, item.total, `${Math.round(item.percentage * 100)}%`]) {
      row.append(createNode('td', '', String(value)));
    }
    performanceBody.append(row);
  }
  performanceTable.append(performanceHead, performanceBody);
  performanceWrap.append(performanceTable);
  panel.append(heading, summaryGrid, questionDetails, analysisGrid, performanceWrap);
  elements.studentView.replaceChildren(panel);
}

function renderActiveView() {
  const selectedStudent = state.students.find(student => student.ref === state.selectedTab);
  if (state.selectedTab !== 'overview' && !selectedStudent) state.selectedTab = 'overview';
  renderTabs();
  elements.overviewView.hidden = state.selectedTab !== 'overview';
  elements.studentView.hidden = state.selectedTab === 'overview';
  if (state.selectedTab === 'overview') renderOverview();
  else renderStudentResult(selectedStudent);
  updateUrl();
}

async function loadResults() {
  const selectedClass = getSelectedClass();
  if (!selectedClass || !state.selectedTestSlug) return;
  showNotice(`Đang tải kết quả ${selectedClass.name}...`);
  const query = new URLSearchParams({ class: selectedClass.name, test: state.selectedTestSlug });
  const payload = await apiRequest(`/api/term-tests/teacher/results?${query}`);
  state.students = payload.students || [];
  if (state.selectedTab !== 'overview' && !state.students.some(student => student.ref === state.selectedTab)) {
    state.selectedTab = 'overview';
  }
  renderActiveView();
  const completed = state.students.filter(student => student.status === 'completed').length;
  showNotice(`Đã tải ${state.students.length} học viên; ${completed} học viên đã hoàn thành.`, 'success');
}

async function connectAfterGoogleLogin() {
  await loadOptions();
  await loadResults();
}

function resetLoginAfterError() {
  state.idToken = '';
  state.connected = false;
  elements.loginBadge.textContent = 'Chưa đăng nhập';
  elements.refreshButton.hidden = true;
  elements.accessView.hidden = false;
  elements.dashboardView.hidden = true;
}

function setupGoogleSignIn() {
  const clientId = appConfig.GOOGLE_CLIENT_ID;
  if (!clientId) {
    showNotice('Chưa cấu hình Google OAuth Client ID.', 'error');
    return;
  }
  const renderButton = () => {
    window.google.accounts.id.initialize({
      client_id: clientId,
      auto_select: false,
      callback: async response => {
        state.idToken = response.credential || '';
        try {
          await connectAfterGoogleLogin();
        } catch (error) {
          resetLoginAfterError();
          showNotice(`Không thể đăng nhập: ${error.message}`, 'error');
        }
      }
    });
    window.google.accounts.id.renderButton(elements.googleSignInButton, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular'
    });
  };
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = renderButton;
  script.onerror = () => showNotice('Không tải được màn hình đăng nhập Google.', 'error');
  document.head.append(script);
}

elements.classSelect.addEventListener('change', async () => {
  state.selectedClassId = elements.classSelect.value;
  state.selectedTab = 'overview';
  try {
    await loadResults();
  } catch (error) {
    showNotice(`Không thể tải kết quả: ${error.message}`, 'error');
  }
});

elements.testSelect.addEventListener('change', async () => {
  state.selectedTestSlug = elements.testSelect.value;
  state.selectedTab = 'overview';
  try {
    await loadResults();
  } catch (error) {
    showNotice(`Không thể tải kết quả: ${error.message}`, 'error');
  }
});

elements.refreshButton.addEventListener('click', async () => {
  try {
    await loadResults();
  } catch (error) {
    showNotice(`Không thể làm mới: ${error.message}`, 'error');
  }
});

elements.teacherTabs.addEventListener('click', event => {
  const button = event.target.closest('[data-tab]');
  if (!button) return;
  state.selectedTab = button.dataset.tab;
  renderActiveView();
});

elements.overviewBody.addEventListener('click', event => {
  const button = event.target.closest('[data-open-student]');
  if (!button) return;
  state.selectedTab = button.dataset.openStudent;
  renderActiveView();
});

setupGoogleSignIn();
