(function () {
  'use strict';

  const contentConfig = window.TERM_TEST_CONTENT;
  const testConfig = window.TERM_TEST_CONFIG;
  const classCode = (new URLSearchParams(window.location.search).get('class') || '').trim().toUpperCase();

  if (!contentConfig || !testConfig || contentConfig.baseTestSlug !== testConfig.slug) {
    return;
  }

  const uiStorageKey = 'izone-test-ui:' + testConfig.slug + ':' + classCode;
  const uiState = readUiState();

  // Dữ liệu vào: trạng thái đánh dấu, mức phóng to và vị trí audio trong tab hiện tại.
  // Việc chính: đọc an toàn rồi bổ sung giá trị mặc định cho từng phần thi.
  // Kết quả: tải lại trang không làm mất bố cục đang dùng hoặc câu đã đánh dấu.
  // Khi lỗi: dùng cấu hình mặc định; luồng nộp bài gốc vẫn hoạt động.
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
      zoom: {
        listening: Number(stored.zoom?.listening) || 100,
        reading: Number(stored.zoom?.reading) || 100
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
      // sessionStorage có thể bị chặn; shared/app.js vẫn giữ toàn bộ luồng làm bài.
    }
  }

  function makeButton(className, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    return button;
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
      const number = field.dataset.number;
      field.setAttribute('aria-label', 'Câu ' + number);
      field.title = 'Câu ' + number;
      if (field.tagName === 'INPUT') {
        field.placeholder = 'Nhập đáp án';
      } else if (field.options[0]) {
        field.options[0].textContent = '—';
      }
      fields.set(number, field);
    });
    return fields;
  }

  function createInlineAnswer(skill, answer, fields) {
    const number = String(answer.number);
    const field = fields.get(number);
    if (!field) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'cbt-inline-answer';
    wrapper.classList.add(field.tagName === 'SELECT' ? 'is-select' : 'is-text');
    wrapper.dataset.questionNumber = number;
    wrapper.style.left = answer.x + '%';
    wrapper.style.top = answer.y + '%';
    wrapper.style.width = answer.width + '%';

    const badge = document.createElement('span');
    badge.className = 'cbt-inline-number';
    badge.textContent = number;
    badge.setAttribute('aria-hidden', 'true');

    const flagButton = makeButton('cbt-inline-flag', '⚑');
    flagButton.setAttribute('aria-label', 'Đánh dấu câu ' + number);
    flagButton.title = 'Đánh dấu để xem lại';
    wrapper.append(badge, field, flagButton);
    return { skill, number, field, wrapper, flagButton };
  }

  // Dữ liệu vào: ảnh scan, tọa độ câu hỏi và 40 ô trả lời do shared/app.js dựng.
  // Việc chính: đặt từng ô lên đúng phần trống tương ứng trong trang đề.
  // Kết quả: học viên thao tác trực tiếp trên đề nhưng dữ liệu vẫn đi qua code cũ.
  // Khi ảnh lỗi: trình duyệt hiện alt text; test tài nguyên sẽ chặn phát hành.
  function createSourcePanel(skill, sectionConfig, heading, fields) {
    const pane = document.createElement('section');
    pane.className = 'cbt-source-pane';
    pane.setAttribute('aria-label', skill === 'listening' ? 'Đề Listening tương tác' : 'Đề Reading tương tác');

    const toolbar = document.createElement('div');
    toolbar.className = 'cbt-source-toolbar';
    heading.classList.add('cbt-test-heading');

    const titleRow = document.createElement('div');
    titleRow.className = 'cbt-source-toolbar-row';
    const title = document.createElement('strong');
    title.textContent = 'Làm bài trực tiếp trên đề';
    const helper = document.createElement('span');
    helper.className = 'cbt-toolbar-helper';
    helper.textContent = 'Ô xanh là vị trí nhập hoặc chọn đáp án.';
    titleRow.append(title, helper);

    const partRow = document.createElement('div');
    partRow.className = 'cbt-source-toolbar-row';

    const scroll = document.createElement('div');
    scroll.className = 'cbt-source-scroll';
    scroll.tabIndex = 0;

    const items = [];
    const pageFrames = [];
    const documentSections = sectionConfig.sections.map((section, sectionIndex) => {
      const sectionNode = document.createElement('section');
      sectionNode.className = 'cbt-document-section';
      sectionNode.id = 'cbt-' + skill + '-section-' + (sectionIndex + 1);

      const sectionHeading = document.createElement('h3');
      sectionHeading.textContent = section.label;
      const stack = document.createElement('div');
      stack.className = 'cbt-page-stack';

      section.pages.forEach((page, pageIndex) => {
        const frame = document.createElement('div');
        frame.className = 'cbt-page-frame';
        frame.dataset.pageSrc = page.src;

        const image = document.createElement('img');
        image.className = 'cbt-page';
        image.src = page.src;
        image.loading = pageIndex === 0 && sectionIndex === 0 ? 'eager' : 'lazy';
        image.decoding = 'async';
        image.alt = section.label + ' · trang ' + (pageIndex + 1);

        const layer = document.createElement('div');
        layer.className = 'cbt-answer-layer';
        layer.setAttribute('aria-label', 'Các ô trả lời trên trang đề');
        (page.answers || []).forEach(answer => {
          const item = createInlineAnswer(skill, answer, fields);
          if (!item) return;
          items.push(item);
          layer.append(item.wrapper);
        });

        frame.append(image, layer);
        stack.append(frame);
        pageFrames.push(frame);
      });

      sectionNode.append(sectionHeading, stack);
      scroll.append(sectionNode);

      const partButton = makeButton('cbt-part-button', section.label.replace('Questions', 'Q'));
      partButton.addEventListener('click', () => {
        sectionNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      partRow.append(partButton);
      return sectionNode;
    });

    const zoomRow = document.createElement('div');
    zoomRow.className = 'cbt-source-toolbar-row cbt-zoom-row';
    const zoomOut = makeButton('cbt-tool-button', '−');
    zoomOut.setAttribute('aria-label', 'Thu nhỏ đề');
    const zoomLabel = document.createElement('span');
    zoomLabel.className = 'cbt-zoom-label';
    const zoomIn = makeButton('cbt-tool-button', '+');
    zoomIn.setAttribute('aria-label', 'Phóng to đề');
    const fitButton = makeButton('cbt-tool-button', '100%');
    fitButton.setAttribute('aria-label', 'Đưa đề về kích thước 100 phần trăm');

    function applyZoom(nextZoom) {
      uiState.zoom[skill] = Math.min(160, Math.max(80, nextZoom));
      zoomLabel.textContent = uiState.zoom[skill] + '%';
      const baseWidth = Number(contentConfig.pageSize?.width) || 827;
      pageFrames.forEach(frame => {
        frame.style.width = Math.round(baseWidth * uiState.zoom[skill] / 100) + 'px';
      });
      saveUiState();
    }

    zoomOut.addEventListener('click', () => applyZoom(uiState.zoom[skill] - 10));
    zoomIn.addEventListener('click', () => applyZoom(uiState.zoom[skill] + 10));
    fitButton.addEventListener('click', () => applyZoom(100));
    zoomRow.append(zoomOut, zoomLabel, zoomIn, fitButton);
    applyZoom(uiState.zoom[skill]);

    toolbar.append(heading, titleRow, partRow, zoomRow);
    pane.append(toolbar, scroll);
    return { pane, toolbar, scroll, items, documentSections };
  }

  // Dữ liệu vào: các ô đã được ghép lên trang đề.
  // Việc chính: đồng bộ trạng thái đã làm, đánh dấu và điều hướng 40 câu.
  // Kết quả: thanh số câu hoạt động như bài mẫu IZONE và focus đúng ô trên đề.
  // Khi một ô thiếu: test cấu hình sẽ báo trước khi bản mới được phát hành.
  function enhanceQuestions(skill, items) {
    const nav = document.createElement('nav');
    nav.className = 'cbt-question-nav';
    nav.setAttribute('aria-label', 'Điều hướng câu hỏi');
    let activeNumber = '';

    items.sort((a, b) => Number(a.number) - Number(b.number));
    items.forEach(item => {
      const navButton = makeButton('cbt-question-button', item.number);
      navButton.setAttribute('aria-label', 'Mở câu ' + item.number);
      nav.append(navButton);
      item.navButton = navButton;

      function updateStatus() {
        const answered = Boolean(item.field.value.trim());
        const flagged = Boolean(uiState.flags[skill][item.number]);
        item.wrapper.classList.toggle('is-answered', answered);
        item.wrapper.classList.toggle('is-flagged', flagged);
        navButton.classList.toggle('is-answered', answered);
        navButton.classList.toggle('is-flagged', flagged);
        navButton.classList.toggle('is-active', activeNumber === item.number);
        item.flagButton.setAttribute('aria-pressed', String(flagged));
      }

      item.flagButton.addEventListener('click', () => {
        uiState.flags[skill][item.number] = !uiState.flags[skill][item.number];
        updateStatus();
        saveUiState();
      });
      navButton.addEventListener('click', () => {
        activeNumber = item.number;
        items.forEach(other => {
          other.wrapper.classList.toggle('is-active', other.number === item.number);
          other.navButton.classList.toggle('is-active', other.number === item.number);
        });
        item.wrapper.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        window.setTimeout(() => item.field.focus({ preventScroll: true }), 350);
      });
      item.field.addEventListener('focus', () => {
        activeNumber = item.number;
        items.forEach(other => {
          other.wrapper.classList.toggle('is-active', other.number === item.number);
          other.navButton.classList.toggle('is-active', other.number === item.number);
        });
      });
      item.field.addEventListener('input', updateStatus);
      item.field.addEventListener('change', updateStatus);
      updateStatus();
    });

    const wrap = document.createElement('div');
    wrap.className = 'cbt-question-nav-wrap';
    const legend = document.createElement('div');
    legend.className = 'cbt-nav-legend';
    legend.textContent = 'Xanh lá: đã trả lời · Gạch vàng: đã đánh dấu · Xanh đậm: câu đang chọn';
    wrap.append(nav, legend);
    return wrap;
  }

  function enhanceForm(skill) {
    const form = document.getElementById(skill + 'View');
    const heading = form?.querySelector('.section-heading');
    const grid = form?.querySelector('.questions-grid');
    const actions = form?.querySelector('.form-actions');
    if (!form || !heading || !grid || !actions) return null;

    const fields = collectFields(grid);
    const source = createSourcePanel(skill, contentConfig[skill], heading, fields);
    const questionNav = enhanceQuestions(skill, source.items);

    grid.classList.add('cbt-inline-stage');
    grid.replaceChildren(source.pane);
    actions.classList.add('cbt-form-actions');
    form.replaceChildren(grid, questionNav, actions);

    const resetScroll = () => {
      source.scroll.scrollTop = 0;
      source.scroll.scrollLeft = 0;
    };
    window.requestAnimationFrame(resetScroll);
    window.addEventListener('load', resetScroll, { once: true });
    return { form, source };
  }

  function setupAudio(listeningForm) {
    if (!listeningForm || !contentConfig.audio?.src) return;

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

  document.body.classList.add('cbt-mode', 'cbt-inline-mode');
  const topbarTitle = document.querySelector('.topbar h1');
  const topbarIntro = document.querySelector('.topbar h1 + p');
  if (topbarTitle) topbarTitle.textContent = contentConfig.title;
  if (topbarIntro) {
    topbarIntro.textContent = 'Học viên nhập và chọn đáp án ngay trên nội dung đề. Luồng lưu bài, chấm điểm và kết quả vẫn dùng nguyên hệ thống Term Test 2.';
  }

  const loadingLabel = document.querySelector('#loadingState strong');
  const listeningSavedCopy = document.querySelector('#listeningSavedView .transition-card p:not(.eyebrow)');
  if (loadingLabel) loadingLabel.textContent = 'Đang chuẩn bị đề tương tác...';
  if (listeningSavedCopy) {
    listeningSavedCopy.textContent = 'Hệ thống đã ghi bài Listening. Khi sẵn sàng, nhấn nút dưới đây để mở phần Reading và làm trực tiếp trên đề.';
  }

  const listeningInstructions = document.getElementById('listeningInstructions');
  const readingInstructions = document.getElementById('readingInstructions');
  if (listeningInstructions) replaceInstructions(listeningInstructions, contentConfig.listening.instructions);
  if (readingInstructions) replaceInstructions(readingInstructions, contentConfig.reading.instructions);

  const listeningForm = enhanceForm('listening');
  enhanceForm('reading');
  setupAudio(listeningForm);
  window.addEventListener('pagehide', saveUiState);
}());
