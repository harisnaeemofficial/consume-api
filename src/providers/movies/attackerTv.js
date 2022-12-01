import { api as axios } from "../../utils/api.js";
import { load } from "cheerio";

import { TvType, StreamingServers } from "../../models/index.js";
import { MixDrop, VidCloud } from "../../utils/index.js";

class AttackerTV {
  name = "FlixHQ";
  baseUrl = "https://www1.attacker.tv";
  logo = "https://www1.attacker.tv/images/group_1/theme_5/logo.png?v=0.1";
  supportedTypes = new Set([TvType.MOVIE, TvType.TVSERIES]);

  async Search(query, page = 1) {
    const searchResult = {
      currentPage: page,
      hasNextPage: false,
      results: [],
    };

    try {
      const { data } = await axios.get(
        `${this.baseUrl}/search/${query.replace(/[\W_]+/g, "-")}?page=${page}`
      );

      const $ = load(data);

      const navSelector =
        "div.pre-pagination:nth-child(3) > nav:nth-child(1) > ul:nth-child(1)";

      searchResult.hasNextPage =
        $(navSelector).length > 0
          ? !$(navSelector).children().last().hasClass("active")
          : false;

      $(".film_list-wrap > div.flw-item").each((i, el) => {
        const releaseDate = $(el)
          .find("div.film-detail > div.fd-infor > span:nth-child(1)")
          .text();
        searchResult.results.push({
          id: $(el).find("div.film-poster > a").attr("href")?.slice(1),
          title: $(el).find("div.film-detail > h2 > a").attr("title"),
          url: `${this.baseUrl}${$(el)
            .find("div.film-poster > a")
            .attr("href")}`,
          image: $(el).find("div.film-poster > img").attr("data-src"),
          releaseDate: isNaN(parseInt(releaseDate)) ? undefined : releaseDate,
          type:
            $(el)
              .find("div.film-detail > div.fd-infor > span.float-right")
              .text() === "Movie"
              ? TvType.MOVIE
              : TvType.TVSERIES,
        });
      });

      return searchResult;
    } catch (err) {
      console.log(err);
      throw new Error(err.message);
    }
  }

  async Info(mediaId) {
    if (!mediaId.startsWith(this.baseUrl)) {
      mediaId = `${this.baseUrl}/${mediaId}`;
    }

    const movieInfo = {
      id: mediaId.split(this.baseUrl).pop(),
      title: "",
      url: mediaId,
    };

    try {
      const { data } = await axios.get(mediaId);
      const $ = load(data);

      const Rd = new Date(
        $("div.row-line:contains('Released:')")
          .text()
          .replace("Released: ", "")
          .trim()
      );
      const now = new Date();

      const isReleased = now > Rd;

      const uid = $(".detail_page-watch").attr("data-id");
      movieInfo.title = $(".heading-name > a:nth-child(1)").text();
      movieInfo.image = $(
        ".m_i-d-poster > div:nth-child(1) > img:nth-child(1)"
      ).attr("src");
      movieInfo.description = $(".description")
        .text()
        .split("\n")
        .join("")
        .replace(/  +/g, "");
      movieInfo.type =
        movieInfo.id.split("/")[1] === "tv" ? TvType.TVSERIES : TvType.MOVIE;
      movieInfo.releaseDate = $("div.row-line:contains('Released:')")
        .text()
        .replace("Released: ", "")
        .trim();
      movieInfo.genres = $("div.row-line:nth-child(2) > a")
        .map((i, el) => $(el).text().split("&"))
        .get()
        .map((v) => v.trim());
      movieInfo.casts = $("div.row-line:contains('Casts:') > a")
        .map((i, el) => $(el).text())
        .get();
      movieInfo.tags = $("div.detail-tags > h2")
        .map((i, el) => $(el).text())
        .get();
      movieInfo.production = $("div.row-line:contains('Production:') > a")
        .map((i, el) => $(el).text())
        .get();
      movieInfo.duration = !isReleased
        ? "Unreleased"
        : $("div.row-line:contains('Duration:')")
            .text()
            .split("\n")
            .join("")
            .replace(/  +/g, " ")
            .replace("Duration: ", "")
            .trim();
      movieInfo.rating = !isReleased
        ? "Unreleased"
        : $("span.item:nth-child(3)").text();

      let ajaxReqUrl = (id, type, isSeasons = false) =>
        `${this.baseUrl}/ajax/${type === "movie" ? type : `v2/${type}`}/${
          isSeasons ? "seasons" : "episodes"
        }/${id}`;

      if (movieInfo.type === TvType.TVSERIES) {
        const { data } = await axios.get(ajaxReqUrl(uid, "tv", true));
        const $$ = load(data);
        const seasonsIds = $$(".dropdown-menu > a")
          .map((i, el) => $(el).attr("data-id"))
          .get();

        movieInfo.episodes = [];
        let season = 1;
        for (const id of seasonsIds) {
          const { data } = await axios.get(ajaxReqUrl(id, "season"));
          const $$$ = load(data);

          $$$(".nav > li")
            .map((i, el) => {
              const episode = {
                id: $$$(el).find("a").attr("id").split("-")[1],
                title: $$$(el).find("a").attr("title"),
                episode: parseInt(
                  $$$(el).find("a").attr("title").split(":")[0].slice(3).trim()
                ),
                season: season,
                url: `${this.baseUrl}/ajax/v2/episode/servers/${
                  $$$(el).find("a").attr("id").split("-")[1]
                }`,
              };
              movieInfo.episodes?.push(episode);
            })
            .get();
          season++;
        }
      } else {
        const { data } = await axios.get(ajaxReqUrl(uid, "movie"));
        const $$$ = load(data);
        movieInfo.episodes = $$$(".nav > li")
          .map((i, el) => {
            const episode = {
              id: uid,
              title: movieInfo.title + " Movie",
              url: `${this.baseUrl}/ajax/movie/episodes/${uid}`,
            };
            return episode;
          })
          .get();
      }

      return movieInfo;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async Source(episodeId, mediaId, server = StreamingServers.VidCloud) {
    if (episodeId.startsWith("http")) {
      const serverUrl = new URL(episodeId);
      switch (server) {
        case StreamingServers.MixDrop:
          return {
            headers: { Referer: serverUrl.href },
            sources: await new MixDrop().extract(serverUrl),
          };
        case StreamingServers.VidCloud:
          return {
            headers: { Referer: serverUrl.href },
            ...(await new VidCloud().extract(serverUrl, true)),
          };
        case StreamingServers.UpCloud:
          return {
            headers: { Referer: serverUrl.href },
            ...(await new VidCloud().extract(serverUrl)),
          };
        default:
          return {
            headers: { Referer: serverUrl.href },
            sources: await new MixDrop().extract(serverUrl),
          };
      }
    }

    try {
      const servers = await this.Servers(episodeId, mediaId);

      const i = servers.findIndex((s) => s.name === server);

      if (i === -1) {
        throw new Error(`Server ${server} not found`);
      }

      const { data } = await axios.get(
        `${this.baseUrl}/ajax/get_link/${servers[i].url
          .split(".")
          .slice(-1)
          .shift()}`
      );

      const serverUrl = new URL(data.link);

      return await this.Source(serverUrl.href, mediaId, server);
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async Servers(episodeId, mediaId) {
    if (
      !episodeId.startsWith(this.baseUrl + "/ajax") &&
      !mediaId.includes("movie")
    )
      episodeId = `${this.baseUrl}/ajax/v2/episode/servers/${episodeId}`;
    else episodeId = `${this.baseUrl}/ajax/movie/episodes/${episodeId}`;

    try {
      const { data } = await axios.get(episodeId);
      const $ = load(data);

      const servers = $(".nav > li")
        .map((i, el) => {
          const server = {
            name: mediaId.includes("movie")
              ? $(el).find("a").attr("title").toLowerCase()
              : $(el).find("a").attr("title").slice(6).trim().toLowerCase(),
            url: `${this.baseUrl}/${mediaId}.${
              !mediaId.includes("movie")
                ? $(el).find("a").attr("data-id")
                : $(el).find("a").attr("data-linkid")
            }`.replace(
              !mediaId.includes("movie") ? /\/tv\// : /\/movie\//,
              !mediaId.includes("movie") ? "/watch-tv/" : "/watch-movie/"
            ),
          };
          return server;
        })
        .get();
      return servers;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async RecentMovies() {
    try {
      const { data } = await axios.get(`${this.baseUrl}/`);
      const $ = load(data);

      const movies = $("div.container section.section-id-02")
        .first()
        .find("div.flw-item")
        .map((i, el) => {
          console.log(i);
          const releaseDate = $(el)
            .find("div.film-detail > div.fd-infor > span:nth-child(1)")
            .text();
          const movie = {
            id: $(el).find("div.film-poster > a").attr("href")?.slice(1),
            title: $(el)
              .find("div.film-detail > h3.film-name > a")
              ?.attr("title"),
            url: `${this.baseUrl}${$(el)
              .find("div.film-poster > a")
              .attr("href")}`,
            image: $(el).find("div.film-poster > img").attr("data-src"),
            releaseDate: isNaN(parseInt(releaseDate)) ? undefined : releaseDate,
            duration:
              $(el)
                .find("div.film-detail > div.fd-infor > span.fdi-duration")
                .text() || null,
            type:
              $(el)
                .find("div.film-detail > div.fd-infor > span.float-right")
                .text() === "Movie"
                ? TvType.MOVIE
                : TvType.TVSERIES,
          };
          return movie;
        })
        .get();
      return movies;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async RecentTvShows() {
    try {
      const { data } = await axios.get(`${this.baseUrl}/home`);
      const $ = load(data);

      const tvshows = $($("div.container section.block_area")[2])
        .find("div.flw-item")
        .map((i, el) => {
          const tvshow = {
            id: $(el).find("div.film-poster > a").attr("href")?.slice(1),
            title: $(el)
              .find("div.film-detail > h3.film-name > a")
              ?.attr("title"),
            url: `${this.baseUrl}${$(el)
              .find("div.film-poster > a")
              .attr("href")}`,
            image: $(el).find("div.film-poster > img").attr("data-src"),
            season: $(el)
              .find("div.film-detail > div.fd-infor > span:nth-child(1)")
              .text(),
            latestEpisode:
              $(el)
                .find("div.film-detail > div.fd-infor > span:nth-child(3)")
                .text() || null,
            type:
              $(el)
                .find("div.film-detail > div.fd-infor > span.float-right")
                .text() === "Movie"
                ? TvType.MOVIE
                : TvType.TVSERIES,
          };
          return tvshow;
        })
        .get();
      return tvshows;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async TrendingMovies() {
    try {
      const { data } = await axios.get(`${this.baseUrl}/`);
      const $ = load(data);

      const movies = $("div.container div#trending-movies div.flw-item")
        .map((i, el) => {
          const Quality = $(el)
            .find("div.film-poster > div.film-poster-quality")
            .text();
          const releaseDate = $(el)
            .find("div.film-detail > div.fd-infor > span:nth-child(1)")
            .text();
          const movie = {
            id: $(el).find("div.film-poster > a").attr("href")?.slice(1),
            title: $(el)
              .find("div.film-detail > h3.film-name > a")
              ?.attr("title"),
            url: `${this.baseUrl}${$(el)
              .find("div.film-poster > a")
              .attr("href")}`,
            Quality: Quality || "Unknown",
            image: $(el).find("div.film-poster > img").attr("data-src"),
            releaseDate: isNaN(parseInt(releaseDate)) ? undefined : releaseDate,
            duration:
              $(el)
                .find("div.film-detail > div.fd-infor > span.fdi-duration")
                .text() || null,
            type:
              $(el)
                .find("div.film-detail > div.fd-infor > span.float-right")
                .text() === "Movie"
                ? TvType.MOVIE
                : TvType.TVSERIES,
          };
          return movie;
        })
        .get();
      return movies;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async TrendingTv() {
    try {
      const { data } = await axios.get(`${this.baseUrl}/home`);
      const $ = load(data);

      const tvshows = $("div#trending-tv div.flw-item")
        .map((i, el) => {
          const Quality = $(el)
            .find("div.film-poster > div.film-poster-quality")
            .text();
          const tvshow = {
            id: $(el).find("div.film-poster > a").attr("href")?.slice(1),
            Quality: Quality || "Unknown",
            title: $(el)
              .find("div.film-detail > h3.film-name > a")
              ?.attr("title"),
            url: `${this.baseUrl}${$(el)
              .find("div.film-poster > a")
              .attr("href")}`,
            image: $(el).find("div.film-poster > img").attr("data-src"),
            season: $(el)
              .find("div.film-detail > div.fd-infor > span:nth-child(1)")
              .text(),
            latestEpisode:
              $(el)
                .find("div.film-detail > div.fd-infor > span:nth-child(3)")
                .text() || null,
            type:
              $(el)
                .find("div.film-detail > div.fd-infor > span.float-right")
                .text() === "Movie"
                ? TvType.MOVIE
                : TvType.TVSERIES,
          };
          return tvshow;
        })
        .get();
      return tvshows;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async Upcoming() {
    try {
      const { data } = await axios.get(`${this.baseUrl}/home`);
      const $ = load(data);

      const reply = $($("div.container section.block_area")[3])
        .find("div.flw-item")
        .map((i, el) => {
          const Season = $(el)
            .find("div.film-detail > div.fd-infor > span:nth-child(1)")
            .text();
          const movies = {
            id: $(el).find("div.film-poster > a").attr("href")?.slice(1),
            title: $(el)
              .find("div.film-detail > h3.film-name > a")
              ?.attr("title"),
            url: `${this.baseUrl}${$(el)
              .find("div.film-poster > a")
              .attr("href")}`,
            image: $(el).find("div.film-poster > img").attr("data-src"),
            season: Season,
            latestEpisode:
              $(el)
                .find("div.film-detail > div.fd-infor > span:nth-child(3)")
                .text() || null,
            type:
              $(el)
                .find("div.film-detail > div.fd-infor > span.float-right")
                .text() === "Movie"
                ? TvType.MOVIE
                : TvType.TVSERIES,
          };
          return movies;
        })
        .get();
      return reply;
    } catch (err) {
      throw new Error(err.message);
    }
  }
}

export default AttackerTV;
