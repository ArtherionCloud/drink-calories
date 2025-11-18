
// api/lookup.js

// Vercel Node.js Serverless Function
export default async function handler(req, res) {
  // --- Get barcode from the URL query string ---
  let barcode = null;
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    barcode = url.searchParams.get("barcode");
  } catch (e) {
    console.error("Error parsing URL", e);
  }

  if (!barcode) {
    res.status(400).json({ error: "Missing barcode parameter" });
    return;
  }

  // --- Read Supabase env vars ---
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase env vars missing");
    res.status(500).json({ error: "Supabase environment variables not configured" });
    return;
  }

  const endpoint = `${SUPABASE_URL}/rest/v1/products?barcode=eq.${encodeURIComponent(
    barcode
  )}&select=*`;

  try {
    // Node 18 on Vercel has fetch built-in – no node-fetch needed
    const response = await fetch(endpoint, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Supabase error response:", text);
      res.status(500).json({ error: "Supabase error", detail: text });
      return;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const product = data[0];
    res.status(200).json({ product });
  } catch (err) {
    console.error("Unexpected error in lookup function:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
}
