(() => {
  const form = document.getElementById("contact-form");
  const statusEl = document.getElementById("form-status");

  // ENDPOINT is now handled via form action attribute in contact.html

  if (!form) return;

  function setError(name, message) {
    const errorEl = document.querySelector(
      `.field-error[data-error-for="${name}"]`
    );
    if (errorEl) errorEl.textContent = message || "";
  }

  function clearErrors() {
    document
      .querySelectorAll(".field-error")
      .forEach((el) => (el.textContent = ""));
    if (statusEl) statusEl.textContent = "";
  }

  function validate() {
    clearErrors();
    let valid = true;

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const type = form.type.value.trim();
    const message = form.message.value.trim();

    if (!name) {
      setError("name", "お名前を入力してください。");
      valid = false;
    }

    if (!email) {
      setError("email", "メールアドレスを入力してください。");
      valid = false;
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("email", "メールアドレスの形式が正しくありません。");
      valid = false;
    }

    if (!type) {
      setError("type", "撮影内容を選択してください。");
      valid = false;
    }

    if (!message) {
      setError("message", "ご相談内容を入力してください。");
      valid = false;
    }

    return valid;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Validated successfully, submit the form normally
    if (statusEl) statusEl.textContent = "送信画面へ移動します…";
    form.submit();
  });
})();

