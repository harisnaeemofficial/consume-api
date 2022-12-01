import axios from "axios";
import { load } from "cheerio";

import { USER_AGENT } from "../utils";

class Vrv {
  serverName = "vrv";
  sources = [];

  host = "https://v.vrv.co";
  animixplayHost = "https://animixplay.to";

  extract = async (videoUrl) => {
    const options = {
      headers: {
        Referer: videoUrl.href,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
        "X-Requested-With": "XMLHttpRequest",
      },
    };
    console.log(videoUrl.href);
    const { data } = await axios.get(videoUrl.href);

    const $ = load(data);
    const iframe = $("#iframeplayer").attr("src");
    console.log(this.animixplayHost + iframe);
    const { data: iframeData } = await axios.get(this.animixplayHost + iframe);

    return this.sources;
  };
}

export default Vrv;
