# IZONE Term Tests

Hai answer sheet tĩnh cho Term Test 1 và Term Test 2. Mỗi trang đọc mã lớp từ query `?class=IC2139`, tải danh sách học viên từ API tích hợp, lưu Listening trước rồi mới mở Reading, sau đó hiển thị kết quả và phân tích.

Trang `/teacher/` dành cho giảng viên đã được cấp quyền Google. Trang này có tổng quan Band của cả lớp và tab kết quả chi tiết cho từng học viên; dữ liệu chỉ được API trả về sau khi kiểm tra quyền theo lớp.

Repo chỉ chứa loại ô nhập và danh sách lựa chọn giống Google Form. Đáp án đúng cùng dữ liệu bài làm nằm trong PostgreSQL/backend riêng, không nằm trong GitHub Pages.

## Đường dẫn

- `/term-test-1/?class=<MÃ_LỚP>`
- `/term-test-2/?class=<MÃ_LỚP>`
- `/teacher/?class=<MÃ_LỚP>&test=<MÃ_BÀI_TEST>`

## Kiểm thử

```text
npm test
npm run check
```

Không đưa tên học viên, đáp án đúng, token hoặc credential vào repo.
