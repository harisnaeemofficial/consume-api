import express from "express";

import { MANGA } from "../../providers/index.js";

const router = express.Router();

const mangapark = new MANGA.Mangapark();

router.get("/search/:query", async (req, res) => {
  const { query } = req.params;
  const { page } = req.query;

  const reply = await mangapark.Search(query, page);

  res.status(200).send(reply);
});

router.get("/info/:id", async (req, res) => {
  const { id } = req.params;

  const reply = await mangapark.Info(decodeURIComponent(id));

  res.status(200).send(reply);
});

router.get("/read", async (req, res) => {
  const { chapterId } = req.query;

  try {
    const reply = await mangapark.ChapterPages(chapterId);

    res.status(200).send(reply);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ error_message: "Something went wrong. Please try again later." });
  }
});

export default router;
