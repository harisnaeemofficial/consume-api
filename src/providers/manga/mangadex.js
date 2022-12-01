import { api as axios } from "../../utils/api.js";
import { encode } from "ascii-url-encoder";
import { capitalizeFirstLetter } from "../../utils/index.js";
class MangaDex {
  name = "MangaDex";
  baseUrl = "https://mangadex.org";
  logo =
    "https://pbs.twimg.com/profile_images/1391016345714757632/xbt_jW78_400x400.jpg";
  classPath = "MANGA.MangaDex";

  apiUrl = "https://api.mangadex.org";

  Info = async (mangaId) => {
    try {
      const { data } = await axios.get(`${this.apiUrl}/manga/${mangaId}`);
      const mangaInfo = {
        id: data.data.id,
        title: data.data.attributes.title.en,
        altTtitles: data.data.attributes.altTitles,
        description: data.data.attributes.description,
        genres: data.data.attributes.tags
          .filter((tag) => tag.attributes.group === "genre")
          .map((tag) => tag.attributes.name.en),
        themes: data.data.attributes.tags
          .filter((tag) => tag.attributes.group === "theme")
          .map((tag) => tag.attributes.name.en),
        status: capitalizeFirstLetter(data.data.attributes.status),
        releaseDate: data.data.attributes.year,
        chapters: [],
      };

      const allChapters = await this.AllChapters(mangaId, 0);

      for (const chapter of allChapters) {
        mangaInfo.chapters?.push({
          id: chapter.id,
          title: chapter.attributes.title
            ? chapter.attributes.title
            : chapter.attributes.chapter,
          pages: chapter.attributes.pages,
        });
      }

      const coverArt = await this.CoverImage(data.data.relationships[2].id);
      mangaInfo.image = `${this.baseUrl}/covers/${mangaInfo.id}/${coverArt}`;

      return mangaInfo;
    } catch (err) {
      if (err.code == "ERR_BAD_REQUEST") {
        throw new Error(
          "Bad request. Make sure you have entered a valid query."
        );
      }

      throw new Error(err.message);
    }
  };

  CoverImage = async (coverId) => {
    const { data } = await axios.get(`${this.apiUrl}/cover/${coverId}`);

    const fileName = data.data.attributes.fileName;

    return fileName;
  };

  ChapterPages = async (chapterId) => {
    try {
      const res = await axios.get(`${this.apiUrl}/at-home/server/${chapterId}`);
      const pages = [];

      for (const id of res.data.chapter.data) {
        pages.push({
          img: `${res.data.baseUrl}/data/${res.data.chapter.hash}/${id}`,
          page: parseInt(/x(.*)-/g.exec(id)[1]),
        });
      }
      return pages;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  Search = async (query, page = 1, limit = 20) => {
    if (page <= 0) throw new Error("Page number must be greater than 0");
    if (limit > 100) throw new Error("Limit must be less than or equal to 100");
    if (limit * (page - 1) >= 10000) throw new Error("not enough results");

    try {
      const res = await axios.get(
        `${this.apiUrl}/manga?limit=${limit}&title=${encode(
          query
        )}&limit=${limit}&offset=${limit * (page - 1)}&order[relevance]=desc`
      );

      if (res.data.result == "ok") {
        const results = {
          currentPage: page,
          results: [],
        };

        for (const manga of res.data.data) {
          results.results.push({
            id: manga.id,
            title: Object.values(manga.attributes.title)[0],
            altTitles: manga.attributes.altTitles,
            description: Object.values(manga.attributes.description)[0],
            status: manga.attributes.status,
            releaseDate: manga.attributes.year,
            contentRating: manga.attributes.contentRating,
            lastVolume: manga.attributes.lastVolume,
            lastChapter: manga.attributes.lastChapter,
          });
        }

        return results;
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      if (err.code == "ERR_BAD_REQUEST")
        throw new Error(
          `[${this.name}] Bad request. Make sure you have entered a valid query.`
        );

      throw new Error(err.message);
    }
  };

  ChapterPages = async (chapterId) => {
    try {
      const res = await axios.get(`${this.apiUrl}/at-home/server/${chapterId}`);
      const pages = [];

      console.log(res);
      for (const id of res.data.chapter.data) {
        pages.push({
          img: `${res.data.baseUrl}/data/${res.data.chapter.hash}/${id}`,
          page: parseInt(id.split("-")[0]),
        });
      }
      return pages;
    } catch (err) {
      console.log(err);
      throw new Error(err.message);
    }
  };

  AllChapters = async (mangaId, offset, res) => {
    if (res?.data?.offset + 96 >= res?.data?.total) {
      return [];
    }

    const response = await axios.get(
      `${this.apiUrl}/manga/${mangaId}/feed?offset=${offset}&limit=96&order[volume]=desc&order[chapter]=desc&translatedLanguage[]=en`
    );

    return [
      ...response.data.data,
      ...(await this.AllChapters(mangaId, offset + 96, response)),
    ];
  };
}

export default MangaDex;
