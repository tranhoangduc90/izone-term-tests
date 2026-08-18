import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadAudioLoader() {
  const source = await readFile(new URL('../term-test-2-computer-based/audio-loader.js', import.meta.url), 'utf8');
  const context = { window: {}, Blob };
  vm.runInNewContext(source, context, { filename: 'audio-loader.js' });
  return context.window.TERM_TEST_AUDIO_LOADER.downloadAudio;
}

function headers(values = {}) {
  return { get: name => values[name.toLowerCase()] ?? null };
}

function streamingResponse(chunks, headerValues = {}) {
  let index = 0;
  return {
    ok: true,
    status: 200,
    headers: headers(headerValues),
    body: {
      getReader() {
        return {
          async read() {
            if (index >= chunks.length) return { done: true };
            return { done: false, value: chunks[index++] };
          }
        };
      }
    }
  };
}

test('chỉ trả audio sau khi đọc đủ mọi khối và báo tiến độ tăng dần', async () => {
  const downloadAudio = await loadAudioLoader();
  const progress = [];
  let fetchOptions;
  const blob = await downloadAudio('audio.mp3', {
    fetchImpl: async (_source, options) => {
      fetchOptions = options;
      return streamingResponse([
        new Uint8Array([1, 2]),
        new Uint8Array([3, 4, 5])
      ], { 'content-length': '5', 'content-type': 'audio/mpeg' });
    },
    onProgress: item => progress.push({ ...item })
  });
  assert.equal(fetchOptions.cache, 'force-cache');
  assert.equal(blob.size, 5);
  assert.equal(blob.type, 'audio/mpeg');
  assert.deepEqual(progress.map(item => item.loaded), [2, 5, 5]);
  assert.equal(progress.at(-1).complete, true);
  assert.equal(progress.at(-1).total, 5);
});

test('không có Content-Length vẫn tải đủ và chốt tổng bằng dung lượng thực', async () => {
  const downloadAudio = await loadAudioLoader();
  const progress = [];
  const blob = await downloadAudio('audio.mp3', {
    fetchImpl: async () => streamingResponse([new Uint8Array([1, 2, 3, 4])]),
    onProgress: item => progress.push({ ...item })
  });
  assert.equal(blob.size, 4);
  assert.equal(progress[0].total, 0);
  assert.deepEqual(progress.at(-1), { loaded: 4, total: 4, complete: true });
});

test('trình duyệt không hỗ trợ stream thì dùng Blob hoàn chỉnh làm phương án dự phòng', async () => {
  const downloadAudio = await loadAudioLoader();
  const progress = [];
  const fallbackBlob = new Blob([new Uint8Array([7, 8, 9])], { type: 'audio/mpeg' });
  const result = await downloadAudio('audio.mp3', {
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      headers: headers(),
      body: null,
      blob: async () => fallbackBlob
    }),
    onProgress: item => progress.push({ ...item })
  });
  assert.equal(result, fallbackBlob);
  assert.deepEqual(progress, [{ loaded: 3, total: 3, complete: true }]);
});

test('HTTP lỗi, mạng lỗi và file rỗng đều không trả file để mở khóa bài', async () => {
  const downloadAudio = await loadAudioLoader();
  await assert.rejects(
    downloadAudio('audio.mp3', { fetchImpl: async () => ({ ok: false, status: 503 }) }),
    /AUDIO_HTTP_503/
  );
  await assert.rejects(
    downloadAudio('audio.mp3', { fetchImpl: async () => { throw new Error('network-down'); } }),
    /network-down/
  );
  await assert.rejects(
    downloadAudio('audio.mp3', { fetchImpl: async () => streamingResponse([]) }),
    /AUDIO_EMPTY/
  );
});
