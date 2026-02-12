(() => {
  const form = document.getElementById("contact-form");
  const statusEl = document.getElementById("form-status");

  const ENDPOINT = ""; // ここにFormspree等のエンドポイントURLを設定

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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!ENDPOINT) {
      if (statusEl) {
        statusEl.textContent =
          "デモ環境のため送信は行われませんでした。Formspreeなどのエンドポイントを設定してください。";
      }
      form.reset();
      return;
    }

    const formData = new FormData(form);

    try {
      if (statusEl) statusEl.textContent = "送信中です…";

      const res = await fetch(ENDPOINT, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("送信エラー");
      }

      if (statusEl) statusEl.textContent = "送信が完了しました。ありがとうございます。";
      form.reset();
    } catch (err) {
      console.error(err);
      if (statusEl)
        statusEl.textContent =
          "送信に失敗しました。お手数ですが時間をおいて再度お試しください。";
    }
  });
})();

