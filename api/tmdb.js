export default async function handler(req, res) {
  const API_KEY = process.env.TMDB_API_KEY;
  const { endpoint, query = "" } = req.query;

  try {
    if (!API_KEY) {
      return res.status(500).json({ error: "TMDB_API_KEY is missing on server" });
    }

    const url =
      `https://api.themoviedb.org/3${endpoint}` +
      `?api_key=${API_KEY}&language=en-US` +
      (query ? `&query=${encodeURIComponent(query)}` : "");

    console.log("TMDB URL:", url);

    const response = await fetch(url);
    const text = await response.text();

    console.log("TMDB status:", response.status);
    console.log("TMDB raw response:", text);

    if (!response.ok) {
      return res.status(response.status).send(text);
    }

    return res.status(200).send(text);
  } catch (error) {
    console.error("TMDB fetch error:", error);
    return res.status(500).json({
      error: error.message || "Failed to fetch TMDB",
      stack: error.stack,
    });
  }
}