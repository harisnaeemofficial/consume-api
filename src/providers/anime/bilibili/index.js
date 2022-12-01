import { api as axios } from "../../../utils/api.js";

import { BilibiliExtractor } from "../../../utils";

class Bilibili {
  name = "Bilibili";
  baseUrl = "https://bilibili.tv";
  logo =
    "https://www.apksforfree.com/wp-content/uploads/2021/10/oie_1413343NvdZCZR5.png";
  classPath = "ANIME.Bilibili";

  apiUrl = "https://api.bilibili.tv/intl/gateway/web";

  cookie = "";
  locale = "en_US";
  sgProxy = "https://streamable-proxy.onrender.com";

  constructor(cookie, locale) {
    this.locale = locale ?? this.locale;
    if (!cookie) return;
    this.cookie = cookie;
  }

  async Search(query) {
    const { data } = await axios.get(
      `${this.sgProxy}/${this.apiUrl}/v2/search?keyword=${query}&platform=web&pn=1&ps=20&qid=&s_locale=${this.locale}`,
      { headers: { cookie: this.cookie } }
    );
    if (!data.data.filter((item) => item.module.includes("ogv")).length)
      return { results: [], totalResults: 0 };

    const results = data.data.find((item) => item.module.includes("ogv"));

    return {
      totalResults: results.items.length ?? 0,
      results: results.items.map((item) => ({
        id: item.season_id,
        title: item.title,
        image: item.cover,
        genres: item.styles.split(" / "),
        rating: item.score,
        view: item.view,
      })),
    };
  }

  async Info(id) {
    try {
      const { data } = await axios.get(
        `${this.sgProxy}/https://app.biliintl.com/intl/gateway/v2/ogv/view/app/season2?locale=${this.locale}&platform=android&season_id=${id}`,
        { headers: { cookie: this.cookie } }
      );

      let counter = 1;

      const episodes = data.data.sections.section.flatMap((section) =>
        section.ep_details.map((ep) => ({
          id: ep.episode_id.toString(),
          number: counter++,
          title: ep.long_title || ep.title,
          image: ep.horizontal_cover,
        }))
      );

      return {
        id,
        title: data.data.title,
        description: data.data.details.desc.value,
        seasons: data.data.season_series.map((season) => ({
          id: season.season_id,
          title: season.title,
        })),
        recommendations: data.data.for_you.item_details.map((section) => ({
          id: section.season_id,
          title: section.title,
          image: section.horizontal_cover,
          genres: section.styles.split(" / "),
          views: section.view,
        })),
        episodes: episodes,
        totalEpisodes: episodes.length,
      };
    } catch (err) {
      throw err;
    }
  }

  async Source(episodeId, ...args) {
    try {
      const { data } = await axios.get(
        `${this.sgProxy}/${this.apiUrl}/v2/subtitle?s_locale=${this.locale}&platform=web&episode_id=${episodeId}`,
        { headers: { cookie: this.cookie } }
      );
      // const ss = await axios.get(
      //   `${this.sgProxy}/${this.apiUrl}/playurl?s_locale=${this.locale}&platform=web&ep_id=${episodeId}`,
      //   { headers: { cookie: this.cookie } }
      // );

      const sources = await new BilibiliExtractor().extract(episodeId);
      return {
        sources: sources.sources,
        subtitles: data.data.subtitles.map((sub) => ({
          id: sub.subtitle_id,
          lang: sub.lang,
          url: `https://api.consumet.org/utils/bilibili/subtitle?url=${sub.url}`,
        })),
      };
    } catch (err) {
      throw err;
    }
  }

  async Servers(episodeId) {
    throw new Error("Method not implemented.");
  }
}

export default Bilibili;
