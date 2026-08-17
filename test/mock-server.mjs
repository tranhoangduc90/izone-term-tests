import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4173);

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function detail(number, skill) {
  const result = number % 7 === 0 ? 'incorrect' : (number % 11 === 0 ? 'blank' : 'correct');
  return {
    number,
    type: `${skill} - Dạng thử nghiệm`,
    studentAnswer: result === 'blank' ? '' : `answer-${number}`,
    correctAnswer: `answer-${number}`,
    result
  };
}

function grade(skill) {
  return {
    correct: 32,
    total: 40,
    answered: 37,
    converted: 32,
    baseBand: 7,
    adjustment: 0,
    band: 7,
    details: Array.from({ length: 40 }, (_, index) => detail(index + 1, skill)),
    typeStats: [{ type: `${skill} - Dạng thử nghiệm`, correct: 32, total: 40, percentage: 0.8 }]
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/term-tests/roster') {
    return json(res, 200, {
      ok: true,
      test: { slug: url.searchParams.get('test'), title: 'Term Test', version: 1 },
      class: { id: '2139', name: 'IC2139' },
      students: [{ ref: '00000000-0000-4000-8000-000000000001', name: 'Học viên thử nghiệm' }]
    });
  }
  if (/\/api\/term-tests\/term-test-[12]\/listening$/.test(url.pathname)) {
    return json(res, 201, {
      ok: true,
      attemptToken: '00000000-0000-4000-8000-000000000099',
      studentName: 'Học viên thử nghiệm',
      next: 'reading'
    });
  }
  if (/\/api\/term-tests\/term-test-[12]\/reading$/.test(url.pathname)) {
    return json(res, 200, {
      ok: true,
      attemptToken: '00000000-0000-4000-8000-000000000099',
      completed: true,
      next: 'result'
    });
  }
  if (url.pathname === '/api/term-tests/result') {
    const listening = grade('Listening');
    const reading = grade('Reading');
    return json(res, 200, {
      ok: true,
      className: 'IC2139',
      studentName: 'Học viên thử nghiệm',
      completedAt: new Date().toISOString(),
      result: {
        testTitle: 'Term Test',
        listening,
        reading,
        summary: { totalCorrect: 64, totalQuestions: 80, percentage: 0.8 },
        performance: {
          best: [{ type: 'Listening - Dạng thử nghiệm', correct: 32, total: 40, percentage: 0.8 }],
          needsImprovement: [{ type: 'Reading - Dạng thử nghiệm', correct: 32, total: 40, percentage: 0.8 }],
          other: []
        },
        typeStats: [
          { type: 'Listening - Dạng thử nghiệm', correct: 32, total: 40, percentage: 0.8 },
          { type: 'Reading - Dạng thử nghiệm', correct: 32, total: 40, percentage: 0.8 }
        ]
      }
    });
  }

  const requested = url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
  const filePath = path.resolve(root, `.${requested}`);
  if (!filePath.startsWith(root)) return json(res, 403, { ok: false });
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('not file');
    const type = filePath.endsWith('.html') ? 'text/html; charset=utf-8'
      : filePath.endsWith('.css') ? 'text/css; charset=utf-8'
        : filePath.endsWith('.js') ? 'text/javascript; charset=utf-8'
          : filePath.endsWith('.png') ? 'image/png'
            : filePath.endsWith('.mp3') ? 'audio/mpeg' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    createReadStream(filePath).pipe(res);
  } catch {
    json(res, 404, { ok: false });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Mock Term Test server: http://127.0.0.1:${port}`);
});
