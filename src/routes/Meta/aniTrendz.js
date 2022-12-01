import express from "express";
import { META } from "../../providers";
const router = express.Router();

import { capitalizeFirstLetter } from "../../utils";

let anitrendz = new META.AniTrendz();

router.get("/top", async (req, res) => {
  const reply = await anitrendz.Top();

  res.status(200).send(reply);
});

router.get("/characters", async (req, res) => {
  const { male } = req.query;

  const reply = await anitrendz.Characters(male);

  res.status(200).send(reply);
});

router.get("/couple", async (req, res) => {
  const reply = await anitrendz.Couple();

  res.status(200).send(reply);
});

// router.get("/music", async (req, res) => {
//   const reply = await anitrendz.MusicChart();

//   res.status(200).send(reply);
// });

router.get("/ost", async (req, res) => {
  const reply = await anitrendz.OstSongs();

  res.status(200).send(reply);
});

export default router;
