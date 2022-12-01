import { api as axios } from "../../../utils/api.js";
import { load } from "cheerio";

import { MediaFormat, MediaStatus, SubOrDub } from "../../../models";

import { Kwik } from "../../../utils";

class AnimePahe {
  name = "AnimePahe";
  baseUrl = "https://animepahe.com";
  logo = "https://animepahe.com/pikacon.ico";
  classPath = "ANIME.AnimePahe";

  proxyURL = "https://streamable-proxy.onrender.com";

  Search = async (query) => {
    try {
      const { data } = await axios.get(
        `${this.proxyURL}/${this.baseUrl}/api?m=search&q=${encodeURIComponent(
          query
        )}`
      );

      const res = {
        results: data.data.map((item) => ({
          id: item.session,
          title: item.title,
          image: item.poster,
          rating: item.score,
          releaseDate: item.year,
          type: item.type,
        })),
      };

      return res;
    } catch (err) {
      console.log(err);
      throw new Error(err.message);
    }
  };

  Info = async (id, episodePage = -1) => {
    const animeInfo = {
      id: id,
      title: "",
    };

    if (id.includes("-")) id = `${this.baseUrl}/anime/${id}`;
    else id = `${this.baseUrl}/a/${id}`;

    try {
      const res = await axios.get(id);
      const $ = load(res.data);

      const tempId = $('head > meta[property="og:url"]')
        .attr("content")
        ?.split("/")
        .pop();

      animeInfo.id = $('head > meta[name="id"]').attr("content");
      animeInfo.title = $(
        "div.header-wrapper > header > div > h1 > span"
      ).text();
      animeInfo.image = $("header > div > div > div > a > img").attr(
        "data-src"
      );
      animeInfo.cover = `https:${$(
        "body > section > article > div.header-wrapper > div"
      ).attr("data-src")}`;
      animeInfo.description = $("div.col-sm-8.anime-summary > div").text();
      animeInfo.subOrDub = SubOrDub.SUB;
      animeInfo.hasSub = true;
      animeInfo.hasDub = false;
      animeInfo.genres = $("div.col-sm-4.anime-info > div > ul > li")
        .map((i, el) => $(el).find("a").attr("title"))
        .get();

      switch ($("div.col-sm-4.anime-info > p:nth-child(4) > a").text().trim()) {
        case "Currently Airing":
          animeInfo.status = MediaStatus.ONGOING;
          break;
        case "Finished Airing":
          animeInfo.status = MediaStatus.COMPLETED;
          break;
        default:
          animeInfo.status = MediaStatus.UNKNOWN;
      }
      animeInfo.type = $("div.col-sm-4.anime-info > p:nth-child(2) > a")
        .text()
        .trim()
        .toUpperCase();
      animeInfo.releaseDate = $("div.col-sm-4.anime-info > p:nth-child(5)")
        .text()
        .split("to")[0]
        .replace("Aired:", "")
        .trim();
      animeInfo.aired = $("div.col-sm-4.anime-info > p:nth-child(5)")
        .text()
        .replace("Aired:", "")
        .trim()
        .replace("\n", " ");
      animeInfo.studios = $("div.col-sm-4.anime-info > p:nth-child(7)")
        .text()
        .replace("Studio:", "")
        .trim()
        .split("\n");
      animeInfo.totalEpisodes = parseInt(
        $("div.col-sm-4.anime-info > p:nth-child(3)")
          .text()
          .replace("Episodes:", "")
      );

      animeInfo.episodes = [];
      if (episodePage < 0) {
        const {
          data: { last_page, data },
        } = await axios.get(
          `${this.baseUrl}/api?m=release&id=${tempId}&sort=episode_asc&page=1`
        );

        animeInfo.episodePages = last_page;

        animeInfo.episodes.push(
          ...data.map((item) => ({
            id: item.session,
            number: item.episode,
            title: item.title,
            image: item.snapshot,
            duration: item.duration,
          }))
        );

        for (let i = 1; i < last_page; i++) {
          animeInfo.episodes.push(...(await this.fetchEpisodes(tempId, i + 1)));
        }
      } else {
        animeInfo.episodes.push(
          ...(await this.fetchEpisodes(tempId, episodePage))
        );
      }

      return animeInfo;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  Source = async (episodeId) => {
    try {
      const { data } = await axios.get(
        `${this.baseUrl}/api?m=links&id=${episodeId}`,
        {
          headers: {
            Referer: `${this.baseUrl}`,
          },
        }
      );

      const links = data.data.map((item) => ({
        quality: Object.keys(item)[0],
        iframe: item[Object.keys(item)[0]].kwik,
        size: item[Object.keys(item)[0]].filesize,
      }));

      const iSource = {
        headers: {
          Referer: "https://kwik.cx/",
        },
        sources: [],
      };
      for (const link of links) {
        const res = await new Kwik().extract(new URL(link.iframe));
        res[0].quality = link.quality;
        res[0].size = link.size;
        iSource.sources.push(res[0]);
      }

      return iSource;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  Episodes = async (id, page) => {
    const res = await axios.get(
      `${this.baseUrl}/api?m=release&id=${id}&sort=episode_asc&page=${page}`
    );

    const epData = res.data.data;

    return [
      ...epData.map((item) => ({
        id: item.session,
        number: item.episode,
        title: item.title,
        image: item.snapshot,
        duration: item.duration,
      })),
    ];
  };

  Servers = (episodeLink) => {
    throw new Error("Method deprecated.");
  };
}

export default AnimePahe;
