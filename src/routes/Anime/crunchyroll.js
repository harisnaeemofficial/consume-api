import express from "express";
import { ANIME } from "../../providers";
import CrunchyrollManager from "../../utils/crunchyroll-token";

const router = express.Router();

const crunchyrollManager = await CrunchyrollManager.create();
const crunchyroll = await ANIME.Crunchyroll.create(
  "en-US",
  crunchyrollManager.returnToken
);

router.get("/search/:query", async (req, res) => {
  const { query } = req.params;
  const { locale } = req.query;

  const crnchyroll = await ANIME.Crunchyroll.create(
    locale,
    crunchyrollManager.returnToken
  );

  const reply = await crnchyroll.Search(query);

  res.status(200).send(reply);
});

router.get("/info/:id", async (req, res) => {
  const { id } = req.params;
  const { mediaType, locale } = req.query;

  const crnchyroll = await ANIME.Crunchyroll.create(
    locale,
    crunchyrollManager.returnToken
  );

  if (typeof id === "undefined")
    return res.status(400).send({ message: "id is required" });

  if (typeof mediaType === "undefined")
    return res.status(400).send({ message: "mediaType is required" });

  try {
    const reply = await crnchyroll.Info(id, mediaType);

    res.status(200).send(reply);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ message: "Something went wrong. Contact developer for help." });
  }
});

router.get("/watch", async (req, res) => {
  const { episodeId, format, type } = req.query;

  if (typeof episodeId === "undefined")
    return res.status(400).send({ message: "episodeId is required" });

  try {
    const reply = await crunchyroll.Source(episodeId, format, type);

    res.send(reply);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Something went wrong. Contact developer for help." });
  }
});

export default router;
