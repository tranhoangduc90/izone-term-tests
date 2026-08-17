(function () {
  'use strict';

  // Dữ liệu vào: các trang đề scan và tệp audio đã được đối chiếu từ Term Test 2.
  // Việc chính: nhóm tài nguyên theo Part/Passage để giao diện dựng vùng đề thi.
  // Kết quả: cấu hình chỉ chứa nội dung hiển thị, không chứa đáp án đúng.
  // Khi lỗi: test computer-based sẽ dừng nếu thiếu trang, sai slug hoặc lộ khóa đáp án.
  window.TERM_TEST_CONTENT = Object.freeze({
    variant: 'computer-based',
    baseTestSlug: 'term-test-2',
    title: 'Term Test 2 · Computer-based',
    audio: {
      src: 'assets/listening/term-test-2-audio.mp3',
      label: 'Listening audio',
      durationLabel: 'Khoảng 31 phút'
    },
    listening: {
      instructions: [
        'Đọc đề ở khung bên trái và nhập đáp án ở khung bên phải.',
        'Audio chỉ bắt đầu khi bạn nhấn nút phát; giao diện không có nút tua lại.',
        'Câu trả lời được lưu tạm trong tab trình duyệt này.'
      ],
      sections: [
        {
          label: 'Part 1 · Questions 1–10',
          pages: ['assets/listening/page-01.png']
        },
        {
          label: 'Part 2 · Questions 11–20',
          pages: ['assets/listening/page-02.png', 'assets/listening/page-03.png']
        },
        {
          label: 'Part 3 · Questions 21–30',
          pages: ['assets/listening/page-04.png', 'assets/listening/page-05.png']
        },
        {
          label: 'Part 4 · Questions 31–40',
          pages: ['assets/listening/page-06.png']
        }
      ]
    },
    reading: {
      instructions: [
        'Đọc passage và câu hỏi ở khung bên trái, sau đó nhập đáp án ở khung bên phải.',
        'Có thể kéo thanh ngăn để đổi độ rộng hai khung hoặc phóng to trang đề.',
        'Câu trả lời được lưu tạm trong tab trình duyệt này.'
      ],
      sections: [
        {
          label: 'Reading Passage 1 · Questions 1–13',
          pages: [
            'assets/reading/page-01.png',
            'assets/reading/page-02.png',
            'assets/reading/page-03.png',
            'assets/reading/page-04.png'
          ]
        },
        {
          label: 'Reading Passage 2 · Questions 14–26',
          pages: [
            'assets/reading/page-05.png',
            'assets/reading/page-06.png',
            'assets/reading/page-07.png',
            'assets/reading/page-08.png'
          ]
        },
        {
          label: 'Reading Passage 3 · Questions 27–40',
          pages: [
            'assets/reading/page-09.png',
            'assets/reading/page-10.png',
            'assets/reading/page-11.png',
            'assets/reading/page-12.png'
          ]
        }
      ]
    }
  });
}());
