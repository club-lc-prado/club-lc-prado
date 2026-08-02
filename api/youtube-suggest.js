module.exports = async (req, res) => {
  try {
    const q = req.query.q || "";
    if (!q.trim()) {
      res.status(200).json({ suggestions: [] });
      return;
    }

    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`;
    const response = await fetch(url);
    const data = await response.json();
    const suggestions = Array.isArray(data) && Array.isArray(data[1]) ? data[1].slice(0, 8) : [];

    res.status(200).json({ suggestions });
  } catch (err) {
    res.status(200).json({ suggestions: [] });
  }
};