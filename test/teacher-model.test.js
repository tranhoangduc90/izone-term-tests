import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatBand,
  getAverageBand,
  statusLabel,
  summarizeStudents,
  writingStatusLabel,
  writingTaskStateLabel
} from '../teacher/model.js';
import { readFile } from 'node:fs/promises';

test('tổng quan lớp chỉ tính trung bình từ học viên đã hoàn thành', () => {
  const students = [
    {
      status: 'completed',
      result: { listening: { band: 6.5 }, reading: { band: 7 }, summary: { averageBand: 6.75 } },
      writing: { status: 'ready' }
    },
    {
      status: 'completed',
      result: { listening: { band: 7.5 }, reading: { band: 8 }, summary: { averageBand: 7.75 } },
      writing: { status: 'processing' }
    },
    { status: 'incomplete', result: null },
    { status: 'not_started', result: null }
  ];
  const summary = summarizeStudents(students);
  assert.equal(summary.total, 4);
  assert.equal(summary.completed, 2);
  assert.equal(summary.writingReady, 1);
  assert.equal(summary.writingProcessing, 1);
  assert.equal(summary.writingReviewRequired, 0);
  assert.equal(summary.listeningAverage, 7);
  assert.equal(summary.readingAverage, 7.5);
  assert.equal(summary.overallAverage, 7.25);
});

test('Band trung bình có fallback và trạng thái dùng nhãn tiếng Việt', () => {
  assert.equal(getAverageBand({ listening: { band: 6 }, reading: { band: 7 } }), 6.5);
  assert.equal(formatBand(6.5, 2), '6.50');
  assert.equal(statusLabel('not_started'), 'Chưa nộp');
  assert.equal(writingStatusLabel('review_required'), 'Cần kiểm tra');
  assert.equal(writingTaskStateLabel('retry_wait'), 'đang thử lại');
});

test('dashboard đổi phiên bản cả CSS, app và model để không dùng cache cũ', async () => {
  const html = await readFile(new URL('../teacher/index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../teacher/app.js', import.meta.url), 'utf8');
  assert.match(html, /styles\.css\?rev=20260821-attempt-review-v1/);
  assert.match(html, /shared\/attempt-review\.js\?rev=20260821-attempt-review-v1/);
  assert.match(html, /app\.js\?rev=20260821-attempt-review-v1/);
  assert.match(app, /model\.js\?rev=20260820-writing-monitor-v1/);
  assert.match(app, /window\.setInterval/);
  assert.match(app, /loadResults\(\{ quiet: true \}\)/);
  assert.match(app, /30_000/);
  assert.match(app, /\/api\/term-tests\/teacher\/writing-detail/);
  assert.match(app, /data-writing-student/);
  assert.match(app, /openTeacherWritingFeedback/);
  assert.doesNotMatch(app, /\.innerHTML\s*=/);
  assert.match(html, /img-src[^;]*https:\/\/ducizone\.ddns\.net/);
});

test('dashboard giảng viên chỉ tải bài thi đầy đủ khi mở đúng học viên', async () => {
  const app = await readFile(new URL('../teacher/app.js', import.meta.url), 'utf8');
  assert.match(app, /attemptReviewCache: new Map\(\)/);
  assert.match(app, /Xem lại toàn bộ bài làm/);
  assert.match(app, /teacher\/attempt-review/);
  assert.match(app, /openTeacherAttemptReview\(student, reviewButton\)/);
  assert.match(app, /if \(!state\.attemptReviewCache\.has\(cacheKey\)\)/);
});
