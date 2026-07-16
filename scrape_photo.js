const fs = require("fs");

async function run() {
  const url = "https://www.facebook.com/photo/?fbid=122095534101248886&set=a.122095522257248886";
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const html = await res.text();
    fs.writeFileSync("facebook_photo.html", html);
    console.log("Wrote facebook_photo.html, searching matches...");

    // Find any ID in strings like "owner", "page", "user", "actor", "profile"
    const regexes = [
      /"owner":\s*\{\s*"id":\s*"(\d+)"/g,
      /"owning_profile":\s*\{\s*"id":\s*"(\d+)"/g,
      /"profile_id":\s*"(\d+)"/g,
      /"owner_id":\s*"(\d+)"/g,
      /owning_profile_id":"(\d+)"/g,
      /userID":"(\d+)"/g,
      /"pageID":"(\d+)"/g
    ];

    for (const r of regexes) {
      let match;
      while ((match = r.exec(html)) !== null) {
        console.log(`Matched ID: ${match[1]} with regex ${r.toString()}`);
      }
    }
  } catch (e) {
    console.error("Scrape error:", e);
  }
}
run();
