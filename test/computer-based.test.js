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

  for (const section of Array.from(config.reading.sections)) {
    assert.match(section.passageHtml, /<p>|cbt-lettered-paragraph/);
    assert.match(section.questionsHtml, /data-answer-slot=/);
    assert.ok(section.passageHtml.length > 2_000, 'Passage HTML quá ngắn: ' + section.label);
  }

  assert.equal(/\.png|page-\d+\.png|inline-on-paper/i.test(source), false, 'Giao diện HTML không được phụ thuộc ảnh scan');
  assert.match(source, /cbt-question-card/);
  assert.match(source, /cbt-test-table/);
  assert.equal(/correctAnswer|answerKey|accepted\s*:/i.test(source), false, 'Cấu hình nội dung không được chứa đáp án đúng');

  const audioInfo = await stat(new URL(config.audio.src, routeUrl));
  assert.ok(audioInfo.isFile(), 'Thiếu audio Listening');
  assert.ok(audioInfo.size > 10_000, 'Audio quá nhỏ hoặc hỏng');
  assert.ok(audioInfo.size < 25 * 1024 * 1024, 'Audio cần được tối ưu trước khi đẩy Git');
});

test('HTML computer-based giữ đúng thứ tự code cũ rồi mới tăng cường giao diện', async () => {
  const html = await readFile(new URL('index.html', routeUrl), 'utf8');
  const configIndex = html.indexOf('../term-test-2/test-config.js');
  const contentIndex = html.indexOf('content-config.js');
  const sharedAppIndex = html.indexOf('../shared/app.js');
  const enhanceIndex = html.indexOf('enhance.js');
  assert.ok(configIndex >= 0);
  assert.ok(configIndex < contentIndex);
  assert.ok(contentIndex < sharedAppIndex);
  assert.ok(sharedAppIndex < enhanceIndex);
  assert.match(html, /media-src 'self'/);
  assert.match(html, /object-src 'none'/);
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
  assert.match(source, /Previous ['"] \+ noun/);
  assert.match(source, /Next ['"] \+ noun/);
  assert.match(source, /grid\.replaceChildren\(source\.pane\)/);
  assert.match(source, /field\.dispatchEvent\(new Event\('input'/);
});
