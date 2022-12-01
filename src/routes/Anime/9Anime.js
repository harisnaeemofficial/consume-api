import express from "express";
import { StreamingServers } from "../../models/index.js";
import { ANIME } from "../../providers/index.js";

const router = express.Router();

const nineanime = await ANIME.NineAnime.Create();

router.get("/search/:query", async (req, res) => {
  const { query } = req.params;
  const { page } = req.query;

  const reply = await nineanime.Search(query, page);

  res.status(200).send(reply);
});

router.get("/info/:id", async (req, res) => {
  const { id } = req.params;

  if (typeof id === "undefined")
    return res.status(400).send({ error_message: "id is required" });

  try {
    const reply = await nineanime
      .Info(id)
      .catch((err) => res.status(404).send({ error_message: err.message }));

    res.status(200).send(reply);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: true, error_message: err });
  }
});

router.get("/watch/:episodeId", async (req, res) => {
  const { episodeId } = req.params;
  const { server } = req.query;

  try {
    if (server && !Object.values(StreamingServers).includes(server))
      return res.status(400).send({ error_message: "server is invalid" });

    if (typeof episodeId === "undefined")
      return res.status(400).send({ error_message: "id is required" });

    const reply = await nineanime.Sources(episodeId, server);

    return res.status(200).send(reply);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: true, error_message: err.message });
  }
});

router.get("/servers/:episodeId", async (req, res) => {
  const { episodeId } = req.params;

  try {
    const reply = await nineanime.Servers(episodeId);

    res.status(200).send(reply);
  } catch (err) {
    res
      .status(500)
      .send({ error_message: "Something went wrong. Please try again later." });
  }
});

export default router;
