// import { api as axios } from "../../utils/api.js";
import axios from "axios";
import { load } from "cheerio";

import { TvType, StreamingServers } from "../../models/index.js";
import { MixDrop, VidCloud } from "../../utils/index.js";

class AllMovies {
  name = "AllMoviesForYou";
  baseUrl = "https://allmoviesforyou.net";
  //   logo = "https://www1.attacker.tv/images/group_1/theme_5/logo.png?v=0.1";
  supportedTypes = new Set([TvType.MOVIE, TvType.TVSERIES]);

  Search = async (query, page = 1) => {
    const searchResult = {
      currentPage: page,
      hasNextPage: false,
      results: [],
    };

    try {
      const { data } = await axios.get(
        `${this.baseUrl}/page/${page}/?s=${query.replace(/[\W_]+/g, "-")}`
      );

      const $ = load(data);

      const navSelector = "div.nav-links a:last-child";

      searchResult.hasNextPage =
        $(navSelector).length > 0
          ? !$(navSelector).children().hasClass("current")
          : false;

      $("ul.MovieList li").each((i, el) => {
        const releaseDate = $(el).find("span.Date").text();
        searchResult.results.push({
          id: $(el).find("article a").attr("href")?.replace(this.baseUrl, ""),
          title: $(el).find("article a h2.Title").text(),
          url: $(el).find("article a").attr("href"),
          description: $(el).find(".Description p:nth-child(1)").text(),
          director: $(el).find(".Director a").text(),
          genre: $(el)
            .find(".Genre a")
            .map((i, el) => $(el).text().replaceAll(",", "").trim())
            .get(),
          cast: $(el)
            .find(".Cast a")
            .map((i, el) => $(el).text().replaceAll(",", "").trim())
            .get(),
          image: $(el)
            .find("div.Image figure img")
            .attr("data-src")
            .replace("//", "https://"),
          rating: $(el).find(".post-ratings span").text(),
          releaseDate: isNaN(parseInt(releaseDate)) ? undefined : releaseDate,
          //   type:
          //     $(el)
          //       .find("div.film-detail > div.fd-infor > span.float-right")
          //       .text() === "Movie"
          //       ? TvType.MOVIE
          //       : TvType.TVSERIES,
        });
      });

      return searchResult;
    } catch (err) {
      console.log(err);
      throw new Error(err.message);
    }
  };

  Info = async (mediaId) => {
    if (!mediaId.startsWith(this.baseUrl))
      mediaId = `${this.baseUrl}/${mediaId}`;

    const mediaInfo = {
      id: "",
      title: "",
    };

    try {
      const { data } = await axios.get(mediaId);

      const $ = load(data);

      const releaseDate = $("span.Date").text();
      mediaInfo.id = mediaId.split(this.baseUrl)[1];
      mediaInfo.title = $("h1.Title").text();
      mediaInfo.cover = $("div.Image figure img")
        .attr("src")
        .replace("//", "https://");
      mediaInfo.description = $(
        "div.TPMvCn div.Description p:first-of-type"
      ).text();
      mediaInfo.type =
        mediaInfo.id.split("/")[1] === "series"
          ? TvType.TVSERIES
          : TvType.MOVIE;
      mediaInfo.rating = $(".post-ratings span").text();
      mediaInfo.runtime = $("span.Time").text();
      mediaInfo.maxQuality = isNaN(parseInt(releaseDate))
        ? undefined
        : $("div.Info span.Qlty").text();
      mediaInfo.releaseDate = isNaN(parseInt(releaseDate))
        ? undefined
        : releaseDate;
      mediaInfo.genre = $("p.Genre a")
        .map((i, el) => $(el).text().replaceAll(",", "").trim())
        .get();
      mediaInfo.tags = $("p.Tags a")
        .map((i, el) => $(el).text().replaceAll(",", "").trim())
        .get();
      // mediaInfo.status = $("div.Info").text();
      mediaInfo.director = $("p.Director span a")
        .map((i, el) => $(el).text().replaceAll(",", "").trim())
        .get();
      mediaInfo.cast = $(".Cast a")
        .map((i, el) => $(el).text().replaceAll(",", "").trim())
        .get();

      return mediaInfo;
    } catch (err) {
      throw err;
    }
  };
}

export default AllMovies;
