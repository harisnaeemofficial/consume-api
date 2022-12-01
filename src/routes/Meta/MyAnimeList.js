import express from "express";
const router = express.Router();

import { Genres } from "../../models";
import { META } from "../../providers/index.js";
import { capitalizeFirstLetter } from "../../utils";
import { PROVIDERS_LIST } from "../../utils/providers-list.js";

let mal = new META.MyAnimeList();

router.get("/search/:query", async (req, res) => {
  const { query } = req.params;
  const { page, perPage } = req.query;

  const reply = await mal.Search(query, page, perPage);

  res.status(200).send(reply);
});

router.get("/data/:id", async (req, res) => {
  const { id } = req.params;

  const reply = await mal.MalInfoById(id);

  res.status(200).send(reply);
});

router.get("/info/:id", async (req, res) => {
  const { id } = req.params;
  let { dub: isDub, provider, fetchFiller } = req.query;

  if (typeof provider !== "undefined") {
    const possibleProvider = PROVIDERS_LIST.ANIME.find(
      (p) => p.name.toLowerCase() === provider.toLocaleLowerCase()
    );
    mal = new META.MyAnimeList(possibleProvider);
  }

  if (isDub === "true" || isDub === "1") isDub = true;
  else isDub = false;

  if (fetchFiller === "true" || fetchFiller === "1") fetchFiller = true;
  else fetchFiller = false;

  try {
    const reply = await mal.Info(id, isDub, fetchFiller);

    mal = new META.MyAnimeList();
    res.status(200).send(reply);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Something went wrong. Contact developer for help." });
  }
});

router.get("/watch/", async (req, res) => {
  const { provider, episodeId, server } = req.query;

  if (typeof provider !== "undefined") {
    const possibleProvider = PROVIDERS_LIST.ANIME.find((p) => {
      return p.name.toLowerCase() === provider.toLocaleLowerCase();
    });

    mal = new META.MyAnimeList(possibleProvider);
  }

  try {
    const reply = await mal.Source(episodeId, server);

    mal = new META.MyAnimeList();
    return res.send(reply);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ message: "Something went wrong. Contact developer for help." });
  }
});

export default router;
