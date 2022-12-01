import express from "express";
const router = express.Router();

import { Genres } from "../../models";
import { META } from "../../providers/index.js";
import { capitalizeFirstLetter } from "../../utils";
import { PROVIDERS_LIST } from "../../utils/providers-list.js";

let anilist = new META.Anilist();

router.get("/search/:query", async (req, res) => {
  const { query } = req.params;
  const { page, perPage } = req.query;

  const reply = await anilist.Search(query, page, perPage);

  res.status(200).send(reply);
});

router.get("/advanced-search", async (req, res) => {
  let {
    query,
    page,
    perPage,
    type,
    genres,
    id,
    format,
    sort,
    status,
    year,
    season,
  } = req.query;
  if (genres) {
    JSON.parse(genres).forEach((genre) => {
      if (!Object.values(Genres).includes(genre)) {
        return res
          .status(400)
          .send({ message: `${genre} is not a valid genre` });
      }
    });

    genres = JSON.parse(genres);
  }

  if (sort) sort = JSON.parse(sort);

  if (season)
    if (!["WINTER", "SPRING", "SUMMER", "FALL"].includes(season))
      return res
        .status(400)
        .send({ message: `${season} is not a valid season` });

  const reply = await anilist.AdvancedSearch(
    query,
    type,
    page,
    perPage,
    format,
    sort,
    genres,
    id,
    year,
    status,
    season
  );

  res.status(200).send(reply);
});

router.get("/trending", async (req, res) => {
  const { page, perPage } = req.query;

  const reply = await anilist.Trending(page, perPage);

  res.status(200).send(reply);
});

router.get("/popular", async (req, res) => {
  const { page, perPage } = req.query;

  const reply = await anilist.Popular(page, perPage);

  res.status(200).send(reply);
});

router.get("/airing-schedule", async (req, res) => {
  const { page, perPage, weekStart, weekEnd, notYetAired } = req.query;

  const reply = await anilist.AiringSchedule(
    page,
    perPage,
    weekStart,
    weekEnd,
    notYetAired
  );

  res.status(200).send(reply);
});

router.get("/genre", async (req, res) => {
  const { page, perPage, genres } = req.query;

  if (typeof genres === "undefined")
    return reply.status(400).send({ message: "genres is required" });

  JSON.parse(genres).forEach((genre) => {
    if (
      !Object.values(Genres).includes(
        capitalizeFirstLetter(genre.toLocaleLowerCase())
      )
    ) {
      return res.status(400).send({ message: `${genre} is not a valid genre` });
    }
  });

  const reply = await anilist.AnimeGenres(JSON.parse(genres), page, perPage);

  res.status(200).send(reply);
});

router.get("/recent-episodes", async (req, res) => {
  const { page, perPage, provider } = req.query;

  const reply = await anilist.RecentEpisodes(provider, page, perPage);

  res.status(200).send(reply);
});

router.get("/random-anime", async (req, res) => {
  const reply = await anilist.RandomAnime().catch((err) => {
    return res.status(404).send({ error_message: "Anime not found" });
  });

  res.status(200).send(reply);
});

router.get("/episodes/:id", async (req, res) => {
  const { id } = req.params;
  let { provider, dub, fetchFiller = true } = req.query;

  if (typeof provider !== "undefined") {
    const possibleProvider = PROVIDERS_LIST.ANIME.find(
      (p) => p.name.toLowerCase() === provider.toLocaleLowerCase()
    );
    anilist = new META.Anilist(possibleProvider);
  }

  if (dub === "true" || dub === "1") dub = true;
  else dub = false;

  if (fetchFiller === "true" || fetchFiller === "1") fetchFiller = true;
  else fetchFiller = false;

  const reply = await anilist.EpisodesListById(id, dub, fetchFiller);

  anilist = new META.Anilist();
  res.status(200).send(reply);
});

router.get("/data/:id", async (req, res) => {
  const { id } = req.params;

  const reply = await anilist.AnilistInfoById(id);

  res.status(200).send(reply);
});

router.get("/info/:id", async (req, res) => {
  const { id } = req.params;
  let { dub: isDub, provider, fetchFiller } = req.query;

  if (typeof provider !== "undefined") {
    const possibleProvider = PROVIDERS_LIST.ANIME.find(
      (p) => p.name.toLowerCase() === provider.toLocaleLowerCase()
    );
    anilist = new META.Anilist(possibleProvider);
  }

  if (isDub === "true" || isDub === "1") isDub = true;
  else isDub = false;

  if (fetchFiller === "true" || fetchFiller === "1") fetchFiller = true;
  else fetchFiller = false;

  try {
    const reply = await anilist.Info(id, isDub, fetchFiller);

    anilist = new META.Anilist();
    res.status(200).send(reply);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Something went wrong. Contact developer for help." });
  }
});

router.get("/character/:id", async (req, res) => {
  const { id } = req.params;

  const reply = await anilist.CharacterInfoById(id);

  res.status(200).send(reply);
});

router.get("/watch/", async (req, res) => {
  const { provider, episodeId, server } = req.query;

  if (typeof provider !== "undefined") {
    const possibleProvider = PROVIDERS_LIST.ANIME.find((p) => {
      return p.name.toLowerCase() === provider.toLocaleLowerCase();
    });

    anilist = new META.Anilist(possibleProvider);
  }

  try {
    const reply = await anilist.Source(episodeId, server);

    anilist = new META.Anilist();
    return res.send(reply);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ message: "Something went wrong. Contact developer for help." });
  }
});

router.get("/servers/:episodeId", async (req, res) => {
  const { episodeId } = req.params;
  const { provider } = req.query;

  if (typeof provider !== "undefined") {
    const possibleProvider = PROVIDERS_LIST.ANIME.find(
      (p) => p.name.toLowerCase() === provider.toLocaleLowerCase()
    );
    anilist = new META.Anilist(possibleProvider);
  }

  const reply = await anilist.Servers(episodeId);

  anilist = new META.Anilist();
  res.status(200).send(reply);
});

export default router;
