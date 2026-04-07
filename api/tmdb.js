export default async function handler(req, res) {
  const API_KEY = process.env.TMDB_API_KEY;
  const { endpoint = "", query = "" } = req.query;

  try {
    if (!API_KEY) {
      return res.status(500).json({ error: "TMDB_API_KEY is missing on server" });
    }

    const decodedEndpoint = decodeURIComponent(endpoint);
    const hasQueryAlready = decodedEndpoint.includes("?");

    const url =
      `https://api.themoviedb.org/3${decodedEndpoint}` +
      `${hasQueryAlready ? "&" : "?"}api_key=${API_KEY}&language=en-US` +
      (query ? `&query=${encodeURIComponent(query)}` : "");

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to fetch TMDB",
    });
  }
}