// import { api as axios } from "../../utils/api.js";
import axios from "axios";
import { load } from "cheerio";

import { TvType, StreamingServers } from "../../models/index.js";
import { AsianLoad, MixDrop, StreamTape, StreamSB } from "../../utils";

class ViewAsian {
  name = "ViewAsian";
  baseUrl = "https://viewasian.co";
  logo = "https://viewasian.co/images/logo.png";
  supportedTypes = new Set([TvType.MOVIE, TvType.TVSERIES]);

  Search = async (query, page = 1) => {
    const searchResult = {
      currentPage: page,
      hasNextPage: false,
      results: [],
    };

    try {
      const { data } = await axios.get(
        `${this.baseUrl}/movie/search/${query.replace(
          /[\W_]+/g,
          "-"
        )}?page=${page}`
      );

      const $ = load(data);

      const navSelector = "div#pagination > nav:nth-child(1) > ul:nth-child(1)";

      searchResult.hasNextPage =
        $(navSelector).length > 0
          ? !$(navSelector).children().last().hasClass("active")
          : false;

      $(".movies-list-full > div.ml-item").each((i, el) => {
        const releaseDate = $(el)
          .find("div.ml-item > div.mli-info > span:nth-child(1)")
          .text();
        searchResult.results.push({
          id: $(el).find("a").attr("href")?.slice(1),
          title: $(el).find("a").attr("title"),
          url: `${this.baseUrl}${$(el).find("a").attr("href")}`,
          image: $(el).find("a > img").data("original"),
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
    const realMediaId = mediaId;
    if (!mediaId.startsWith(this.baseUrl))
      mediaId = `${this.baseUrl}/watch/${mediaId
        .split("/")
        .slice(1)}/watching.html`;

    const mediaInfo = {
      id: "",
      title: "",
    };

    try {
      const { data } = await axios.get(mediaId);

      const $ = load(data);

      mediaInfo.id = realMediaId;
      mediaInfo.title = $(".detail-mod h3").text();
      mediaInfo.otherNames = $(".other-name a")
        .map((i, el) => $(el).attr("title").trim())
        .get();
      mediaInfo.description = $(".desc").text().trim();
      mediaInfo.genre = $(".mvic-info p:contains(Genre) > a")
        .map((i, el) => $(el).text().replaceAll(",", "").trim())
        .get();
      mediaInfo.description = $(".desc").text().trim();
      mediaInfo.status = $(".mvic-info p:contains(Status)")
        .text()
        .replace("Status: ", "")
        .trim();
      mediaInfo.director = $(".mvic-info p:contains(Director)")
        .text()
        .replace("Director: ", "")
        .trim();
      mediaInfo.country = $(".mvic-info p:contains(Country) a").text().trim();
      mediaInfo.release = $(".mvic-info p:contains(Release)")
        .text()
        .replace("Release: ", "")
        .trim();

      mediaInfo.episodes = [];
      $("ul#episodes-sv-1 li").each((i, el) => {
        mediaInfo.episodes?.push({
          id: $(el).find("a").attr("href").replace("?ep=", "$episode$"),
          title: $(el).find("a").attr("title").trim(),
          episode: parseFloat($(el).find("a").attr("episode-data")),
          url: `${this.baseUrl}${$(el).find("a").attr("href")}`,
        });
      });

      return mediaInfo;
    } catch (err) {
      throw err;
    }
  };

  Source = async (episodeId, server = StreamingServers.AsianLoad) => {
    if (episodeId.startsWith("http")) {
      const serverUrl = new URL(episodeId);
      switch (server) {
        case StreamingServers.AsianLoad:
          return {
            sources: await new AsianLoad().extract(serverUrl),
          };
        case StreamingServers.MixDrop:
          return {
            sources: await new MixDrop().extract(serverUrl),
          };
        case StreamingServers.StreamTape:
          return {
            sources: await new StreamTape().extract(serverUrl),
          };
        case StreamingServers.StreamSB:
          return {
            sources: await new StreamSB().extract(serverUrl),
          };
        default:
          throw new Error("Server not supported");
      }
    }
    if (!episodeId.includes("$episode$")) throw new Error("Invalid episode id");
    episodeId = `${this.baseUrl}${episodeId.replace("$episode$", "?ep=")}`;

    // return episodeId;
    try {
      const { data } = await axios.get(episodeId);

      const $ = load(data);

      let serverUrl = "";
      switch (server) {
        // asianload is the same as the standard server
        case StreamingServers.AsianLoad:
          serverUrl = `https:${$(".anime:contains(Asianload)").attr(
            "data-video"
          )}`;
          if (!serverUrl.includes("asian"))
            throw new Error("Try another server");
          break;
        case StreamingServers.MixDrop:
          serverUrl = $(".mixdrop").attr("data-video");
          if (!serverUrl.includes("mixdrop"))
            throw new Error("Try another server");
          break;
        case StreamingServers.StreamTape:
          serverUrl = $(".streamtape").attr("data-video");
          if (!serverUrl.includes("streamtape"))
            throw new Error("Try another server");
          break;
        case StreamingServers.StreamSB:
          serverUrl = $(".streamsb").attr("data-video");
          if (!serverUrl.includes("stream"))
            throw new Error("Try another server");
          break;
      }

      return await this.Source(serverUrl, server);
    } catch (err) {
      throw err;
    }
  };
}

export default ViewAsian;
