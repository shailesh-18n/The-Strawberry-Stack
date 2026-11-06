(() => {
  const form = document.querySelector('#coding-assessment-form');
  const editor = document.querySelector('#python-code');
  const counter = document.querySelector('#code-byte-count');
  const submitButton = form?.querySelector('button[type="submit"]');
  const keyField = form?.querySelector('[data-submission-key]');
  if (!form || !editor || !counter || !submitButton || !keyField) return;

  const encoder = new TextEncoder();
  const maxBytes = 8 * 1024;
  const updateCount = () => {
    const bytes = encoder.encode(editor.value).byteLength;
    counter.textContent = `${bytes} / ${maxBytes} UTF-8 bytes`;
    counter.classList.toggle('text-danger', bytes > maxBytes);
    submitButton.disabled = bytes > maxBytes;
  };

  editor.addEventListener('input', () => {
    keyField.value = crypto.randomUUID();
    updateCount();
  });
  updateCount();
})();
