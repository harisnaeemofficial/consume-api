import axios from "axios";
import { load } from "cheerio";
import CFF from "cfbypass";
const CF = CFF.default;
const cf = new CF(false);

import cloudscraper from "cloudscraper-version.two";

import { USER_AGENT } from "../../utils";
import FormData from "form-data";

class WcoForever {
  name = "WcoForever";
  baseUrl = "https://wcoforever.net";

  Search = async (query, page = 1) => {
    const searchResults = {
      currentPage: page,
      hasNextPage: false,
      results: [],
    };

    try {
      const options = {
        body: {
          catara: query,
          konuara: "series",
        },
        method: "post",
      };

      const data = await cf.post(`${this.baseUrl}/search`, options);

      const html = await data.text();
      const $ = load(html);

      const results = $("ul.items li");

      results.each((i, el) => {
        const title = $(el).find("div.recent-release-episodes > a").text();
        const id = $(el).find("a").attr("href").split("/").pop();
        const url = $(el).find("a").attr("href");
        const image = $(el).find("img").attr("src");

        searchResults.results.push({
          id,
          title,
          image,
          url: url,
        });
      });

      return searchResults;
    } catch (error) {
      console.error(error);
    }
  };

  Info = async (id) => {
    if (!id.includes(this.baseUrl)) id = `${this.baseUrl}/anime/${id}`;

    const animeInfo = {
      id: "",
      title: "",
      url: id,
      genres: [],
      totalEpisodes: 0,
    };

    try {
      const data = await cf.get(id, {
        method: "GET",
      });

      const html = await data.text();
      const $ = load(html);

      animeInfo.id = id.split("/").pop();
      animeInfo.title = $(".h1-tag > a").text();
      animeInfo.image = `https:${$("#sidebar_cat .img5").first().attr("src")}`;
      animeInfo.description = $("#sidebar_cat p").text();

      $("a.genre-buton:not(:contains('Report'))").each((i, el) => {
        animeInfo.genres.push($(el).text());
      });

      const episodes = $("#sidebar_right3 a");
      animeInfo.totalEpisodes = episodes.length;

      animeInfo.episodes = [];
      episodes.each((i, el) => {
        const episodeId = $(el).attr("href").split("/").pop();
        const episodeNumber = String(
          $(el).attr("href").split("-episode-")[1]
        ).split("-")[0];
        const episodeSeason = String(
          $(el).attr("href")?.split("-season-")[1]
        )?.split("-")[0];
        const episodeTitle = $(el).text().split(" ").slice(0, -1).join(" ");

        animeInfo.episodes.push({
          id: episodeId,
          season: episodeSeason === "undefined" ? "1" : episodeSeason,
          number: episodeNumber,
          title: episodeTitle,
        });
      });

      return animeInfo;
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
      let num = parseInt(tempRegOut.split(`.replace(/\\\\D/g,\\'\\')) - `)[1]);

      await arrayRegOut.forEach((value) => {
        main += String.fromCharCode(
          parseInt(atob(value).replace(/\D/g, "")) - num
        );
      });

      main = main.split('src="')[1].split('" ')[0];
      option2.headers.referer = main;

      let domain;
      try {
        domain = new URL(main).origin;
      } catch (err) {
        domain = "https://embed.watchanimesub.net";
      }

      let req2 = await axios.get(main, option2);

      main = domain + req2.data.split('$.getJSON("')[1].split('"')[0];

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
}

// (async () => {
//   const wcoForever = new WcoForever();
//   const search = await wcoForever.Search("naruto");
//   const info = await wcoForever.Info(search.results[0].id);

//   const source = await wcoForever.Source(info.episodes[0].id);
//   console.log(source);
// })();

export default WcoForever;
