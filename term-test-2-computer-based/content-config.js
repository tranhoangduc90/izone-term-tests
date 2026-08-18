(function () {
  'use strict';

  // Dữ liệu vào: ảnh scan gốc của Term Test 2 và vị trí phần trống của từng câu.
  // Việc chính: ghép ô trả lời thật của hệ thống lên đúng vị trí trong đề.
  // Kết quả: học viên nhập/chọn đáp án trực tiếp trên trang đề, không cần phiếu riêng.
  // Khi lỗi: test tự động sẽ báo câu thiếu, câu trùng hoặc tọa độ nằm ngoài trang.
  window.TERM_TEST_CONTENT = Object.freeze({
    variant: 'inline-on-paper',
    baseTestSlug: 'term-test-2',
    title: 'Term Test 2 · Làm bài trực tiếp trên đề',
    pageSize: { width: 827, height: 1070 },
    audio: {
      src: 'assets/listening/term-test-2-audio.mp3',
      label: 'Listening audio',
      durationLabel: 'Khoảng 31 phút'
    },
    listening: {
      instructions: [
        'Nhập hoặc chọn đáp án ngay tại các ô màu xanh trong đề.',
        'Dùng thanh số câu phía dưới để nhảy nhanh hoặc đánh dấu câu cần xem lại.',
        'Audio chỉ bắt đầu khi bạn nhấn nút phát; giao diện không có nút tua lại.'
      ],
      sections: [
        {
          label: 'Part 1 · Questions 1–10',
          pages: [
            {
              src: 'assets/listening/page-01.png',
              answers: [
                { number: 1, x: 42.8, y: 42.7, width: 19 },
                { number: 2, x: 42.4, y: 47.2, width: 19 },
                { number: 3, x: 39.2, y: 55.0, width: 20 },
                { number: 4, x: 43.7, y: 57.3, width: 22 },
                { number: 5, x: 36.0, y: 59.7, width: 21 },
                { number: 6, x: 36.2, y: 65.1, width: 21 },
                { number: 7, x: 36.7, y: 67.3, width: 21 },
                { number: 8, x: 52.0, y: 69.5, width: 23 },
                { number: 9, x: 26.0, y: 75.0, width: 21 },
                { number: 10, x: 31.0, y: 79.5, width: 21 }
              ]
            }
          ]
        },
        {
          label: 'Part 2 · Questions 11–20',
          pages: [
            {
              src: 'assets/listening/page-02.png',
              answers: [
                { number: 11, x: 77.5, y: 27.0, width: 15 },
                { number: 12, x: 77.5, y: 35.4, width: 15 },
                { number: 13, x: 77.5, y: 44.0, width: 15 },
                { number: 14, x: 77.5, y: 52.4, width: 15 }
              ]
            },
            {
              src: 'assets/listening/page-03.png',
              answers: [
                { number: 15, x: 63.0, y: 36.8, width: 18 },
                { number: 16, x: 59.0, y: 42.3, width: 16 },
                { number: 17, x: 37.0, y: 48.8, width: 18 },
                { number: 18, x: 61.5, y: 54.2, width: 18 },
                { number: 19, x: 35.0, y: 59.7, width: 18 },
                { number: 20, x: 62.0, y: 63.2, width: 18 }
              ]
            }
          ]
        },
        {
          label: 'Part 3 · Questions 21–30',
          pages: [
            {
              src: 'assets/listening/page-04.png',
              answers: [
                { number: 21, x: 53.0, y: 63.2, width: 16 },
                { number: 22, x: 53.0, y: 65.8, width: 16 },
                { number: 23, x: 53.0, y: 68.3, width: 16 },
                { number: 24, x: 53.0, y: 70.7, width: 16 },
                { number: 25, x: 53.0, y: 73.1, width: 16 },
                { number: 26, x: 53.0, y: 75.5, width: 16 }
              ]
            },
            {
              src: 'assets/listening/page-05.png',
              answers: [
                { number: 27, x: 78.0, y: 20.0, width: 14 },
                { number: 28, x: 78.0, y: 33.8, width: 14 },
                { number: 29, x: 70.0, y: 65.0, width: 13 },
                { number: 30, x: 84.0, y: 65.0, width: 13 }
              ]
            }
          ]
        },
        {
          label: 'Part 4 · Questions 31–40',
          pages: [
            {
              src: 'assets/listening/page-06.png',
              answers: [
                { number: 31, x: 29.0, y: 30.5, width: 22 },
                { number: 32, x: 31.0, y: 33.0, width: 22 },
                { number: 33, x: 47.0, y: 43.7, width: 22 },
                { number: 34, x: 36.0, y: 50.2, width: 22 },
                { number: 35, x: 30.0, y: 61.0, width: 22 },
                { number: 36, x: 31.0, y: 68.6, width: 22 },
                { number: 37, x: 41.0, y: 71.6, width: 22 },
                { number: 38, x: 41.0, y: 75.8, width: 22 },
                { number: 39, x: 26.0, y: 78.6, width: 22 },
                { number: 40, x: 42.0, y: 81.5, width: 22 }
              ]
            }
          ]
        }
      ]
    },
    reading: {
      instructions: [
        'Đọc passage và nhập hoặc chọn đáp án ngay tại các ô màu xanh trong đề.',
        'Dùng thanh số câu phía dưới để chuyển thẳng tới câu cần làm hoặc đánh dấu.',
        'Câu trả lời vẫn được lưu tạm trong tab trình duyệt này.'
      ],
      sections: [
        {
          label: 'Reading Passage 1 · Questions 1–13',
          pages: [
            { src: 'assets/reading/page-01.png', answers: [] },
            { src: 'assets/reading/page-02.png', answers: [] },
            {
              src: 'assets/reading/page-03.png',
              answers: [
                { number: 1, x: 39.0, y: 30.4, width: 16 },
                { number: 2, x: 24.5, y: 33.3, width: 16 },
                { number: 3, x: 24.5, y: 37.6, width: 16 },
                { number: 4, x: 53.0, y: 40.0, width: 23 },
                { number: 5, x: 77.0, y: 67.2, width: 16 },
                { number: 6, x: 77.0, y: 70.0, width: 16 },
                { number: 7, x: 77.0, y: 72.7, width: 16 }
              ]
            },
            {
              src: 'assets/reading/page-04.png',
              answers: [
                { number: 8, x: 54.0, y: 28.8, width: 22 },
                { number: 9, x: 53.0, y: 36.9, width: 22 },
                { number: 10, x: 35.0, y: 47.4, width: 22 },
                { number: 11, x: 58.0, y: 50.3, width: 22 },
                { number: 12, x: 61.0, y: 55.9, width: 22 },
                { number: 13, x: 32.0, y: 60.8, width: 22 }
              ]
            }
          ]
        },
        {
          label: 'Reading Passage 2 · Questions 14–26',
          pages: [
            { src: 'assets/reading/page-05.png', answers: [] },
            { src: 'assets/reading/page-06.png', answers: [] },
            {
              src: 'assets/reading/page-07.png',
              answers: [
                { number: 14, x: 78.0, y: 26.7, width: 15 },
                { number: 15, x: 78.0, y: 29.7, width: 15 },
                { number: 16, x: 78.0, y: 32.5, width: 15 },
                { number: 17, x: 78.0, y: 35.2, width: 15 },
                { number: 18, x: 78.0, y: 38.0, width: 15 },
                { number: 19, x: 35.0, y: 65.2, width: 23 },
                { number: 20, x: 55.0, y: 69.5, width: 23 },
                { number: 21, x: 40.0, y: 78.2, width: 23 },
                { number: 22, x: 38.0, y: 81.0, width: 16 }
              ]
            },
            {
              src: 'assets/reading/page-08.png',
              answers: [
                { number: 23, x: 69.0, y: 35.0, width: 13 },
                { number: 24, x: 83.0, y: 35.0, width: 13 },
                { number: 25, x: 69.0, y: 57.4, width: 13 },
                { number: 26, x: 83.0, y: 57.4, width: 13 }
              ]
            }
          ]
        },
        {
          label: 'Reading Passage 3 · Questions 27–40',
          pages: [
            { src: 'assets/reading/page-09.png', answers: [] },
            { src: 'assets/reading/page-10.png', answers: [] },
            {
              src: 'assets/reading/page-11.png',
              answers: [
                { number: 27, x: 78.0, y: 23.5, width: 15 },
                { number: 28, x: 78.0, y: 34.1, width: 15 },
                { number: 29, x: 78.0, y: 44.2, width: 15 },
                { number: 30, x: 78.0, y: 53.8, width: 15 },
                { number: 31, x: 78.0, y: 64.3, width: 15 },
                { number: 32, x: 78.0, y: 76.2, width: 15 }
              ]
            },
            {
              src: 'assets/reading/page-12.png',
              answers: [
                { number: 33, x: 77.0, y: 29.8, width: 16 },
                { number: 34, x: 77.0, y: 32.6, width: 16 },
                { number: 35, x: 77.0, y: 35.4, width: 16 },
                { number: 36, x: 77.0, y: 38.2, width: 16 },
                { number: 37, x: 77.0, y: 41.0, width: 16 },
                { number: 38, x: 52.0, y: 81.5, width: 18 },
                { number: 39, x: 55.0, y: 84.0, width: 14 },
                { number: 40, x: 15.0, y: 88.0, width: 18 }
              ]
            }
          ]
        }
      ]
    }
  });
}());
