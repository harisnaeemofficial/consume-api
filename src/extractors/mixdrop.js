import { api as axios } from "../utils/api.js";
import { load } from "cheerio";

class MixDrop {
  serverName = "MixDrop";
  sources = [];

  extract = async (videoUrl) => {
    try {
      const { data } = await axios.get(videoUrl.href);

      const match = load(data)
        .html()
        .match(/(?<=p}\().*(?<=wurl).*\}/g);

      if (!match) {
        throw new Error("Video not found.");
      }
      const [p, a, c, k, e, d] = match[0]
        .split(",")
        .map((x) => x.split(".sp")[0]);
      const formated = this.format(p, a, c, k, e, JSON.parse(d));

      const [poster, source] = formated
        .match(/(?<=poster'=").+?(?=")|(?<=wurl=").+?(?=")/g)
        .map((x) => (x.startsWith("http") ? x : `https:${x}`));

      this.sources.push({
        url: source,
        isM3U8: source.includes(".m3u8"),
        poster: poster,
      });

      return this.sources;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  format = (p, a, c, k, e, d) => {
    k = k.split("|");
    e = (c) => {
      return c.toString(36);
    };
    if (!"".replace(/^/, String)) {
      while (c--) {
        d[c.toString(a)] = k[c] || c.toString(a);
      }
      k = [
        (e) => {
          return d[e];
        },
      ];
      e = () => {
        return "\\w+";
      };
      c = 1;
    }
    while (c--) {
      if (k[c]) {
        p = p.replace(new RegExp("\\b" + e(c) + "\\b", "g"), k[c]);
      }
    }
    return p;
  };
}
export default MixDrop;
