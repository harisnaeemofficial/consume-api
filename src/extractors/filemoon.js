import { api as axios } from "../utils/api.js";
import { load } from "cheerio";

import { USER_AGENT } from "../utils";

class Filemoon {
  serverName = "Filemoon";
  sources = [];

  host = "https://filemoon.sx";

  extract = async (videoUrl) => {
    const options = {
      headers: {
        Referer: videoUrl.href,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
        "X-Requested-With": "XMLHttpRequest",
      },
    };

    const { data } = await axios.get(videoUrl.href);

    const s = data.substring(
      data.indexOf("eval(function") + 5,
      data.lastIndexOf(")))")
    );
    try {
      const newScript = "function run(" + s.split("function(")[1] + "))";
    } catch (err) {}
    return this.sources;
  };
}

export default Filemoon;
