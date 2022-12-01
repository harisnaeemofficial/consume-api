import express from "express";
import { StreamingServers } from "../../models/index.js";
import { MOVIES } from "../../providers/index.js";

const router = express.Router();

const flixhq = new MOVIES.FlixHQ();

router.get("/search/:query", async (req, res) => {
  const { query } = req.params;
  const { page } = req.query;

  const reply = await flixhq.Search(decodeURIComponent(query), page);

  return res.status(200).send(reply);
});

router.get("/info", async (req, res) => {
  const { mediaId } = req.query;

  if (typeof mediaId === "undefined")
    return res.status(400).send({
      error_message: "id is required",
    });

  const reply = await flixhq.Info(mediaId);

  return res.status(200).send(reply);
});

router.get("/watch/:episodeId", async (req, res) => {
  const { episodeId } = req.params;
  const { mediaId, server } = req.query;

  if (typeof episodeId === "undefined")
    return res.status(400).send({ error_message: "episode id is required" });

  if (typeof mediaId === "undefined")
    return res.status(400).send({
      error_message: "media id is required",
    });

  if (server && !Object.values(StreamingServers).includes(server))
    return res.status(400).send({ error_message: "Invalid server query" });

  const reply = await flixhq.Source(episodeId, mediaId, server);

  return res.status(200).send(reply);
});

router.get("/recent-movies", async (req, res) => {
  const reply = await flixhq.RecentMovies();

  if (!reply) return res.status(400).send({ error_message: "No data" });

  res.status(200).send(reply);
});

router.get("/recent-tv", async (req, res) => {
  const reply = await flixhq.RecentTvShows();

  if (!reply) return res.status(400).send({ error_message: "No data" });

  res.status(200).send(reply);
});

export default router;
