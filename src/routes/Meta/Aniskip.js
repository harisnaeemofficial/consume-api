import express from "express";
const router = express.Router();

import { META } from "../../providers/index.js";
import { capitalizeFirstLetter } from "../../utils";

let Aniskip = new META.AniSkip();

router.get(
  "/skip-times/:malId/:episodeNumber/:episodeLength",
  async (req, res) => {
    const { malId, episodeNumber, episodeLength } = req.params;

    if (!malId)
      return res.status(404).send({ error_message: "no malId specified" });

    if (!episodeNumber)
      return res
        .status(404)
        .send({ error_message: "no episodeNumber specified" });

    if (!episodeLength)
      return res
        .status(404)
        .send({ error_message: "no episodeLength specified" });

    const reply = await Aniskip.getSkipTime(
      malId,
      episodeNumber,
      episodeLength
    );

    res.status(200).send(reply);
  }
);

export default router;
