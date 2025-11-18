// api/lookup.js
// Simple Vercel serverless function that reads a product by barcode
// from the Supabase "products" table using the REST API.

export default async function handler(req, res) {
  try {
    // 1. Read barcode from query string: /api/lookup?barcode=123
    const { barcode } = req.query;

    if (!barcode || String(barcode).trim() === "") {
      return res.status(400).json({ error: "Missing barcode parameter" });
    }

    // 2. Read Supabase environment variables set in Vercel
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      // If you see this in the browser, env vars aren’t wired correctly
      return res.status(500).json({
        error: "Supabase environment variables not configured",
      });
    }

    // 3. Build the REST URL for the "products" table
    // Ensure no trailing / on SUPABASE_URL
    const baseUrl = SUPABASE_URL.replace(/\/+$/, "");
    const url = new URL("/rest/v1/products", baseUrl);

    // Equivalent to: ?barcode=eq.123456&select=*
    url.searchParams.set("barcode", `eq.${barcode}`);
    url.searchParams.set("select", "*");

    // 4. Call Supabase REST using the built-in fetch (Node 18 on Vercel)
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
    });

    // If Supabase itself failed, bubble up details
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return res.status(500).json({
        error: "Supabase request failed",
        status: response.status,
        detail: text,
      });
    }

    const data = await response.json();

    // 5. Handle “not found”
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 6. Return the first matching product
    const product = data[0];
    return res.status(200).json({ product });
  } catch (err) {
    // 7. Catch any unexpected errors
    console.error("lookup handler error:", err);
    return res.status(500).json({
      error: "Internal server error",
      detail: err?.message || String(err),
    });
  }
}
