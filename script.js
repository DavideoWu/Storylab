async function renderGallery() {
  const gallery = document.querySelector(".gallery");
  if (!gallery) return;

  const response = await fetch("works.json");
  const works = await response.json();

  gallery.innerHTML = works.map((work) => `
    <article class="card">
      <img class="card__image" src="${work.image}" alt="${work.title}">
      <h2>${work.title}</h2>
      <p class="card__meta">by ${work.author}${work.age ? `, age ${work.age}` : ""}</p>
      <p>${work.description}</p>
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
    const file = form.pdf.files[0];

    status.textContent = "Uploading…";

    const payload = {
      title: form.title.value,
      description: form.description.value,
      password: form.password.value,
      pdfFilename: file.name,
      pdfBase64: await fileToBase64(file),
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

renderGallery();
setupUploadForm();
