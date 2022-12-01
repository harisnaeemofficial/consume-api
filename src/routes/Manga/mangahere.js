import express from "express";

import { MANGA } from "../../providers/index.js";

const router = express.Router();

const mangahere = new MANGA.MangaHere();

router.get("/search/:query", async (req, res) => {
  const { query } = req.params;
  const { page } = req.query;

  const reply = await mangahere.Search(query, page);

  res.status(200).send(reply);
});

router.get("/info", async (req, res) => {
  const { id } = req.query;

  const reply = await mangahere.Info(decodeURIComponent(id));

  res.status(200).send(reply);
});

router.get("/read", async (req, res) => {
  const { chapterId } = req.query;

  try {
    const reply = await mangahere.ChapterPages(chapterId);

    res.status(200).send(reply);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ error_message: "Something went wrong. Please try again later." });
  }
});

export default router;
