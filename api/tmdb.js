export default async function handler(req, res) {
  const API_KEY = process.env.TMDB_API_KEY;

  const { endpoint, query } = req.query;

  try {
    const url = `https://api.themoviedb.org/3${endpoint}?api_key=${API_KEY}&language=en-US${query ? `&query=${query}` : ""}`;

    const response = await fetch(url);
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch TMDB" });
  }
}