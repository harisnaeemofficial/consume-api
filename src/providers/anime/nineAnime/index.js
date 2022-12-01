import { load } from "cheerio";
import { api as axios } from "../../../utils/api.js";
import { encode, decode } from "ascii-url-encoder";

import * as constants from "./helpers/constants.js";
import {
  MediaStatus,
  StreamingServers,
  SubOrDub,
  MediaFormat,
} from "../../../models/index.js";
import {
  range,
  StreamTape,
  USER_AGENT,
  VizCloud,
  Filemoon,
} from "../../../utils/index.js";

class NineAnime {
  name = "9Anime";
  baseUrl = constants.BaseURL;
  classPath = "ANIME.NineAnime";

  baseTable =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=_";
  table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+=/_";
  cipherKey = "";
  decipherKey = "";
  keyMap = "";

  async init() {
    const {
      data: { cipher, decipher, keyMap },
    } = await axios.get(
      "https://raw.githubusercontent.com/AnimeJeff/Brohflow/main/keys.json"
    );
    this.cipherKey = cipher;
    this.decipherKey = decipher;
    this.keyMap = keyMap;
  }

  static async Create() {
    const nineanime = new NineAnime();
    await nineanime.init();

    return nineanime;
  }

  async Search(query, page = 1) {
    const searchResult = {
      currentPage: page,
      hasNextPage: false,
      results: [],
    };

    try {
      const res = await axios.get(
        `${this.baseUrl}/filter?keyword=${encode(query).replace(
          /%20/g,
          "+"
        )}&vrf=${encode(this.ev(query))}&page=${page}`
      );

      const $ = load(res.data);

      searchResult.hasNextPage =
        $(`ul.pagination`).length > 0
          ? $("ul.pagination > li").last().hasClass("disabled")
            ? false
            : true
          : false;

      $("#list-items > div.item").each((i, el) => {
        const subs = $(el)
          .find("div.ani > a > div.meta > div > div.left > span.ep-status")
          .map((i, el) => {
            if ($(el).hasClass("sub")) {
              return SubOrDub.SUB;
            } else if ($(el).hasClass("dub")) {
              return SubOrDub.DUB;
            }
          })
          .get();

        let type = undefined;
        switch (
          $(el)
            .find("div > div.ani > a > div.meta > div > div.right")
            .text()
            ?.trim()
        ) {
          case "MOVIE":
            type = MediaFormat.MOVIE;
            break;
          case "TV":
            type = MediaFormat.TV;
            break;
          case "OVA":
            type = MediaFormat.OVA;
            break;
          case "SPECIAL":
            type = MediaFormat.SPECIAL;
            break;
          case "ONA":
            type = MediaFormat.ONA;
            break;
          case "MUSIC":
            type = MediaFormat.MUSIC;
            break;
        }

        searchResult.results.push({
          id: $(el).find("div > div.ani > a").attr("href")?.split("/")[2],
          title: $(el).find("div > div.info > div.b1 > a").text(),
          url: `${this.baseUrl}${$(el).find("div > div.ani > a").attr("href")}`,
          image: $(el).find("div > div.ani > a > img").attr("src"),
          SubOrDub:
            subs.includes(SubOrDub.SUB) && subs.includes(SubOrDub.DUB)
              ? SubOrDub.BOTH
              : subs[0],
          type: type,
        });
      });

      return searchResult;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async Info(animeUrl, isDub = false) {
    if (!animeUrl.startsWith(this.baseUrl))
      animeUrl = `${this.baseUrl}/watch/${animeUrl}`;

    const animeInfo = {
      id: "",
      title: "",
      url: animeUrl,
    };

    try {
      const res = await axios.get(animeUrl);

      const $ = load(res.data);

      animeInfo.id = new URL(animeUrl).pathname.split("/")[2];
      animeInfo.title = $("h1.title").text();
      animeInfo.title_japanese = $("h1.title").attr("data-jp");
      animeInfo.genres = Array.from(
        $("div.meta:nth-child(1) > div:nth-child(5) > span > a").map((i, el) =>
          $(el).text()
        )
      );
      animeInfo.img = $(".binfo > div.poster > span > img").attr("src");
      animeInfo.description = $(".content").text()?.trim();
      switch (
        $(
          "div.meta:nth-child(1) > div:nth-child(1) > span:nth-child(1) > a"
        ).text()
      ) {
        case "MOVIE":
          animeInfo.type = MediaFormat.MOVIE;
          break;
        case "TV":
          animeInfo.type = MediaFormat.TV;
          break;
        case "OVA":
          animeInfo.type = MediaFormat.OVA;
          break;
        case "SPECIAL":
          animeInfo.type = MediaFormat.SPECIAL;
          break;
        case "ONA":
          animeInfo.type = MediaFormat.ONA;
          break;
        case "MUSIC":
          animeInfo.type = MediaFormat.MUSIC;
          break;
      }
      animeInfo.studios = Array.from(
        $(
          "div.meta:nth-child(1) > div:nth-child(2) > span:nth-child(1) > a"
        ).map((i, el) => $(el).text()?.trim())
      );
      animeInfo.releaseDate = $(
        "div.meta:nth-child(1) > div:nth-child(3) > span:nth-child(1)"
      )
        .text()
        .trim()
        .split("to")[0]
        ?.trim();

      switch (
        $("div.meta:nth-child(1) > div:nth-child(4) > span:nth-child(1)")
          .text()
          ?.trim()
      ) {
        case "Releasing":
          animeInfo.status = MediaStatus.ONGOING;
          break;
        case "Completed":
          animeInfo.status = MediaStatus.COMPLETED;
          break;
        case "Cancelled":
          animeInfo.status = MediaStatus.CANCELLED;
          break;
        case "Unknown":
          animeInfo.status = MediaStatus.UNKNOWN;
          break;
        default:
          animeInfo.status = MediaStatus.UNKNOWN;
          break;
      }

      animeInfo.score = parseFloat(
        $(".bmeta > div:nth-child(2) > div:nth-child(2) > span:nth-child(1)")
          ?.text()
          .split("by")[0]
      );
      animeInfo.premiered = $(
        ".bmeta > div:nth-child(2) > div:nth-child(3) > span:nth-child(1) > a:nth-child(1)"
      ).text();
      animeInfo.duration = $(
        ".bmeta > div:nth-child(2) > div:nth-child(4) > span:nth-child(1)"
      ).text();
      animeInfo.views = parseInt(
        $(".bmeta > div:nth-child(2) > div:nth-child(5) > span:nth-child(1)")
          .text()
          .split("by")
          .join("")
          .split(",")
          .join("")
          .trim()
      );
      animeInfo.otherNames = $(".names")
        .text()
        .split("; ")
        .map((name) => name?.trim());

      const id = $("#watch-main").attr("data-id");

      const {
        data: { result },
      } = await axios.get(
        `${this.baseUrl}/ajax/episode/list/${id}?vrf=${encode(this.ev(id))}`
      );

      const $$ = load(result);

      animeInfo.totalEpisodes = $$("div.episodes > ul > li > a").length;
      animeInfo.episodes = [];
      animeInfo.episodes?.push(
        ...$$("div.episodes > ul > li > a").map((i, el) => {
          return $$(el)
            .map((i, el) => {
              const possibleIds = $$(el).attr("data-ids")?.split(",");
              const id = possibleIds[isDub ? 1 : 0] ?? possibleIds[0];
              const number = parseInt($$(el).attr("data-num")?.toString());
              const title =
                $$(el).find("span").text().length > 0
                  ? $$(el).find("span").text()
                  : undefined;
              const isFiller = $$(el).hasClass("filler");
              return {
                id: id,
                episode: number,
                title: title,
                isFiller: isFiller,
                url: `${this.baseUrl}/ajax/server/list/${id}?vrf=${this.ev(
                  id
                )}`,
              };
            })
            .get();
        })
      );

      return animeInfo;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async Source(episodeId, server = StreamingServers.VizCloud) {
    if (episodeId.startsWith("http")) {
      const serverUrl = new URL(episodeId);
      switch (server) {
        case StreamingServers.StreamTape:
          return {
            headers: { Referer: serverUrl.href, "User-Agent": USER_AGENT },
            sources: await new StreamTape().extract(serverUrl),
          };
        case StreamingServers.VizCloud:
          return {
            headers: { Referer: serverUrl.href, "User-Agent": USER_AGENT },
            sources: await new VizCloud().extract(
              serverUrl,
              this.cipher,
              this.encrypt
            ),
          };
        case StreamingServers.MyCloud:
          return {
            headers: { Referer: serverUrl.href, "User-Agent": USER_AGENT },
            sources: await new VizCloud().extract(
              serverUrl,
              this.cipher,
              this.encrypt
            ),
          };
        case StreamingServers.Filemoon:
          return {
            headers: { Referer: serverUrl.href, "User-Agent": USER_AGENT },
            sources: await new Filemoon().extract(serverUrl),
          };
      }
    }
    try {
      const servers = await this.Servers(episodeId);

      let s = servers.find((s) => s.name === server);
      switch (server) {
        case StreamingServers.VizCloud:
          s = servers.find((s) => s.name === "vidstream");
          if (!s) throw new Error("Vidstream server found");
          break;
        case StreamingServers.StreamTape:
          s = servers.find((s) => s.name === "streamtape");
          if (!s) throw new Error("Streamtape server found");
          break;
        case StreamingServers.MyCloud:
          s = servers.find((s) => s.name === "mycloud");
          if (!s) throw new Error("Mycloud server found");
          break;
        case StreamingServers.Filemoon:
          s = servers.find((s) => s.name === "filemoon");
          if (!s) throw new Error("Filemoon server found");
          break;
        default:
          throw new Error("Server not found");
      }

      const {
        data: {
          result: { url },
        },
      } = await axios.get(s.url);

      const iframe = decode(this.dv(url));

      return await this.Source(`htt${iframe.slice(3)}`, server);
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async Servers(episodeId) {
    if (!episodeId.startsWith(this.baseUrl))
      episodeId = `${this.baseUrl}/ajax/server/list/${episodeId}?vrf=${this.ev(
        episodeId
      )}`;

    const {
      data: { result },
    } = await axios.get(episodeId);

    const $ = load(result);

    const servers = [];
    $(".type > ul > li").each((i, el) => {
      const serverId = $(el).attr("data-link-id");
      servers.push({
        name: $(el).text().toLocaleLowerCase(),
        url: `${this.baseUrl}/ajax/server/${serverId}?vrf=${encode(
          this.ev(serverId)
        )}`,
      });
    });

    return servers;
  }

  ev(query) {
    return this.encrypt(
      this.mapKeys(
        this.encrypt(
          this.cipher(encode(query), this.cipherKey),
          this.baseTable
        ),
        this.keyMap
      ),
      this.baseTable
    );
  }

  dv(query) {
    return decode(this.cipher(this.decrypt(query), this.decipherKey));
  }

  mapKeys(encrypted, keyMap) {
    const table = keyMap.split("");
    return encrypted
      .split("")
      .map((c, i) => table[this.table.indexOf(c) * 16 + 1 + (1 % 16)])
      .join("");
  }

  cipher(query, key) {
    let u = 0;
    let v = 0;
    const arr = range({ from: 0, to: 256 });

    for (let i = 0; i < arr.length; i++) {
      u = (u + arr[i] + key.charCodeAt(i % key.length)) % 256;
      v = arr[i];
      arr[i] = arr[u];
      arr[u] = v;
    }
    u = 0;
    let j = 0;

    let res = "";
    for (let i = 0; i < query.length; i++) {
      j = (j + 1) % 256;
      u = (u + arr[j]) % 256;
      v = arr[j];
      arr[j] = arr[u];
      arr[u] = v;
      res += String.fromCharCode(
        query.charCodeAt(i) ^ arr[(arr[j] + arr[u]) % 256]
      );
    }
    return res;
  }

  encrypt(query, key) {
    query.split("").forEach((char) => {
      if (char.charCodeAt(0) > 255) throw new Error("Invalid character.");
    });

    let res = "";
    for (let i = 0; i < query.length; i += 3) {
      const arr = Array(4).fill(-1);

      arr[0] = query.charCodeAt(i) >> 2;
      arr[1] = (3 & query.charCodeAt(i)) << 4;

      if (query.length > i + 1) {
        arr[1] = arr[1] | (query.charCodeAt(i + 1) >> 4);
        arr[2] = (15 & query.charCodeAt(i + 1)) << 2;
      }
      if (query.length > i + 2) {
        arr[2] = arr[2] | (query.charCodeAt(i + 2) >> 6);
        arr[3] = 63 & query.charCodeAt(i + 2);
      }

      for (const j of arr) {
        if (j === -1) res += "=";
        else if (range({ from: 0, to: 64 }).includes(j)) res += key.charAt(j);
      }
    }
    return res;
  }

  decrypt(query) {
    const key =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const p =
      query?.replace(/[\t\n\f\r]/g, "")?.length % 4 === 0
        ? query?.replace(/[==|?|$]/g, "")
        : query;

    if (p?.length % 4 === 1 || /[^+/0-9A-Za-z]/gm.test(p))
      throw new Error("Invalid character.");

    let res = "";
    i = key.indexOf(p[j]);
    let e = 0;
    let n = 0;
    for (let j = 0; j < p?.length; j++) {
      e = e << 6;
      i = key.indexOf(p[j]);
      e = e | i;
      n += 6;

      if (n === 24) {
        res += String.fromCharCode((16711680 & e) >> 16);
        res += String.fromCharCode((65280 & e) >> 8);
        res += String.fromCharCode(255 & e);
        n = 0;
        e = 0;
      }
    }

    if (12 === n) return res + String.fromCharCode(e >> 4);
    else if (18 === n) {
      e = e >> 2;
      res += String.fromCharCode((65280 & e) >> 8);
      res += String.fromCharCode(255 & e);
    }
    return res;
  }
}

export default NineAnime;
