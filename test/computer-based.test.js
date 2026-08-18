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

test('bản computer-based dùng đúng Term Test 2, đủ trang và đủ vị trí 40 câu', async () => {
  const { source, config } = await loadContentConfig();
  assert.equal(config.variant, 'inline-on-paper');
  assert.equal(config.baseTestSlug, 'term-test-2');
  assert.equal(config.listening.sections.length, 4);
  assert.equal(config.reading.sections.length, 3);

  const listeningPageConfigs = Array.from(config.listening.sections).flatMap(section => Array.from(section.pages));
  const readingPageConfigs = Array.from(config.reading.sections).flatMap(section => Array.from(section.pages));
  const listeningPages = listeningPageConfigs.map(page => page.src);
  const readingPages = readingPageConfigs.map(page => page.src);
  assert.equal(listeningPages.length, 6);
  assert.equal(readingPages.length, 12);
  assert.equal(new Set(listeningPages).size, listeningPages.length);
  assert.equal(new Set(readingPages).size, readingPages.length);

  for (const pages of [listeningPageConfigs, readingPageConfigs]) {
    const positions = pages.flatMap(page => Array.from(page.answers || []));
    const numbers = positions.map(item => item.number).sort((a, b) => a - b);
    assert.deepEqual(numbers, Array.from({ length: 40 }, (_, index) => index + 1));
    positions.forEach(item => {
      assert.ok(item.x >= 0 && item.x <= 100, 'Tọa độ x không hợp lệ ở câu ' + item.number);
      assert.ok(item.y >= 0 && item.y <= 100, 'Tọa độ y không hợp lệ ở câu ' + item.number);
      assert.ok(item.width >= 10 && item.x + item.width <= 100, 'Độ rộng không hợp lệ ở câu ' + item.number);
    });
  }

  for (const relativePath of [...listeningPages, ...readingPages, config.audio.src]) {
    const info = await stat(new URL(relativePath, routeUrl));
    assert.ok(info.isFile(), 'Thiếu tài nguyên: ' + relativePath);
    assert.ok(info.size > 10_000, 'Tài nguyên quá nhỏ hoặc hỏng: ' + relativePath);
  }

  const audioInfo = await stat(new URL(config.audio.src, routeUrl));
  assert.ok(audioInfo.size < 25 * 1024 * 1024, 'Audio cần được tối ưu trước khi đẩy Git');
  assert.equal(/accepted|correctAnswer|answerKey/i.test(source), false, 'Cấu hình nội dung không được chứa đáp án đúng');
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

test('mã tăng cường không thay API, slug hoặc nhúng đáp án', async () => {
  const source = await readFile(new URL('enhance.js', routeUrl), 'utf8');
  assert.equal(/accepted|correctAnswer|answerKey/i.test(source), false);
  assert.equal(/API_BASE_URL|\/api\/term-tests\//.test(source), false);
  assert.equal(/wrapper\.dataset\.number/.test(source), false, 'Không được trùng data-number của ô trả lời');
  assert.match(source, /shared\/app\.js/);
  assert.match(source, /createInlineAnswer/);
  assert.match(source, /grid\.replaceChildren\(source\.pane\)/);
});
