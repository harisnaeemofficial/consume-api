import express from "express";
const router = express.Router();

import { Genres } from "../../models";
import { META } from "../../providers/index.js";
import { capitalizeFirstLetter } from "../../utils";
import { PROVIDERS_LIST } from "../../utils/providers-list.js";

let anilist = new META.Anilist.Manga();

router.get("/search/:query", async (req, res) => {
  const { query } = req.params;
  const { page, perPage } = req.query;

  const reply = await anilist.Search(query, page, perPage);

  res.status(200).send(reply);
});

router.get("/info/:id", async (req, res) => {
  let { id } = req.params;
  let { provider } = req.query;

  if (typeof provider !== "undefined") {
    const possibleProvider = PROVIDERS_LIST.MANGA.find(
      (p) => p.name.toLowerCase() === provider.toLocaleLowerCase()
    );
    anilist = new META.Anilist.Manga(possibleProvider);
  }

  if (typeof id === "undefined")
    return res.status(400).send({ message: "id is required" });

  try {
    const reply = await anilist.Info(id);

    res.status(200).send(reply);
    anilist = new META.Anilist.Manga();
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ message: "Something went wrong. Contact developer for help." });
  }
});

router.get("/read", async (req, res) => {
  const { chapterId, provider } = req.query;

  if (typeof provider !== "undefined") {
    const possibleProvider = PROVIDERS_LIST.MANGA.find(
      (p) => p.name.toLowerCase() === provider.toLocaleLowerCase()
    );
    anilist = new META.Anilist.Manga(possibleProvider);
  }

  if (typeof chapterId === "undefined")
    return res.status(400).send({ message: "chapterId is required" });

  try {
    const reply = await anilist.ChapterPages(chapterId);

    res.status(200).send(reply);
    anilist = new META.Anilist.Manga();
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ message: "Something went wrong. Contact developer for help." });
  }
});

export default router;
