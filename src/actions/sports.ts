"use server";

export async function getSportsNews(teamName: string) {
  try {
    const query = teamName;

    // 1. Fetch Team Logo from TheSportsDB
    let teamLogo: string | undefined;
    try {
      const logoRes = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(query)}`,
      );
      if (logoRes.ok) {
        const logoData = await logoRes.json();
        if (logoData?.teams && logoData.teams.length > 0) {
          teamLogo = logoData.teams[0].strBadge;
        }
      }
    } catch (logoError) {
      console.error(`[getSportsNews] Error fetching logo for ${teamName}:`, logoError);
    }

    // 2. Fetch News from Google News RSS
    const articles = [];
    try {
      const rssSearchQuery = `${query} sports`;
      const rssRes = await fetch(
        `https://news.google.com/rss/search?q=${encodeURIComponent(rssSearchQuery)}&hl=en-US&gl=US&ceid=US:en`,
      );
      if (rssRes.ok) {
        const xml = await rssRes.text();

        // Use basic regex to extract titles, links, and descriptions
        const titles = [...xml.matchAll(/<title>(.*?)<\/title>/g)].slice(1, 4).map((m) => m[1]);
        const links = [...xml.matchAll(/<link>(.*?)<\/link>/g)].slice(1, 4).map((m) => m[1]);
        const descriptions = [...xml.matchAll(/<description>(.*?)<\/description>/g)].slice(1, 4).map((m) => m[1]);

        for (let i = 0; i < titles.length; i++) {
          // Decode simple HTML entities sometimes found in RSS
          const title = titles[i]
            .replace(/&apos;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, "&");

          // Attempt to extract img src from description for thumbnail, otherwise use team badge
          let thumbnail = teamLogo;
          const imgMatch = descriptions[i]?.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch?.[1]) {
            thumbnail = imgMatch[1];
          }

          articles.push({
            title: title,
            url: links[i],
            thumbnail: thumbnail,
            source: "Google News",
          });
        }
      }
    } catch (newsError) {
      console.error(`[getSportsNews] Error fetching news for ${teamName}:`, newsError);
    }

    return {
      success: true,
      teamLogo,
      articles:
        articles.length > 0
          ? articles
          : [
              {
                title: `Latest updates for ${teamName}`,
                url: "https://news.google.com/search?q=" + encodeURIComponent(teamName),
                source: "Google News",
                thumbnail: teamLogo,
              },
            ],
    };
  } catch (error: unknown) {
    console.error(`[getSportsNews] Error:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
