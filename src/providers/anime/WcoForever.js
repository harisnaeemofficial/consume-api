import axios from "axios";
import { load } from "cheerio";
import puppeteer from "puppeteer-extra";

import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { executablePath } from "puppeteer";
puppeteer.use(StealthPlugin());

class WcoForever {
  name = "WcoForever";
  baseUrl = "https://wcoforever.net";

  Source = async (episodeId) => {
    if (!episodeId.startsWith("http"))
      episodeId = `${this.baseUrl}/${episodeId}`;

    const sources = [];
    let option2 = {
      headers: {
        "x-requested-with": "XMLHttpRequest",
      },
    };

    try {
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: executablePath(),
      });
      const page = await browser.newPage();
      await page.goto(episodeId, { waitUntil: "networkidle2" });

      const htmlEpisodeId = await page.content();

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

        if (req4.hd != "") {
          sources.push({
            url: req4.cdn + "/getvid?evid=" + req4.hd,
            name: "HD#2",
            type: "mp4",
          });
        }

        if (req4.enc != "") {
          sources.push({
            url: req4.cdn + "/getvid?evid=" + req4.enc,
            name: "SD#2",
            type: "mp4",
          });
        }

        if (req4.fhd != "") {
          sources.push({
            url: req4.cdn + "/getvid?evid=" + req4.fhd,
            name: "FHD#2",
            type: "mp4",
          });
        }
      } catch (err) {
        console.error(err);
      }

      let { data: req3 } = await axios.get(main, option2);

      if (req3.enc != "") {
        sources.unshift({
          url: req3.cdn + "/getvid?evid=" + req3.enc,
          name: "SD",
          type: "mp4",
        });
      }

      if (req3.hd != "") {
        sources.unshift({
          url: req3.cdn + "/getvid?evid=" + req3.hd,
          name: "HD",
          type: "mp4",
        });
      }

      if (req3.fhd != "") {
        sources.unshift({
          url: req3.cdn + "/getvid?evid=" + req3.fhd,
          name: "FHD",
          type: "mp4",
        });
      }

      await browser.close();
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
  const source = await wcoForever.Source(
    "https://www.wcoforever.net/xian-wang-de-richang-shenghuo-season-3-episode-12-english-subbed"
  );
  console.log(source);
})();

export default WcoForever;
