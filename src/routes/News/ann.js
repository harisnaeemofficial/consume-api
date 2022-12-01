import express from "express";
import { NEWS } from "../../providers";

const router = express.Router();

const ann = new NEWS.AnimeNewsNetwork();

router.get("/topic/info", async (req, res) => {
  const { id } = req.query;

  if (!id) return res.status(404).send({ error: "id not found!" });

  const reply = await ann.NewsInfo(id);

  res.send(reply);
});

router.get("/topic/:topic?", async (req, res) => {
  const { topic } = req.params;

  const reply = await ann.NewsFeeds(topic);

  res.send(reply);
});

export default router;
