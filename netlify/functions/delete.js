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

  const { title, password } = payload;

  if (password !== process.env.UPLOAD_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: "Incorrect password." }) };
  }

  if (!title) {
    return { statusCode: 400, body: JSON.stringify({ error: "Title is required." }) };
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // e.g. "yourname/storylab"
  const branch = process.env.GITHUB_BRANCH || "main";

  const githubHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  try {
    const worksRes = await fetch(`${GITHUB_API}/repos/${repo}/contents/works.json?ref=${branch}`, {
      headers: githubHeaders,
    });

    if (!worksRes.ok) {
      throw new Error(`Failed to read works.json: ${await worksRes.text()}`);
    }

    const worksFile = await worksRes.json();
    const works = JSON.parse(Buffer.from(worksFile.content, "base64").toString("utf-8"));

    const index = works.findIndex((work) => work.title === title);
    if (index === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: "Work not found." }) };
    }

    const [removed] = works.splice(index, 1);

    for (const filePath of [removed.image, removed.pdf]) {
      if (!filePath) continue;

      const fileRes = await fetch(`${GITHUB_API}/repos/${repo}/contents/${filePath}?ref=${branch}`, {
        headers: githubHeaders,
      });
      if (!fileRes.ok) continue;

      const file = await fileRes.json();
      await fetch(`${GITHUB_API}/repos/${repo}/contents/${filePath}`, {
        method: "DELETE",
        headers: githubHeaders,
        body: JSON.stringify({
          message: `Remove file for deleted work: ${title}`,
          sha: file.sha,
          branch,
        }),
      });
    }

    const updateRes = await fetch(`${GITHUB_API}/repos/${repo}/contents/works.json`, {
      method: "PUT",
      headers: githubHeaders,
      body: JSON.stringify({
        message: `Remove "${title}" from works.json`,
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
        message: "Deleted. It will disappear from the site once the new deploy finishes.",
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "Delete failed." }) };
  }
};
