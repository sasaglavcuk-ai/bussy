const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL; // твій Apps Script URL у змінних середовища Vercel

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(200).send("ok");
    return;
  }

  try {
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("sheet proxy error:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
}