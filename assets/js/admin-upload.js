(() => {
  const form = document.getElementById("upload-form");
  const statusEl = document.getElementById("upload-status");
  const guardMessageEl = document.getElementById("admin-guard-message");
  const config = window.PORTFOLIO_CONFIG || {};

  if (!form || !statusEl) return;

  const isLocalhost =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "::1";

  const baseUrlInput = document.getElementById("base-url");
  const apiKeyInput = document.getElementById("api-key");
  const mediaPathInput = document.getElementById("media-path");

  if (!isLocalhost) {
    Array.from(form.elements).forEach((el) => {
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLButtonElement
      ) {
        el.disabled = true;
      }
    });
    if (guardMessageEl) {
      guardMessageEl.textContent =
        "セキュリティのためこの管理ページは localhost でのみ有効です。公開サイトでは無効化されています。";
      guardMessageEl.style.color = "#c62828";
      guardMessageEl.style.fontWeight = "700";
    }
    return;
  }

  if (baseUrlInput) {
    baseUrlInput.value = config.CMS_BASE_URL || "";
  }
  if (apiKeyInput && config.CMS_API_KEY && config.CMS_API_KEY !== "YOUR_API_KEY_HERE") {
    apiKeyInput.value = config.CMS_API_KEY;
  }

  function setStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#c62828" : "";
  }

  async function uploadImage(baseUrl, apiKey, mediaPath, file) {
    const formData = new FormData();
    formData.append("file", file);

    const endpoint = new URL(mediaPath.replace(/^\//, ""), `${baseUrl}/`).toString();
    const tryEndpoints = [endpoint];

    if (mediaPath === "/media") {
      tryEndpoints.push(new URL("upload", `${baseUrl}/`).toString());
    }

    for (const url of tryEndpoints) {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey
        },
        body: formData
      });
      if (!res.ok) continue;
      const data = await res.json();
      const imageUrl =
        data?.url ||
        data?.image?.url ||
        data?.file?.url ||
        data?.media?.url ||
        "";
      if (imageUrl) {
        return imageUrl;
      }
    }

    throw new Error("画像アップロードに失敗しました。mediaPath を確認してください。");
  }

  async function createPhotoEntry(baseUrl, apiKey, payload) {
    const endpoint = new URL("photos", `${baseUrl}/`).toString();
    const payloadVariants = [
      payload,
      { ...payload, image: payload.image?.url || "" }
    ];

    for (const body of payloadVariants) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) continue;
      return res.json();
    }

    throw new Error("photos登録に失敗しました。フィールド設定を確認してください。");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const baseUrl = String(formData.get("baseUrl") || "").trim().replace(/\/$/, "");
    const apiKey = String(formData.get("apiKey") || "").trim();
    const mediaPath = String(formData.get("mediaPath") || "/media").trim() || "/media";
    const file = formData.get("imageFile");
    const title = String(formData.get("title") || "").trim();
    const genre = String(formData.get("genre") || "").trim();

    if (!baseUrl || !apiKey || !file || !(file instanceof File) || !title || !genre) {
      setStatus("必須項目を入力してください。", true);
      return;
    }

    setStatus("アップロード中...");

    try {
      const imageUrl = await uploadImage(baseUrl, apiKey, mediaPath, file);
      const tags = String(formData.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        title,
        genre,
        caption: String(formData.get("caption") || "").trim(),
        image: { url: imageUrl },
        eventDate: String(formData.get("eventDate") || "").trim(),
        team: String(formData.get("team") || "").trim(),
        location: String(formData.get("location") || "").trim(),
        tags,
        publishStatus: String(formData.get("publishStatus") || "draft"),
        featuredPriority: formData.get("featuredPriority")
          ? Number(formData.get("featuredPriority"))
          : undefined,
        projectId: String(formData.get("projectId") || "").trim()
      };

      Object.keys(payload).forEach((key) => {
        if (
          payload[key] === "" ||
          payload[key] === undefined ||
          (Array.isArray(payload[key]) && payload[key].length === 0)
        ) {
          delete payload[key];
        }
      });

      const created = await createPhotoEntry(baseUrl, apiKey, payload);
      setStatus(`登録完了: ${created.id || "ID取得成功"}`);
      form.reset();
      if (baseUrlInput) baseUrlInput.value = baseUrl;
      if (mediaPathInput) mediaPathInput.value = mediaPath;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "登録に失敗しました。", true);
    }
  });
})();
