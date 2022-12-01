import { api as axios } from "../../../utils/api.js";
import { load } from "cheerio";

class Enime {
  name = "Enime";
  baseUrl = "https://enime.moe";
  logo = "https://enime.moe/favicon.ico";
  classPath = "ANIME.Enime";

  enimeApi = "https://api.enime.moe";

  RawSearch = async (query, page = 1, perPage = 15) => {
    const { data } = await axios.get(
      `${this.enimeApi}/search/${query}?page=${page}&perPage=${perPage}`
    );

    return data;
  };

  Search = async (query, page = 1, perPage = 15) => {
    const res = {
      currentPage: page,
      hasNextPage: false,
      results: [],
    };

    const { data } = await axios.get(
      `${this.enimeApi}/search/${query}?page=${page}&perPage=${perPage}`
    );

    if (data.currentPage !== res.currentPage) res.hasNextPage = true;

    res.results = data.data.map((anime) => ({
      id: anime.id,
      anilistId: anime.anilistId,
      malId: anime.mappings.mal,
      title: anime.title.english ?? anime.title.romaji ?? anime.title.native,
      image: anime.coverImage,
      cover: anime.bannerImage,
      releaseDate: anime.year,
      description: anime.description,
      genres: anime.genre,
      rating: anime.averageScore,
      status: anime.status,
      mappings: anime.mappings,
      type: anime.format,
    }));
    return res;
  };

  Info = async (id) => {
    const animeInfo = {
      id: id,
      title: "",
    };

    const { data } = await axios
      .get(`${this.enimeApi}/anime/${id}`)
      .catch(() => {
        throw new Error("Anime not found");
      });

    animeInfo.anilistId = data.anilistId;
    animeInfo.malId = data.mappings.mal;
    animeInfo.title =
      data.title.english ?? data.title.romaji ?? data.title.native;
    animeInfo.image = data.coverImage;
    animeInfo.cover = data.bannerImage;
    animeInfo.season = data.season;
    animeInfo.releaseDate = data.year;
    animeInfo.duration = data.duration;
    animeInfo.popularity = data.popularity;
    animeInfo.description = data.description;
    animeInfo.genres = data.genre;
    animeInfo.rating = data.averageScore;
    animeInfo.status = data.status;
    animeInfo.synonyms = data.synonyms;
    animeInfo.mappings = data.mappings;
    animeInfo.type = data.format;

    data.episodes = data.episodes.sort((a, b) => b.number - a.number);
    animeInfo.episodes = data.episodes.map((episode) => ({
      id: episode.id,
      number: episode.number,
      title: episode.title,
    }));

    return animeInfo;
  };

  InfoByIdRaw = async (id) => {
    const { data } = await axios
      .get(`${this.enimeApi}/mapping/anilist/${id}`)
      .catch((err) => {
        throw new Error("Backup api seems to be down! Can't fetch anime info");
      });

    return data;
  };

  AnimeInfoByAnilistId = async (id, type) => {
    const animeInfo = {
      id: id,
      title: "",
    };
    const { data } = await axios
      .get(`${this.enimeApi}/mapping/anilist/${id}`)
      .catch((err) => {
        throw new Error(err);
      });

    animeInfo.anilistId = data.anilistId;
    animeInfo.malId = data.mappings.mal;
    animeInfo.title =
      data.title.english ?? data.title.romaji ?? data.title.native;
    animeInfo.image = data.coverImage;
    animeInfo.cover = data.bannerImage;
    animeInfo.season = data.season;
    animeInfo.releaseDate = data.year;
    animeInfo.duration = data.duration;
    animeInfo.popularity = data.popularity;
    animeInfo.description = data.description;
    animeInfo.genres = data.genre;
    animeInfo.rating = data.averageScore;
    animeInfo.status = data.status;
    animeInfo.synonyms = data.synonyms;
    animeInfo.mappings = data.mappings;
    animeInfo.type = data.format;
    animeInfo.mappings = data.mappings;

    data.episodes = data.episodes.sort((a, b) => b.number - a.number);

    let useType = undefined;
    if (
      type == "gogoanime" &&
      data.episodes.every((e) =>
        e.sources.find((s) => s.target.includes("episode"))
      )
    )
      useType = "gogoanime";
    else if (
      type == "zoro" &&
      data.episodes.every((e) =>
        e.sources.find((s) => s.target.includes("?ep="))
      )
    )
      useType = "zoro";
    else throw new Error("Anime not found on Enime");

    animeInfo.episodes = data.episodes.map((episode) => ({
      id: episode.id,
      slug: episode.sources
        .find((source) =>
          useType === "zoro"
            ? source.target.includes("?ep=")
            : source.target.includes("episode")
        )
        ?.target.split("/")
        .pop()
        .replace("?ep=", "$episode$")
        ?.concat(useType === "zoro" ? "$sub" : ""),
      description: episode.description,
      number: episode.number,
      title: episode.title,
      image: episode?.image ?? animeInfo.image,
    }));

    return animeInfo;
  };

  Source = async (episodeId, ...args) => {
    if (episodeId.includes("enime"))
      return this.SourceFromSourceId(episodeId.replace("-enime", ""));
    return this.SourceFromEpisodeId(episodeId);
  };

  SourceFromEpisodeId = async (episodeId) => {
    const res = {
      headers: {},
      sources: [],
    };

    const { data } = await axios.get(`${this.enimeApi}/episode/${episodeId}`);
    const {
      data: { url, referer },
    } = await axios.get(`${this.enimeApi}/source/${data.sources[0].id}`);

    res.headers["Referer"] = referer;

    const resResult = await axios.get(url);
    const resolutions = resResult.data.match(/(RESOLUTION=)(.*)(\s*?)(\s*.*)/g);
    resolutions.forEach((ress) => {
      var index = url.lastIndexOf("/");
      var quality = ress.split("\n")[0].split("x")[1].split(",")[0];
      var urll = url.slice(0, index);
      res.sources.push({
        url: urll + "/" + ress.split("\n")[1],
        isM3U8: (urll + ress.split("\n")[1]).includes(".m3u8"),
        quality: quality + "p",
      });
    });

    res.sources.push({
      url: url,
      isM3U8: url.includes(".m3u8"),
      quality: "default",
    });

    return res;
  };

  SourceFromSourceId = async (sourceId) => {
    const res = {
      headers: {},
      sources: [],
    };

    const {
      data: { url, referer },
    } = await axios.get(`${this.enimeApi}/source/${sourceId}`);

    res.headers["Referer"] = referer;

    const resResult = await axios.get(url).catch(() => {
      throw new Error("Source not found");
    });

    const resolutions = resResult.data.match(/(RESOLUTION=)(.*)(\s*?)(\s*.*)/g);
    resolutions.forEach((ress) => {
      var index = url.lastIndexOf("/");
      var quality = ress.split("\n")[0].split("x")[1].split(",")[0];
      var urll = url.slice(0, index);
      res.sources.push({
        url: urll + "/" + ress.split("\n")[1],
        isM3U8: (urll + ress.split("\n")[1]).includes(".m3u8"),
        quality: quality + "p",
      });
    });

    res.sources.push({
      url: url,
      isM3U8: url.includes(".m3u8"),
      quality: "default",
    });

    return res;
  };
}

export default Enime;
