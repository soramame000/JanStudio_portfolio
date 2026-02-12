(() => {
  const loginForm = document.getElementById("login-form");
  const uploadForm = document.getElementById("upload-form");
  const uploaderSection = document.getElementById("uploader-section");
  const statusEl = document.getElementById("status");

  let token = "";

  function setStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#c62828" : "#0f2747";
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const password = String(formData.get("password") || "");
    if (!password) {
      setStatus("パスワードを入力してください。", true);
      return;
    }

    setStatus("ログイン中...");
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (!response.ok) {
      setStatus("ログインに失敗しました。", true);
      return;
    }

    const data = await response.json();
    token = data.token || "";
    uploaderSection.hidden = !token;
    setStatus("ログイン成功。アップロード可能です。");
  });

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!token) {
      setStatus("先にログインしてください。", true);
      return;
    }

    const formData = new FormData(uploadForm);
    const file = formData.get("imageFile");
    const title = String(formData.get("title") || "").trim();
    const genre = String(formData.get("genre") || "").trim();
    if (!file || !(file instanceof File) || !title || !genre) {
      setStatus("必須項目を入力してください。", true);
      return;
    }

    setStatus("アップロード中...");
    const response = await fetch("/api/upload-photo", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      setStatus(error.message || "アップロードに失敗しました。", true);
      return;
    }

    const result = await response.json();
    setStatus(`登録完了: ${result.id || "ID取得成功"}`);
    uploadForm.reset();
  });
})();
