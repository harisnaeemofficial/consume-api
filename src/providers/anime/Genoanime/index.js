import { api as axios } from "../../../utils/api.js";
import FormData from "form-data";
import { load } from "cheerio";

import * as constants from "./helpers/constants.js";

class Genoanime {
  Popular = async ({ list = [], page = 1 }) => {
    const { data } = await axios.get(
      `${constants.BaseURL}/browse?sort=top_rated&page=${page}`
    );

    const $ = load(data);

    const pList = $(
      "div.trending__product div.col-lg-10 div.row div.col-lg-3.col-6"
    );

    // console.log(pList);

    pList.each((i, res) => {
      const $res = load(res);
      const title = $res("div.product__item__text h5 a:nth-of-type(2)")
        .first()
        .text();

      const typesub = title.toLowerCase().includes("dub") ? "dub" : "sub";
      list.push({
        id: parseFloat(
          $res("div.product__item a").attr("href").split("/").pop()
        ),
        url:
          constants.BaseURL +
          "/" +
          $res("div.product__item a")
            .attr("href")
            .split("../")
            .splice(1)
            .join(""),
        title,
        img: $res("div.product__item__pic").attr("data-setbg"),
        typesub,
      });
    });

    return list;
  };

  Search = async ({ list = [], keyw }) => {
    if (!keyw) return { error: true };
    const form = new FormData();
    form.append("anime", keyw);

    const { data } = await axios.request({
      url: `${constants.BaseURL}/data/searchdata.php`,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: new URLSearchParams({ anime: keyw }),
    });

    const $ = load(data);

    const sList = $("div.col-lg-3");

    sList.each((i, res) => {
      const $res = load(res);
      const title = $res("div.product__item__text h5 a:nth-of-type(2)").text();

      const typesub = title.toLowerCase().includes("dub") ? "dub" : "sub";
      list.push({
        id: parseFloat($res("a").attr("href").split("?id=").splice(1)[0]),
        url:
          constants.BaseURL +
          "/" +
          $res("a").attr("href").split("./").splice(1).join(""),
        title,
        img:
          constants.BaseURL +
          "/" +
          $res("div.product__item div.product__item__pic.set-bg")
            .attr("data-setbg")
            .split("./")
            .splice(1)
            .join(""),
        typesub,
      });
    });

    return list;
  };

  Info = async ({ list = [], animeId }) => {
    if (!animeId)
      return {
        error: "No episode ID provided",
      };
    const { data } = await axios.get(`${constants.BaseURL}/browse/${animeId}`);

    if (!data) return { error: "no data found" };

    const $ = load(data);

    const animeImg = $("div.anime__details__pic").data("setbg");
    const animeTitle = $("div.anime__details__title h3").text();
    const animeDescription = $("div.anime__details__text > p").text();
    const WatchURL =
      constants.BaseURL +
      "/" +
      $("div.anime__details__content div.anime__details__btn a.watch-btn")
        .attr("href")
        .split("../")
        .splice(1)
        .join();
    const animeGenres = $(
      "div.col-lg-6.col-md-6:nth-of-type(1) ul li:nth-of-type(3)"
    )
      .map(function () {
        return $(this).text();
      })
      .get()
      .join(", ")
      .replace("Genre: ", "");
    const TotalEpisodes = $(
      "div.anime__details__widget ul#episode-section li:contains(Episodes:)"
    )
      .text()
      .split("Episodes: ")
      .splice(1)
      .join();
    const animeType = $("div.anime__details__widget ul li:contains(Type:)")
      .text()
      .split("Type: ")
      .splice(1)
      .join();

    const EpArray = [];
    const eList = $("div.anime__details__episodes div.tab-pane a");
    eList.each((i, res) => {
      const $res = $(res);

      const EpisodeId = $res.attr("href").split("/").pop();
      const EpisodeURL =
        constants.BaseURL +
        "/" +
        $res.attr("href").split("../").splice(1).join();
      const EpisodeTitle = $res.text();
      const EpisodeNumber = $res.text().split("Ep ").splice(1).join("");

      EpArray.push({
        episodeId: EpisodeId,
        url: EpisodeURL,
        title: EpisodeTitle,
        episode: EpisodeNumber,
      });
    });

    list = {
      url: WatchURL,
      type: animeType,
      animeTitle,
      img: animeImg,
      genres: animeGenres,
      synopsis: animeDescription,
      total_episodes: parseFloat(TotalEpisodes),
      episodes: EpArray,
    };

    return list;
  };
}

export default Genoanime;
