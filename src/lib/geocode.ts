interface GeocodeResult {
  lat: number;
  lng: number;
}

export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip: string
): Promise<GeocodeResult> {
  const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`;

  const res = await fetch(url, {
    headers: { "User-Agent": "BlockAndMortar/1.0" },
  });

  if (!res.ok) {
    return { lat: 0, lng: 0 };
  }

  const data = await res.json();
  if (data.length === 0) {
    return { lat: 0, lng: 0 };
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}
