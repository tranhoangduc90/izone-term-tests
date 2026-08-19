import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const routeUrl = new URL('../term-test-2-computer-based/', import.meta.url);

async function loadContentConfig() {
  const source = await readFile(new URL('content-config.js', routeUrl), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: 'content-config.js' });
  return { source, config: context.window.TERM_TEST_CONTENT };
}

function collectSlots(section, property) {
  return [...section[property].matchAll(/data-answer-slot="(\d+)"/g)].map(match => Number(match[1]));
}

test('bản computer-based dùng HTML thật và có đúng 40 vị trí trả lời cho mỗi kỹ năng', async () => {
  const { source, config } = await loadContentConfig();
  assert.equal(config.variant, 'semantic-html');
  assert.equal(config.baseTestSlug, 'term-test-2');
  assert.equal(config.listening.sections.length, 4);
  assert.equal(config.reading.sections.length, 3);
  assert.equal(config.writing.tasks.length, 2);

  const listeningSlots = Array.from(config.listening.sections).flatMap(section => collectSlots(section, 'html'));
  const readingSlots = Array.from(config.reading.sections).flatMap(section => collectSlots(section, 'questionsHtml'));
  const expected = Array.from({ length: 40 }, (_, index) => index + 1);
  assert.deepEqual(listeningSlots.slice().sort((a, b) => a - b), expected);
  assert.deepEqual(readingSlots.slice().sort((a, b) => a - b), expected);
  assert.equal(new Set(listeningSlots).size, 40, 'Listening có câu bị lặp');
  assert.equal(new Set(readingSlots).size, 40, 'Reading có câu bị lặp');

  const listeningPart3 = config.listening.sections[2].html;
  assert.match(listeningPart3, /data-control="multi"/);
  assert.match(listeningPart3, /data-question-numbers="29,30"/);
  assert.equal([...listeningPart3.matchAll(/data-choice-value="[A-E]"/g)].length, 11, 'Part 3 phải có 6 lựa chọn radio và 5 lựa chọn checkbox');

  const readingPassage1 = config.reading.sections[0].questionsHtml;
  assert.match(readingPassage1, /data-choice-value="TRUE">\s*<span>True<\/span>\s*<\/label>/);
  assert.match(readingPassage1, /data-choice-value="FALSE">\s*<span>False<\/span>\s*<\/label>/);
  assert.match(readingPassage1, /data-choice-value="NOT GIVEN">\s*<span>Not given<\/span>\s*<\/label>/);
  assert.doesNotMatch(readingPassage1, /cbt-choice-letter">(?:TRUE|FALSE|NOT GIVEN)<\/span>/);

  const readingPassage2 = config.reading.sections[1].questionsHtml;
  assert.equal([...readingPassage2.matchAll(/data-control="multi"/g)].length, 2);
  assert.match(readingPassage2, /data-question-numbers="23,24"/);
  assert.match(readingPassage2, /data-question-numbers="25,26"/);
  assert.equal([...readingPassage2.matchAll(/data-choice-value="[A-E]"/g)].length, 10);
  assert.doesNotMatch(readingPassage2, /cbt-double-choice/);

  for (const section of Array.from(config.reading.sections)) {
    assert.match(section.passageHtml, /<p>|cbt-lettered-paragraph/);
    assert.match(section.questionsHtml, /data-answer-slot=/);
    assert.ok(section.passageHtml.length > 2_000, 'Passage HTML quá ngắn: ' + section.label);
  }

  assert.equal(/page-\d+\.png|inline-on-paper/i.test(source), false, 'Listening và Reading HTML không được phụ thuộc ảnh scan');
  assert.match(source, /cbt-question-card/);
  assert.match(source, /cbt-test-table/);
  assert.equal(/correctAnswer|answerKey|accepted\s*:/i.test(source), false, 'Cấu hình nội dung không được chứa đáp án đúng');

  const audioInfo = await stat(new URL(config.audio.src, routeUrl));
  assert.ok(audioInfo.isFile(), 'Thiếu audio Listening');
  assert.ok(audioInfo.size > 10_000, 'Audio quá nhỏ hoặc hỏng');
  assert.ok(audioInfo.size < 25 * 1024 * 1024, 'Audio cần được tối ưu trước khi đẩy Git');

  const [task1, task2] = Array.from(config.writing.tasks);
  assert.equal(task1.id, 'task1');
  assert.equal(task1.minimumWords, 150);
  assert.equal(task1.recommendedMinutes, 20);
  assert.match(task1.prompt, /physical activities between 2001 and 2009/i);
  assert.match(task1.followUp, /selecting and reporting the main features/i);
  assert.equal(task2.id, 'task2');
  assert.equal(task2.minimumWords, 250);
  assert.equal(task2.recommendedMinutes, 40);
  assert.match(task2.prompt, /decline in writing by hand/i);
  const task1Image = await stat(new URL(task1.image.src, routeUrl));
  assert.ok(task1Image.isFile(), 'Thiếu biểu đồ Writing Task 1');
  assert.ok(task1Image.size > 10_000, 'Biểu đồ Writing Task 1 quá nhỏ hoặc hỏng');
});

test('HTML computer-based giữ đúng thứ tự code cũ rồi mới tăng cường giao diện', async () => {
  const html = await readFile(new URL('index.html', routeUrl), 'utf8');
  const configIndex = html.indexOf('../term-test-2/test-config.js');
  const contentIndex = html.indexOf('content-config.js');
  const sharedAppIndex = html.indexOf('../shared/app.js');
  const audioLoaderIndex = html.indexOf('audio-loader.js');
  const enhanceIndex = html.indexOf('enhance.js');
  assert.ok(configIndex >= 0);
  assert.ok(configIndex < contentIndex);
  assert.ok(contentIndex < sharedAppIndex);
  assert.ok(sharedAppIndex < audioLoaderIndex);
  assert.ok(audioLoaderIndex < enhanceIndex);
  assert.match(html, /media-src 'self' blob:/);
  assert.match(html, /object-src 'none'/);
  assert.match(html, /cbt-v15/);
});

test('mã tăng cường chỉ nối giao diện HTML với field cũ, không đổi API hoặc nhúng đáp án', async () => {
  const source = await readFile(new URL('enhance.js', routeUrl), 'utf8');
  assert.equal(/correctAnswer|answerKey|accepted\s*:/i.test(source), false);
  assert.equal(/API_BASE_URL|\/api\/term-tests\//.test(source), false);
  assert.equal(/\.png|createInlineAnswer|cbt-page-frame/.test(source), false);
  assert.match(source, /shared\/app\.js/);
  assert.match(source, /attachAnswerFields/);
  assert.match(source, /syncMultiFields/);
  assert.match(source, /createSectionPager/);
  assert.match(source, /compactIdentityPanel/);
  assert.match(source, /placeSubmitInHeading/);
  assert.match(source, /actions\.remove\(\)/);
  assert.match(source, /Previous ['"] \+ noun/);
  assert.match(source, /Next ['"] \+ noun/);
  assert.match(source, /grid\.replaceChildren\(source\.pane\)/);
  assert.match(source, /field\.dispatchEvent\(new Event\('input'/);
  assert.match(source, /setupBufferedAudio/);
  assert.match(source, /TERM_TEST_AUDIO_LOADER/);
  assert.match(source, /cbt-listening-lobby/);
  assert.match(source, /previewTime >= 30/);
  assert.match(source, /previewHeard/);
  assert.match(source, /setListeningVisible\(false\)/);
  assert.match(source, /region\.hidden = !visible/);
  assert.match(source, /region\.inert = !visible/);
  assert.match(source, /URL\.createObjectURL\(blob\)/);
  assert.match(source, /setupReadingTimer/);
  assert.match(source, /60 \* 60 \* 1000/);
  assert.match(source, /readingTimer\.deadline/);
  assert.match(source, /readingTimer\.attemptToken/);
  assert.match(source, /submissionStorageKey/);
  assert.match(source, /\[sessionStorage, localStorage\]/);
  assert.match(source, /Math\.ceil\(remainingMs \/ 60_000\)/);
  assert.match(source, /minutes <= 10 && minutes > 0/);
  assert.match(source, /requestSubmit\(autoSubmitButton\)/);

  const startHandlerIndex = source.indexOf("startButton.addEventListener('click'");
  const officialPlayIndex = source.indexOf('await audio.play()', startHandlerIndex);
  const revealIndex = source.indexOf('setListeningVisible(true)', startHandlerIndex);
  assert.ok(startHandlerIndex >= 0 && officialPlayIndex > startHandlerIndex);
  assert.ok(revealIndex > officialPlayIndex, 'Chỉ được hiện đề sau khi audio chính thức phát thành công');
});

test('app chung hỗ trợ kết quả Listening độc lập và hai bản demo không gọi dữ liệu thật', async () => {
  const source = await readFile(new URL('../shared/app.js', import.meta.url), 'utf8');
  assert.match(source, /viewListeningResult/);
  assert.match(source, /continueReadingFromResult/);
  assert.match(source, /Reading chưa bị tính là 0 điểm/);
  assert.match(source, /\['complete', 'listening-only', 'writing-prep', 'writing'\]/);
  assert.match(source, /result\.reading\)/);
  assert.match(source, /portalSyncStatus/);
  assert.match(source, /skillPerformanceSections/);
  assert.match(source, /renderSkillPerformance\('Listening'/);
  assert.match(source, /renderSkillPerformance\('Reading'/);
  assert.match(source, /splitSkillPerformance/);
  assert.match(source, /event\.submitter\?\.dataset\.autoSubmit/);
  assert.match(source, /readingSubmitting/);
  assert.match(source, /!automatic && !confirmIncomplete/);
  assert.match(source, /term-test:reading-submitted/);
  assert.match(source, /setStage\('writing-prep'\)/);
  assert.match(source, /writingStarted/);
  assert.match(source, /writingSubmitted/);
  assert.match(source, /writingDirty/);
  assert.match(source, /\[sessionStorage, localStorage\]/);
  assert.match(source, /\/api\/term-tests\/writing/);
  assert.match(source, /saveWritingToServer\('draft'\)/);
  assert.match(source, /saveWritingToServer\('submit'\)/);
  assert.match(source, /applyWritingFromServer/);
  assert.match(source, /step\.dataset\.progress !== activeProgress && completed/);
  assert.match(source, /setupWritingExam/);
  assert.match(source, /role', 'separator'/);
  assert.match(source, /setPointerCapture/);
  assert.match(source, /spellcheck = false/);
  assert.match(source, /navigator\.clipboard/);
  assert.match(source, /Sao chép \$\{task\.label\}/);
  assert.match(source, /renderWritingSubmission/);
  assert.match(source, /await loadResult\(elements\.viewResult\)/);
  assert.doesNotMatch(source, /addSummaryCard\('Tổng điểm'/);
});
