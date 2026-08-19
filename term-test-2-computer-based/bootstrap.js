(function () {
  'use strict';

  const testConfig = window.TERM_TEST_CONFIG;
  const appConfig = window.TERM_TEST_APP_CONFIG;
  const audioLoader = window.TERM_TEST_AUDIO_LOADER;
  const root = document.getElementById('app');
  const query = new URLSearchParams(window.location.search);
  const classCode = (query.get('class') || '').trim().toUpperCase();
  if (!testConfig || !appConfig || !audioLoader || !root) return;
  document.body.classList.add('cbt-mode');

  const storageKey = `izone-test:${testConfig.slug}:${classCode}`;
  const uiStorageKey = `izone-test-ui:${testConfig.slug}:${classCode}`;
  let state = readState();
  const legacyUiState = readLegacyUiState();
  let legacyListeningResume = Boolean(state.studentRef && !state.attemptToken && legacyUiState.audioStarted);
  let roster = [];
  let encryptedAudio = null;
  let previewObjectUrl = '';
  let officialObjectUrl = '';
  let previewHeard = false;
  let preparing = false;
  let downloadController = null;

  root.innerHTML = `
    <header class="topbar cbt-bootstrap-topbar">
      <h1>Term test 2</h1>
    </header>
    <main class="page-shell cbt-bootstrap-shell">
      <section class="panel cbt-bootstrap-card" aria-labelledby="securePrepTitle">
        <header class="cbt-lobby-header">
          <span class="cbt-lobby-badge">Phòng chờ Listening</span>
          <h2 id="securePrepTitle">Kiểm tra âm thanh trước khi bắt đầu</h2>
          <p>Đề thi đang được khóa. Audio chính được tải dưới dạng mã hóa và chỉ mở khi bạn bấm Bắt đầu.</p>
        </header>
        <div class="cbt-bootstrap-identity">
          <strong id="bootstrapClass">Lớp ${escapeText(classCode)}</strong>
          <label>Họ và tên
            <select id="bootstrapStudent" required>
              <option value="">Nhấn để chọn</option>
            </select>
          </label>
        </div>
        <div class="cbt-lobby-steps">
          <section class="cbt-lobby-step" id="bootstrapDownloadStep" data-state="locked">
            <span class="cbt-lobby-step-number">1</span>
            <div class="cbt-lobby-step-body">
              <h3>Tải đủ audio đã mã hóa</h3>
              <p>Chọn họ tên rồi chờ thanh tải đạt 100%.</p>
              <strong class="cbt-audio-status cbt-lobby-download-status" id="bootstrapDownloadStatus" role="status">Đang tải danh sách lớp...</strong>
              <progress class="cbt-audio-progress" id="bootstrapDownloadProgress" max="1" value="0"></progress>
              <button class="button button-secondary" id="bootstrapRetry" type="button" hidden>Thử tải lại</button>
            </div>
          </section>
          <section class="cbt-lobby-step" id="bootstrapPreviewStep" data-state="locked">
            <span class="cbt-lobby-step-number">2</span>
            <div class="cbt-lobby-step-body">
              <h3>Nghe thử 30 giây</h3>
              <p>Bản nghe thử chỉ có 30 giây đầu. Âm lượng này được giữ cho bài thi chính.</p>
              <div class="cbt-lobby-preview-controls">
                <button class="button button-secondary" id="bootstrapPreview" type="button" disabled>Nghe thử 30 giây đầu</button>
                <label class="cbt-volume cbt-lobby-volume"><span>Âm lượng</span><input id="bootstrapVolume" type="range" min="0.1" max="1" step="0.1" value="${Number(state.audioVolume) || legacyUiState.audioVolume || 1}" disabled></label>
              </div>
              <span class="cbt-preview-status" id="bootstrapPreviewStatus" role="status">Chờ tải audio xong.</span>
            </div>
          </section>
          <section class="cbt-lobby-step" id="bootstrapStartStep" data-state="locked">
            <span class="cbt-lobby-step-number">3</span>
            <div class="cbt-lobby-step-body">
              <h3>Bắt đầu thi</h3>
              <p id="bootstrapStartStatus">Đề và audio chính chỉ mở sau nút này.</p>
              <button class="button button-primary" id="bootstrapStart" type="button" disabled>Bắt đầu thi Listening</button>
            </div>
          </section>
        </div>
        <div class="notice" id="bootstrapNotice" role="status" hidden></div>
      </section>
    </main>`;

  const elements = Object.fromEntries([
    'bootstrapStudent', 'bootstrapClass', 'bootstrapDownloadStep', 'bootstrapDownloadStatus',
    'bootstrapDownloadProgress', 'bootstrapRetry', 'bootstrapPreviewStep', 'bootstrapPreview',
    'bootstrapVolume', 'bootstrapPreviewStatus', 'bootstrapStartStep', 'bootstrapStartStatus',
    'bootstrapStart', 'bootstrapNotice'
  ].map(id => [id, document.getElementById(id)]));
  const previewAudio = document.createElement('audio');
  previewAudio.hidden = true;
  document.body.append(previewAudio);

  function escapeText(value) {
    return String(value || '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function readState() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const parsed = JSON.parse(storage.getItem(storageKey) || '{}');
        if (Object.keys(parsed).length) return parsed;
      } catch {
        // Tiếp tục với nguồn bộ nhớ còn lại.
      }
    }
    return {};
  }

  function readLegacyUiState() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const parsed = JSON.parse(storage.getItem(uiStorageKey) || '{}');
        if (Object.keys(parsed).length) {
          return {
            audioStarted: Boolean(parsed.audio?.started),
            audioTime: Math.min(1844, Math.max(0, Math.floor(Number(parsed.audio?.time) || 0))),
            audioVolume: Math.min(1, Math.max(0.1, Number(parsed.audio?.volume) || 1))
          };
        }
      } catch {
        // Dữ liệu giao diện cũ lỗi thì bắt đầu theo phòng chờ mới.
      }
    }
    return { audioStarted: false, audioTime: 0, audioVolume: 1 };
  }

  function saveState(patch = {}) {
    state = { ...state, ...patch };
    const serialized = JSON.stringify(state);
    for (const storage of [sessionStorage, localStorage]) {
      try {
        storage.setItem(storageKey, serialized);
      } catch {
        // Phiên thi chính vẫn nằm trên máy chủ nếu bộ nhớ trình duyệt bị chặn.
      }
    }
  }

  function showNotice(message, error = false) {
    elements.bootstrapNotice.hidden = false;
    elements.bootstrapNotice.className = `notice${error ? ' error' : ''}`;
    elements.bootstrapNotice.textContent = message;
  }

  async function apiRequest(path, options = {}, timeoutMs = 30_000) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(appConfig.API_BASE_URL + path, { ...options, signal: controller.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Lỗi HTTP ${response.status}`);
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Máy chủ phản hồi quá chậm. Hãy thử lại.');
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function formatBytes(bytes) {
    return `${(Number(bytes || 0) / 1024 / 1024).toFixed(1)} MB`;
  }

  function setStartAvailability() {
    const resumed = Boolean(state.listeningStartedAt || legacyListeningResume);
    const ready = Boolean(encryptedAudio && (previewHeard || resumed));
    elements.bootstrapStart.disabled = !ready || preparing;
    elements.bootstrapStart.textContent = resumed ? 'Tiếp tục bài thi Listening' : 'Bắt đầu thi Listening';
    elements.bootstrapStartStatus.textContent = resumed
      ? 'Đồng hồ máy chủ vẫn đang chạy. Tiếp tục ngay sau khi audio tải đủ.'
      : 'Sau khi bấm, đồng hồ máy chủ bắt đầu và đề mới được mở.';
  }

  function revokePreview() {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = '';
  }

  async function downloadForSession(session) {
    downloadController?.abort();
    downloadController = new AbortController();
    encryptedAudio = null;
    const resuming = Boolean(session.listeningStartedAt || legacyListeningResume);
    previewHeard = resuming;
    elements.bootstrapDownloadStep.dataset.state = 'active';
    elements.bootstrapPreviewStep.dataset.state = 'locked';
    elements.bootstrapStartStep.dataset.state = 'locked';
    elements.bootstrapRetry.hidden = true;
    elements.bootstrapPreview.disabled = true;
    elements.bootstrapVolume.disabled = true;
    elements.bootstrapDownloadStatus.textContent = 'Đang tải audio đã mã hóa...';
    elements.bootstrapDownloadProgress.max = 1;
    elements.bootstrapDownloadProgress.value = 0;
    try {
      const audioUrl = appConfig.API_BASE_URL + session.encryptedAudioUrl;
      const previewUrl = appConfig.API_BASE_URL + session.previewAudioUrl;
      const [encrypted, previewResponse] = await Promise.all([
        audioLoader.downloadAudio(audioUrl, {
          signal: downloadController.signal,
          onProgress: ({ loaded, total, complete }) => {
            if (total > 0) {
              elements.bootstrapDownloadProgress.max = total;
              elements.bootstrapDownloadProgress.value = loaded;
              const percent = Math.min(100, Math.round(loaded * 100 / total));
              elements.bootstrapDownloadStatus.textContent = `${complete ? 'Đã tải đủ audio mã hóa' : 'Đang tải audio mã hóa'} · ${percent}% · ${formatBytes(loaded)} / ${formatBytes(total)}`;
            } else {
              elements.bootstrapDownloadProgress.removeAttribute('value');
              elements.bootstrapDownloadStatus.textContent = `Đang tải audio mã hóa · ${formatBytes(loaded)}`;
            }
          }
        }),
        fetch(previewUrl, { cache: 'no-store', signal: downloadController.signal })
      ]);
      if (!previewResponse.ok) throw new Error('Không tải được bản nghe thử.');
      encryptedAudio = encrypted;
      const previewBlob = await previewResponse.blob();
      revokePreview();
      previewObjectUrl = URL.createObjectURL(previewBlob);
      previewAudio.src = previewObjectUrl;
      previewAudio.volume = Number(elements.bootstrapVolume.value) || 1;
      elements.bootstrapDownloadProgress.max = 1;
      elements.bootstrapDownloadProgress.value = 1;
      elements.bootstrapDownloadStatus.textContent = `Đã tải đủ audio mã hóa · 100% · ${formatBytes(encrypted.size)}`;
      elements.bootstrapDownloadStep.dataset.state = 'complete';
      elements.bootstrapVolume.disabled = false;
      if (resuming) {
        elements.bootstrapPreviewStep.dataset.state = 'skipped';
        elements.bootstrapPreview.hidden = true;
        elements.bootstrapPreviewStatus.textContent = 'Bài thi đã bắt đầu nên chế độ nghe thử đã đóng.';
        elements.bootstrapStartStep.dataset.state = 'active';
      } else {
        elements.bootstrapPreviewStep.dataset.state = 'active';
        elements.bootstrapPreview.disabled = false;
        elements.bootstrapPreviewStatus.textContent = 'Bấm nút để nghe thử và chỉnh âm lượng.';
      }
      setStartAvailability();
    } catch (error) {
      if (error.name === 'AbortError') return;
      elements.bootstrapDownloadStep.dataset.state = 'error';
      elements.bootstrapDownloadStatus.textContent = 'Chưa tải đủ audio. Bài thi vẫn đang khóa.';
      elements.bootstrapRetry.hidden = false;
      showNotice(error.message, true);
    }
  }

  async function prepareSelectedStudent() {
    const studentRef = elements.bootstrapStudent.value;
    const student = roster.find(item => item.ref === studentRef);
    if (!student || preparing) return;
    preparing = true;
    saveState({ studentRef, studentName: student.name });
    elements.bootstrapStudent.disabled = true;
    try {
      if (state.attemptToken) {
        await resumeAfterListening();
        return;
      }
      const prepared = await apiRequest(`/api/term-tests/${testConfig.slug}/session/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classCode,
          studentRef,
          examSessionToken: state.examSessionToken || undefined,
          legacyElapsedSeconds: legacyListeningResume ? legacyUiState.audioTime : 0
        })
      });
      saveState({
        examSessionToken: prepared.examSessionToken,
        listeningStartedAt: prepared.listeningStartedAt,
        listeningDeadlineAt: prepared.listeningDeadlineAt,
        attemptToken: prepared.attemptToken || state.attemptToken || ''
      });
      if (state.attemptToken || prepared.listeningSubmitted) {
        await resumeAfterListening();
        return;
      }
      await downloadForSession(prepared);
    } catch (error) {
      elements.bootstrapStudent.disabled = false;
      showNotice(`Chưa chuẩn bị được bài thi: ${error.message}`, true);
    } finally {
      preparing = false;
      elements.bootstrapStudent.disabled = Boolean(state.listeningStartedAt);
      setStartAvailability();
    }
  }

  function base64Bytes(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, character => character.charCodeAt(0));
  }

  async function decryptOfficialAudio(blob, response) {
    const envelope = new Uint8Array(await blob.arrayBuffer());
    const magic = new TextDecoder().decode(envelope.subarray(0, 5));
    if (magic !== response.audioEnvelope.magic) throw new Error('Gói audio mã hóa không hợp lệ.');
    const ivStart = 5;
    const ivEnd = ivStart + response.audioEnvelope.ivBytes;
    const key = await crypto.subtle.importKey('raw', base64Bytes(response.audioKey), 'AES-GCM', false, ['decrypt']);
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: envelope.subarray(ivStart, ivEnd) }, key, envelope.subarray(ivEnd));
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', () => reject(new Error(`Không nạp được ${src}.`)), { once: true });
      document.body.append(script);
    });
  }

  async function enterExam(started, audioElement = null) {
    window.TERM_TEST_CONTENT = Object.freeze(started.content);
    window.TERM_TEST_BOOTSTRAP = Object.freeze({
      examSessionToken: state.examSessionToken,
      listeningDeadlineAt: started.listeningDeadlineAt,
      serverNow: started.serverNow,
      audioVolume: Number(state.audioVolume) || 1,
      officialAudioElement: audioElement,
      officialAudioUrl: officialObjectUrl,
      skipListeningAudio: Boolean(state.attemptToken || started.listeningSubmitted)
    });
    previewAudio.remove();
    revokePreview();
    await loadScript('../shared/app.js?rev=20260819-cbt-v22');
    await loadScript('enhance.js?rev=20260819-cbt-v22');
  }

  async function resumeAfterListening() {
    const started = await apiRequest(`/api/term-tests/${testConfig.slug}/session/resume-attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classCode,
        studentRef: state.studentRef,
        attemptToken: state.attemptToken
      })
    });
    saveState({
      examSessionToken: started.examSessionToken || state.examSessionToken || '',
      listeningStartedAt: started.listeningStartedAt || state.listeningStartedAt || '',
      listeningDeadlineAt: started.listeningDeadlineAt || state.listeningDeadlineAt || '',
      readingStartedAt: started.readingStartedAt || state.readingStartedAt || '',
      readingDeadlineAt: started.readingDeadlineAt || state.readingDeadlineAt || '',
      writingStartedAt: started.writingStartedAt || state.writingStartedAt || '',
      writingDeadlineAt: started.writingDeadlineAt || state.writingDeadlineAt || '',
      serverTimeOffsetMs: Date.parse(started.serverNow) - Date.now(),
      attemptToken: started.attemptToken || state.attemptToken || ''
    });
    await enterExam(started);
  }

  elements.bootstrapPreview.addEventListener('click', async () => {
    if (!previewObjectUrl || state.listeningStartedAt || legacyListeningResume) return;
    if (!previewAudio.paused) {
      previewAudio.pause();
      elements.bootstrapPreview.textContent = 'Nghe lại 30 giây đầu';
      return;
    }
    previewAudio.currentTime = 0;
    try {
      await previewAudio.play();
      previewHeard = true;
      elements.bootstrapPreview.textContent = 'Dừng nghe thử';
      elements.bootstrapPreviewStep.dataset.state = 'complete';
      elements.bootstrapStartStep.dataset.state = 'active';
      elements.bootstrapPreviewStatus.textContent = 'Đang nghe thử · tối đa 30 giây.';
      setStartAvailability();
    } catch {
      elements.bootstrapPreviewStatus.textContent = 'Trình duyệt chưa cho phát. Hãy nhấn lại nút nghe thử.';
    }
  });
  previewAudio.addEventListener('ended', () => {
    elements.bootstrapPreview.textContent = 'Nghe lại 30 giây đầu';
    elements.bootstrapPreviewStatus.textContent = 'Đã nghe hết bản thử. Bạn có thể bắt đầu thi.';
  });
  elements.bootstrapVolume.addEventListener('input', () => {
    const volume = Number(elements.bootstrapVolume.value) || 1;
    previewAudio.volume = volume;
    saveState({ audioVolume: volume });
  });
  elements.bootstrapStart.addEventListener('click', async () => {
    if (!encryptedAudio || preparing) return;
    preparing = true;
    elements.bootstrapStart.disabled = true;
    elements.bootstrapStart.textContent = 'Đang mở đề và audio...';
    previewAudio.pause();
    try {
      const started = await apiRequest(`/api/term-tests/${testConfig.slug}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examSessionToken: state.examSessionToken })
      });
      const decrypted = await decryptOfficialAudio(encryptedAudio, started);
      officialObjectUrl = URL.createObjectURL(new Blob([decrypted], { type: 'audio/mpeg' }));
      const officialAudio = document.createElement('audio');
      officialAudio.hidden = true;
      officialAudio.src = officialObjectUrl;
      officialAudio.volume = Number(elements.bootstrapVolume.value) || 1;
      document.body.append(officialAudio);
      const serverElapsed = Math.max(0, (Date.parse(started.serverNow) - Date.parse(started.listeningStartedAt)) / 1000);
      await new Promise((resolve, reject) => {
        officialAudio.addEventListener('loadedmetadata', resolve, { once: true });
        officialAudio.addEventListener('error', () => reject(new Error('Trình duyệt không đọc được audio chính.')), { once: true });
        officialAudio.load();
      });
      officialAudio.currentTime = Math.min(serverElapsed, Math.max(0, officialAudio.duration - 0.05));
      if (serverElapsed < officialAudio.duration) await officialAudio.play();
      saveState({
        listeningStartedAt: started.listeningStartedAt,
        listeningDeadlineAt: started.listeningDeadlineAt,
        serverTimeOffsetMs: Date.parse(started.serverNow) - Date.now(),
        audioVolume: officialAudio.volume
      });
      legacyListeningResume = false;
      await enterExam(started, officialAudio);
    } catch (error) {
      showNotice(`Chưa thể bắt đầu: ${error.message}. Đề vẫn đang khóa.`, true);
      elements.bootstrapStart.textContent = state.listeningStartedAt ? 'Tiếp tục bài thi Listening' : 'Bắt đầu thi Listening';
      elements.bootstrapStart.disabled = false;
    } finally {
      preparing = false;
    }
  });
  elements.bootstrapRetry.addEventListener('click', prepareSelectedStudent);
  elements.bootstrapStudent.addEventListener('change', () => {
    const selectedRef = elements.bootstrapStudent.value;
    const sameStudent = selectedRef === state.studentRef;
    legacyListeningResume = Boolean(sameStudent && selectedRef && !state.attemptToken && legacyUiState.audioStarted);
    saveState({
      studentRef: selectedRef,
      studentName: roster.find(item => item.ref === selectedRef)?.name || '',
      examSessionToken: sameStudent ? state.examSessionToken : '',
      attemptToken: sameStudent ? state.attemptToken : '',
      listeningStartedAt: sameStudent ? state.listeningStartedAt : '',
      listeningDeadlineAt: sameStudent ? state.listeningDeadlineAt : '',
      readingStartedAt: sameStudent ? state.readingStartedAt : '',
      readingDeadlineAt: sameStudent ? state.readingDeadlineAt : '',
      writingStartedAt: sameStudent ? state.writingStartedAt : '',
      writingDeadlineAt: sameStudent ? state.writingDeadlineAt : ''
    });
    if (selectedRef) prepareSelectedStudent();
  });

  async function initialize() {
    if (!/^[A-Z0-9_-]{2,32}$/.test(classCode)) {
      showNotice('Link chưa có mã lớp hợp lệ.', true);
      return;
    }
    try {
      const data = await apiRequest(`/api/term-tests/roster?class=${encodeURIComponent(classCode)}&test=${encodeURIComponent(testConfig.slug)}`);
      roster = data.students || [];
      elements.bootstrapClass.textContent = `Lớp ${data.class.name}`;
      const options = [new Option('Nhấn để chọn', '')];
      for (const student of roster) options.push(new Option(student.name, student.ref));
      elements.bootstrapStudent.replaceChildren(...options);
      if (state.studentRef && roster.some(student => student.ref === state.studentRef)) {
        elements.bootstrapStudent.value = state.studentRef;
        await prepareSelectedStudent();
      } else {
        elements.bootstrapDownloadStatus.textContent = 'Hãy chọn họ và tên để bắt đầu tải audio.';
        elements.bootstrapDownloadStep.dataset.state = 'active';
      }
    } catch (error) {
      showNotice(`Không thể mở phòng chờ: ${error.message}`, true);
    }
  }

  window.addEventListener('pagehide', () => {
    downloadController?.abort();
    previewAudio.pause();
    revokePreview();
  });
  initialize();
}());
