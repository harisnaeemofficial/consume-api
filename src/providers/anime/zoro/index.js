import { api as axios } from "../../../utils/api.js";
import { load } from "cheerio";

import * as constants from "./helpers/constants.js";
import { getSourcesLink } from "./helpers/utils.js";

import {
  StreamingServers,
  MediaFormat,
  SubOrDub,
} from "../../../models/index.js";

import {
  StreamSB,
  USER_AGENT,
  RapidCloud,
  StreamTape,
} from "../../../utils/index.js";

class Zoro {
  name = "Zoro";
  baseUrl = constants.BaseURL;

  Search = async (query, page = 1) => {
    const res = {
      currentPage: page,
      hasNextPage: false,
      results: [],
    };

    try {
      const { data } = await axios.get(
        `${this.baseUrl}/search?keyword=${decodeURIComponent(
          query
        )}&page=${page}`
      );
      const $ = load(data);

      res.hasNextPage =
        $(".pagination > li").length > 0
          ? $(".pagination > li").last().hasClass("active")
            ? false
            : true
          : false;

      $(".film_list-wrap > div.flw-item").each((i, el) => {
        const id = $(el)
          .find("div:nth-child(1) > a.film-poster-ahref")
          .attr("href")
          ?.split("/")[1]
          .split("?")[0];
        const title = $(el)
          .find("div.film-detail > h3.film-name > a.dynamic-name")
          .attr("title");
        // Movie, TV, OVA, ONA, Special, Music
        const type = $(el)
          .find("div:nth-child(2) > div:nth-child(2) > span:nth-child(1)")
          .text();
        const image = $(el)
          .find("div:nth-child(1) > img.film-poster-img")
          .attr("data-src");
        const url =
          this.baseUrl + $(el).find("div:nth-child(1) > a").last().attr("href");

        res.results.push({
          id: id,
          title: title,
          type: type.toUpperCase(),
          image: image,
          url: url,
        });
      });

      return res;
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
      const { data } = await axios.get(`${this.baseUrl}/watch/${id}`);
      const $ = load(data);

      info.title = $("h2.film-name > a.text-white").text();
      info.image = $("img.film-poster-img").attr("src");
      info.description = $("div.film-description").text().trim();
      // Movie, TV, OVA, ONA, Special, Music
      info.type = $("span.item").last().prev().prev().text().toUpperCase();
      info.url = `${this.baseUrl}/${id}`;

      const subDub = $("div.film-stats span.item div.tick-dub")
        .toArray()
        .map((value) => $(value).text().toLowerCase());
      if (subDub.length > 1) {
        info.subOrDub = SubOrDub.BOTH;
      } else if (subDub.length > 0) {
        info.subOrDub = subDub[0];
      } else {
        info.subOrDub = SubOrDub.SUB;
      }

      const episodesAjax = await axios.get(
        `${this.baseUrl}/ajax/v2/episode/list/${id.split("-").pop()}`,
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            Referer: `${this.baseUrl}/watch/${id}`,
          },
        }
      );

      const $$ = load(episodesAjax.data.html);

      info.totalEpisodes = $$("div.detail-infor-content > div > a").length;
      info.episodes = [];
      $$("div.detail-infor-content > div > a").each((i, el) => {
        const episodeId = $$(el)
          .attr("href")
          ?.split("/")[2]
          ?.replace("?ep=", "$episode$")
          ?.concat(`$${info.subOrDub}`);
        const number = parseInt($$(el).attr("data-number"));
        const title = $$(el).attr("title");
        const url = this.baseUrl + $$(el).attr("href");
        const isFiller = $$(el).hasClass("ssl-item-filler");

        info.episodes?.push({
          id: episodeId,
          number: number,
          title: title,
          isFiller: isFiller,
          url: url,
        });
      });

      return info;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  Source = async (episodeId, server = StreamingServers.VidCloud) => {
    if (episodeId.startsWith("http")) {
      const serverUrl = new URL(episodeId);
      switch (server) {
        case StreamingServers.VidStreaming:
        case StreamingServers.VidCloud:
          return {
            ...(await new RapidCloud().extract(serverUrl)),
          };
        case StreamingServers.StreamSB:
          return {
            headers: {
              Referer: serverUrl.href,
              watchsb: "streamsb",
              "User-Agent": USER_AGENT,
            },
            sources: await new StreamSB().extract(serverUrl, true),
          };
        case StreamingServers.StreamTape:
          return {
            headers: { Referer: serverUrl.href, "User-Agent": USER_AGENT },
            sources: await new StreamTape().extract(serverUrl),
          };
        default:
        case StreamingServers.VidCloud:
          return {
            headers: { Referer: serverUrl.href },
            ...(await new RapidCloud().extract(serverUrl)),
          };
      }
    }
    if (!episodeId.includes("$episode$")) throw new Error("Invalid episode id");

    // Fallback to using sub if no info found in case of compatibility

    // TODO: add both options later
    let subOrDub = episodeId.split("$")?.pop() === "dub" ? "dub" : "sub";

    episodeId = `${this.baseUrl}/watch/${episodeId
      .replace("$episode$", "?ep=")
      .replace(/\$auto|\$sub|\$dub/gi, "")}`;

    try {
      const { data } = await axios.get(
        `${this.baseUrl}/ajax/v2/episode/servers?episodeId=${
          episodeId.split("?ep=")[1]
        }`
      );

      const $ = load(data.html);

      /**
       * vidtreaming -> 4
       * rapidcloud  -> 1
       * streamsb -> 5
       * streamtape -> 3
       */
      const subOrDub = isDub ? "dub" : "sub";
      let serverId = "";
      try {
        switch (server) {
          case StreamingServers.VidCloud:
            serverId = this.retrieveServerId($, 1, subOrDub);

            // zoro's vidcloud server is rapidcloud
            if (!serverId) throw new Error("RapidCloud not found");
            break;
          case StreamingServers.VidStreaming:
            serverId = this.retrieveServerId($, 4, subOrDub);

            // zoro's vidcloud server is rapidcloud
            if (!serverId) throw new Error("vidstreaming not found");
            break;
          case StreamingServers.StreamSB:
            serverId = this.retrieveServerId($, 5, subOrDub);

            if (!serverId) throw new Error("StreamSB not found");
            break;
          case StreamingServers.StreamTape:
            serverId = this.retrieveServerId($, 3, subOrDub);

            if (!serverId) throw new Error("StreamTape not found");
            break;
        }
      } catch (err) {
        throw new Error("Couldn't find server. Try another server");
      }

      const {
        data: { link },
      } = await axios.get(
        `${this.baseUrl}/ajax/v2/episode/sources?id=${serverId}`
      );
      return await this.fetchEpisodeSources(link, server);
    } catch (err) {
      throw err;
    }
  };

  RecentEpisodes = async (page = 1) => {
    try {
      const { data } = await axios.get(
        `${this.baseUrl}/recently-updated?page=${page}`
      );
      const $ = load(data);

      const hasNextPage =
        $(".pagination > li").length > 0
          ? $(".pagination > li").last().hasClass("active")
            ? false
            : true
          : false;

      const recentEpisodes = [];

      $("div.film_list-wrap > div").each((i, el) => {
        recentEpisodes.push({
          id: $(el).find("div.film-poster > a").attr("href")?.replace("/", ""),
          image: $(el).find("div.film-poster > img").attr("data-src"),
          title: $(el).find("div.film-poster > img").attr("alt"),
          url: `${this.baseUrl}${$(el)
            .find("div.film-poster > a")
            .attr("href")}`,
          episode: parseInt(
            $(el)
              .find("div.tick-eps")
              .text()
              .replace(/\s/g, "")
              .replace("Ep", "")
              .split("/")[0]
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

  Servers = (episodeId) => {
    throw new Error("Method not implemented.");
  };

  retrieveServerId = ($, index, subOrDub) => {
    return $(
      `div.ps_-block.ps_-block-sub.servers-${subOrDub} > div.ps__-list > div`
    )
      .map((i, el) =>
        $(el).attr("data-server-id") == `${index}` ? $(el) : null
      )
      .get()[0]
      .attr("data-id");
  };
}

export default Zoro;
