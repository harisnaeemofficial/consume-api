import { api as axios } from "../../../utils/api.js";
import { load } from "cheerio";

import { MediaStatus, MediaFormat } from "../../../models";

import { GogoCDN } from "../../../utils";

class AnimeFox {
  name = "AnimeFox";
  baseUrl = "https://animefox.tv";
  logo = "https://animefox.tv/assets/images/logo.png";
  classPath = "ANIME.AnimeFox";

  Search = async (query, page = 1) => {
    try {
      const { data } = await axios.get(
        `${this.baseUrl}/search?keyword=${decodeURIComponent(
          query
        )}&page=${page}`
      );

      const $ = load(data);

      const hasNextPage = $(".pagination > nav > ul > li")
        .last()
        .hasClass("disabled")
        ? false
        : true;

      const searchResults = [];

      $("div.film_list-wrap > div").each((i, el) => {
        let type = undefined;
        switch ($(el).find("div.fd-infor > span").text()) {
          case "TV Series":
            type = MediaFormat.TV;
            break;
          case "Movie":
            type = MediaFormat.MOVIE;
            break;
          case "Special":
            type = MediaFormat.SPECIAL;
            break;
          case "OVA":
            type = MediaFormat.OVA;
            break;
          default:
            type = MediaFormat.TV;
            break;
        }
        searchResults.push({
          id: $(el)
            .find("div.film-poster > a")
            .attr("href")
            ?.replace("/anime/", ""),
          title: $(el).find("div.film-poster > img").attr("alt"),
          type: type,
          image: $(el).find("div.fd-infor > span:nth-child(1)").text(),
          url: `${this.baseUrl}${$(el)
            .find("div.film-poster > a")
            .attr("href")}`,
          episode: parseInt(
            $(el).find("div.tick-eps").text().replace("EP", "").trim()
          ),
        });
      });
      return {
        currentPage: page,
        hasNextPage: hasNextPage,
        results: searchResults,
      };
    } catch (err) {
      throw new Error(err);
    }
  };

  Info = async (id) => {
    const info = {
      id: id,
      title: "",
    };
    try {
      const { data } = await axios.get(`${this.baseUrl}/anime/${id}`);
      const $ = load(data);

      info.title = $("h2.film-name").attr("data-jname");
      info.image = $("img.film-poster-img").attr("data-src");
      info.description = $("div.anisc-info > div:nth-child(1) > div")
        .text()
        .trim();
      switch ($("div.anisc-info > div:nth-child(8) > a").text().trim()) {
        case "TV Series":
          info.type = MediaFormat.TV;
          break;
        case "Movie":
          info.type = MediaFormat.MOVIE;
          break;
        case "Special":
          info.type = MediaFormat.SPECIAL;
          break;
        case "OVA":
          info.type = MediaFormat.OVA;
          break;
        default:
          info.type = MediaFormat.TV;
          break;
      }
      info.releaseYear = $("div.anisc-info > div:nth-child(7) > a")
        .text()
        .trim();
      switch ($("div.anisc-info > div:nth-child(9) > a").text().trim()) {
        case "Ongoing":
          info.status = MediaStatus.ONGOING;
          break;
        case "Completed":
          info.status = MediaStatus.COMPLETED;
          break;
        case "Upcoming":
          info.status = MediaStatus.NOT_YET_AIRED;
          break;
        default:
          info.status = MediaStatus.UNKNOWN;
          break;
      }
      info.totalEpisodes = parseInt(
        $("div.anisc-info > div:nth-child(4) > span:nth-child(2)").text().trim()
      );
      info.url = `${this.baseUrl}/${id}`;
      info.episodes = [];
      const episodes = Array.from(
        { length: info.totalEpisodes },
        (_, i) => i + 1
      );
      episodes.forEach((element, i) =>
        info.episodes?.push({
          id: `${id}-episode-${i + 1}`,
          number: i + 1,
          title: `${info.title} Episode ${i + 1}`,
          url: `${this.baseUrl}/watch/${id}-episode-${i + 1}`,
        })
      );
      return info;
    } catch (err) {
      throw new Error(err);
    }
  };

  RecentEpisodes = async (page = 1) => {
    try {
      const { data } = await axios.get(
        `${this.baseUrl}/latest-added?page=${page}`
      );
      const $ = load(data);

      const hasNextPage = $(".pagination > nav > ul > li")
        .last()
        .hasClass("disabled")
        ? false
        : true;

      const recentEpisodes = [];

      $("div.film_list-wrap > div").each((i, el) => {
        recentEpisodes.push({
          id: $(el)
            .find("div.film-poster > a")
            .attr("href")
            ?.replace("/watch/", ""),
          image: $(el).find("div.film-poster > img").attr("data-src"),
          title: $(el).find("div.film-poster > img").attr("alt"),
          url: `${this.baseUrl}${$(el)
            .find("div.film-poster > a")
            .attr("href")}`,
          episode: parseInt(
            $(el).find("div.tick-eps").text().replace("EP ", "").split("/")[0]
          ),
        });
      });

      return {
        currentPage: page,
        hasNextPage: hasNextPage,
        results: recentEpisodes,
      };
    } catch (err) {
      throw new Error("Something went wrong. Please try again later.");
    }
  };

  Source = async (episodeId) => {
    try {
      const { data } = await axios.get(`${this.baseUrl}/watch/${episodeId}`);
      const $ = load(data);
      const iframe = $("#iframe-to-load").attr("src") || "";
      const streamUrl = `https://goload.io/streaming.php?id=${iframe
        .split("=")
        .pop()}`;

      return {
        sources: await new GogoCDN().extract(new URL(streamUrl)),
      };
    } catch (err) {
      throw new Error("Something went wrong. Please try again later.");
    }
  };

  Servers = async (episodeId) => {
    throw new Error("Method not implemented.");
  };
}

export default AnimeFox;
