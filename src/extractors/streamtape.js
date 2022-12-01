import { api as axios } from "../utils/api.js";
import { load } from "cheerio";

class StreamTape {
  serverName = "StreamTape";
  sources = [];

  extract = async (videoUrl) => {
    try {
      return console.log(videoUrl.href);
      const { data } = await axios.get(videoUrl.href).catch((err) => {
        throw new Error("Video not found");
      });

      const $ = load(data);

      let [fh, sh] = $.html()
        ?.match(/robotlink'\).innerHTML = (.*)'/)[1]
        .split("+ ('");

      sh = sh.substring(3);
      fh = fh.replace(/\'/g, "");

      const url = `https:${fh}${sh}`;

      this.sources.push({
        url,
        isM3U8: isM3U8.includes(".m3u8"),
      });

      return this.sources;
    } catch (err) {
      throw new Error(err.message);
    }
  };
}
export default StreamTape;
