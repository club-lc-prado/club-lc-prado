module.exports = async (req, res) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    const fetchFor = async (lang, query) => {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=date&maxResults=10&relevanceLanguage=${lang}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.error) return [];
      return (data.items || []).map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        publishedAt: item.snippet.publishedAt,
      }));
    };

    const customQuery = req.query.q;

    const [ru, de] = customQuery
      ? await Promise.all([fetchFor("ru", customQuery), fetchFor("de", customQuery)])
      : await Promise.all([
          fetchFor("ru", "Тойота Прадо тест-драйв обзор"),
          fetchFor("de", "Toyota Land Cruiser Prado Test Fahrbericht"),
        ]);

    const merged = [];
    const seen = new Set();
    const maxLen = Math.max(ru.length, de.length);
    for (let i = 0; i < maxLen; i++) {
      if (ru[i] && !seen.has(ru[i].id)) {
        merged.push(ru[i]);
        seen.add(ru[i].id);
      }
      if (de[i] && !seen.has(de[i].id)) {
        merged.push(de[i]);
        seen.add(de[i].id);
      }
    }

    res.status(200).json({ videos: merged });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};