import { api as axios } from "../../../utils/api.js";
import { load } from "cheerio";
import FormData from "form-data";

import {
  encodeString,
  decodeString,
  decodeStreamingLinkAnimix,
  headerOption,
} from "./helpers/utils.js";

import { GogoCDN, USER_AGENT, Vrv } from "../../../utils";
import * as constants from "./helpers/constants.js";

class Animixplay {
  name = "AniMixPlay";
  baseUrl = constants.BaseURL;
  logo =
    "https://www.apksforfree.com/wp-content/uploads/2021/10/oie_1413343NvdZCZR5.png";
  classPath = "ANIME.AniMixPlay";

  searchUrl = constants.SearchApi;

  Search = async (query) => {
    const formData = new FormData();
    formData.append("qfast", query);
    formData.append("root", "animixplay.to");

    const {
      data: { result },
    } = await axios.post(this.searchUrl, formData);
    const $ = load(result);

    const results = [];
    $("a").each((i, el) => {
      const href = `${this.baseUrl}${$(el).attr("href")}`;
      const title = $(el).find("li > div.details > p.name").text();

      results.push({
        id: href.split(this.baseUrl)[1],
        title: title,
        url: href,
      });
    });
    return { results };
  };

  Popular = async ({ list = [], type = 1 }) => {
    try {
      if (type == 1) {
        const res = await axios.get(
          `${constants.BaseURL}assets/popular/popular.json`,
          headerOption
        );

        res.data.result.map((anime) => {
          list.push({
            title: anime.title,
            malId: anime.url.split("/").reverse()[0],
            img: anime.picture,
            views: anime.infotext.split(" ")[3],
            score: anime.score / 100,
          });
        });
      } else if (type == 2) {
        const res = await axios(`${constants.BaseURL}api/search`, {
          method: "POST",
          headers: {
            "User-Agent": USER_AGENT,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          data: new URLSearchParams({
            genre: "any",
            minstr: 99999999,
            orderby: "popular",
          }),
        });

        res.data.result.map((anime) => {
          list.push({
            animeTitle: anime.title,
            animeId: anime.url.split("/").reverse()[0],
            animeImg: anime.picture,
            format: anime.infotext,
            score: anime.score / 100,
          });
        });
      }

      return list;
    } catch (err) {
      console.log(err);
      return {
        error: true,
        error_message: err,
      };
    }
  };

  Featured = async ({ list = [] }) => {
    try {
      const { data } = await axios.get(
        `${constants.BaseURL}assets/s/featured.json`,
        headerOption
      );

      data.map((anime) => {
        list.push({
          title: anime.title,
          animeId: anime.url.split("/").reverse()[0],
          img: anime.img,
          desc: anime.desc,
          genres: anime.genre.split(", "),
        });
      });

      return list;
    } catch (err) {
      console.log(err);
      return {
        error: true,
        error_message: err,
      };
    }
  };

  RecentEpisodes = async ({ list }) => {
    try {
      const res = await axios.get(`${constants.BaseURL}rsssub.xml`);
      const jsonResults = JSON.parse(parser.toJson(res.data)).rss.channel.item;

      jsonResults.map((anime) => {
        const $ = load(anime.description);
        list.push({
          episodeTitle: anime.title.split(" ").slice(0, -2).join(" "),
          animeId: anime.link.split("/")[4],
          releaseTimeUnix: Date.parse(anime.pubDate) / 1000,
          malId: anime.idmal,
          episodeNum: anime.ep.split("/")[0],
          episodes: anime.ep,
          animeImg: $("img").attr("src"),
        });
      });

      return list;
    } catch (err) {
      console.log(err);
      return {
        error: true,
        error_message: err,
      };
    }
  };

  All = async ({ list = [] }) => {
    try {
      const fetchAll = await axios.get(constants.All, headerOption);
      fetchAll.data.map((anime) => {
        list.push({
          animeTitle: anime.title,
          animeId: anime.id,
        });
      });

      return list;
    } catch (err) {
      console.log(err);
      return {
        error: true,
        error_message: err,
      };
    }
  };

  Info = async (id, dub = false) => {
    if (!id.startsWith("http")) id = `${this.baseUrl}${dub ? `${id}-dub` : id}`;

    const animeInfo = {
      id: id.split(this.baseUrl)[1],
      title: "",
    };
    try {
      const { data } = await axios.get(id, {
        headers: {
          "User-Agent": USER_AGENT,
        },
      });
      const $ = load(data);

      const epObj = JSON.parse($("div#epslistplace").text());

      animeInfo.title = $("#aligncenter > span.animetitle").text();
      animeInfo.genres = $("span#genres > span").text().split(", ");
      animeInfo.status = $("#status").text().split(": ")[1];
      animeInfo.totalEpisodes = parseInt(epObj.eptotal);
      animeInfo.episodes = [];

      if ($("div#epslistplace").text().startsWith("{")) {
        const episodes = epObj;

        delete episodes[
          Object.keys(episodes)[Object.keys(episodes).length - 1]
        ];

        for (const key in episodes) {
          animeInfo.episodes.push({
            id: episodes[key].toString()?.match(/(?<=id=).*(?=&title)/g)[0],
            animixplayId: `${animeInfo.id}/ep${parseInt(key) + 1}`,
            number: parseInt(key) + 1,
            url: `${this.baseUrl}${animeInfo.id}/ep${parseInt(key) + 1}`,
            gogoUrl: `https:${episodes[key]}`,
          });
        }
      }

      return animeInfo;
    } catch (e) {
      throw new Error(e.message);
    }
  };

  Source = async (episodeId) => {
    if (!episodeId.startsWith("http"))
      episodeId = "https://gogohd.net/streaming.php?id=" + episodeId;
    // const { data } = await axios.get(this.baseUrl + episodeId);
    // console.log(data);
    // const iframe = data.match(/(?<=<iframe src=").*(?=")/g)![0];
    // console.log(iframe);
    return {
      sources: await new GogoCDN().extract(new URL(episodeId)),
    };
  };
}

export default Animixplay;
