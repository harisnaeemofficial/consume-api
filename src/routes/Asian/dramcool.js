import express from "express";
const router = express.Router();

import { Genres } from "../../models";
import { ASIAN } from "../../providers/index.js";
import { capitalizeFirstLetter } from "../../utils";

let dramacool = new ASIAN.DramaCool();

router.get("/search/:query", async (req, res) => {
  const { query } = req.params;
  const { page = 1 } = req.query;

  if (!query)
    return res.status(404).send({ error_message: "no search specified" });

  const reply = await dramacool.Search(query, page);

  res.status(200).send(reply);
});

router.get("/info", async (req, res) => {
  const { mediaId } = req.query;

  if (!mediaId)
    return res.status(404).send({ error_message: "no Media id specified" });

  const reply = await dramacool.Info(mediaId);

  res.status(200).send(reply);
});

router.get("/watch", async (req, res) => {
  const { mediaId, provider } = req.query;

  const reply = await dramacool.Source(mediaId, provider);

  res.status(200).send(reply);
});

export default router;
