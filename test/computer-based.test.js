import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const routeUrl = new URL('../term-test-2-computer-based/', import.meta.url);

test('GitHub Pages chỉ nạp phòng chờ an toàn, không phát hành đề hay audio rõ', async () => {
  const html = await readFile(new URL('index.html', routeUrl), 'utf8');
  const bootstrap = await readFile(new URL('bootstrap.js', routeUrl), 'utf8');
  assert.match(html, /term-test-2\/test-config\.js/);
  assert.match(html, /audio-loader\.js/);
  assert.match(html, /bootstrap\.js/);
  assert.doesNotMatch(html, /content-config\.js/);
  assert.doesNotMatch(html, /shared\/app\.js/);
  assert.doesNotMatch(html, /enhance\.js/);
  assert.match(html, /bootstrap\.js\?rev=20260821-demo-roster-v1/);
  await assert.rejects(access(new URL('content-config.js', routeUrl)));
  await assert.rejects(access(new URL('assets/listening/term-test-2-audio.mp3', routeUrl)));
  assert.doesNotMatch(bootstrap, /Bankside Recruitment|What is exploration|physical activities between 2001 and 2009/);
});

test('phòng chờ tải audio mã hóa, nghe bản thử rồi mới xin khóa và nạp đề', async () => {
  const source = await readFile(new URL('bootstrap.js', routeUrl), 'utf8');
  assert.match(source, /session\/prepare/);
  assert.match(source, /encryptedAudioUrl/);
  assert.match(source, /previewAudioUrl/);
  assert.match(source, /session\/start/);
  assert.match(source, /crypto\.subtle\.importKey/);
  assert.match(source, /crypto\.subtle\.decrypt/);
  assert.match(source, /magic !== response\.audioEnvelope\.magic/);
  assert.match(source, /window\.TERM_TEST_CONTENT = Object\.freeze\(started\.content\)/);
  assert.match(source, /await officialAudio\.play\(\)/);
  const playIndex = source.indexOf('await officialAudio.play()');
  const enterIndex = source.indexOf('await enterExam(started, officialAudio)');
  assert.ok(playIndex >= 0 && enterIndex > playIndex, 'Audio chính phải phát thành công trước khi nạp giao diện đề');
  assert.match(source, /audioVolume/);
  assert.match(source, /audioVolume: Number\(state\.audioVolume\) \|\| 1/);
  assert.match(source, /serverTimeOffsetMs/);
  assert.match(source, /listeningDeadlineAt/);
  assert.match(source, /session\/resume-attempt/);
  assert.match(source, /legacyElapsedSeconds/);
  assert.match(source, /legacyUiState\.audioTime/);
  assert.match(source, /const sameStudent = selectedRef === state\.studentRef/);
  assert.match(source, /examSessionToken: sameStudent \? state\.examSessionToken : ''/);
});

test('liên kết xem kết quả demo chỉ hoạt động trong lớp giả lập và vẫn xác thực UUID', async () => {
  const source = await readFile(new URL('bootstrap.js', routeUrl), 'utf8');
  assert.match(source, /classCode === 'CODEXDEMO806'/);
  assert.match(source, /query\.get\('demoStudent'\)/);
  assert.match(source, /query\.get\('demoAttempt'\)/);
  assert.match(source, /!demoStudent \|\| !isUuid\(demoStudentRef\) \|\| !isUuid\(demoAttemptToken\)/);
  assert.match(source, /await prepareSelectedStudent\(\)/);
});

test('đường dẫn chung của lớp demo luôn hiện danh sách chọn học viên', async () => {
  const source = await readFile(new URL('bootstrap.js', routeUrl), 'utf8');
  assert.match(source, /const shouldRestoreSelectedStudent = classCode !== 'CODEXDEMO806'/);
  assert.match(source, /if \(shouldRestoreSelectedStudent\)/);
  assert.match(source, /state\.studentRef/);
  assert.match(source, /roster\.some\(student => student\.ref === state\.studentRef\)/);
});

test('giao diện tăng cường giữ hành vi câu hỏi và dùng deadline máy chủ cho ba kỹ năng', async () => {
  const source = await readFile(new URL('enhance.js', routeUrl), 'utf8');
  assert.equal(/correctAnswer|answerKey|accepted\s*:/i.test(source), false);
  assert.match(source, /attachAnswerFields/);
  assert.match(source, /syncMultiFields/);
  assert.match(source, /createSectionPager/);
  assert.match(source, /annotateQuestionRanges/);
  assert.match(source, /child\.dataset\.questionRange = activeRange/);
  assert.match(source, /compactIdentityPanel/);
  assert.match(source, /topbar\.append\(panel\)/);
  assert.match(source, /identityObserver\.observe\(select, \{ childList: true \}\)/);
  assert.match(source, /identityTitle\.textContent = 'Họ và tên đã xác nhận'/);
  assert.match(source, /topbarTitle\.textContent = 'Term test 2'/);
  assert.match(source, /Previous ['"] \+ noun/);
  assert.match(source, /Next ['"] \+ noun/);
  assert.match(source, /protectedBootstrap\?\.officialAudioElement/);
  assert.match(source, /uiState\.audio\.volume = preparedVolume/);
  assert.match(source, /setupListeningTimer/);
  assert.doesNotMatch(source, /cbt-listening-clock/);
  assert.match(source, /listeningDeadlineAt/);
  assert.match(source, /listeningTimeExpired/);
  assert.match(source, /setupReadingTimer/);
  assert.match(source, /readingDeadlineAt/);
  assert.match(source, /setupWritingTimer/);
  assert.match(source, /writingDeadlineAt/);
  assert.match(source, /requestSubmit\(autoSubmit/);
  assert.match(source, /minutes <= 10 && minutes > 0/);
  assert.match(source, /Kết quả đang được giữ kín/);
});

test('công cụ tô sáng, ghi chú và rà soát tách khỏi logic đáp án', async () => {
  const bootstrap = await readFile(new URL('bootstrap.js', routeUrl), 'utf8');
  const source = await readFile(new URL('interaction-tools.js', routeUrl), 'utf8');
  const styles = await readFile(new URL('styles.css', routeUrl), 'utf8');
  assert.match(bootstrap, /interaction-tools\.js/);
  assert.match(source, /'Highlight'/);
  assert.match(source, /'Note'/);
  assert.match(source, /'Delete Highlight'/);
  assert.match(source, /'Saved automatically'/);
  assert.match(source, /izone-test-interactions:/);
  assert.match(source, /submission\.attemptToken/);
  assert.match(source, /questionRefForSelection/);
  assert.match(source, /contextQuestionNumbers/);
  assert.match(source, /fallbackQuestionNumbers/);
  assert.match(source, /questionRef: pendingSelection\.questionRef/);
  assert.match(source, /reference\.className = 'cbt-note-question-ref'/);
  assert.match(source, /\['unanswered', 'Chưa làm'\]/);
  assert.match(source, /\['flagged', 'Đã đánh dấu'\]/);
  assert.match(source, /\['all', 'Tất cả'\]/);
  assert.match(source, /sourceButton\.click\(\)/);
  assert.doesNotMatch(source, /correctAnswer|answerKey|accepted\s*:/i);
  assert.match(styles, /\.cbt-annotation-toolbar/);
  assert.match(styles, /\.cbt-note-panel/);
  assert.match(styles, /\.cbt-note-question-ref/);
  assert.match(styles, /\.cbt-review-panel/);
});

test('app khóa đáp án khi nộp, lưu nháp database và resume thẳng Reading', async () => {
  const source = await readFile(new URL('../shared/app.js', import.meta.url), 'utf8');
  assert.match(source, /examSessionToken/);
  assert.match(source, /listening\/draft/);
  assert.match(source, /reading\/draft/);
  assert.match(source, /reading\/start/);
  assert.match(source, /scheduleSectionDraft/);
  assert.match(source, /frozenAnswers/);
  assert.match(source, /setAnswerControlsLocked\('listening', true\)/);
  assert.match(source, /setAnswerControlsLocked\('reading', true\)/);
  assert.match(source, /term-test:listening-submitted/);
  assert.match(source, /term-test:reading-submitted/);
  assert.match(source, /if \(state\.readingDeadlineAt\)/);
  assert.doesNotMatch(source, /Bạn đang làm phần Reading\. Đồng hồ 60 phút đã chạy trên máy chủ/);
  assert.doesNotMatch(source, /Writing đã bắt đầu\. Bạn có 60 phút/);
  assert.doesNotMatch(source, /Đang tiếp tục Reading\. Đồng hồ máy chủ không dừng khi tải lại trang/);
  assert.match(source, /writingDeadlineAt/);
  assert.match(source, /audioVolume: state\.audioVolume/);
  assert.match(source, /await loadResult\(elements\.viewResult\)/);
  assert.match(source, /function resultsUnlocked\(\)/);
  assert.match(source, /Boolean\(state\.writingSubmitted\)/);
  assert.match(source, /function stageBeforeResults\(\)/);
  assert.match(source, /Kết quả Listening và Reading được giữ kín cho tới khi bạn nộp Writing/);
  assert.match(source, /Listening đã được ghi nhận/);
  assert.match(source, /Chuẩn bị phần Reading/);
  assert.match(source, /elements\.viewListeningResult\?\.addEventListener/);
  assert.doesNotMatch(source, /addSummaryCard\('Tổng điểm'/);
  assert.match(source, /const showConfirmedIdentity = document\.body\.classList\.contains\('cbt-mode'\)/);
  assert.match(source, /if \(showConfirmedIdentity\) elements\.identityView\.hidden = false/);
});

test('Writing xếp dọc trên điện thoại nhưng vẫn giữ thanh chia ở desktop', async () => {
  const styles = await readFile(new URL('styles.css', routeUrl), 'utf8');
  assert.match(styles, /\.topbar\.cbt-topbar-with-identity[\s\S]*grid-template-columns: auto minmax\(460px, 720px\)/);
  assert.match(styles, /\.cbt-mode \.test-panel:not\(\[hidden\]\)[\s\S]*height: calc\(100vh - 120px\)/);
  assert.match(styles, /grid-template-columns: minmax\(280px, var\(--writing-left, 47%\)\) 12px minmax\(360px, 1fr\)/);
  assert.match(styles, /@media \(max-width: 620px\)[\s\S]*\.writing-split\s*{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(styles, /@media \(max-width: 620px\)[\s\S]*\.writing-separator\s*{\s*display: none;/);
  assert.doesNotMatch(styles, /\.writing-divider/);
});

test('kết quả Writing chỉ mở khi đủ hai Task và mở phân tích chi tiết ngay trên web', async () => {
  const source = await readFile(new URL('../shared/app.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('styles.css', routeUrl), 'utf8');
  assert.match(source, /grading\?\.ready/);
  assert.match(source, /openWritingFeedback/);
  assert.match(source, /Nhận xét theo tiêu chí/);
  assert.match(source, /appendSafeWritingFeedback/);
  assert.match(source, /Xem phân tích chi tiết và cách cải thiện/);
  assert.match(source, /Bài Writing của bạn đang được chấm\. Kết quả sẽ hiển thị sớm\./);
  assert.match(source, /Bạn có thể tắt trang web và quay lại sau bằng đúng đường dẫn này\./);
  assert.match(source, /Bài Writing đã được chấm xong\. Điểm và phân tích chi tiết đã hiển thị bên dưới\./);
  assert.match(source, /Thu gọn phân tích chi tiết/);
  assert.match(source, /writingCriterionSections/);
  assert.match(source, /writing-component-detail/);
  assert.match(source, /\(\?:docs\|drive\)\\\.google/);
  assert.match(source, /noopener noreferrer/);
  assert.doesNotMatch(source, /feedback\.innerHTML/);
  assert.match(source, /function appendSanitizedWritingHtml/);
  assert.match(source, /new DOMParser\(\)\.parseFromString/);
  assert.match(source, /blockedTags\.has\(sourceTag\)/);
  assert.doesNotMatch(source, /insertAdjacentHTML/);
  assert.doesNotMatch(source, /Phân tích câu/);
  assert.doesNotMatch(source, /Sao chép \$\{task\.label\}/);
  assert.doesNotMatch(source, /Bài làm của học viên/);
  assert.doesNotMatch(source, /writing-result-card/);
  assert.match(styles, /\.writing-feedback-dialog/);
  assert.match(styles, /\.writing-score-grid/);
  assert.match(styles, /\.writing-component-toggle/);
  assert.match(styles, /\.writing-component-detail\[hidden\]/);
  assert.doesNotMatch(styles, /\.writing-copy-button/);
});

test('toàn bộ bài làm chỉ được tải sau khi bấm nút xem lại', async () => {
  const appSource = await readFile(new URL('../shared/app.js', import.meta.url), 'utf8');
  const bootstrap = await readFile(new URL('bootstrap.js', routeUrl), 'utf8');
  const reviewSource = await readFile(new URL('../shared/attempt-review.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../shared/styles.css', import.meta.url), 'utf8');
  assert.match(appSource, /id="viewFullAttempt"/);
  assert.match(appSource, /Xem lại toàn bộ bài làm/);
  assert.match(appSource, /viewFullAttempt\.addEventListener\('click'/);
  assert.match(appSource, /\/api\/term-tests\/result\/review/);
  assert.match(appSource, /if \(!state\.attemptReview\)/);
  assert.match(bootstrap, /shared\/attempt-review\.js\?rev=20260821-attempt-review-v1/);
  assert.match(reviewSource, /data-answer-slot/);
  assert.match(reviewSource, /attempt-review-choice-selected/);
  assert.match(reviewSource, /Bài thi đã nộp · Chế độ chỉ đọc/);
  assert.doesNotMatch(reviewSource, /correctAnswer|answerKey|accepted\s*:/i);
  assert.match(styles, /\.attempt-review-dialog/);
  assert.match(styles, /\.attempt-review-reading-split/);
  assert.match(styles, /\.attempt-review-writing-split/);
});
