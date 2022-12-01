import express from "express";
const router = express.Router();

import { ANIME } from "../../providers/index.js";

const animepahe = new ANIME.AnimePahe();

router.get("/search/:search", async (req, res) => {
  const keyw = req.params.search;
  if (!keyw || keyw.length < 0) return res.send({ error: "no search query" });

  const Search = await animepahe.Search(keyw);

  if (!Search) return res.send({ error: "no results found" });

  return res.send(Search);
});

router.get("/info", async (req, res) => {
  const { id, dub } = req.query;

  if (typeof id === "undefined")
    return reply.status(400).send({ message: "id is required" });

  const reply = await animepahe.Info(id, dub);

  res.status(200).send(reply);
});

router.get("/watch", async (req, res) => {
  const { episodeId } = req.query;

  if (typeof episodeId === "undefined")
    return res.status(400).send({ message: "episodeId is required" });

  const reply = await animepahe.Source(episodeId);

  res.status(200).send(reply);
});

export default router;
