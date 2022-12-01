import express from "express";
import { ANIME } from "../../providers";

const router = express.Router();

const enime = new ANIME.Enime();

router.get("/search/:query", async (req, res) => {
  const { query } = req.params;

  const reply = await enime.Search(query);

  res.status(200).send(reply);
});

router.get("/info", async (req, res) => {
  const { id } = req.query;

  if (typeof id === "undefined")
    return res.status(400).send({ message: "id is required" });

  try {
    const res = await enime
      .Info(id)
      .catch((err) => reply.status(404).send({ message: err }));

    reply.status(200).send(res);
  } catch (err) {
    reply
      .status(500)
      .send({ message: "Something went wrong. Contact developer for help." });
  }
});

router.get("/watch", async (req, res) => {
  const { episodeId } = req.query;

  if (typeof episodeId === "undefined")
    return res.status(400).send({ message: "episodeId is required" });

  try {
    const reply = await enime
      .Source(episodeId)
      .catch((err) => reply.status(404).send({ message: err }));

    res.status(200).send(reply);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Something went wrong. Contact developer for help." });
  }
});

export default router;
