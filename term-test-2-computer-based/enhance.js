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

  // Dữ liệu vào: trạng thái bố cục, câu đánh dấu và vị trí audio trong tab hiện tại.
  // Việc chính: đọc an toàn rồi bổ sung giá trị mặc định cho từng kỹ năng.
  // Kết quả: giao diện có thể tiếp tục sau khi tải lại mà không đụng tới mã lượt làm.
  // Khi lỗi: dùng cấu hình mặc định; luồng nộp bài cốt lõi của shared/app.js vẫn hoạt động.
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
      ratios: {
        listening: Number(stored.ratios?.listening) || 52,
        reading: Number(stored.ratios?.reading) || 52
      },
      zoom: {
        listening: Number(stored.zoom?.listening) || 100,
        reading: Number(stored.zoom?.reading) || 100
      },
      mobilePane: {
        listening: stored.mobilePane?.listening === 'answer' ? 'answer' : 'source',
        reading: stored.mobilePane?.reading === 'answer' ? 'answer' : 'source'
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
      // sessionStorage có thể bị chặn; bài làm vẫn được shared/app.js xử lý như cũ.
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

  // Dữ liệu vào: cấu hình các Part/Passage cùng đường dẫn ảnh scan.
  // Việc chính: dựng vùng đề, nút nhảy phần và công cụ phóng to.
  // Kết quả: học viên đọc đúng đề bên cạnh phiếu trả lời, không có đáp án trong DOM.
  // Khi ảnh lỗi: trình duyệt hiện alt text và test tài nguyên sẽ báo trước khi phát hành.
  function createSourcePanel(skill, sectionConfig) {
    const pane = document.createElement('aside');
    pane.className = 'cbt-source-pane';
    pane.setAttribute('aria-label', skill === 'listening' ? 'Đề Listening' : 'Đề Reading');

    const toolbar = document.createElement('div');
    toolbar.className = 'cbt-source-toolbar';

    const titleRow = document.createElement('div');
    titleRow.className = 'cbt-source-toolbar-row';
    const title = document.createElement('strong');
    title.textContent = skill === 'listening' ? 'Đề Listening' : 'Đề Reading';
    titleRow.append(title);

    const partRow = document.createElement('div');
    partRow.className = 'cbt-source-toolbar-row';

    const scroll = document.createElement('div');
    scroll.className = 'cbt-source-scroll';
    scroll.tabIndex = 0;

    const documentSections = sectionConfig.sections.map((section, sectionIndex) => {
      const sectionNode = document.createElement('section');
      sectionNode.className = 'cbt-document-section';
      sectionNode.id = 'cbt-' + skill + '-section-' + (sectionIndex + 1);

      const heading = document.createElement('h3');
      heading.textContent = section.label;
      const stack = document.createElement('div');
      stack.className = 'cbt-page-stack';

      section.pages.forEach((src, pageIndex) => {
        const image = document.createElement('img');
        image.className = 'cbt-page';
        image.src = src;
        image.loading = pageIndex === 0 && sectionIndex === 0 ? 'eager' : 'lazy';
        image.decoding = 'async';
        image.alt = section.label + ' · trang ' + (pageIndex + 1);
        image.style.width = uiState.zoom[skill] + '%';
        stack.append(image);
      });

      sectionNode.append(heading, stack);
      scroll.append(sectionNode);

      const partButton = makeButton('cbt-part-button', section.label.replace('Questions', 'Q'));
      partButton.addEventListener('click', () => {
        sectionNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      partRow.append(partButton);
      return sectionNode;
    });

    const zoomRow = document.createElement('div');
    zoomRow.className = 'cbt-source-toolbar-row';
    const zoomOut = makeButton('cbt-tool-button', '−');
    zoomOut.setAttribute('aria-label', 'Thu nhỏ đề');
    const zoomLabel = document.createElement('span');
    zoomLabel.className = 'cbt-zoom-label';
    const zoomIn = makeButton('cbt-tool-button', '+');
    zoomIn.setAttribute('aria-label', 'Phóng to đề');
    const fitButton = makeButton('cbt-tool-button', 'Vừa khung');

    function applyZoom(nextZoom) {
      uiState.zoom[skill] = Math.min(160, Math.max(80, nextZoom));
      zoomLabel.textContent = uiState.zoom[skill] + '%';
      scroll.querySelectorAll('.cbt-page').forEach(image => {
        image.style.width = uiState.zoom[skill] + '%';
      });
      saveUiState();
    }

    zoomOut.addEventListener('click', () => applyZoom(uiState.zoom[skill] - 10));
    zoomIn.addEventListener('click', () => applyZoom(uiState.zoom[skill] + 10));
    fitButton.addEventListener('click', () => applyZoom(100));
    zoomRow.append(zoomOut, zoomLabel, zoomIn, fitButton);
    applyZoom(uiState.zoom[skill]);

    toolbar.append(titleRow, partRow, zoomRow);
    pane.append(toolbar, scroll);
    return { pane, toolbar, scroll, documentSections };
  }

  function createMobileTabs(skill, workspace) {
    const tabs = document.createElement('div');
    tabs.className = 'cbt-mobile-tabs';
    tabs.setAttribute('aria-label', 'Chọn vùng hiển thị');
    const sourceButton = makeButton('cbt-mobile-tab', 'Đề thi');
    const answerButton = makeButton('cbt-mobile-tab', 'Phiếu trả lời');
    const buttons = { source: sourceButton, answer: answerButton };

    function setMobilePane(pane) {
      workspace.dataset.mobilePane = pane;
      uiState.mobilePane[skill] = pane;
      Object.entries(buttons).forEach(([name, button]) => {
        const active = name === pane;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      saveUiState();
    }

    sourceButton.addEventListener('click', () => setMobilePane('source'));
    answerButton.addEventListener('click', () => setMobilePane('answer'));
    tabs.append(sourceButton, answerButton);
    setMobilePane(uiState.mobilePane[skill]);
    return { tabs, setMobilePane };
  }

  function setupResizer(skill, workspace, resizer) {
    function applyRatio(ratio) {
      const safeRatio = Math.min(68, Math.max(35, ratio));
      uiState.ratios[skill] = safeRatio;
      workspace.style.setProperty('--source-width', safeRatio + '%');
      resizer.setAttribute('aria-valuenow', String(Math.round(safeRatio)));
      saveUiState();
    }

    function updateFromPointer(event) {
      const bounds = workspace.getBoundingClientRect();
      if (!bounds.width) return;
      applyRatio(((event.clientX - bounds.left) / bounds.width) * 100);
    }

    resizer.addEventListener('pointerdown', event => {
      resizer.setPointerCapture(event.pointerId);
      updateFromPointer(event);
    });
    resizer.addEventListener('pointermove', event => {
      if (resizer.hasPointerCapture(event.pointerId)) updateFromPointer(event);
    });
    resizer.addEventListener('pointerup', event => {
      if (resizer.hasPointerCapture(event.pointerId)) resizer.releasePointerCapture(event.pointerId);
    });
    resizer.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        applyRatio(uiState.ratios[skill] - 2);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        applyRatio(uiState.ratios[skill] + 2);
      }
    });
    applyRatio(uiState.ratios[skill]);
  }

  // Dữ liệu vào: 40 ô trả lời do shared/app.js đã dựng.
  // Việc chính: thêm trạng thái đã làm/đánh dấu, điều hướng và điểm focus.
  // Kết quả: học viên nhảy nhanh tới từng câu; dữ liệu trả lời vẫn do code cũ lưu/nộp.
  // Khi enhancement lỗi: form gốc vẫn giữ nguyên các ô và nút nộp.
  function enhanceQuestions(skill, grid, setMobilePane) {
    const shells = [];
    const nav = document.createElement('nav');
    nav.className = 'cbt-question-nav';
    nav.setAttribute('aria-label', 'Điều hướng câu hỏi');
    let activeNumber = '';

    grid.querySelectorAll('.question').forEach(question => {
      const field = question.querySelector('[data-number]');
      if (!field) return;
      const number = field.dataset.number;
      const shell = document.createElement('div');
      shell.className = 'cbt-question-shell';
      shell.dataset.questionNumber = number;
      question.before(shell);
      shell.append(question);

      const flagButton = makeButton('cbt-flag-button', '⚑');
      flagButton.setAttribute('aria-label', 'Đánh dấu câu ' + number);
      flagButton.title = 'Đánh dấu để xem lại';
      shell.append(flagButton);

      const navButton = makeButton('cbt-question-button', number);
      navButton.setAttribute('aria-label', 'Mở câu ' + number);
      nav.append(navButton);
      shells.push({ number, field, shell, flagButton, navButton });

      function updateStatus() {
        const answered = Boolean(field.value.trim());
        const flagged = Boolean(uiState.flags[skill][number]);
        shell.classList.toggle('is-flagged', flagged);
        navButton.classList.toggle('is-answered', answered);
        navButton.classList.toggle('is-flagged', flagged);
        navButton.classList.toggle('is-active', activeNumber === number);
        flagButton.setAttribute('aria-pressed', String(flagged));
      }

      flagButton.addEventListener('click', () => {
        uiState.flags[skill][number] = !uiState.flags[skill][number];
        updateStatus();
        saveUiState();
      });
      navButton.addEventListener('click', () => {
        setMobilePane('answer');
        activeNumber = number;
        shells.forEach(item => {
          item.shell.classList.toggle('is-active', item.number === number);
          item.navButton.classList.toggle('is-active', item.number === number);
        });
        shell.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => field.focus({ preventScroll: true }), 350);
      });
      field.addEventListener('focus', () => {
        activeNumber = number;
        shells.forEach(item => {
          item.shell.classList.toggle('is-active', item.number === number);
          item.navButton.classList.toggle('is-active', item.number === number);
        });
      });
      field.addEventListener('input', updateStatus);
      field.addEventListener('change', updateStatus);
      updateStatus();
    });

    const wrap = document.createElement('div');
    wrap.className = 'cbt-question-nav-wrap';
    const legend = document.createElement('div');
    legend.className = 'cbt-nav-legend';
    legend.textContent = 'Xanh: đã trả lời · Gạch vàng: đã đánh dấu · Xanh đậm: câu đang chọn';
    wrap.append(nav, legend);
    return wrap;
  }

  function enhanceForm(skill) {
    const form = document.getElementById(skill + 'View');
    const heading = form?.querySelector('.section-heading');
    const grid = form?.querySelector('.questions-grid');
    const actions = form?.querySelector('.form-actions');
    if (!form || !heading || !grid || !actions) return null;

    const workspace = document.createElement('div');
    workspace.className = 'cbt-workspace';
    const mobileTabs = createMobileTabs(skill, workspace);
    const source = createSourcePanel(skill, contentConfig[skill]);
    const resizer = document.createElement('div');
    resizer.className = 'cbt-resizer';
    resizer.tabIndex = 0;
    resizer.setAttribute('role', 'separator');
    resizer.setAttribute('aria-label', 'Đổi độ rộng vùng đề và phiếu trả lời');
    resizer.setAttribute('aria-orientation', 'vertical');
    resizer.setAttribute('aria-valuemin', '35');
    resizer.setAttribute('aria-valuemax', '68');

    const answerPane = document.createElement('section');
    answerPane.className = 'cbt-answer-pane';
    answerPane.setAttribute('aria-label', skill === 'listening' ? 'Phiếu trả lời Listening' : 'Phiếu trả lời Reading');
    const questionNav = enhanceQuestions(skill, grid, mobileTabs.setMobilePane);
    actions.classList.add('cbt-form-actions');
    answerPane.append(heading, grid, questionNav, actions);
    workspace.append(source.pane, resizer, answerPane);
    form.replaceChildren(mobileTabs.tabs, workspace);
    setupResizer(skill, workspace, resizer);
    const resetScroll = () => {
      source.scroll.scrollTop = 0;
      answerPane.scrollTop = 0;
    };
    window.requestAnimationFrame(resetScroll);
    window.addEventListener('load', resetScroll, { once: true });
    return { form, source, answerPane, workspace, setMobilePane: mobileTabs.setMobilePane };
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

  document.body.classList.add('cbt-mode');
  const topbarTitle = document.querySelector('.topbar h1');
  const topbarIntro = document.querySelector('.topbar h1 + p');
  if (topbarTitle) topbarTitle.textContent = contentConfig.title;
  if (topbarIntro) {
    topbarIntro.textContent = 'Đề thi và phiếu trả lời nằm trên cùng một màn hình. Kết quả vẫn được lưu, chấm và phân tích bằng hệ thống Term Test 2 hiện tại.';
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
