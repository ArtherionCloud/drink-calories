// api/lookup.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { barcode } = req.query;

  if (!barcode) {
    return res.status(400).json({ error: "Missing barcode parameter" });
  }

  // Supabase credentials (we'll fill these in)
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res
      .status(500)
      .json({ error: "Supabase environment variables not configured" });
  }

  const url = `${SUPABASE_URL}/rest/v1/products?barcode=eq.${encodeURIComponent(
    barcode
  )}&select=*`;

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

  // For now just return the first match
  const product = data[0];
  res.status(200).json({ product });
}
async function lookupByBarcode() {
  const barcode = document.getElementById("barcode").value.trim();
  if (!barcode) {
    alert("Enter a barcode first.");
    return;
  }

  try {
    const res = await fetch(`/api/lookup?barcode=${encodeURIComponent(barcode)}`);
    if (!res.ok) {
      if (res.status === 404) {
        alert("Product not found in database yet.");
        return;
      }
      const err = await res.json().catch(() => ({}));
      console.error(err);
      alert("Error looking up product.");
      return;
    }

    const { product } = await res.json();
    if (!product) {
      alert("No product data returned.");
      return;
    }

    // Fill form with product info
    if (product.abv) {
      document.getElementById("abv").value = product.abv;
    }
    if (product.style) {
      document.getElementById("style").value = product.style;
    }

    // Optional: auto-calc if you stored calories_bottle
    if (product.calories_bottle && product.calories_bottle > 0) {
      const volumeInput = document.getElementById("volume");
      const glassInput = document.getElementById("glass");
      const volume = parseFloat(volumeInput.value) || 750;
      const glass = parseFloat(glassInput.value) || 150;

      const totalBottle = product.calories_bottle;
      const perGlass = totalBottle * (glass / volume);

      const results = document.getElementById("results");
      document.getElementById(
        "perGlass"
      ).textContent = `Per ${glass.toFixed(0)} ml glass: ~${perGlass.toFixed(0)} kcal`;
      document.getElementById(
        "perBottle"
      ).textContent = `Per ${volume.toFixed(0)} ml bottle: ~${totalBottle.toFixed(0)} kcal`;
      results.style.display = "block";
    } else {
      alert("Product found – ABV and style filled. Hit Estimate to calculate.");
    }
  } catch (e) {
    console.error(e);
    alert("Unexpected error looking up barcode.");
  }
}

document.getElementById("lookupButton")?.addEventListener("click", lookupByBarcode);
