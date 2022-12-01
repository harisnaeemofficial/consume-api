import { api as axios } from "../../utils/api";
import { load } from "cheerio";

import { TvType, StreamingServers } from "../../models";
import { AsianLoad, MixDrop, StreamTape, StreamSB } from "../../utils";

class Asianload {
  name = "AsianLoad";

  baseUrl = "https://asianembed.io";
  //   logo = "https://editorialge.com/media/2021/12/Dramacool.jpg";

  classPath = "ASIAN.AsianLoad";
  supportedTypes = new Set([TvType.MOVIE, TvType.TVSERIES]);

  Search = async (query, page = 1) => {
    const searchResult = {
      currentPage: parseInt(page),
      hasNextPage: false,
      results: [],
    };

    try {
      const { data } = await axios.get(
        `${this.baseUrl}/search.html?keyword=${query.replace(
          /[\W_]+/g,
          "-"
        )}&page=${page}`
      );

      const $ = load(data);

      const navSelector = "li.next a";

      searchResult.hasNextPage =
        $(navSelector).length > 0
          ? !$(navSelector).children().last().hasClass("active")
          : false;

      $("ul.listing.items li a").each((i, el) => {
        searchResult.results.push({
          id: $(el).attr("href")?.slice(1),
          title: $(el).find("div.img div.picture img").attr("alt"),
          url: `${this.baseUrl}${$(el).attr("href")}`,
          image: $(el).find("div.img div.picture img").attr("src"),
        });
      });
      return searchResult;
    } catch (err) {
      throw err;
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

      mediaInfo.id = mediaId.split("/").pop()?.split(".")[0];
      mediaInfo.title = $(".info > h1:nth-child(1)").text();
      mediaInfo.otherNames = $(".other_name > a")
        .map((i, el) => $(el).text().trim())
        .get();

      mediaInfo.episodes = [];
      $("div.content-left > div.block-tab > div > div > ul > li").each(
        (i, el) => {
          mediaInfo.episodes?.push({
            id: $(el).find("a").attr("href")?.split(".html")[0].slice(1),
            title: $(el)
              .find("h3")
              .text()
              .replace(mediaInfo.title.toString(), ""),
            episode: parseFloat(
              $(el)
                .find("a")
                .attr("href")
                ?.split("-episode-")[1]
                .split(".html")[0]
                .split("-")
                .join(".")
            ),
            releaseDate: $(el).find("span.time").text(),
            url: `${this.baseUrl}${$(el).find("a").attr("href")}`,
          });
        }
      );
      mediaInfo.episodes.reverse();

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
            ...(await new AsianLoad().extract(serverUrl)),
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
    if (!episodeId.includes(".html"))
      episodeId = `${this.baseUrl}/${episodeId}.html`;
    try {
      const { data } = await axios.get(episodeId);

      const $ = load(data);

      let serverUrl = "";
      switch (server) {
        // asianload is the same as the standard server
        case StreamingServers.AsianLoad:
          serverUrl = `https:${$(".Standard").attr("data-video")}`;
          if (!serverUrl.includes("dembed2"))
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

  Servers = async (mediaLink, ...args) => {
    throw new Error("Method not implemented.");
  };
}

export default Asianload;
