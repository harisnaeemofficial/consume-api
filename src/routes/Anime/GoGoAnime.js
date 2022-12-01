import ora from "ora";

import express from "express";
const router = express.Router();

import { ANIME } from "../../providers/index.js";
import { StreamingServers } from "../../models/types.js";

const GogoAnime = new ANIME.GogoAnime();

router.get("/search/:searchTerm", async (req, res) => {
  const { searchTerm } = req.params;

  if (!searchTerm || searchTerm.length < 0)
    return res.send({ error: "no search query" });

  const Search = await GogoAnime.Search(searchTerm);

  if (!Search) return res.send({ error: "no results found" });

  return res.send(Search);
});

router.get("/info", async (req, res) => {
  const { animeId } = req.query;

  if (!animeId) return res.send({ error: "no mal id specified" });

  const Info = await GogoAnime.Info(animeId);

  if (!Info) return res.send({ error: "no info found" });

  return res.send(Info);
});

router.get("/watch/:episodeId", async (req, res) => {
  const { episodeId } = req.params;
  const { server } = req.query;

  if (
    server &&
    !Object.values(StreamingServers).includes(server.toLowerCase())
  ) {
    res.status(400).send("Invalid server");
  }

  console.log(`${episodeId} is the episode id`);

  const source = await GogoAnime.Source(episodeId, server);

  if (!source) return res.send({ error: "no source found" });

  return res.send(source);
});

router.get("/recent", async (req, res) => {
  const { page, type } = req.query;

  const Recent = await GogoAnime.RecentEpisodes(page, type);

  if (!Recent) return res.send({ error: "no data found" });

  res.send(Recent);
});

router.get("/top", async (req, res) => {
  const { page } = req.query;

  const Top = await GogoAnime.TopAiring(page);

  if (!Top) return res.send({ error: "no data found" });

  res.send(Top);
});

// router.get("/new", async (req, res) => {
//   const { page } = req.query;

//   const New = await GogoAnime.NewSeason({ page });

//   if (!New) return res.send({ error: "no data found" });

//   res.send(New);
// });

// router.get("/season", async (req, res) => {
//   const { page, season } = req.query;

//   const Season = await GogoAnime.Season({ page, season });

//   if (!Season) return res.send({ error: "no data found" });

//   res.send(Season);
// });

// router.get("/genre", async (req, res) => {
//   const { page, genre } = req.query;

//   const Genre = await GogoAnime.Genre({ page, genre });

//   if (!Genre) return res.send({ error: "no data found" });

//   res.send(Genre);
// });

export default router;
