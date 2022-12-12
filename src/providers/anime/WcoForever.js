import axios from "axios";
import { load } from "cheerio";
import CFF from "../../utils/CF/src/CF";
const CF = CFF.default;
const cf = new CF(false);

import { USER_AGENT } from "../../utils";
import FormData from "form-data";

class WcoForever {
  name = "WcoForever";
  baseUrl = "https://wcoforever.net";

  search = async (query, page = 1) => {
    const searchResults = {
      currentPage: page,
      hasNextPage: false,
      results: [],
    };

    try {
      let formData = new FormData();
      formData.append("catara", query);
      formData.append("konuara", "series");

      const options = {
        method: "post",
        headers: {
          ...formData.getHeaders(),
          mode: "cors",
          redirect: "follow",
          credentials: "same-origin",
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: formData,
      };

      const data = await cf.post(`${this.baseUrl}/search`, options);

      const html = await data.text();
      const $ = load(html);

      const results = $("ul.items > li");
      console.log($("ul.items ").html());

      results.each((i, el) => {
        const title = $(el).find("h2").text();
        const id = $(el).find("a").attr("href");
        const image = $(el).find("img").attr("src");
        const type = $(el).find("span").text();

        searchResults.results.push({
          id,
          title,
          image,
          type,
        });
      });

      return searchResults;
    } catch (error) {
      console.error(error);
    }
  };

  Source = async (episodeId) => {
    if (!episodeId.startsWith("http"))
      episodeId = `${this.baseUrl}/${episodeId}`;

    const sources = {
      results: [],
      // Needed to play the video
      "user-agent": USER_AGENT,
    };

    let option2 = {
      headers: {
        "user-agent": USER_AGENT,
        "x-requested-with": "XMLHttpRequest",
      },
    };

    try {
      const data = await cf.get(episodeId, {
        method: "GET",
      });

      const htmlEpisodeId = await data.text();

      let tempReg =
        /<script>var.+?document\.write\(decodeURIComponent\(escape.+?<\/script>/gis;
      let tempRegOut = tempReg.exec(htmlEpisodeId)[0];
      let arrayReg = /\[.+\]/gis;
      let main = "";

      let arrayRegOut = JSON.parse(arrayReg.exec(tempRegOut)[0]);
      let num = parseInt(tempRegOut.split(`.replace(\/\\D\/g,'')) -`)[1]);

      await arrayRegOut.forEach((value) => {
        const atob = Buffer.from(value, "base64").toString();
        main += String.fromCharCode(parseInt(atob.replace(/\D/g, "")) - num);
      });

      main = main.split('src="')[1].split('" ')[0];
      option2.headers.referer = main;

      let domain;
      try {
        domain = new URL(main).origin;
      } catch (err) {
        domain = "https://embed.watchanimesub.net";
      }

      let { data: req2 } = await axios.get(main, option2);

      main = domain + req2.split('$.getJSON("')[1].split('"')[0];

      try {
        let animeUrl = main
          .split("v=cizgi")
          .join("v=")
          .split("&embed=cizgi")
          .join("&embed=anime");

        let { data: req4 } = await axios.get(main, option2);

        const server = req4?.cdn;
        if (req4.hd != "") {
          sources.results.push({
            url: `${server}/getvid?evid=${req4.hd}`,
            name: "HD#2",
            type: "mp4",
          });
        }

        if (req4.enc != "") {
          sources.results.push({
            url: `${server}/getvid?evid=${req4.enc}`,
            name: "SD#2",
            type: "mp4",
          });
        }

        if (req4.fhd != "") {
          sources.results.push({
            url: `${server}/getvid?evid=${req4.fhd}`,
            name: "FHD#2",
            type: "mp4",
          });
        }
      } catch (err) {
        console.error(err);
      }

      let { data: req3 } = await axios.get(main, option2);

      const server = req3?.server;
      if (req3.enc != "") {
        sources.results.unshift({
          url: `${server}/getvid?evid=${req3.enc}`,
          name: "SD",
          type: "mp4",
        });
      }

      if (req3.hd != "") {
        sources.results.unshift({
          url: `${server}/getvid?evid=${req3.hd}`,
          name: "HD",
          type: "mp4",
        });
      }

      if (req3.fhd != "") {
        sources.results.unshift({
          url: `${server}/getvid?evid=${req3.fhd}`,
          name: "FHD",
          type: "mp4",
        });
      }

      return sources;
    } catch (error) {
      console.log(error);
    }
  };

  Servers = async (episodeId) => {
    throw new Error("Method not implemented.");
  };
}

(async () => {
  const wcoForever = new WcoForever();
  const source = await wcoForever.search("naruto");
  console.log(source);
})();

export default WcoForever;
