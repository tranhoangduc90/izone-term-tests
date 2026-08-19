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
  assert.match(html, /cbt-v20/);
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

test('giao diện tăng cường giữ hành vi câu hỏi và dùng deadline máy chủ cho ba kỹ năng', async () => {
  const source = await readFile(new URL('enhance.js', routeUrl), 'utf8');
  assert.equal(/correctAnswer|answerKey|accepted\s*:/i.test(source), false);
  assert.match(source, /attachAnswerFields/);
  assert.match(source, /syncMultiFields/);
  assert.match(source, /createSectionPager/);
  assert.match(source, /compactIdentityPanel/);
  assert.match(source, /topbarTitle\.textContent = 'Term test 2'/);
  assert.match(source, /Previous ['"] \+ noun/);
  assert.match(source, /Next ['"] \+ noun/);
  assert.match(source, /protectedBootstrap\?\.officialAudioElement/);
  assert.match(source, /uiState\.audio\.volume = preparedVolume/);
  assert.match(source, /setupListeningTimer/);
  assert.match(source, /listeningDeadlineAt/);
  assert.match(source, /listeningTimeExpired/);
  assert.match(source, /setupReadingTimer/);
  assert.match(source, /readingDeadlineAt/);
  assert.match(source, /setupWritingTimer/);
  assert.match(source, /writingDeadlineAt/);
  assert.match(source, /requestSubmit\(autoSubmit/);
  assert.match(source, /minutes <= 10 && minutes > 0/);
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
  assert.match(source, /Đồng hồ máy chủ không dừng khi tải lại trang/);
  assert.match(source, /writingDeadlineAt/);
  assert.match(source, /audioVolume: state\.audioVolume/);
  assert.match(source, /await loadResult\(elements\.viewResult\)/);
  assert.doesNotMatch(source, /addSummaryCard\('Tổng điểm'/);
});

test('Writing xếp dọc trên điện thoại nhưng vẫn giữ thanh chia ở desktop', async () => {
  const styles = await readFile(new URL('styles.css', routeUrl), 'utf8');
  assert.match(styles, /grid-template-columns: minmax\(280px, var\(--writing-left, 47%\)\) 12px minmax\(360px, 1fr\)/);
  assert.match(styles, /@media \(max-width: 620px\)[\s\S]*\.writing-split\s*{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(styles, /@media \(max-width: 620px\)[\s\S]*\.writing-separator\s*{\s*display: none;/);
  assert.doesNotMatch(styles, /\.writing-divider/);
});
