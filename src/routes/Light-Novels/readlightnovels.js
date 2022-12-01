import express from "express";
const router = express.Router();

import { LIGHT_NOVELS } from "../../providers";

const RLN = new LIGHT_NOVELS.ReadLightNovels();

router.get("/search/:query", async (req, res) => {
  const { query } = req.params;

  const reply = await RLN.Search(query);

  res.status(200).send(reply);
});

router.get("/info/:id/:chapterPage?", async (req, res) => {
  const { id, chapterPage } = req.params;

  if (typeof id === "undefined") {
    return res.status(400).send({
      message: "id is required",
    });
  }

  try {
    const reply = await RLN.Info(id, chapterPage).catch((err) =>
      res.status(404).send({ message: err })
    );

    res.status(200).send(reply);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Something went wrong. Please try again later." });
  }
});

router.get("/read/", async (req, res) => {
  const { chapterId } = req.query;

  if (typeof chapterId === "undefined") {
    return res.status(400).send({
      message: "chapterId is required",
    });
  }

  try {
    const reply = await RLN.ChapterContent(chapterId).catch((err) =>
      res.status(404).send(err)
    );

    res.status(200).send(reply);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Something went wrong. Please try again later." });
  }
});

export default router;
