# IZONE Tests

Các answer sheet tĩnh cho Term Test 1, Term Test 2 và Mini Test Buổi 5. Mỗi trang đọc mã lớp từ query `?class=IC2139`, tải danh sách học viên từ API tích hợp, lưu Listening trước rồi mới mở Reading, sau đó hiển thị kết quả và phân tích.

Route `/term-test-2-computer-based/` là bản giao diện mở rộng của Term Test 2. Trang này vẫn dùng nguyên API, slug, dữ liệu tạm, luồng nộp và màn hình kết quả hiện tại, đồng thời hiển thị đề scan, audio, hai khung đổi độ rộng, điều hướng 40 câu và đánh dấu câu cần xem lại.

Trang `/teacher/` dành cho giảng viên đã được cấp quyền Google. Trang này có tổng quan Band của cả lớp và tab kết quả chi tiết cho từng học viên; dữ liệu chỉ được API trả về sau khi kiểm tra quyền theo lớp.

Repo không chứa đáp án đúng, tên học viên viết cứng, token hoặc credential. Bản computer-based có thêm ảnh scan đề và audio để hiển thị cho thí sinh; chỉ phát hành các tài nguyên này khi đã xác nhận quyền sử dụng nội dung. Đáp án đúng cùng dữ liệu bài làm vẫn nằm trong PostgreSQL/backend riêng, không nằm trong GitHub Pages.

## Đường dẫn

- `/term-test-1/?class=<MÃ_LỚP>`
- `/term-test-2/?class=<MÃ_LỚP>`
- `/term-test-2-computer-based/?class=<MÃ_LỚP>`
- `/mini-test-lesson-5/?class=<MÃ_LỚP>`
- `/teacher/?class=<MÃ_LỚP>&test=<MÃ_BÀI_TEST>`

## Kiểm thử

```text
npm test
npm run check
```

Không đưa tên học viên, đáp án đúng, token hoặc credential vào repo.
