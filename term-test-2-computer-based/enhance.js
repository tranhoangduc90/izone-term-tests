(function () {
  'use strict';

  const contentConfig = window.TERM_TEST_CONTENT;
  const testConfig = window.TERM_TEST_CONFIG;
  const classCode = (new URLSearchParams(window.location.search).get('class') || '').trim().toUpperCase();

  if (!contentConfig || !testConfig || contentConfig.baseTestSlug !== testConfig.slug) return;

  const uiStorageKey = 'izone-test-ui:' + testConfig.slug + ':' + classCode;
  const uiState = readUiState();

  // Dữ liệu vào: phần đang mở, câu đánh dấu, cỡ chữ và vị trí audio trong tab hiện tại.
  // Việc chính: đọc an toàn rồi bổ sung giá trị mặc định cho Listening và Reading.
  // Kết quả: tải lại trang vẫn trở về đúng ngữ cảnh học viên đang làm.
  // Khi lỗi: dùng cấu hình mặc định; luồng lưu bài của shared/app.js không bị ảnh hưởng.
  function readUiState() {
    let stored = {};
    try {
      stored = JSON.parse(sessionStorage.getItem(uiStorageKey) || '{}');
    } catch {
      stored = {};
    }
    return {
      flags: {
        listening: { ...(stored.flags?.listening || {}) },
        reading: { ...(stored.flags?.reading || {}) }
      },
      activeSection: {
        listening: Number(stored.activeSection?.listening) || 0,
        reading: Number(stored.activeSection?.reading) || 0
      },
      fontSize: {
        listening: Number(stored.fontSize?.listening) || 100,
        reading: Number(stored.fontSize?.reading) || 100
      },
      audio: {
        started: Boolean(stored.audio?.started),
        time: Number(stored.audio?.time) || 0,
        volume: Number(stored.audio?.volume) || 1
      }
    };
  }

  function saveUiState() {
    try {
      sessionStorage.setItem(uiStorageKey, JSON.stringify(uiState));
    } catch {
      // sessionStorage có thể bị chặn; bài làm chính vẫn được shared/app.js quản lý.
    }
  }

  function makeButton(className, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    return button;
  }

  // Dữ liệu vào: khối chọn học viên do shared/app.js dựng và mã lớp tải từ API.
  // Việc chính: bỏ nhãn lặp, đưa tên lớp lên trên tiêu đề và giữ dropdown trên cùng một hàng.
  // Kết quả: phần đầu trang thấp hơn nhưng dropdown và dữ liệu học viên vẫn là phần tử gốc.
  // Khi thiếu phần tử: giữ nguyên bố cục cũ để không cản học viên vào bài.
  function compactIdentityPanel() {
    const panel = document.getElementById('identityView');
    const copy = panel?.querySelector('.identity-copy');
    const oldEyebrow = copy?.querySelector('.eyebrow');
    const classLabel = document.getElementById('classLabel');
    const select = document.getElementById('studentSelect');
    const selectLabel = select?.closest('label');
    if (!panel || !copy || !classLabel || !select || !selectLabel) return;

    oldEyebrow?.remove();
    classLabel.classList.add('eyebrow', 'cbt-class-label');
    copy.prepend(classLabel);
    select.setAttribute('aria-label', 'Họ và tên');
    selectLabel.classList.add('cbt-student-select');
    selectLabel.replaceChildren(select);
    panel.classList.add('cbt-identity-panel');
  }

  function replaceInstructions(list, instructions) {
    list.replaceChildren(...instructions.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
    const whole = Math.floor(seconds);
    const minutes = Math.floor(whole / 60);
    const remaining = whole % 60;
    return String(minutes).padStart(2, '0') + ':' + String(remaining).padStart(2, '0');
  }

  function collectFields(grid) {
    const fields = new Map();
    grid.querySelectorAll('.question').forEach(question => {
      const field = question.querySelector('[data-number]');
      if (!field) return;
      const number = String(field.dataset.number);
      field.setAttribute('aria-label', 'Câu ' + number);
      field.title = 'Câu ' + number;
      if (field.tagName === 'INPUT') field.placeholder = 'Nhập đáp án';
      if (field.tagName === 'SELECT' && field.options[0]) field.options[0].textContent = 'Chọn';
      fields.set(number, field);
    });
    return fields;
  }

  function hideBackingField(field) {
    field.classList.add('cbt-visually-hidden-field');
    field.hidden = true;
    field.setAttribute('aria-hidden', 'true');
    field.tabIndex = -1;
  }

  function syncRadioField(field, card) {
    const groupName = 'cbt-choice-' + card.dataset.questionNumber + '-' + Math.random().toString(36).slice(2, 8);
    const radios = [...card.querySelectorAll('[data-choice-value]')].map(label => {
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = groupName;
      radio.value = label.dataset.choiceValue;
      radio.checked = field.value === radio.value;
      radio.setAttribute('aria-label', 'Câu ' + field.dataset.number + ', đáp án ' + radio.value);
      radio.addEventListener('change', () => {
        if (!radio.checked) return;
        field.value = radio.value;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
      });
      label.prepend(radio);
      return radio;
    });
    hideBackingField(field);
    field.addEventListener('input', () => {
      radios.forEach(radio => { radio.checked = field.value === radio.value; });
    });
    return radios;
  }

  function syncMultiFields(card, fields) {
    const limit = fields.length;
    const status = document.createElement('p');
    status.className = 'cbt-multi-status';
    status.setAttribute('role', 'status');

    function readValues() {
      return [...new Set(fields.map(field => field.value).filter(Boolean))].slice(0, limit);
    }

    function writeValues(values) {
      const changed = [];
      fields.forEach((field, index) => {
        const nextValue = values[index] || '';
        if (field.value === nextValue) return;
        field.value = nextValue;
        changed.push(field);
      });
      changed.forEach(field => {
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    const checkboxes = [...card.querySelectorAll('[data-choice-value]')].map(label => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = label.dataset.choiceValue;
      checkbox.setAttribute('aria-label', 'Câu ' + fields.map(field => field.dataset.number).join('–') + ', đáp án ' + checkbox.value);
      label.prepend(checkbox);
      return checkbox;
    });

    function renderSelection(message = '') {
      const values = readValues();
      checkboxes.forEach(checkbox => { checkbox.checked = values.includes(checkbox.value); });
      card.classList.toggle('is-complete', values.length === limit);
      card.classList.toggle('is-limit', Boolean(message));
      status.textContent = message || 'Đã chọn ' + values.length + '/' + limit + '. Có thể bỏ tick để đổi đáp án.';
    }

    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        let values = readValues();
        if (checkbox.checked) {
          if (values.length >= limit) {
            checkbox.checked = false;
            renderSelection('Tối đa ' + limit + ' phương án. Hãy bỏ tick một phương án trước khi chọn đáp án khác.');
            return;
          }
          values.push(checkbox.value);
        } else {
          values = values.filter(value => value !== checkbox.value);
        }
        writeValues(values);
        renderSelection();
      });
    });
    fields.forEach(field => {
      hideBackingField(field);
      field.addEventListener('input', () => renderSelection());
    });
    card.append(status);
    renderSelection();
    return checkboxes;
  }

  // Dữ liệu vào: HTML đề, 40 ô do shared/app.js tạo và trạng thái đánh dấu.
  // Việc chính: chuyển từng ô thật vào đúng data-answer-slot rồi nối radio hoặc checkbox HTML với select gốc.
  // Kết quả: giao diện đẹp hơn nhưng dữ liệu vẫn đi qua đúng field, draft và API cũ.
  // Khi thiếu slot: câu đó được giữ trong bản đồ để test DOM phát hiện trước khi phát hành.
  function attachAnswerFields(skill, sectionNode, sectionIndex, fields, items) {
    const processedSlots = new Set();
    sectionNode.querySelectorAll('[data-control="multi"]').forEach(card => {
      const numbers = (card.dataset.questionNumbers || '').split(',').filter(Boolean);
      const multiFields = numbers.map(number => fields.get(number)).filter(Boolean);
      if (multiFields.length !== numbers.length) return;

      numbers.forEach((number, index) => {
        const slot = card.querySelector('[data-answer-slot="' + number + '"]');
        const field = multiFields[index];
        if (!slot) return;
        field.classList.add('cbt-answer-select');
        slot.append(field);
        processedSlots.add(slot);
      });
      const checkboxes = syncMultiFields(card, multiFields);
      const flags = document.createElement('span');
      flags.className = 'cbt-multi-flags';
      card.querySelector('.cbt-question-heading')?.append(flags);

      multiFields.forEach(field => {
        const number = String(field.dataset.number);
        const flagButton = makeButton('cbt-flag-button cbt-multi-flag', '⚑' + number);
        flagButton.setAttribute('aria-label', 'Đánh dấu câu ' + number);
        flagButton.title = 'Đánh dấu câu ' + number + ' để xem lại';
        flags.append(flagButton);
        items.push({
          skill,
          number,
          field,
          target: card,
          flagButton,
          radios: checkboxes,
          sectionIndex
        });
      });
    });

    sectionNode.querySelectorAll('[data-answer-slot]').forEach(slot => {
      if (processedSlots.has(slot)) return;
      const number = String(slot.dataset.answerSlot);
      const field = fields.get(number);
      if (!field) return;

      const target = slot.closest('[data-question-number]') || slot;
      field.classList.add(field.tagName === 'SELECT' ? 'cbt-answer-select' : 'cbt-answer-input');
      slot.append(field);

      let radios = [];
      const radioCard = target.closest('[data-control="radio"]');
      if (radioCard) radios = syncRadioField(field, radioCard);

      const flagButton = makeButton('cbt-flag-button', '⚑');
      flagButton.setAttribute('aria-label', 'Đánh dấu câu ' + number);
      flagButton.title = 'Đánh dấu để xem lại';
      const heading = target.querySelector?.(':scope > .cbt-question-heading');
      (heading || target).append(flagButton);

      items.push({
        skill,
        number,
        field,
        target,
        flagButton,
        radios,
        sectionIndex
      });
    });
  }

  function createToolbar(heading, skill, sectionConfig) {
    const toolbar = document.createElement('div');
    toolbar.className = 'cbt-toolbar';
    heading.classList.add('cbt-test-heading');

    const controls = document.createElement('div');
    controls.className = 'cbt-toolbar-controls';
    const partNav = document.createElement('nav');
    partNav.className = 'cbt-part-nav';
    partNav.setAttribute('aria-label', skill === 'listening' ? 'Chọn phần Listening' : 'Chọn bài đọc');

    const sizeControls = document.createElement('div');
    sizeControls.className = 'cbt-text-size';
    const sizeLabel = document.createElement('span');
    sizeLabel.textContent = 'Cỡ chữ';
    const smaller = makeButton('cbt-tool-button', 'A−');
    smaller.setAttribute('aria-label', 'Giảm cỡ chữ');
    const sizeValue = document.createElement('strong');
    const larger = makeButton('cbt-tool-button', 'A+');
    larger.setAttribute('aria-label', 'Tăng cỡ chữ');
    sizeControls.append(sizeLabel, smaller, sizeValue, larger);

    controls.append(partNav, sizeControls);
    toolbar.append(heading, controls);
    return { toolbar, partNav, smaller, larger, sizeValue, sectionConfig };
  }

  function createSectionPager(skill, sectionIndex, sectionCount, onActivate) {
    const noun = skill === 'listening' ? 'Part' : 'Passage';
    const pager = document.createElement('nav');
    pager.className = 'cbt-section-pager';
    pager.setAttribute('aria-label', 'Chuyển ' + noun);

    const previous = makeButton('cbt-section-page-button is-previous', '← Previous ' + noun);
    previous.disabled = sectionIndex === 0;
    previous.addEventListener('click', () => onActivate(sectionIndex - 1));

    const position = document.createElement('span');
    position.textContent = noun + ' ' + (sectionIndex + 1) + ' / ' + sectionCount;

    const next = makeButton('cbt-section-page-button is-next', 'Next ' + noun + ' →');
    next.disabled = sectionIndex === sectionCount - 1;
    next.addEventListener('click', () => onActivate(sectionIndex + 1));
    pager.append(previous, position, next);
    return pager;
  }

  function createSemanticPane(skill, sectionConfig, heading, fields) {
    const pane = document.createElement('section');
    pane.className = 'cbt-semantic-pane';
    pane.setAttribute('aria-label', skill === 'listening' ? 'Đề Listening HTML' : 'Đề Reading HTML');

    const toolbarParts = createToolbar(heading, skill, sectionConfig);
    const viewport = document.createElement('div');
    viewport.className = 'cbt-content-viewport';
    viewport.dataset.skill = skill;
    const sectionNodes = [];
    const items = [];

    sectionConfig.sections.forEach((section, sectionIndex) => {
      let sectionNode;
      let pagerHost;
      if (skill === 'reading') {
        sectionNode = document.createElement('section');
        sectionNode.className = 'cbt-reading-section';

        const passage = document.createElement('article');
        passage.className = 'cbt-reading-passage';
        const passageHeader = document.createElement('header');
        passageHeader.className = 'cbt-passage-header';
        const passageLabel = document.createElement('span');
        passageLabel.textContent = section.label;
        const passageTitle = document.createElement('h3');
        passageTitle.textContent = section.title;
        passageHeader.append(passageLabel, passageTitle);
        const passageBody = document.createElement('div');
        passageBody.className = 'cbt-passage-body';
        passageBody.innerHTML = section.passageHtml;
        passage.append(passageHeader, passageBody);

        const questions = document.createElement('div');
        questions.className = 'cbt-reading-questions';
        questions.innerHTML = section.questionsHtml;
        sectionNode.append(passage, questions);
        pagerHost = questions;
      } else {
        sectionNode = document.createElement('article');
        sectionNode.className = 'cbt-listening-section';
        sectionNode.innerHTML = section.html;
        pagerHost = sectionNode;
      }
      pagerHost.append(createSectionPager(skill, sectionIndex, sectionConfig.sections.length, activateSection));
      sectionNode.dataset.sectionIndex = String(sectionIndex);
      sectionNode.hidden = true;
      viewport.append(sectionNode);
      sectionNodes.push(sectionNode);
      attachAnswerFields(skill, sectionNode, sectionIndex, fields, items);
    });

    const partButtons = sectionConfig.sections.map((section, index) => {
      const button = makeButton('cbt-part-button', section.label + ' · ' + section.range.replace('Questions ', 'Q'));
      button.addEventListener('click', () => activateSection(index));
      toolbarParts.partNav.append(button);
      return button;
    });

    function activateSection(index, focusTop = true) {
      const safeIndex = Math.min(sectionNodes.length - 1, Math.max(0, Number(index) || 0));
      sectionNodes.forEach((node, nodeIndex) => { node.hidden = nodeIndex !== safeIndex; });
      partButtons.forEach((button, buttonIndex) => {
        const active = buttonIndex === safeIndex;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-current', active ? 'true' : 'false');
      });
      uiState.activeSection[skill] = safeIndex;
      saveUiState();
      if (focusTop) {
        if (skill === 'listening') {
          sectionNodes[safeIndex].scrollTo(0, 0);
        } else {
          sectionNodes[safeIndex].querySelectorAll('.cbt-reading-passage, .cbt-reading-questions').forEach(node => node.scrollTo(0, 0));
        }
      }
    }

    function applyFontSize(nextSize) {
      const allowed = [90, 100, 110, 120];
      const selected = allowed.reduce((best, value) => Math.abs(value - nextSize) < Math.abs(best - nextSize) ? value : best, 100);
      uiState.fontSize[skill] = selected;
      viewport.dataset.fontSize = String(selected);
      toolbarParts.sizeValue.textContent = selected + '%';
      saveUiState();
    }

    toolbarParts.smaller.addEventListener('click', () => applyFontSize(uiState.fontSize[skill] - 10));
    toolbarParts.larger.addEventListener('click', () => applyFontSize(uiState.fontSize[skill] + 10));
    applyFontSize(uiState.fontSize[skill]);
    activateSection(uiState.activeSection[skill], false);

    pane.append(toolbarParts.toolbar, viewport);
    return { pane, toolbar: toolbarParts.toolbar, viewport, sectionNodes, items, activateSection };
  }

  function createQuestionNav(skill, source) {
    const wrap = document.createElement('div');
    wrap.className = 'cbt-question-nav-wrap';
    const nav = document.createElement('nav');
    nav.className = 'cbt-question-nav';
    nav.setAttribute('aria-label', 'Điều hướng câu hỏi');
    const legend = document.createElement('p');
    legend.className = 'cbt-nav-legend';
    legend.textContent = 'Viền xanh: đang chọn · Xanh lá: đã làm · Gạch vàng: cần xem lại';
    wrap.append(nav, legend);

    let activeNumber = '';
    const itemByNumber = new Map(source.items.map(item => [item.number, item]));

    function updateItem(item) {
      const answered = Boolean(item.field.value.trim());
      const flagged = Boolean(uiState.flags[skill][item.number]);
      const active = activeNumber === item.number;
      const targetItems = source.items.filter(candidate => candidate.target === item.target);
      item.target.classList.toggle('is-answered', targetItems.some(candidate => Boolean(candidate.field.value.trim())));
      item.target.classList.toggle('is-flagged', targetItems.some(candidate => Boolean(uiState.flags[skill][candidate.number])));
      item.target.classList.toggle('is-active', targetItems.some(candidate => activeNumber === candidate.number));
      item.flagButton.classList.toggle('is-flagged', flagged);
      const button = nav.querySelector('[data-nav-number="' + item.number + '"]');
      if (button) {
        button.classList.toggle('is-answered', answered);
        button.classList.toggle('is-flagged', flagged);
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-label', 'Câu ' + item.number + (answered ? ', đã làm' : ', chưa làm') + (flagged ? ', đã đánh dấu' : ''));
      }
    }

    function refreshAll() {
      source.items.forEach(updateItem);
    }

    function focusItem(item) {
      activeNumber = item.number;
      source.activateSection(item.sectionIndex, false);
      window.requestAnimationFrame(() => {
        item.target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        const focusTarget = item.radios.find(radio => radio.checked) || item.radios[0] || item.field;
        focusTarget.focus({ preventScroll: true });
        refreshAll();
      });
    }

    [...itemByNumber.values()].sort((a, b) => Number(a.number) - Number(b.number)).forEach(item => {
      const button = makeButton('cbt-question-button', item.number);
      button.dataset.navNumber = item.number;
      button.addEventListener('click', () => focusItem(item));
      nav.append(button);

      item.field.addEventListener('input', refreshAll);
      item.field.addEventListener('focus', () => {
        activeNumber = item.number;
        refreshAll();
      });
      item.radios.forEach(radio => radio.addEventListener('focus', () => {
        activeNumber = item.number;
        refreshAll();
      }));
      item.flagButton.addEventListener('click', event => {
        event.preventDefault();
        uiState.flags[skill][item.number] = !uiState.flags[skill][item.number];
        saveUiState();
        updateItem(item);
      });
    });
    refreshAll();
    return wrap;
  }

  // Dữ liệu vào: bộ đếm câu đã làm và nút nộp gốc của từng kỹ năng.
  // Việc chính: đặt hai phần tử cạnh nhau trên thanh tiêu đề và xóa khung chân trang rỗng.
  // Kết quả: nút nộp vẫn nằm trong form nên validation, trạng thái bận và API giữ nguyên.
  // Khi thiếu phần tử: không thay đổi DOM của form để luồng nộp bài cũ tiếp tục hoạt động.
  function placeSubmitInHeading(skill, heading, actions) {
    const count = document.getElementById(skill + 'Count');
    const submit = actions.querySelector('button[type="submit"]');
    if (!count || !submit) return false;

    const cluster = document.createElement('div');
    cluster.className = 'cbt-heading-actions';
    submit.classList.add('cbt-heading-submit');
    cluster.append(count, submit);
    heading.append(cluster);
    actions.remove();
    return true;
  }

  function enhanceForm(skill) {
    const form = document.getElementById(skill + 'View');
    const grid = document.getElementById(skill + 'Questions');
    const heading = form?.querySelector('.section-heading');
    const actions = form?.querySelector('.form-actions');
    if (!form || !grid || !heading || !actions) return null;

    const fields = collectFields(grid);
    const submitMoved = placeSubmitInHeading(skill, heading, actions);
    const source = createSemanticPane(skill, contentConfig[skill], heading, fields);
    grid.className = 'questions-grid cbt-semantic-stage';
    grid.replaceChildren(source.pane);
    const nav = createQuestionNav(skill, source);
    if (submitMoved) {
      form.append(nav);
    } else {
      actions.classList.add('cbt-form-actions');
      form.insertBefore(nav, actions);
    }
    form.classList.add('cbt-test-form', 'cbt-' + skill + '-form');
    return { form, source };
  }

  // Dữ liệu vào: file audio gốc và thời điểm đã nghe trong sessionStorage.
  // Việc chính: phát một chiều, hiển thị tiến độ và lưu vị trí mỗi năm giây.
  // Kết quả: tải lại trang có thể tiếp tục đúng vị trí; học viên không có thanh tua.
  // Khi lỗi: hiện thông báo ngay trên trình phát, không làm mất bài đang nhập.
  function setupAudio(listeningForm) {
    if (!listeningForm) return;
    const card = document.createElement('section');
    card.className = 'cbt-audio-card';
    card.setAttribute('aria-label', 'Trình phát audio Listening');
    const copy = document.createElement('div');
    copy.className = 'cbt-audio-copy';
    const label = document.createElement('strong');
    label.textContent = contentConfig.audio.label;
    const status = document.createElement('span');
    status.className = 'cbt-audio-status';
    status.textContent = 'Đang chuẩn bị audio...';
    copy.append(label, status);

    const controls = document.createElement('div');
    controls.className = 'cbt-audio-controls';
    const playButton = makeButton('cbt-audio-play', uiState.audio.started ? 'Tiếp tục audio' : 'Bắt đầu phát audio');
    const progress = document.createElement('progress');
    progress.className = 'cbt-audio-progress';
    progress.max = 1;
    progress.value = 0;
    const volume = document.createElement('label');
    volume.className = 'cbt-volume';
    volume.append(document.createTextNode('Âm lượng'));
    const volumeInput = document.createElement('input');
    volumeInput.type = 'range';
    volumeInput.min = '0.1';
    volumeInput.max = '1';
    volumeInput.step = '0.1';
    volumeInput.value = String(uiState.audio.volume);
    volume.append(volumeInput);
    controls.append(playButton, progress, volume);
    card.append(copy, controls);
    listeningForm.source.toolbar.append(card);

    const audio = document.createElement('audio');
    audio.src = contentConfig.audio.src;
    audio.preload = 'metadata';
    audio.volume = uiState.audio.volume;
    audio.hidden = true;
    card.append(audio);
    let lastSavedSecond = Math.floor(uiState.audio.time);
    let restored = false;

    function restoreAudioTime() {
      if (restored || !Number.isFinite(audio.duration)) return;
      const safeTime = Math.min(Math.max(0, uiState.audio.time), Math.max(0, audio.duration - 1));
      if (safeTime > 0) audio.currentTime = safeTime;
      restored = true;
    }

    function updateAudioStatus(prefix) {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      progress.max = duration || 1;
      progress.value = current;
      status.textContent = prefix + ' · ' + formatTime(current) + ' / ' + (duration ? formatTime(duration) : contentConfig.audio.durationLabel);
    }

    audio.addEventListener('loadedmetadata', () => {
      restoreAudioTime();
      updateAudioStatus(uiState.audio.started ? 'Sẵn sàng tiếp tục' : 'Sẵn sàng');
    });
    audio.addEventListener('timeupdate', () => {
      updateAudioStatus(audio.paused ? 'Đã dừng' : 'Đang phát');
      const currentSecond = Math.floor(audio.currentTime);
      if (currentSecond - lastSavedSecond >= 5) {
        lastSavedSecond = currentSecond;
        uiState.audio.time = audio.currentTime;
        saveUiState();
      }
    });
    audio.addEventListener('ended', () => {
      uiState.audio.time = audio.duration || uiState.audio.time;
      playButton.disabled = true;
      playButton.textContent = 'Đã phát xong';
      updateAudioStatus('Đã phát xong');
      saveUiState();
    });
    audio.addEventListener('error', () => {
      status.textContent = 'Không tải được audio. Hãy kiểm tra mạng rồi tải lại trang.';
      playButton.disabled = false;
    });

    playButton.addEventListener('click', async () => {
      restoreAudioTime();
      try {
        await audio.play();
        uiState.audio.started = true;
        playButton.disabled = true;
        playButton.textContent = 'Audio đang phát';
        updateAudioStatus('Đang phát');
        saveUiState();
      } catch {
        status.textContent = 'Trình duyệt chưa cho phép phát audio. Hãy nhấn lại nút phát.';
        playButton.disabled = false;
      }
    });
    volumeInput.addEventListener('input', () => {
      const nextVolume = Number(volumeInput.value);
      audio.volume = nextVolume;
      uiState.audio.volume = nextVolume;
      saveUiState();
    });
    listeningForm.form.addEventListener('submit', () => {
      audio.pause();
      uiState.audio.time = audio.currentTime;
      saveUiState();
    });
    window.addEventListener('pagehide', () => {
      uiState.audio.time = audio.currentTime;
      saveUiState();
    });
  }

  document.body.classList.add('cbt-mode', 'cbt-semantic-mode');
  compactIdentityPanel();
  const topbarTitle = document.querySelector('.topbar h1');
  const topbarIntro = document.querySelector('.topbar h1 + p');
  if (topbarTitle) topbarTitle.textContent = contentConfig.title;
  if (topbarIntro) topbarIntro.textContent = 'Đề và bài làm nằm trong cùng một giao diện HTML như bài thi IELTS trên máy. Hệ thống lưu bài, chấm điểm và trả kết quả vẫn giữ nguyên.';

  const loadingLabel = document.querySelector('#loadingView strong');
  const listeningSavedCopy = document.querySelector('#listeningSavedView > p:not(.eyebrow)');
  if (loadingLabel) loadingLabel.textContent = 'Đang chuẩn bị đề thi HTML...';
  if (listeningSavedCopy) listeningSavedCopy.textContent = 'Hệ thống đã ghi bài Listening. Khi sẵn sàng, mở Reading để đọc passage và làm câu hỏi ngay trong giao diện.';

  const listeningInstructions = document.getElementById('listeningInstructions');
  const readingInstructions = document.getElementById('readingInstructions');
  if (listeningInstructions) replaceInstructions(listeningInstructions, contentConfig.listening.instructions);
  if (readingInstructions) replaceInstructions(readingInstructions, contentConfig.reading.instructions);

  const listeningForm = enhanceForm('listening');
  enhanceForm('reading');
  setupAudio(listeningForm);
  window.addEventListener('pagehide', saveUiState);
}());
