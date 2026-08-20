const GITHUB_API = "https://api.github.com";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const { title, description, password, pdfBase64, pdfFilename } = payload;

  if (password !== process.env.UPLOAD_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: "Incorrect password." }) };
  }

  if (!title || !pdfBase64 || !pdfFilename) {
    return { statusCode: 400, body: JSON.stringify({ error: "Title and PDF file are required." }) };
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // e.g. "yourname/storylab"
  const branch = process.env.GITHUB_BRANCH || "main";

  const githubHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  const safeName = pdfFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const pdfPath = `assets/works/${Date.now()}-${safeName}`;

  try {
    const pdfRes = await fetch(`${GITHUB_API}/repos/${repo}/contents/${pdfPath}`, {
      method: "PUT",
      headers: githubHeaders,
      body: JSON.stringify({
        message: `Add work: ${title}`,
        content: pdfBase64,
        branch,
      }),
    });

    if (!pdfRes.ok) {
      throw new Error(`Failed to upload PDF: ${await pdfRes.text()}`);
    }

    const worksRes = await fetch(`${GITHUB_API}/repos/${repo}/contents/works.json?ref=${branch}`, {
      headers: githubHeaders,
    });

    if (!worksRes.ok) {
      throw new Error(`Failed to read works.json: ${await worksRes.text()}`);
    }

    const worksFile = await worksRes.json();
    const works = JSON.parse(Buffer.from(worksFile.content, "base64").toString("utf-8"));

    works.push({
      title,
      description: description || "",
      pdf: pdfPath,
    });

    const updateRes = await fetch(`${GITHUB_API}/repos/${repo}/contents/works.json`, {
      method: "PUT",
      headers: githubHeaders,
      body: JSON.stringify({
        message: `Add "${title}" to works.json`,
        content: Buffer.from(JSON.stringify(works, null, 2)).toString("base64"),
        sha: worksFile.sha,
        branch,
      }),
    });

    if (!updateRes.ok) {
      throw new Error(`Failed to update works.json: ${await updateRes.text()}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Uploaded! It will appear on the site once the new deploy finishes (usually under a minute).",
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "Upload failed." }) };
  }
};
