(() => {
  const MAX_IMAGE_BYTES = 950_000;
  const TARGET_IMAGE_BYTES = 900_000;
  const loginForm = document.getElementById("login-form");
  const uploadForm = document.getElementById("upload-form");
  const uploaderSection = document.getElementById("uploader-section");
  const statusEl = document.getElementById("status");

  let token = "";

  function setStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#c62828" : "#0f2747";
  }

  function toJpegFileName(name) {
    const dotIndex = name.lastIndexOf(".");
    const base = dotIndex > 0 ? name.slice(0, dotIndex) : name;
    return `${base}.jpg`;
  }

  function canvasToBlob(canvas, quality) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
    });
  }

  async function compressImageIfNeeded(file) {
    if (!(file instanceof File) || file.size <= TARGET_IMAGE_BYTES) return file;

    try {
      setStatus("画像を自動圧縮しています...");
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return file;

      const longestEdge = Math.max(bitmap.width, bitmap.height);
      const baseScale = longestEdge > 3200 ? 3200 / longestEdge : 1;
      const scaleSteps = [baseScale, baseScale * 0.9, baseScale * 0.8, baseScale * 0.7];
      const qualitySteps = [0.9, 0.82, 0.75, 0.68, 0.6, 0.52];

      let bestBlob = null;

      for (const scale of scaleSteps) {
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.width = width;
        canvas.height = height;
        context.clearRect(0, 0, width, height);
        context.drawImage(bitmap, 0, 0, width, height);

        for (const quality of qualitySteps) {
          const blob = await canvasToBlob(canvas, quality);
          if (!blob) continue;
          if (!bestBlob || blob.size < bestBlob.size) {
            bestBlob = blob;
          }
          if (blob.size <= TARGET_IMAGE_BYTES) {
            return new File([blob], toJpegFileName(file.name), { type: "image/jpeg" });
          }
        }
      }

      if (bestBlob) {
        return new File([bestBlob], toJpegFileName(file.name), { type: "image/jpeg" });
      }
      return file;
    } catch (_error) {
      return file;
    }
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
    const imageUrl = String(formData.get("imageUrl") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const genre = String(formData.get("genre") || "").trim();
    const hasFile = file instanceof File && file.size > 0;
    if (!title || !genre || (!hasFile && !imageUrl)) {
      setStatus("必須項目（タイトル・ジャンル・画像または画像URL）を入力してください。", true);
      return;
    }

    if (hasFile) {
      const preparedFile = await compressImageIfNeeded(file);
      if (preparedFile.size > MAX_IMAGE_BYTES) {
        const sizeMb = (preparedFile.size / (1024 * 1024)).toFixed(1);
        const maxMb = (MAX_IMAGE_BYTES / (1024 * 1024)).toFixed(1);
        setStatus(
          `自動圧縮後もサイズ超過です（現在 ${sizeMb}MB / 上限 ${maxMb}MB）。もう少し小さい画像で試してください。`,
          true
        );
        return;
      }
      formData.set("imageFile", preparedFile, preparedFile.name);
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
