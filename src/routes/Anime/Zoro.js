import ora from "ora";
import chalk from "chalk";

import express from "express";
const router = express.Router();

import { ANIME } from "../../providers/index.js";

import { StreamingServers } from "../../models/index.js";

const Zoro = new ANIME.Zoro();

router.get("/search/:query", async (req, res) => {
  const { query } = req.params;
  const { page } = req.query;

  if (!query || query.length < 0) return res.send({ error: "no search query" });

  const Search = await Zoro.Search({ query, page });
  if (!Search) return res.send({ error: "no results found" });

  return res.send(Search);
});

router.get("/info/:animeId", async (req, res) => {
  const { animeId } = req.params;

  if (!animeId) return res.send({ error: "no mal id specified" });

  const Info = await Zoro.Info(animeId);

  if (!Info) return res.send({ error: "no info found" });

  return res.send(Info);
});

router.get("/episodes", async (req, res) => {
  const { id } = req.query;

  if (!id) return res.send({ error: "no id specified" });

  const Episodes = await Zoro.Episodes({ id });
  if (!Episodes) return res.send({ error: "no results found" });

  return res.send(Episodes);
});

router.get("/watch/:episodeId", async (req, res) => {
  const { episodeId } = req.params;
  const { server } = req.query;

  if (server && !Object.values(StreamingServers).includes(server))
    return res.status(400).send({ message: "server is invalid" });

  if (typeof episodeId === "undefined")
    return res.status(400).send({ message: "id is required" });

  try {
    const reply = await Zoro.Source(episodeId, server);

    res.status(200).send(reply);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ message: "Something went wrong. Contact developer for help." });
  }
});

export default router;
