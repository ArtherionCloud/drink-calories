// api/lookup.js

const fetch = require("node-fetch"); // CommonJS import

module.exports = async (req, res) => {
  const barcode = req.query.barcode;

  if (!barcode) {
    return res.status(400).json({ error: "Missing barcode parameter" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: "Missing Supabase environment vars" });
  }

  const url = `${SUPABASE_URL}/rest/v1/products?barcode=eq.${encodeURIComponent(
    barcode
  )}&select=*`;

  try {
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: "Supabase error", detail: text });
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(200).json({ product: data[0] });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected error", detail: err.toString() });
  }
};
