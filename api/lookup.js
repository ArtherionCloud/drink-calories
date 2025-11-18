export default async function handler(req, res) {
  try {
    // 1. Read the barcode from query string
    const barcode = req.query.barcode;

    if (!barcode) {
      return res.status(400).json({
        error: "Missing barcode parameter. Example: /api/lookup?barcode=1234567"
      });
    }

    // 2. Load Supabase environment variables from Vercel
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({
        error: "Supabase credentials missing",
        details: "Check Vercel → Project Settings → Environment Variables"
      });
    }

    // 3. Build the Supabase REST URL
    // EXACT TEXT MATCH on barcode
    const url =
      `${SUPABASE_URL}/rest/v1/products` +
      `?barcode=eq.${encodeURIComponent(barcode)}` +
      `&select=*`;

    // 4. Make the request to Supabase
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    // 5. Handle Supabase errors
    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({
        error: "Supabase query failed",
        details: text
      });
    }

    // 6. Parse the result
    const data = await response.json();

    // 7. No match found
    if (!data || data.length === 0) {
      return res.status(404).json({
        error: "Product not found",
        searched_barcode: barcode
      });
    }

    // 8. Return the FIRST MATCH
    return res.status(200).json({
      success: true,
      product: data[0]
    });

  } catch (err) {
    // 9. Catch unexpected errors
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message
    });
  }
}
