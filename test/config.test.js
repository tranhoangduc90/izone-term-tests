import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadConfig(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: relativePath });
  return { source, config: context.window.TERM_TEST_CONFIG };
}

function summarize(controls) {
  return controls.map(control => ({
    number: control.number,
    kind: control.kind,
    options: control.options ? Array.from(control.options) : []
  }));
}

function assertValidConfig(source, config, slug) {
  assert.equal(config.slug, slug);
  for (const skill of ['listening', 'reading']) {
    assert.equal(config[skill].controls.length, 40);
    assert.deepEqual(Array.from(config[skill].controls, item => item.number), Array.from({ length: 40 }, (_, index) => index + 1));
    assert.ok(config[skill].controls.every(item => ['text', 'select'].includes(item.kind)));
    assert.ok(config[skill].controls.filter(item => item.kind === 'select').every(item => item.options.length >= 2));
  }
  assert.equal(/accepted|correctAnswer|answerKey/i.test(source), false, 'Frontend không được chứa đáp án đúng.');
}

test('Term Test 1 khớp loại ô của hai Google Form', async () => {
  const { source, config } = await loadConfig('../term-test-1/test-config.js');
  assertValidConfig(source, config, 'term-test-1');
  const listening = summarize(config.listening.controls);
  const reading = summarize(config.reading.controls);
  assert.equal(listening[0].kind, 'text');
  assert.deepEqual(listening[10].options, ['A', 'B', 'C']);
  assert.deepEqual(listening[14].options, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);
  assert.equal(listening[30].kind, 'text');
  assert.deepEqual(reading[0].options, ['TRUE', 'FALSE', 'NOT GIVEN']);
  assert.equal(reading[7].kind, 'text');
  assert.deepEqual(reading[13].options, ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix']);
  assert.deepEqual(reading[39].options, ['A', 'B', 'C']);
});

test('Term Test 2 giữ câu 15 Listening là ô nhập và đúng các nhóm còn lại', async () => {
  const { source, config } = await loadConfig('../term-test-2/test-config.js');
  assertValidConfig(source, config, 'term-test-2');
  const listening = summarize(config.listening.controls);
  const reading = summarize(config.reading.controls);
  assert.equal(listening[14].kind, 'text');
  assert.equal(listening[19].kind, 'text');
  assert.deepEqual(listening[20].options, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  assert.deepEqual(listening[28].options, ['A', 'B', 'C', 'D', 'E']);
  assert.equal(reading[0].kind, 'text');
  assert.deepEqual(reading[4].options, ['TRUE', 'FALSE', 'NOT GIVEN']);
  assert.equal(reading[18].kind, 'text');
  assert.deepEqual(reading[32].options, ['A', 'B', 'C', 'D', 'E']);
  assert.equal(reading[37].kind, 'text');
});
