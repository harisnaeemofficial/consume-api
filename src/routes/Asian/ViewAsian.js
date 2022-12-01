import express from "express";
const router = express.Router();

import { Genres } from "../../models";
import { ASIAN } from "../../providers/index.js";
import { capitalizeFirstLetter } from "../../utils";

let VA = new ASIAN.ViewAsian();

router.get("/search/:query", async (req, res) => {
  const { query } = req.params;
  const { page = 1 } = req.query;

  if (!query)
    return res.status(404).send({ error_message: "no search specified" });

  const reply = await VA.Search(query, page);

  res.status(200).send(reply);
});

router.get("/info", async (req, res) => {
  const { mediaId } = req.query;

  if (!mediaId)
    return res.status(404).send({ error_message: "no search specified" });

  const reply = await VA.Info(mediaId);

  res.status(200).send(reply);
});

router.get("/watch", async (req, res) => {
  const { mediaId } = req.query;

  if (!mediaId)
    return res.status(404).send({ error_message: "no search specified" });

  const reply = await VA.Source(mediaId);

  res.status(200).send(reply);
});

export default router;
