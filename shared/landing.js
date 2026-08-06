(function () {
  'use strict';

  const input = document.getElementById('classCode');
  document.querySelectorAll('[data-test]').forEach(button => {
    button.addEventListener('click', () => {
      const classCode = input.value.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{2,32}$/.test(classCode)) {
        input.setCustomValidity('Hãy nhập mã lớp hợp lệ.');
        input.reportValidity();
        return;
      }
      input.setCustomValidity('');
      window.location.href = `${button.dataset.test}/?class=${encodeURIComponent(classCode)}`;
    });
  });
}());
