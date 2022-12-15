import axios from "axios";

import { MediaStatus, SubOrDub, Genres } from "../../models";
import {
  anilistSearchQuery,
  anilistMediaDetailQuery,
  kitsuSearchQuery,
  anilistTrendingQuery,
  anilistPopularQuery,
  anilistAiringScheduleQuery,
  anilistGenresQuery,
  anilistAdvancedQuery,
  anilistSiteStatisticsQuery,
  anilistCharacterQuery,
  range,
  getDays,
  days,
  capitalizeFirstLetter,
} from "../../utils";

import Gogoanime from "../../providers/anime/gogoAnime";
import Enime from "../anime/enime";
import Zoro from "../anime/zoro";
import Mangasee123 from "../manga/mangasee123";
import Crunchyroll from "../anime/crunchyroll";
import Bilibili from "../anime/bilibili";
import { compareTwoStrings } from "../../utils/utils";

class Anilist {
  name = "Anilist";
  baseUrl = "https://anilist.co";
  logo = "https://upload.wikimedia.org/wikipedia/commons/6/61/AniList_logo.svg";
  classPath = "META.Anilist";

  anilistGraphqlUrl = "https://graphql.anilist.co";
  kitsuGraphqlUrl = "https://kitsu.io/api/graphql";
  malSyncUrl = "https://api.malsync.moe";
  enimeUrl = "https://api.enime.moe";
  provider;

  /**
   * This class maps anilist to kitsu with any other anime provider.
   * kitsu is used for episode images, titles and description.
   * @param provider anime provider (optional) default: Gogoanime
   */
  constructor(provider, proxyConfig) {
    this.proxyConfig = proxyConfig;
    this.provider = provider || new Gogoanime();
    this.proxyUrl = proxyConfig?.url;
  }

  /**
   * @param query Search query
   * @param page Page number (optional)
   * @param perPage Number of results per page (optional) (default: 15) (max: 50)
   */
  Search = async (query, page = 1, perPage = 15) => {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...Object.values([
          typeof this.proxyConfig?.key != "undefined"
            ? { "x-api-key": this.proxyConfig?.key }
            : undefined,
        ])[0],
      },
      ...Object.values([
        typeof this.proxyConfig == "undefined"
          ? { query: anilistSearchQuery(query, page, perPage) }
          : {
              body: JSON.stringify({
                query: anilistSearchQuery(query, page, perPage),
              }),
            },
      ])[0],
    };

    try {
      let { data, status } = await axios.post(
        typeof this.proxyUrl != "undefined"
          ? `${this.proxyUrl}/${this.anilistGraphqlUrl}`
          : this.anilistGraphqlUrl,
        typeof this.proxyConfig == "undefined" ? options : options.body,
        typeof this.proxyConfig == "undefined"
          ? { validateStatus: () => true }
          : { headers: options.headers, validateStatus: () => true }
      );

      if (status >= 500 || status == 429)
        data = await new Enime().RawSearch(query, page, perPage);

      const res = {
        currentPage:
          data.data.Page?.pageInfo?.currentPage ?? data.meta?.currentPage,
        hasNextPage:
          data.data.Page?.pageInfo?.hasNextPage ??
          data.meta?.currentPage != data.meta?.lastPage,
        results:
          data.data?.Page?.media?.map((item) => ({
            id: item.id.toString(),
            malId: item.idMal,
            title:
              {
                romaji: item.title.romaji,
                english: item.title.english,
                native: item.title.native,
                userPreferred: item.title.userPreferred,
              } || item.title.romaji,
            status:
              item.status == "RELEASING"
                ? MediaStatus.ONGOING
                : item.status == "FINISHED"
                ? MediaStatus.COMPLETED
                : item.status == "NOT_YET_RELEASED"
                ? MediaStatus.NOT_YET_AIRED
                : item.status == "CANCELLED"
                ? MediaStatus.CANCELLED
                : item.status == "HIATUS"
                ? MediaStatus.HIATUS
                : MediaStatus.UNKNOWN,
            image:
              item.coverImage?.extraLarge ??
              item.coverImage?.large ??
              item.coverImage?.medium,
            cover: item.bannerImage,
            popularity: item.popularity,
            description: item.description,
            rating: item.averageScore,
            genres: item.genres,
            color: item.coverImage?.color,
            totalEpisodes: item.episodes ?? item.nextAiringEpisode?.episode - 1,
            type: item.format,
            releaseDate: item.seasonYear,
          })) ??
          data.data.map((item) => ({
            id: item.anilistId.toString(),
            malId: item.mappings["mal"],
            title: item.title,
            status:
              item.status == "RELEASING"
                ? MediaStatus.ONGOING
                : item.status == "FINISHED"
                ? MediaStatus.COMPLETED
                : item.status == "NOT_YET_RELEASED"
                ? MediaStatus.NOT_YET_AIRED
                : item.status == "CANCELLED"
                ? MediaStatus.CANCELLED
                : item.status == "HIATUS"
                ? MediaStatus.HIATUS
                : MediaStatus.UNKNOWN,
            image: item.coverImage ?? item.bannerImage,
            cover: item.bannerImage,
            popularity: item.popularity,
            description: item.description,
            rating: item.averageScore,
            genres: item.genre,
            color: item.color,
            totalEpisodes: item.currentEpisode,
            type: item.format,
            releaseDate: item.year,
          })),
      };

      return res;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  /**
   *
   * @param query Search query (optional)
   * @param type Media type (optional) (default: `ANIME`) (options: `ANIME`, `MANGA`)
   * @param page Page number (optional)
   * @param perPage Number of results per page (optional) (default: `20`) (max: `50`)
   * @param format Format (optional) (options: `TV`, `TV_SHORT`, `MOVIE`, `SPECIAL`, `OVA`, `ONA`, `MUSIC`)
   * @param sort Sort (optional) (Default: `[POPULARITY_DESC, SCORE_DESC]`) (options: `POPULARITY_DESC`, `POPULARITY`, `TRENDING_DESC`, `TRENDING`, `UPDATED_AT_DESC`, `UPDATED_AT`, `START_DATE_DESC`, `START_DATE`, `END_DATE_DESC`, `END_DATE`, `FAVOURITES_DESC`, `FAVOURITES`, `SCORE_DESC`, `SCORE`, `TITLE_ROMAJI_DESC`, `TITLE_ROMAJI`, `TITLE_ENGLISH_DESC`, `TITLE_ENGLISH`, `TITLE_NATIVE_DESC`, `TITLE_NATIVE`, `EPISODES_DESC`, `EPISODES`, `ID`, `ID_DESC`)
   * @param genres Genres (optional) (options: `Action`, `Adventure`, `Cars`, `Comedy`, `Drama`, `Fantasy`, `Horror`, `Mahou Shoujo`, `Mecha`, `Music`, `Mystery`, `Psychological`, `Romance`, `Sci-Fi`, `Slice of Life`, `Sports`, `Supernatural`, `Thriller`)
   * @param id anilist Id (optional)
   * @param year Year (optional) e.g. `2022`
   * @param status Status (optional) (options: `RELEASING`, `FINISHED`, `NOT_YET_RELEASED`, `CANCELLED`, `HIATUS`)
   * @param season Season (optional) (options: `WINTER`, `SPRING`, `SUMMER`, `FALL`)
   */
  AdvancedSearch = async (
    query,
    type = "ANIME",
    page = 1,
    perPage = 20,
    format,
    sort,
    genres,
    id,
    year,
    status,
    season
  ) => {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistAdvancedQuery(),
      variables: {
        search: query,
        type: type,
        page: page,
        size: perPage,
        format: format,
        sort: sort,
        genres: genres,
        id: id,
        year: year ? `${year}%` : undefined,
        status: status,
        season: season,
      },
    };

    if (genres) {
      genres.forEach((genre) => {
        if (!Object.values(Genres).includes(genre)) {
          throw new Error(`genre ${genre} is not valid`);
        }
      });
    }

    try {
      let { data, status } = await axios.post(
        this.proxyUrl
          ? this.proxyUrl + this.anilistGraphqlUrl
          : this.anilistGraphqlUrl,
        options,
        {
          validateStatus: () => true,
        }
      );

      if (status >= 500 && !query) throw new Error("No results found");
      if (status >= 500)
        data = await new Enime().RawSearch(query, page, perPage);

      const res = {
        currentPage:
          data.data?.Page?.pageInfo?.currentPage ?? data.meta?.currentPage,
        hasNextPage:
          data.data?.Page?.pageInfo?.hasNextPage ??
          data.meta?.currentPage != data.meta?.lastPage,
        totalPages: data.data?.Page?.pageInfo?.lastPage,
        totalResults: data.data?.Page?.pageInfo?.total,
        results:
          data.data?.Page?.media?.map((item) => ({
            id: item.id.toString(),
            malId: item.idMal,
            title:
              {
                romaji: item.title.romaji,
                english: item.title.english,
                native: item.title.native,
                userPreferred: item.title.userPreferred,
              } || item.title.romaji,
            status:
              item.status == "RELEASING"
                ? MediaStatus.ONGOING
                : item.status == "FINISHED"
                ? MediaStatus.COMPLETED
                : item.status == "NOT_YET_RELEASED"
                ? MediaStatus.NOT_YET_AIRED
                : item.status == "CANCELLED"
                ? MediaStatus.CANCELLED
                : item.status == "HIATUS"
                ? MediaStatus.HIATUS
                : MediaStatus.UNKNOWN,
            image:
              item.coverImage.extraLarge ??
              item.coverImage.large ??
              item.coverImage.medium,
            cover: item.bannerImage,
            popularity: item.popularity,
            totalEpisodes: item.episodes ?? item.nextAiringEpisode?.episode - 1,
            description: item.description,
            genres: item.genres,
            rating: item.averageScore,
            color: item.coverImage?.color,
            type: item.format,
            releaseDate: item.seasonYear,
          })) ??
          data.data?.map((item) => ({
            id: item.anilistId.toString(),
            malId: item.mappings["mal"],
            title: item.title,
            status:
              item.status == "RELEASING"
                ? MediaStatus.ONGOING
                : item.status == "FINISHED"
                ? MediaStatus.COMPLETED
                : item.status == "NOT_YET_RELEASED"
                ? MediaStatus.NOT_YET_AIRED
                : item.status == "CANCELLED"
                ? MediaStatus.CANCELLED
                : item.status == "HIATUS"
                ? MediaStatus.HIATUS
                : MediaStatus.UNKNOWN,
            image: item.coverImage ?? item.bannerImage,
            cover: item.bannerImage,
            popularity: item.popularity,
            description: item.description,
            rating: item.averageScore,
            genres: item.genre,
            color: item.color,
            totalEpisodes: item.currentEpisode,
            type: item.format,
            releaseDate: item.year,
          })),
      };

      return res;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  /**
   *
   * @param id Anime id
   * @param dub to get dubbed episodes (optional) set to `true` to get dubbed episodes. **ONLY WORKS FOR GOGOANIME**
   * @param fetchFiller to get filler boolean on the episode object (optional) set to `true` to get filler boolean on the episode object.
   */
  Info = async (id, dub = false, fetchFiller = false) => {
    const animeInfo = {
      id: id,
      title: "",
    };

    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistMediaDetailQuery(id),
    };

    let fillerEpisodes;
    try {
      let { data, status } = await axios.post(
        this.proxyUrl
          ? this.proxyUrl + this.anilistGraphqlUrl
          : this.anilistGraphqlUrl,
        options,
        {
          validateStatus: () => true,
        }
      );

      if (status == 429)
        throw new Error(
          "Anilist seems to have some issues. Please try again later."
        );
      // if (status >= 500) throw new Error('Anilist seems to be down. Please try again later');
      if (status != 200 && status < 429)
        throw Error(
          "Media not found. If the problem persists, please contact the developer"
        );
      if (status >= 500) data = await new Enime().AnimeInfoByAnilistId(id);

      animeInfo.malId = data.data?.Media?.idMal ?? data?.mappings["mal"];
      animeInfo.title = data.data.Media
        ? {
            romaji: data.data.Media.title.romaji,
            english: data.data.Media.title.english,
            native: data.data.Media.title.native,
            userPreferred: data.data.Media.title.userPreferred,
          }
        : data.data.title;

      animeInfo.synonyms = data.data?.Media?.synonyms ?? data?.synonyms;
      animeInfo.isLicensed = data.data?.Media?.isLicensed ?? undefined;
      animeInfo.isAdult = data.data?.Media?.isAdult ?? undefined;
      animeInfo.countryOfOrigin =
        data.data?.Media?.countryOfOrigin ?? undefined;

      if (data.data?.Media?.trailer?.id) {
        animeInfo.trailer = {
          id: data.data.Media.trailer.id,
          site: data.data.Media.trailer?.site,
          thumbnail: data.data.Media.trailer?.thumbnail,
        };
      }
      animeInfo.image =
        data.data?.Media?.coverImage?.extraLarge ??
        data.data?.Media?.coverImage?.large ??
        data.data?.Media?.coverImage?.medium ??
        data.coverImage ??
        data.bannerImage;

      animeInfo.popularity = data.data?.Media?.popularity ?? data?.popularity;
      animeInfo.color = data.data?.Media?.coverImage?.color ?? data?.color;
      animeInfo.cover =
        data.data?.Media?.bannerImage ?? data?.bannerImage ?? animeInfo.image;
      animeInfo.description =
        data.data?.Media?.description ?? data?.description;
      switch (data.data?.Media?.status ?? data?.status) {
        case "RELEASING":
          animeInfo.status = MediaStatus.ONGOING;
          break;
        case "FINISHED":
          animeInfo.status = MediaStatus.COMPLETED;
          break;
        case "NOT_YET_RELEASED":
          animeInfo.status = MediaStatus.NOT_YET_AIRED;
          break;
        case "CANCELLED":
          animeInfo.status = MediaStatus.CANCELLED;
          break;
        case "HIATUS":
          animeInfo.status = MediaStatus.HIATUS;
        default:
          animeInfo.status = MediaStatus.UNKNOWN;
      }
      animeInfo.releaseDate = data.data?.Media?.startDate?.year ?? data.year;
      animeInfo.startDate = {
        year: data.data.Media.startDate.year,
        month: data.data.Media.startDate.month,
        day: data.data.Media.startDate.day,
      };
      animeInfo.endDate = {
        year: data.data.Media.endDate.year,
        month: data.data.Media.endDate.month,
        day: data.data.Media.endDate.day,
      };
      if (data.data.Media.nextAiringEpisode?.airingAt)
        animeInfo.nextAiringEpisode = {
          airingTime: data.data.Media.nextAiringEpisode?.airingAt,
          timeUntilAiring: data.data.Media.nextAiringEpisode?.timeUntilAiring,
          episode: data.data.Media.nextAiringEpisode?.episode,
        };
      animeInfo.totalEpisodes =
        data.data.Media?.episodes ??
        data.data.Media.nextAiringEpisode?.episode - 1;
      animeInfo.rating = data.data.Media.averageScore;
      animeInfo.duration = data.data.Media.duration;
      animeInfo.genres = data.data.Media.genres;
      animeInfo.season = data.data.Media.season;
      animeInfo.studios = data.data.Media.studios.edges.map(
        (item) => item.node.name
      );
      animeInfo.subOrDub = dub ? SubOrDub.DUB : SubOrDub.SUB;
      animeInfo.hasSub = dub ? false : true;
      animeInfo.hasDub = dub ? true : false;
      animeInfo.type = data.data.Media.format;
      animeInfo.recommendations = data.data.Media?.recommendations?.edges?.map(
        (item) => ({
          id: item.node.mediaRecommendation?.id,
          malId: item.node.mediaRecommendation?.idMal,
          title: {
            romaji: item.node.mediaRecommendation?.title?.romaji,
            english: item.node.mediaRecommendation?.title?.english,
            native: item.node.mediaRecommendation?.title?.native,
            userPreferred: item.node.mediaRecommendation?.title?.userPreferred,
          },
          status:
            item.node.mediaRecommendation?.status == "RELEASING"
              ? MediaStatus.ONGOING
              : item.node.mediaRecommendation?.status == "FINISHED"
              ? MediaStatus.COMPLETED
              : item.node.mediaRecommendation?.status == "NOT_YET_RELEASED"
              ? MediaStatus.NOT_YET_AIRED
              : item.node.mediaRecommendation?.status == "CANCELLED"
              ? MediaStatus.CANCELLED
              : item.node.mediaRecommendation?.status == "HIATUS"
              ? MediaStatus.HIATUS
              : MediaStatus.UNKNOWN,
          episodes: item.node.mediaRecommendation?.episodes,
          image:
            item.node.mediaRecommendation?.coverImage?.extraLarge ??
            item.node.mediaRecommendation?.coverImage?.large ??
            item.node.mediaRecommendation?.coverImage?.medium,
          cover:
            item.node.mediaRecommendation?.bannerImage ??
            item.node.mediaRecommendation?.coverImage?.extraLarge ??
            item.node.mediaRecommendation?.coverImage?.large ??
            item.node.mediaRecommendation?.coverImage?.medium,
          rating: item.node.mediaRecommendation?.meanScore,
          type: item.node.mediaRecommendation?.format,
        })
      );

      animeInfo.characters = data.data?.Media?.characters?.edges?.map(
        (item) => ({
          id: item.node?.id,
          role: item.role,
          name: {
            first: item.node.name.first,
            last: item.node.name.last,
            full: item.node.name.full,
            native: item.node.name.native,
            userPreferred: item.node.name.userPreferred,
          },
          image: item.node.image.large ?? item.node.image.medium,
          voiceActors: item.voiceActors.map((voiceActor) => ({
            id: voiceActor.id,
            language: voiceActor.languageV2,
            name: {
              first: voiceActor.name.first,
              last: voiceActor.name.last,
              full: voiceActor.name.full,
              native: voiceActor.name.native,
              userPreferred: voiceActor.name.userPreferred,
            },
            image: voiceActor.image.large ?? voiceActor.image.medium,
          })),
        })
      );

      animeInfo.relations = data.data?.Media?.relations?.edges?.map((item) => ({
        id: item.node.id,
        relationType: item.relationType,
        malId: item.node.idMal,
        title: {
          romaji: item.node.title.romaji,
          english: item.node.title.english,
          native: item.node.title.native,
          userPreferred: item.node.title.userPreferred,
        },
        status:
          item.node.status == "RELEASING"
            ? MediaStatus.ONGOING
            : item.node.status == "FINISHED"
            ? MediaStatus.COMPLETED
            : item.node.status == "NOT_YET_RELEASED"
            ? MediaStatus.NOT_YET_AIRED
            : item.node.status == "CANCELLED"
            ? MediaStatus.CANCELLED
            : item.node.status == "HIATUS"
            ? MediaStatus.HIATUS
            : MediaStatus.UNKNOWN,
        episodes: item.node.episodes,
        image:
          item.node.coverImage.extraLarge ??
          item.node.coverImage.large ??
          item.node.coverImage.medium,
        color: item.node.coverImage?.color,
        type: item.node.format,
        cover:
          item.node.bannerImage ??
          item.node.coverImage.extraLarge ??
          item.node.coverImage.large ??
          item.node.coverImage.medium,
        rating: item.node.meanScore,
      }));
      if (
        (this.provider instanceof Zoro || this.provider instanceof Gogoanime) &&
        !dub &&
        (animeInfo.status === MediaStatus.ONGOING ||
          range({ from: 2000, to: new Date().getFullYear() + 1 }).includes(
            parseInt(animeInfo.releaseDate)
          ))
      ) {
        try {
          const enimeInfo = await new Enime().AnimeInfoByAnilistId(
            id,
            this.provider.name.toLowerCase()
          );
          animeInfo.mappings = enimeInfo.mappings;
          animeInfo.episodes = enimeInfo.episodes?.map((item) => ({
            id: item.slug,
            title: item.title,
            description: item.description,
            number: item.number,
            image: item.image,
          }));
          animeInfo.episodes?.reverse();
        } catch (err) {
          animeInfo.episodes = await this.DefaultEpisodeList(
            {
              idMal: animeInfo.malId,
              season: data.data.Media.season,
              startDate: { year: parseInt(animeInfo.releaseDate) },
              title: {
                english: animeInfo.title?.english,
                romaji: animeInfo.title?.romaji,
              },
            },
            dub,
            id
          );

          animeInfo.episodes = animeInfo.episodes?.map((episode) => {
            if (!episode.image) episode.image = animeInfo.image;

            return episode;
          });

          return animeInfo;
        }
      } else
        animeInfo.episodes = await this.DefaultEpisodeList(
          {
            idMal: animeInfo.malId,
            season: data.data.Media.season,
            startDate: { year: parseInt(animeInfo.releaseDate) },
            title: {
              english: animeInfo.title?.english,
              romaji: animeInfo.title?.romaji,
            },
          },
          dub,
          id
        );

      if (fetchFiller) {
        let { data: fillerData } = await axios({
          baseURL: `https://raw.githubusercontent.com/saikou-app/mal-id-filler-list/main/fillers/${animeInfo.malId}.json`,
          method: "GET",
          validateStatus: () => true,
        });

        if (!fillerData.toString().startsWith("404")) {
          fillerEpisodes = [];
          fillerEpisodes?.push(...fillerData.episodes);
        }
      }

      animeInfo.episodes = animeInfo.episodes?.map((episode) => {
        if (!episode.image) episode.image = animeInfo.image;

        if (
          fetchFiller &&
          fillerEpisodes?.length > 0 &&
          fillerEpisodes?.length >= animeInfo.episodes.length
        ) {
          if (fillerEpisodes[episode.number - 1])
            episode.isFiller = new Boolean(
              fillerEpisodes[episode.number - 1]["filler-bool"]
            ).valueOf();
        }

        return episode;
      });

      return animeInfo;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  /**
   *
   * @param episodeId Episode id
   */
  Source = async (episodeId) => {
    if (episodeId.includes("enime")) return new Enime().Source(episodeId);
    return this.provider.Source(episodeId);
  };

  /**
   *
   * @param episodeId Episode id
   */
  Servers = async (episodeId) => {
    return this.provider.Servers(episodeId);
  };

  FindAnime = async (
    title,
    season,
    startDate,
    malId,
    dub,
    anilistId,
    externalLinks
  ) => {
    title.english = title.english ?? title.romaji;
    title.romaji = title.romaji ?? title.english;

    title.english = title.english.toLowerCase();
    title.romaji = title.romaji.toLowerCase();

    if (title.english === title.romaji) {
      return await this.AnimeSlug(
        title.english,
        season,
        startDate,
        malId,
        dub,
        anilistId,
        externalLinks
      );
    }

    const romajiPossibleEpisodes = await this.AnimeSlug(
      title.romaji,
      season,
      startDate,
      malId,
      dub,
      anilistId,
      externalLinks
    );

    if (romajiPossibleEpisodes) {
      return romajiPossibleEpisodes;
    }

    const englishPossibleEpisodes = await this.AnimeSlug(
      title.english,
      season,
      startDate,
      malId,
      dub,
      anilistId,
      externalLinks
    );
    return englishPossibleEpisodes;
  };

  AnimeSlug = async (
    title,
    season,
    startDate,
    malId,
    dub,
    anilistId,
    externalLinks
  ) => {
    if (this.provider instanceof Enime)
      return (await this.provider.AnimeInfoByAnilistId(anilistId)).episodes;

    const slug = title.replace(/[^0-9a-zA-Z]+/g, " ");

    let possibleAnime;

    if (
      malId &&
      !(
        this.provider instanceof Crunchyroll ||
        this.provider instanceof Bilibili
      )
    ) {
      const malAsyncReq = await axios({
        method: "GET",
        url: `${this.malSyncUrl}/mal/anime/${malId}`,
        validateStatus: () => true,
      });

      if (malAsyncReq.status === 200) {
        const sitesT = malAsyncReq.data.Sites;
        let sites = Object.values(sitesT).map((v, i) => {
          const obj = [...Object.values(Object.values(sitesT)[i])];
          const pages = obj.map((v) => ({
            page: v.page,
            url: v.url,
            title: v.title,
          }));
          return pages;
        });

        sites = sites.flat();

        const possibleSource = sites.find(
          (s) =>
            s.page.toLowerCase() === this.provider.name.toLowerCase() &&
            (dub
              ? s.title.toLowerCase().includes("dub")
              : !s.title.toLowerCase().includes("dub"))
        );

        if (possibleSource) {
          try {
            possibleAnime = await this.provider.Info(
              possibleSource.url.split("/").pop()
            );
          } catch (err) {
            console.error(err);
            possibleAnime = await this.AnimeRaw(slug);
          }
        } else possibleAnime = await this.AnimeRaw(slug);
      } else possibleAnime = await this.AnimeRaw(slug);
    } else possibleAnime = await this.AnimeRaw(slug, externalLinks);

    // To avoid a new request, lets match and see if the anime show found is in sub/dub

    let expectedType = dub ? SubOrDub.DUB : SubOrDub.SUB;

    if (
      possibleAnime.subOrDub != SubOrDub.BOTH &&
      possibleAnime.subOrDub != expectedType
    ) {
      return [];
    }

    if (this.provider instanceof Zoro) {
      // Set the correct episode sub/dub request type
      possibleAnime.episodes.forEach((_, index) => {
        if (possibleAnime.subOrDub === SubOrDub.BOTH) {
          possibleAnime.episodes[index].id = possibleAnime.episodes[
            index
          ].id.replace(`$both`, dub ? "$dub" : "$sub");
        }
      });
    }

    if (this.provider instanceof Crunchyroll) {
      return dub
        ? possibleAnime.episodes.filter((ep) => ep.isDubbed)
        : possibleAnime.episodes.filter((ep) => ep.type == "Subbed");
    }

    const possibleProviderEpisodes = possibleAnime.episodes;

    if (
      typeof possibleProviderEpisodes[0]?.image !== "undefined" &&
      typeof possibleProviderEpisodes[0]?.title !== "undefined" &&
      typeof possibleProviderEpisodes[0]?.description !== "undefined"
    )
      return possibleProviderEpisodes;

    const options = {
      headers: { "Content-Type": "application/json" },
      query: kitsuSearchQuery(slug),
    };

    const newEpisodeList = await this.KitsuAnime(
      possibleProviderEpisodes,
      options,
      season,
      startDate
    );

    return newEpisodeList;
  };

  KitsuAnime = async (possibleProviderEpisodes, options, season, startDate) => {
    const kitsuEpisodes = await axios.post(this.kitsuGraphqlUrl, options);
    const episodesList = new Map();
    if (kitsuEpisodes?.data.data) {
      const { nodes } = kitsuEpisodes.data.data.searchAnimeByTitle;

      if (nodes) {
        nodes.forEach((node) => {
          if (
            node.season === season &&
            node.startDate.trim().split("-")[0] === startDate?.toString()
          ) {
            const episodes = node.episodes.nodes;

            for (const episode of episodes) {
              const i = episode?.number.toString().replace(/"/g, "");
              let name = undefined;
              let description = undefined;
              let thumbnail = undefined;

              if (episode?.description?.en)
                description = episode?.description.en
                  .toString()
                  .replace(/"/g, "")
                  .replace("\\n", "\n");
              if (episode?.thumbnail)
                thumbnail = episode?.thumbnail.original.url
                  .toString()
                  .replace(/"/g, "");

              if (episode) {
                if (episode.titles?.canonical)
                  name = episode.titles.canonical.toString().replace(/"/g, "");
                episodesList.set(i, {
                  episodeNum: episode?.number.toString().replace(/"/g, ""),
                  title: name,
                  description,
                  thumbnail,
                });
                continue;
              }
              episodesList.set(i, {
                episodeNum: undefined,
                title: undefined,
                description: undefined,
                thumbnail,
              });
            }
          }
        });
      }
    }

    const newEpisodeList = [];
    if (possibleProviderEpisodes?.length !== 0) {
      possibleProviderEpisodes?.forEach((ep, i) => {
        const j = (i + 1).toString();
        newEpisodeList.push({
          id: ep.id,
          title: ep.title ?? episodesList.get(j)?.title ?? null,
          image: ep.image ?? episodesList.get(j)?.thumbnail ?? null,
          number: ep.number,
          description:
            ep.description ?? episodesList.get(j)?.description ?? null,
          url: ep.url ?? null,
        });
      });
    }

    return newEpisodeList;
  };

  /**
   * @param page page number to search for (optional)
   * @param perPage number of results per page (optional)
   */
  Trending = async (page = 1, perPage = 10) => {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistTrendingQuery(page, perPage),
    };

    try {
      const { data } = await axios.post(
        this.proxyUrl
          ? this.proxyUrl + this.anilistGraphqlUrl
          : this.anilistGraphqlUrl,
        options
      );

      const res = {
        currentPage: data.data.Page.pageInfo.currentPage,
        hasNextPage: data.data.Page.pageInfo.hasNextPage,
        results: data.data.Page.media.map((item) => ({
          id: item.id.toString(),
          malId: item.idMal,
          title:
            {
              romaji: item.title.romaji,
              english: item.title.english,
              native: item.title.native,
              userPreferred: item.title.userPreferred,
            } || item.title.romaji,
          image:
            item.coverImage.extraLarge ??
            item.coverImage.large ??
            item.coverImage.medium,
          trailer: {
            id: item.trailer?.id,
            site: item.trailer?.site,
            thumbnail: item.trailer?.thumbnail,
          },
          description: item.description,
          status:
            item.status == "RELEASING"
              ? MediaStatus.ONGOING
              : item.status == "FINISHED"
              ? MediaStatus.COMPLETED
              : item.status == "NOT_YET_RELEASED"
              ? MediaStatus.NOT_YET_AIRED
              : item.status == "CANCELLED"
              ? MediaStatus.CANCELLED
              : item.status == "HIATUS"
              ? MediaStatus.HIATUS
              : MediaStatus.UNKNOWN,
          cover:
            item.bannerImage ??
            item.coverImage.extraLarge ??
            item.coverImage.large ??
            item.coverImage.medium,
          rating: item.averageScore,
          releaseDate: item.seasonYear,
          color: item.color,
          genres: item.genres,
          totalEpisodes: isNaN(item.episodes)
            ? 0
            : item.episodes ?? item.nextAiringEpisode?.episode - 1 ?? 0,
          duration: item.duration,
          type: item.format,
        })),
      };
      return res;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  /**
   *
   * @param page page number to search for (optional)
   * @param perPage number of results per page (optional)
   */
  Popular = async (page = 1, perPage = 10) => {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistPopularQuery(page, perPage),
    };

    try {
      const { data } = await axios.post(
        this.proxyUrl
          ? this.proxyUrl + this.anilistGraphqlUrl
          : this.anilistGraphqlUrl,
        options
      );

      const res = {
        currentPage: data.data.Page.pageInfo.currentPage,
        hasNextPage: data.data.Page.pageInfo.hasNextPage,
        results: data.data.Page.media.map((item) => ({
          id: item.id.toString(),
          malId: item.idMal,
          title:
            {
              romaji: item.title.romaji,
              english: item.title.english,
              native: item.title.native,
              userPreferred: item.title.userPreferred,
            } || item.title.romaji,
          image:
            item.coverImage.extraLarge ??
            item.coverImage.large ??
            item.coverImage.medium,
          trailer: {
            id: item.trailer?.id,
            site: item.trailer?.site,
            thumbnail: item.trailer?.thumbnail,
          },
          description: item.description,
          status:
            item.status == "RELEASING"
              ? MediaStatus.ONGOING
              : item.status == "FINISHED"
              ? MediaStatus.COMPLETED
              : item.status == "NOT_YET_RELEASED"
              ? MediaStatus.NOT_YET_AIRED
              : item.status == "CANCELLED"
              ? MediaStatus.CANCELLED
              : item.status == "HIATUS"
              ? MediaStatus.HIATUS
              : MediaStatus.UNKNOWN,
          cover:
            item.bannerImage ??
            item.coverImage.extraLarge ??
            item.coverImage.large ??
            item.coverImage.medium,
          rating: item.averageScore,
          releaseDate: item.seasonYear,
          color: item.color,
          genres: item.genres,
          totalEpisodes: isNaN(item.episodes)
            ? 0
            : item.episodes ?? item.nextAiringEpisode?.episode - 1 ?? 0,
          duration: item.duration,
          type: item.format,
        })),
      };
      return res;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  /**
   *
   * @param page page number (optional)
   * @param perPage number of results per page (optional)
   * @param weekStart Filter by the start of the week (optional) (default: todays date) (options: 2 = Monday, 3 = Tuesday, 4 = Wednesday, 5 = Thursday, 6 = Friday, 0 = Saturday, 1 = Sunday) you can use either the number or the string
   * @param weekEnd Filter by the end of the week (optional) similar to weekStart
   * @param notYetAired if true will return anime that have not yet aired (optional)
   * @returns the next airing episodes
   */
  AiringSchedule = async (
    page = 1,
    perPage = 20,
    weekStart = (new Date().getDay() + 1) % 7,
    weekEnd = (new Date().getDay() + 7) % 7,
    notYetAired = false
  ) => {
    let day1,
      day2 = undefined;

    if (typeof weekStart === "string" && typeof weekEnd === "string")
      [day1, day2] = getDays(
        capitalizeFirstLetter(weekStart.toLowerCase()),
        capitalizeFirstLetter(weekEnd.toLowerCase())
      );
    else if (typeof weekStart === "number" && typeof weekEnd === "number")
      [day1, day2] = getDays(days[weekStart], days[weekEnd]);
    else throw new Error("Invalid weekStart or weekEnd");

    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistAiringScheduleQuery(page, perPage, day1, day2, notYetAired),
    };

    try {
      const { data } = await axios.post(
        this.proxyUrl
          ? this.proxyUrl + this.anilistGraphqlUrl
          : this.anilistGraphqlUrl,
        options
      );

      const res = {
        currentPage: data.data.Page.pageInfo.currentPage,
        hasNextPage: data.data.Page.pageInfo.hasNextPage,
        results: data.data.Page.airingSchedules.map((item) => ({
          id: item.media.id.toString(),
          malId: item.media.idMal,
          episode: item.episode,
          airingAt: item.airingAt,
          title:
            {
              romaji: item.media.title.romaji,
              english: item.media.title.english,
              native: item.media.title.native,
              userPreferred: item.media.title.userPreferred,
            } || item.media.title.romaji,
          country: item.media.countryOfOrigin,
          image:
            item.media.coverImage.extraLarge ??
            item.media.coverImage.large ??
            item.media.coverImage.medium,
          description: item.media.description,
          cover:
            item.media.bannerImage ??
            item.media.coverImage.extraLarge ??
            item.media.coverImage.large ??
            item.media.coverImage.medium,
          genres: item.media.genres,
          color: item.media.coverImage?.color,
          rating: item.media.averageScore,
          releaseDate: item.media.seasonYear,
          type: item.media.format,
        })),
      };
      return res;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  /**
   *
   * @param genres An array of genres to filter by (optional) genres: [`Action`, `Adventure`, `Cars`, `Comedy`, `Drama`, `Fantasy`, `Horror`, `Mahou Shoujo`, `Mecha`, `Music`, `Mystery`, `Psychological`, `Romance`, `Sci-Fi`, `Slice of Life`, `Sports`, `Supernatural`, `Thriller`]
   * @param page page number (optional)
   * @param perPage number of results per page (optional)
   */
  AnimeGenres = async (genres, page = 1, perPage = 20) => {
    if (genres.length === 0) throw new Error("No genres specified");

    for (const genre of genres) {
      if (
        !Object.values(Genres).includes(
          capitalizeFirstLetter(genre.toLowerCase())
        )
      )
        throw new Error("Invalid genre");
    }

    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistGenresQuery(genres, page, perPage),
    };
    try {
      const { data } = await axios.post(
        this.proxyUrl
          ? this.proxyUrl + this.anilistGraphqlUrl
          : this.anilistGraphqlUrl,
        options
      );

      const res = {
        currentPage: data.data.Page.pageInfo.currentPage,
        hasNextPage: data.data.Page.pageInfo.hasNextPage,
        results: data.data.Page.media.map((item) => ({
          id: item.id.toString(),
          malId: item.idMal,
          title:
            {
              romaji: item.title.romaji,
              english: item.title.english,
              native: item.title.native,
              userPreferred: item.title.userPreferred,
            } || item.title.romaji,
          image:
            item.coverImage.extraLarge ??
            item.coverImage.large ??
            item.coverImage.medium,
          trailer: {
            id: item.trailer?.id,
            site: item.trailer?.site,
            thumbnail: item.trailer?.thumbnail,
          },
          description: item.description,
          cover:
            item.bannerImage ??
            item.coverImage.extraLarge ??
            item.coverImage.large ??
            item.coverImage.medium,
          rating: item.averageScore,
          releaseDate: item.seasonYear,
          color: item.coverImage?.color,
          genres: item.genres,
          totalEpisodes: isNaN(item.episodes)
            ? 0
            : item.episodes ?? item.nextAiringEpisode?.episode - 1 ?? 0,
          duration: item.duration,
          type: item.format,
        })),
      };
      return res;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  AnimeRaw = async (slug, externalLinks) => {
    if (externalLinks && this.provider instanceof Crunchyroll) {
      if (externalLinks.map((link) => link.site.includes("Crunchyroll"))) {
        const link = externalLinks.find((link) =>
          link.site.includes("Crunchyroll")
        );
        const { request } = await axios.get(link.url, {
          validateStatus: () => true,
        });
        const mediaType = request.res.responseUrl.split("/")[3];
        const id = request.res.responseUrl.split("/")[4];

        return await this.provider.Info(id, mediaType);
      }
    }
    const findAnime = await this.provider.Search(slug);
    if (findAnime.results.length === 0) return [];

    // Sort the retrieved info for more accurate results.

    findAnime.results.sort((a, b) => {
      const targetTitle = slug.toLowerCase();

      let firstTitle;
      let secondTitle;

      if (typeof a.title == "string") firstTitle = a.title;
      else firstTitle = a.title.english ?? a.title.romaji ?? "";

      if (typeof b.title == "string") secondTitle = b.title;
      else secondTitle = b.title.english ?? b.title.romaji ?? "";

      const firstRating = compareTwoStrings(
        targetTitle,
        firstTitle.toLowerCase()
      );
      const secondRating = compareTwoStrings(
        targetTitle,
        secondTitle.toLowerCase()
      );

      // Sort in descending order
      return secondRating - firstRating;
    });

    if (this.provider instanceof Crunchyroll) {
      return await this.provider.Info(
        findAnime.results[0].id,
        findAnime.results[0].type
      );
    }
    // TODO: use much better way than this
    return await this.provider.Info(findAnime.results[0].id);
  };

  /**
   * @returns a random anime
   */
  RandomAnime = async () => {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistSiteStatisticsQuery(),
    };

    try {
      // const {
      //   data: { data },
      // } = await axios.post(this.anilistGraphqlUrl, options);

      // const selectedAnime = Math.floor(
      //   Math.random() * data.SiteStatistics.anime.nodes[data.SiteStatistics.anime.nodes.length - 1].count
      // );
      // const { results } = await this.advancedSearch(undefined, 'ANIME', Math.ceil(selectedAnime / 50), 50);

      const { data: data } = await axios.get(
        "https://raw.githubusercontent.com/5H4D0WILA/IDFetch/main/ids.txt"
      );

      const ids = data?.trim().split("\n");
      const selectedAnime = Math.floor(Math.random() * ids.length);
      return await this.Info(ids[selectedAnime]);
    } catch (err) {
      throw new Error(err.message);
    }
  };

  /**
   * @param provider The provider to get the episode Ids from (optional) default: `gogoanime` (options: `gogoanime`, `zoro`)
   * @param page page number (optional)
   * @param perPage number of results per page (optional)
   */
  RecentEpisodes = async (provider = "gogoanime", page = 1, perPage = 15) => {
    try {
      const {
        data: { data, meta },
      } = await axios.get(
        `${this.enimeUrl}/recent?page=${page}&perPage=${perPage}`
      );

      let results = data.map((item) => ({
        id: item.anime.anilistId.toString(),
        malId: item.anime.mappings?.mal,
        title: {
          romaji: item.anime.title?.romaji,
          english: item.anime.title?.english,
          native: item.anime.title?.native,
          userPreferred: item.anime.title?.userPreferred,
        },
        image: item.anime.coverImage ?? item.anime.bannerImage,
        rating: item.anime.averageScore,
        color: item.anime.color,
        episodeId: `${
          provider === "gogoanime"
            ? item.sources.find(
                (source) => source.website.toLowerCase() === "gogoanime"
              )?.id
            : item.sources.find(
                (source) => source.website.toLowerCase() === "zoro"
              )?.id
        }-enime`,
        episodeTitle: item.title ?? `Episode ${item.number}`,
        episodeNumber: item.number,
        genres: item.anime.genre,
        type: item.anime.format,
        aired: item.airedAt,
        duration: item.anime.duration,
      }));

      results = results.filter(
        (item) =>
          item.episodeNumber !== 0 &&
          item.episodeId.replace("-enime", "").length > 0 &&
          item.episodeId.replace("-enime", "") !== "undefined"
      );

      return {
        currentPage: page,
        hasNextPage: meta.lastPage !== page,
        totalPages: meta.lastPage,
        totalResults: meta.total,
        results: results,
      };
    } catch (err) {
      throw new Error(err.message);
    }
  };

  DefaultEpisodeList = async (Media, dub, id) => {
    let episodes = [];

    episodes = await this.FindAnime(
      { english: Media.title?.english, romaji: Media.title?.romaji },
      Media.season,
      Media.startDate.year,
      Media.idMal,
      dub,
      id,
      Media.externalLinks
    );

    return episodes;
  };

  /**
   * @param id anilist id
   * @param dub language of the dubbed version (optional) currently only works for gogoanime
   * @param fetchFiller to get filler boolean on the episode object (optional) set to `true` to get filler boolean on the episode object.
   * @returns episode list **(without anime info)**
   */
  EpisodesListById = async (id, dub = false, fetchFiller = false) => {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: `query($id: Int = ${id}){ Media(id: $id){ idMal externalLinks {site url} title {romaji english} status season episodes startDate {year} coverImage {extraLarge large medium} } }`,
    };

    const {
      data: {
        data: { Media },
      },
    } = await axios.post(
      this.proxyUrl
        ? this.proxyUrl + this.anilistGraphqlUrl
        : this.anilistGraphqlUrl,
      options
    );

    let possibleAnimeEpisodes = [];
    let fillerEpisodes = [];
    if (
      (this.provider instanceof Zoro || this.provider instanceof Gogoanime) &&
      !dub &&
      (Media.status === "RELEASING" ||
        range({ from: 2000, to: new Date().getFullYear() + 1 }).includes(
          parseInt(Media.startDate?.year)
        ))
    ) {
      try {
        possibleAnimeEpisodes = (
          await new Enime().AnimeInfoByAnilistId(
            id,
            this.provider.name.toLowerCase()
          )
        ).episodes?.map((item) => ({
          id: item.slug,
          title: item.title,
          description: item.description,
          number: item.number,
          image: item.image,
        }));
        possibleAnimeEpisodes.reverse();
      } catch (err) {
        possibleAnimeEpisodes = await this.DefaultEpisodeList(Media, dub, id);

        possibleAnimeEpisodes = possibleAnimeEpisodes?.map((episode) => {
          if (!episode.image)
            episode.image =
              Media.coverImage.extraLarge ??
              Media.coverImage.large ??
              Media.coverImage.medium;

          return episode;
        });
        return possibleAnimeEpisodes;
      }
    } else
      possibleAnimeEpisodes = await this.DefaultEpisodeList(Media, dub, id);

    if (fetchFiller) {
      let { data: fillerData } = await axios({
        baseURL: `https://raw.githubusercontent.com/saikou-app/mal-id-filler-list/main/fillers/${Media.idMal}.json`,
        method: "GET",
        validateStatus: () => true,
      });

      if (!fillerData.toString().startsWith("404")) {
        fillerEpisodes = [];
        fillerEpisodes?.push(...fillerData.episodes);
      }
    }

    possibleAnimeEpisodes = possibleAnimeEpisodes?.map((episode) => {
      if (!episode.image)
        episode.image =
          Media.coverImage.extraLarge ??
          Media.coverImage.large ??
          Media.coverImage.medium;

      if (
        fetchFiller &&
        fillerEpisodes?.length > 0 &&
        fillerEpisodes?.length >= Media.episodes
      ) {
        if (fillerEpisodes[episode.number - 1])
          episode.isFiller = new Boolean(
            fillerEpisodes[episode.number - 1]["filler-bool"]
          ).valueOf();
      }

      return episode;
    });

    return possibleAnimeEpisodes;
  };

  /**
   * @param id anilist id
   * @returns anilist data for the anime **(without episodes)** (use `fetchEpisodesListById` to get the episodes) (use `fetchAnimeInfo` to get both)
   */
  AnilistInfoById = async (id) => {
    const animeInfo = {
      id: id,
      title: "",
    };

    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistMediaDetailQuery(id),
    };

    try {
      const { data } = await axios
        .post(
          this.proxyUrl
            ? this.proxyUrl + this.anilistGraphqlUrl
            : this.anilistGraphqlUrl,
          options
        )
        .catch(() => {
          throw new Error("Media not found");
        });
      animeInfo.malId = data.data.Media.idMal;
      animeInfo.title = {
        romaji: data.data.Media.title.romaji,
        english: data.data.Media.title.english,
        native: data.data.Media.title.native,
        userPreferred: data.data.Media.title.userPreferred,
      };

      if (data.data.Media.trailer?.id) {
        animeInfo.trailer = {
          id: data.data.Media.trailer?.id,
          site: data.data.Media.trailer?.site,
          thumbnail: data.data.Media.trailer?.thumbnail,
        };
      }

      animeInfo.synonyms = data.data.Media.synonyms;
      animeInfo.isLicensed = data.data.Media.isLicensed;
      animeInfo.isAdult = data.data.Media.isAdult;
      animeInfo.countryOfOrigin = data.data.Media.countryOfOrigin;

      animeInfo.image =
        data.data.Media.coverImage.extraLarge ??
        data.data.Media.coverImage.large ??
        data.data.Media.coverImage.medium;

      animeInfo.cover = data.data.Media.bannerImage ?? animeInfo.image;
      animeInfo.description = data.data.Media.description;
      switch (data.data.Media.status) {
        case "RELEASING":
          animeInfo.status = MediaStatus.ONGOING;
          break;
        case "FINISHED":
          animeInfo.status = MediaStatus.COMPLETED;
          break;
        case "NOT_YET_RELEASED":
          animeInfo.status = MediaStatus.NOT_YET_AIRED;
          break;
        case "CANCELLED":
          animeInfo.status = MediaStatus.CANCELLED;
          break;
        case "HIATUS":
          animeInfo.status = MediaStatus.HIATUS;
        default:
          animeInfo.status = MediaStatus.UNKNOWN;
      }
      animeInfo.releaseDate = data.data.Media.startDate.year;
      if (data.data.Media.nextAiringEpisode?.airingAt)
        animeInfo.nextAiringEpisode = {
          airingTime: data.data.Media.nextAiringEpisode?.airingAt,
          timeUntilAiring: data.data.Media.nextAiringEpisode?.timeUntilAiring,
          episode: data.data.Media.nextAiringEpisode?.episode,
        };
      animeInfo.totalEpisodes =
        data.data.Media?.episodes ??
        data.data.Media.nextAiringEpisode?.episode - 1;
      animeInfo.rating = data.data.Media.averageScore;
      animeInfo.duration = data.data.Media.duration;
      animeInfo.genres = data.data.Media.genres;
      animeInfo.studios = data.data.Media.studios.edges.map(
        (item) => item.node.name
      );
      animeInfo.season = data.data.Media.season;
      animeInfo.popularity = data.data.Media.popularity;
      animeInfo.type = data.data.Media.format;
      animeInfo.startDate = {
        year: data.data.Media.startDate?.year,
        month: data.data.Media.startDate?.month,
        day: data.data.Media.startDate?.day,
      };
      animeInfo.endDate = {
        year: data.data.Media.endDate?.year,
        month: data.data.Media.endDate?.month,
        day: data.data.Media.endDate?.day,
      };
      animeInfo.recommendations = data.data.Media.recommendations.edges.map(
        (item) => ({
          id: item.node.mediaRecommendation.id,
          malId: item.node.mediaRecommendation.idMal,
          title: {
            romaji: item.node.mediaRecommendation.title.romaji,
            english: item.node.mediaRecommendation.title.english,
            native: item.node.mediaRecommendation.title.native,
            userPreferred: item.node.mediaRecommendation.title.userPreferred,
          },
          status:
            item.node.mediaRecommendation.status == "RELEASING"
              ? MediaStatus.ONGOING
              : item.node.mediaRecommendation.status == "FINISHED"
              ? MediaStatus.COMPLETED
              : item.node.mediaRecommendation.status == "NOT_YET_RELEASED"
              ? MediaStatus.NOT_YET_AIRED
              : item.node.mediaRecommendation.status == "CANCELLED"
              ? MediaStatus.CANCELLED
              : item.node.mediaRecommendation.status == "HIATUS"
              ? MediaStatus.HIATUS
              : MediaStatus.UNKNOWN,
          episodes: item.node.mediaRecommendation.episodes,
          image:
            item.node.mediaRecommendation.coverImage.extraLarge ??
            item.node.mediaRecommendation.coverImage.large ??
            item.node.mediaRecommendation.coverImage.medium,
          cover:
            item.node.mediaRecommendation.bannerImage ??
            item.node.mediaRecommendation.coverImage.extraLarge ??
            item.node.mediaRecommendation.coverImage.large ??
            item.node.mediaRecommendation.coverImage.medium,
          rating: item.node.mediaRecommendation.meanScore,
          type: item.node.mediaRecommendation.format,
        })
      );

      animeInfo.characters = data.data.Media.characters.edges.map((item) => ({
        id: item.node.id,
        role: item.role,
        name: {
          first: item.node.name.first,
          last: item.node.name.last,
          full: item.node.name.full,
          native: item.node.name.native,
          userPreferred: item.node.name.userPreferred,
        },
        image: item.node.image.large ?? item.node.image.medium,
        voiceActors: item.voiceActors.map((voiceActor) => ({
          id: voiceActor.id,
          language: voiceActor.languageV2,
          name: {
            first: voiceActor.name.first,
            last: voiceActor.name.last,
            full: voiceActor.name.full,
            native: voiceActor.name.native,
            userPreferred: voiceActor.name.userPreferred,
          },
          image: voiceActor.image.large ?? voiceActor.image.medium,
        })),
      }));
      animeInfo.color = data.data.Media.coverImage?.color;
      animeInfo.relations = data.data.Media.relations.edges.map((item) => ({
        id: item.node.id,
        malId: item.node.idMal,
        relationType: item.relationType,
        title: {
          romaji: item.node.title.romaji,
          english: item.node.title.english,
          native: item.node.title.native,
          userPreferred: item.node.title.userPreferred,
        },
        status:
          item.node.status == "RELEASING"
            ? MediaStatus.ONGOING
            : item.node.status == "FINISHED"
            ? MediaStatus.COMPLETED
            : item.node.status == "NOT_YET_RELEASED"
            ? MediaStatus.NOT_YET_AIRED
            : item.node.status == "CANCELLED"
            ? MediaStatus.CANCELLED
            : item.node.status == "HIATUS"
            ? MediaStatus.HIATUS
            : MediaStatus.UNKNOWN,
        episodes: item.node.episodes,
        image:
          item.node.coverImage.extraLarge ??
          item.node.coverImage.large ??
          item.node.coverImage.medium,
        cover:
          item.node.bannerImage ??
          item.node.coverImage.extraLarge ??
          item.node.coverImage.large ??
          item.node.coverImage.medium,
        rating: item.node.meanScore,
        type: item.node.format,
      }));

      return animeInfo;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  /**
   * TODO: finish this (got lazy)
   * @param id staff id from anilist
   *
   */
  StaffById = async (id) => {
    throw new Error("Not implemented yet");
  };

  /**
   *
   * @param id character id from anilist
   */
  CharacterInfoById = async (id) => {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      query: anilistCharacterQuery(),
      variables: {
        id: id,
      },
    };

    try {
      const {
        data: {
          data: { Character },
        },
      } = await axios.post(
        this.proxyUrl
          ? this.proxyUrl + this.anilistGraphqlUrl
          : this.anilistGraphqlUrl,
        options
      );

      const height = Character.description.match(/__Height:__(.*)/)?.[1].trim();
      const weight = Character.description.match(/__Weight:__(.*)/)?.[1].trim();
      const hairColor = Character.description
        .match(/__Hair Color:__(.*)/)?.[1]
        .trim();
      const eyeColor = Character.description
        .match(/__Eye Color:__(.*)/)?.[1]
        .trim();
      const relatives = Character.description
        .match(/__Relatives:__(.*)/)?.[1]
        .trim()
        .split(/(, \[)/g)
        .filter((g) => !g.includes(", ["))
        .map((r) => ({
          id: r.match(/\/(\d+)/)?.[1],
          name: r.match(/([^)]+)\]/)?.[1].replace(/\[/g, ""),
          relationship: r.match(/\(([^)]+)\).*?(\(([^)]+)\))/)?.[3],
        }));
      const race = Character.description
        .match(/__Race:__(.*)/)?.[1]
        .split(", ")
        .map((r) => r.trim());
      const rank = Character.description.match(/__Rank:__(.*)/)?.[1];
      const occupation =
        Character.description.match(/__Occupation:__(.*)/)?.[1];
      const previousPosition = Character.description
        .match(/__Previous Position:__(.*)/)?.[1]
        ?.trim();
      const partner = Character.description
        .match(/__Partner:__(.*)/)?.[1]
        .split(/(, \[)/g)
        .filter((g) => !g.includes(", ["))
        .map((r) => ({
          id: r.match(/\/(\d+)/)?.[1],
          name: r.match(/([^)]+)\]/)?.[1].replace(/\[/g, ""),
        }));
      const dislikes = Character.description.match(/__Dislikes:__(.*)/)?.[1];
      const sign = Character.description.match(/__Sign:__(.*)/)?.[1];
      const zodicSign = Character.description
        .match(/__Zodiac sign:__(.*)/)?.[1]
        ?.trim();
      const zodicAnimal = Character.description
        .match(/__Zodiac Animal:__(.*)/)?.[1]
        ?.trim();
      const themeSong = Character.description
        .match(/__Theme Song:__(.*)/)?.[1]
        ?.trim();
      Character.description = Character.description.replace(
        /__Theme Song:__(.*)\n|__Race:__(.*)\n|__Height:__(.*)\n|__Relatives:__(.*)\n|__Rank:__(.*)\n|__Zodiac sign:__(.*)\n|__Zodiac Animal:__(.*)\n|__Weight:__(.*)\n|__Eye Color:__(.*)\n|__Hair Color:__(.*)\n|__Dislikes:__(.*)\n|__Sign:__(.*)\n|__Partner:__(.*)\n|__Previous Position:__(.*)\n|__Occupation:__(.*)\n/gm,
        ""
      );

      const characterInfo = {
        id: Character.id,
        name: {
          first: Character.name?.first,
          last: Character.name?.last,
          full: Character.name?.full,
          native: Character.name?.native,
          userPreferred: Character.name?.userPreferred,
          alternative: Character.name?.alternative,
          alternativeSpoiler: Character.name?.alternativeSpoiler,
        },
        image: Character.image?.large ?? Character.image?.medium,
        description: Character.description,
        gender: Character.gender,
        dateOfBirth: {
          year: Character.dateOfBirth?.year,
          month: Character.dateOfBirth?.month,
          day: Character.dateOfBirth?.day,
        },
        bloodType: Character.bloodType,
        age: Character.age,
        hairColor: hairColor,
        eyeColor: eyeColor,
        height: height,
        weight: weight,
        occupation: occupation,
        partner: partner,
        relatives: relatives,
        race: race,
        rank: rank,
        previousPosition: previousPosition,
        dislikes: dislikes,
        sign: sign,
        zodicSign: zodicSign,
        zodicAnimal: zodicAnimal,
        themeSong: themeSong,
        relations: Character.media.edges?.map((v) => ({
          id: v.node.id,
          malId: v.node.idMal,
          role: v.characterRole,
          title: {
            romaji: v.node.title?.romaji,
            english: v.node.title?.english,
            native: v.node.title?.native,
            userPreferred: v.node.title?.userPreferred,
          },
          status:
            v.node.status == "RELEASING"
              ? MediaStatus.ONGOING
              : v.node.status == "FINISHED"
              ? MediaStatus.COMPLETED
              : v.node.status == "NOT_YET_RELEASED"
              ? MediaStatus.NOT_YET_AIRED
              : v.node.status == "CANCELLED"
              ? MediaStatus.CANCELLED
              : v.node.status == "HIATUS"
              ? MediaStatus.HIATUS
              : MediaStatus.UNKNOWN,
          episodes: v.node.episodes,
          image:
            v.node.coverImage?.extraLarge ??
            v.node.coverImage?.large ??
            v.node.coverImage?.medium,
          rating: v.node.averageScore,
          releaseDate: v.node.startDate?.year,
          type: v.node.format,
          color: v.node.coverImage?.color,
        })),
      };

      return characterInfo;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  /**
   * Anilist Anime class
   */
  static Anime = this;

  /**
   * Anilist Manga Class
   */
  static Manga = class Manga {
    provider;

    /**
     * Maps anilist manga to any manga provider (mangadex, mangasee, etc)
     * @param provider MangaParser
     */
    constructor(provider) {
      this.provider = provider || new Mangasee123();
    }

    /**
     *
     * @param query query to search for
     * @param page (optional) page number (default: `1`)
     * @param perPage (optional) number of results per page (default: `20`)
     */
    Search = async (query, page = 1, perPage = 20) => {
      const options = {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        query: anilistSearchQuery(query, page, perPage, "MANGA"),
      };

      try {
        const { data } = await axios.post(
          new Anilist().anilistGraphqlUrl,
          options
        );

        const res = {
          currentPage: data.data.Page.pageInfo.currentPage,
          hasNextPage: data.data.Page.pageInfo.hasNextPage,
          results: data.data.Page.media.map((item) => ({
            id: item.id.toString(),
            malId: item.idMal,
            title:
              {
                romaji: item.title.romaji,
                english: item.title.english,
                native: item.title.native,
                userPreferred: item.title.userPreferred,
              } || item.title.romaji,
            status:
              item.status == "RELEASING"
                ? MediaStatus.ONGOING
                : item.status == "FINISHED"
                ? MediaStatus.COMPLETED
                : item.status == "NOT_YET_RELEASED"
                ? MediaStatus.NOT_YET_AIRED
                : item.status == "CANCELLED"
                ? MediaStatus.CANCELLED
                : item.status == "HIATUS"
                ? MediaStatus.HIATUS
                : MediaStatus.UNKNOWN,
            image:
              item.coverImage?.extraLarge ??
              item.coverImage?.large ??
              item.coverImage?.medium,
            cover: item.bannerImage,
            popularity: item.popularity,
            description: item.description,
            rating: item.averageScore,
            genres: item.genres,
            color: item.coverImage?.color,
            totalChapters: item.chapters,
            volumes: item.volumes,
            type: item.format,
            releaseDate: item.seasonYear,
          })),
        };

        return res;
      } catch (err) {
        throw new Error(err.message);
      }
    };

    /**
     *
     * @param chapterId chapter id
     * @param args args to pass to the provider (if any)
     * @returns
     */
    ChapterPages = (chapterId, ...args) => {
      return this.provider.ChapterPages(chapterId, ...args);
    };

    Info = async (id, ...args) => {
      const mangaInfo = {
        id: id,
        title: "",
      };

      const options = {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        query: anilistMediaDetailQuery(id),
      };

      try {
        const { data } = await axios
          .post(new Anilist().anilistGraphqlUrl, options)
          .catch((err) => {
            throw new Error("Media not found");
          });
        mangaInfo.malId = data.data.Media.idMal;
        mangaInfo.title = {
          romaji: data.data.Media.title.romaji,
          english: data.data.Media.title.english,
          native: data.data.Media.title.native,
          userPreferred: data.data.Media.title.userPreferred,
        };

        if (data.data.Media.trailer?.id) {
          mangaInfo.trailer = {
            id: data.data.Media.trailer.id,
            site: data.data.Media.trailer?.site,
            thumbnail: data.data.Media.trailer?.thumbnail,
          };
        }
        mangaInfo.image =
          data.data.Media.coverImage.extraLarge ??
          data.data.Media.coverImage.large ??
          data.data.Media.coverImage.medium;

        mangaInfo.popularity = data.data.Media.popularity;
        mangaInfo.color = data.data.Media.coverImage?.color;
        mangaInfo.cover = data.data.Media.bannerImage ?? mangaInfo.image;
        mangaInfo.description = data.data.Media.description;
        switch (data.data.Media.status) {
          case "RELEASING":
            mangaInfo.status = MediaStatus.ONGOING;
            break;
          case "FINISHED":
            mangaInfo.status = MediaStatus.COMPLETED;
            break;
          case "NOT_YET_RELEASED":
            mangaInfo.status = MediaStatus.NOT_YET_AIRED;
            break;
          case "CANCELLED":
            mangaInfo.status = MediaStatus.CANCELLED;
            break;
          case "HIATUS":
            mangaInfo.status = MediaStatus.HIATUS;
          default:
            mangaInfo.status = MediaStatus.UNKNOWN;
        }
        mangaInfo.releaseDate = data.data.Media.startDate.year;
        mangaInfo.startDate = {
          year: data.data.Media.startDate.year,
          month: data.data.Media.startDate.month,
          day: data.data.Media.startDate.day,
        };
        mangaInfo.endDate = {
          year: data.data.Media.endDate.year,
          month: data.data.Media.endDate.month,
          day: data.data.Media.endDate.day,
        };
        mangaInfo.rating = data.data.Media.averageScore;
        mangaInfo.genres = data.data.Media.genres;
        mangaInfo.season = data.data.Media.season;
        mangaInfo.studios = data.data.Media.studios.edges.map(
          (item) => item.node.name
        );
        mangaInfo.type = data.data.Media.format;
        mangaInfo.recommendations = data.data.Media.recommendations.edges.map(
          (item) => ({
            id: item.node.mediaRecommendation?.id,
            malId: item.node.mediaRecommendation?.idMal,
            title: {
              romaji: item.node.mediaRecommendation?.title?.romaji,
              english: item.node.mediaRecommendation?.title?.english,
              native: item.node.mediaRecommendation?.title?.native,
              userPreferred:
                item.node.mediaRecommendation?.title?.userPreferred,
            },
            status:
              item.node.mediaRecommendation?.status == "RELEASING"
                ? MediaStatus.ONGOING
                : item.node.mediaRecommendation?.status == "FINISHED"
                ? MediaStatus.COMPLETED
                : item.node.mediaRecommendation?.status == "NOT_YET_RELEASED"
                ? MediaStatus.NOT_YET_AIRED
                : item.node.mediaRecommendation?.status == "CANCELLED"
                ? MediaStatus.CANCELLED
                : item.node.mediaRecommendation?.status == "HIATUS"
                ? MediaStatus.HIATUS
                : MediaStatus.UNKNOWN,
            chapters: item.node.mediaRecommendation?.chapters,
            image:
              item.node.mediaRecommendation?.coverImage?.extraLarge ??
              item.node.mediaRecommendation?.coverImage?.large ??
              item.node.mediaRecommendation?.coverImage?.medium,
            cover:
              item.node.mediaRecommendation?.bannerImage ??
              item.node.mediaRecommendation?.coverImage?.extraLarge ??
              item.node.mediaRecommendation?.coverImage?.large ??
              item.node.mediaRecommendation?.coverImage?.medium,
            rating: item.node.mediaRecommendation?.meanScore,
            type: item.node.mediaRecommendation?.format,
          })
        );

        mangaInfo.characters = data.data.Media.characters.edges.map((item) => ({
          id: item.node?.id,
          role: item.role,
          name: {
            first: item.node.name.first,
            last: item.node.name.last,
            full: item.node.name.full,
            native: item.node.name.native,
            userPreferred: item.node.name.userPreferred,
          },
          image: item.node.image.large ?? item.node.image.medium,
        }));

        mangaInfo.relations = data.data.Media.relations.edges.map((item) => ({
          id: item.node.id,
          relationType: item.relationType,
          malId: item.node.idMal,
          title: {
            romaji: item.node.title.romaji,
            english: item.node.title.english,
            native: item.node.title.native,
            userPreferred: item.node.title.userPreferred,
          },
          status:
            item.node.status == "RELEASING"
              ? MediaStatus.ONGOING
              : item.node.status == "FINISHED"
              ? MediaStatus.COMPLETED
              : item.node.status == "NOT_YET_RELEASED"
              ? MediaStatus.NOT_YET_AIRED
              : item.node.status == "CANCELLED"
              ? MediaStatus.CANCELLED
              : item.node.status == "HIATUS"
              ? MediaStatus.HIATUS
              : MediaStatus.UNKNOWN,
          chapters: item.node.chapters,
          image:
            item.node.coverImage.extraLarge ??
            item.node.coverImage.large ??
            item.node.coverImage.medium,
          color: item.node.coverImage?.color,
          type: item.node.format,
          cover:
            item.node.bannerImage ??
            item.node.coverImage.extraLarge ??
            item.node.coverImage.large ??
            item.node.coverImage.medium,
          rating: item.node.meanScore,
        }));

        mangaInfo.chapters = await new Anilist().FindManga(
          this.provider,
          { english: mangaInfo.title.english, romaji: mangaInfo.title.romaji },
          mangaInfo.malId
        );

        return mangaInfo;
      } catch (error) {
        console.log(error);
        throw Error(error.message);
      }
    };
  };

  MangaSlug = async (provider, title, malId) => {
    const slug = title.replace(/[^0-9a-zA-Z]+/g, " ");

    let possibleManga;

    if (malId) {
      const malAsyncReq = await axios({
        method: "GET",
        url: `${this.malSyncUrl}/mal/manga/${malId}`,
        validateStatus: () => true,
      });

      if (malAsyncReq.status === 200) {
        const sitesT = malAsyncReq.data.Sites;
        let sites = Object.values(sitesT).map((v, i) => {
          const obj = [...Object.values(Object.values(sitesT)[i])];
          const pages = obj.map((v) => ({
            page: v.page,
            url: v.url,
            title: v.title,
          }));
          return pages;
        });

        sites = sites.flat();

        sites.sort((a, b) => {
          const targetTitle = malAsyncReq.data.title.toLowerCase();

          const firstRating = compareTwoStrings(
            targetTitle,
            a.title.toLowerCase()
          );
          const secondRating = compareTwoStrings(
            targetTitle,
            b.title.toLowerCase()
          );

          // Sort in descending order
          return secondRating - firstRating;
        });

        const possibleSource = sites.find((s) => {
          if (s.page.toLowerCase() === this.provider.name.toLowerCase())
            if (this.provider instanceof Gogoanime)
              return dub
                ? s.title.toLowerCase().includes("dub")
                : !s.title.toLowerCase().includes("dub");
            else return true;
          return false;
        });

        if (possibleSource)
          possibleManga = await provider.Info(
            possibleSource.url.split("/").pop()
          );
        else possibleManga = await this.MangaRaw(provider, slug, title);
      } else possibleManga = await this.MangaRaw(provider, slug, title);
    } else possibleManga = await this.MangaRaw(provider, slug, title);

    const possibleProviderChapters = possibleManga.chapters;

    return possibleProviderChapters;
  };

  MangaRaw = async (provider, slug, title) => {
    const findAnime = await provider.Search(slug);

    if (findAnime.results.length === 0) return [];
    // TODO: use much better way than this

    const possibleManga = findAnime.results.find(
      (manga) =>
        title.toLowerCase() ==
        (typeof manga.title === "string" ? manga.title.toLowerCase() : "")
    );

    if (!possibleManga) return await provider.Info(findAnime.results[0].id);
    return await provider.Info(possibleManga.id);
  };

  FindManga = async (provider, title, malId) => {
    title.english = title.english ?? title.romaji;
    title.romaji = title.romaji ?? title.english;

    title.english = title.english.toLowerCase();
    title.romaji = title.romaji.toLowerCase();

    if (title.english === title.romaji)
      return await this.MangaSlug(provider, title.english, malId);

    const romajiPossibleEpisodes = this.MangaSlug(
      provider,
      title.romaji,
      malId
    );

    if (romajiPossibleEpisodes) {
      return romajiPossibleEpisodes;
    }

    const englishPossibleEpisodes = this.MangaSlug(
      provider,
      title.english,
      malId
    );
    return englishPossibleEpisodes;
  };
}

// (async () => {
//   const ani = new Anilist();

//   const search = await ani.Search("classroom of the elite");
//   const info = await ani.Info(search.results[0].id);
//   const sources = await ani.Source(info.episodes[0].id);

//   console.log(sources);
// })();

export default Anilist;
