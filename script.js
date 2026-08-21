async function renderGallery() {
  const gallery = document.querySelector(".gallery");
  if (!gallery) return;

  const response = await fetch("works.json");
  const works = await response.json();

  gallery.innerHTML = works.map((work) => `
    <article class="card">
      <button type="button" class="icon-button card__delete" data-title="${work.title}" aria-label="Delete this work">&times;</button>
      <a class="card__link" href="${work.pdf}" target="_blank" rel="noopener">
        <img class="card__image" src="${work.image}" alt="${work.title}">
        <h2>${work.title}</h2>
        <p class="card__meta">by ${work.author}, age ${work.age}</p>
        <p>${work.description}</p>
      </a>
    </article>
  `).join("");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setupUploadForm() {
  const toggle = document.querySelector("#upload-toggle");
  const form = document.querySelector("#upload-form");
  const closeButton = document.querySelector("#upload-close");
  if (!toggle || !form || !closeButton) return;

  toggle.addEventListener("click", () => {
    form.hidden = false;
  });

  closeButton.addEventListener("click", () => {
    form.hidden = true;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector(".upload-form__status");
    const pdfFile = form.pdf.files[0];
    const imageFile = form.image.files[0];

    status.textContent = "Uploading…";

    const payload = {
      title: form.title.value,
      author: form.author.value,
      age: form.age.value,
      description: form.description.value,
      password: form.password.value,
      pdfFilename: pdfFile.name,
      pdfBase64: await fileToBase64(pdfFile),
      imageFilename: imageFile.name,
      imageBase64: await fileToBase64(imageFile),
    };

    try {
      const response = await fetch("/.netlify/functions/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      status.textContent = response.ok ? result.message : result.error;
      if (response.ok) form.reset();
    } catch (err) {
      status.textContent = "Upload failed. Please try again.";
    }
  });
}

function setupDeleteDialog() {
  const gallery = document.querySelector(".gallery");
  const dialog = document.querySelector("#delete-dialog");
  const message = document.querySelector("#delete-dialog__message");
  const passwordInput = document.querySelector("#delete-password");
  const cancelButton = document.querySelector("#delete-cancel");
  if (!gallery || !dialog || !message || !passwordInput || !cancelButton) return;

  let pendingTitle = null;

  gallery.addEventListener("click", (event) => {
    const button = event.target.closest(".card__delete");
    if (!button) return;

    pendingTitle = button.dataset.title;
    message.textContent = `Delete "${pendingTitle}"? This can't be undone. Enter the password to confirm.`;
    passwordInput.value = "";
    dialog.showModal();
  });

  cancelButton.addEventListener("click", () => {
    dialog.close();
  });

  dialog.addEventListener("close", async () => {
    if (dialog.returnValue !== "confirm" || !pendingTitle) return;

    const title = pendingTitle;
    const password = passwordInput.value;
    pendingTitle = null;

    try {
      const response = await fetch("/.netlify/functions/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, password }),
      });
      const result = await response.json();

      alert(response.ok ? result.message : result.error);
    } catch (err) {
      alert("Delete failed. Please try again.");
    }
  });
}

renderGallery();
setupUploadForm();
setupDeleteDialog();
