import axios from "axios";
import { load } from "cheerio";

import { StreamingServers, MediaStatus, SubOrDub } from "../../../models";
import { GogoCDN, StreamSB, USER_AGENT } from "../../../utils";

class NyaaSi {
  name = "NyaaSi";
  baseUrl = "https://nyaa.si";
  /*
   * DON'T THINK THEY HAVE A LOGO
   */
  logo = "";
  classPath = "ANIME.NyaaSi";

  Search = async (query, page = 1) => {
    const { data } = await axios.get(
      `${this.baseUrl}?page=rss&f=0&c=1_0&q=${query}&p=${page}`,
      {
        headers: {
          "User-Agent": USER_AGENT,
        },
      }
    );

    const $ = load(data, {
      xmlMode: true,
    });

    const results = [];
    $("item")
      .get()
      .map((el, i) => {
        // console.log($(el).find("title").text());
        const title = $(el).find("title").text();
        const link = $(el).find("link").text();
        const size = $(el).find("nyaa\\:size").text();
        const date = $(el).find("pubDate").text();
        const seeders = $(el).find("nyaa\\:seeders").text();
        const leechers = $(el).find("nyaa\\:leechers").text();
        const category = $(el).find("nyaa\\:category").text();
        const trusted = $(el).find("nyaa\\:trusted").text();

        if (title) {
          results.push({
            title,
            link,
            category,
            trusted,
            size,
            date,
            seeders,
            leechers,
          });
        }
      });

    return results;
  };
}

// (async () => {
//   const nyaa = new NyaaSi();
//   const search = await nyaa.Search("classroom of the elite");
//   console.log(search);
// })();

export default NyaaSi;
