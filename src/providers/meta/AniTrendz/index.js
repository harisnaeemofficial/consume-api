import { api as axios } from "../../../utils/api.js";
import { load } from "cheerio";

import * as constants from "./constants.js";

class AniTrendz {
  name = "AniTrendz";
  baseUrl = constants.BaseUrl;
  logo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tmdb.new.logo.svg/1280px-Tmdb.new.logo.svg.png";
  classPath = "MOVIES.AniTrendz";

  Scrape = async (url, week) => {
    const res = {
      week: "",
      previousWeek: "",
      date: "",
      results: [],
    };

    try {
      const { data } = await axios.get(url);

      const $ = load(data);

      const listAnime = $(".at-mcc-entry");

      const currentWeek = $("div.at-cth-b-week-no").first().text().trim();
      const previousWeek = $("div.prev-page > a")
        .first()
        .attr("href")
        .split("/")
        .pop()
        .trim();
      const currentDate = $("div.at-cth-b-date").first().text().trim();
      res.week = currentWeek;
      res.previousWeek = previousWeek;
      res.date = currentDate;

      listAnime.each((i, el) => {
        let previously = $(el)
          .find(
            "div.at-mcc-e-movement > div.stats > div.prev.stats-entry > span"
          )
          .text()
          .trim();
        previously = previously === "-" ? "-" : +previously;

        res.results.push({
          title: $(el)
            .find("div.at-mcc-e-details > div.entry-title")
            .text()
            .trim(),
          image: $(el)
            .find("div.at-mcc-e-details > div.at-mcc-e-thumbnail > img")
            .attr("src"),
          studio: $(el)
            .find("div.at-mcc-e-details > div.entry-detail")
            .text()
            .trim(),
          rank: +$(el)
            .find("div.main-rank")
            .text()
            .trim()
            .replaceAll(" Vote", ""),
          stats: {
            peak: +$(el)
              .find("div.stats > div.peak.stats-entry > span")
              .text()
              .trim(),
            previously,
            weeksOnTop: +$(el)
              .find(
                "div.at-mcc-e-movement > div.stats > div.weeks.stats-entry > span"
              )
              .text()
              .trim(),
            status: $(el)
              .find("div.at-mcc-e-movement > div.arrow-container > img")
              .attr("alt")
              .replaceAll("arrow", "")
              .replaceAll("-", " ")
              .trim(),
            stat: $(el)
              .find("div.at-mcc-e-movement > div.arrow-number")
              .text()
              .trim(),
          },
        });
      });

      return res;
    } catch (err) {
      throw err;
    }
  };

  Top = async (week) => {
    return await this.Scrape(constants.URL_TOP_ANIME);
  };

  OstSongs = async (week) => {
    const res = {
      week: "",
      previousWeek: "",
      date: "",
      results: [],
    };

    try {
      const { data } = await axios.get(constants.URL_OPENING_SONG);

      const $ = load(data);

      const listAnime = $(".at-mcc-entry");

      const currentWeek = $("div.at-cth-b-week-no").first().text().trim();
      const previousWeek = $("div.prev-page > a")
        .first()
        .attr("href")
        .split("/")
        .pop()
        .trim();
      const currentDate = $("div.at-cth-b-date").first().text().trim();
      res.week = currentWeek;
      res.previousWeek = previousWeek;
      res.date = currentDate;

      listAnime.each((i, el) => {
        let previously = $(el)
          .find(
            "div.at-mcc-e-movement > div.stats > div.prev.stats-entry > span"
          )
          .text()
          .trim();
        previously = previously === "-" ? "-" : +previously;

        res.results.push({
          title: $(el)
            .find("div.at-mcc-e-details > div.entry-title")
            .text()
            .trim()
            .split(" x "),
          image: $(el)
            .find("div.at-mcc-e-details > div.at-mcc-e-thumbnail > img")
            .attr("src"),
          artists: $(el)
            .find("div.at-mcc-e-details > div.entry-detail")
            .text()
            .trim()
            .split(", "),
          rank: +$(el)
            .find("div.main-rank")
            .text()
            .trim()
            .replaceAll(" Vote", ""),
          stats: {
            peak: +$(el)
              .find("div.stats > div.peak.stats-entry > span")
              .text()
              .trim(),
            previously,
            weeksOnTop: +$(el)
              .find(
                "div.at-mcc-e-movement > div.stats > div.weeks.stats-entry > span"
              )
              .text()
              .trim(),
            status: $(el)
              .find("div.at-mcc-e-movement > div.arrow-container > img")
              .attr("alt")
              .replaceAll("arrow", "")
              .replaceAll("-", " ")
              .trim(),
            stat: $(el)
              .find("div.at-mcc-e-movement > div.arrow-number")
              .text()
              .trim(),
          },
        });
      });

      return res;
    } catch (err) {
      throw err;
    }
  };

  MusicChart = async () => {
    const res = {
      results: [],
    };

    try {
      const { data } = await axios.get(constants.URL_MUSIC_CHART);

      const $ = load(data);

      console.log($);

      const listSongs = $(".at-shuffle-feature-details");

      listSongs.each((i, el) => {
        console.log(i);
        const urlYoutube = $(el)
          .find(".sse-top > .sse-mv-pop.sse-e > .youtube-pop.sse-pop")
          .data("url");
        const urlSpotify = $(el)
          .find(".sse-top > .sse-mv-pop.sse-e > .spotify-pop.sse-pop")
          .data("url");
        const urlItunes = $(el)
          .find(".sse-top > .sse-mv-pop.sse-e > .itunes-pop.sse-pop > a")
          .attr("href");
        let previously = $(el)
          .find(
            "div.sse-bottom > div > div.sse-prev.sse-stat-e.col-sm-4 > div.sse-stat-no"
          )
          .text()
          .trim();
        previously = previously === "-" ? "-" : +previously;

        res.results.push({
          title: $(el)
            .find(".sse-top > .sse-details.sse-e > .sse-title")
            .text()
            .trim(),
          artists: $(el)
            .find(".sse-top > .sse-details.sse-e > .sse-artist")
            .text()
            .trim()
            .split(", "),
          image: $(el)
            .find("div.sse-top > div.sse-thumbnail.sse-e > img")
            .attr("src"),
          rank: i + 1,
          media: {
            youtube:
              urlYoutube !== undefined
                ? `https://www.youtube.com/watch?v=${urlYoutube}`
                : undefined,
            spotify:
              urlSpotify !== undefined
                ? `https://open.spotify.com/track/${urlSpotify}`
                : undefined,
            itunes: urlItunes !== undefined ? urlItunes : undefined,
          },
          stats: {
            peak: +$(el)
              .find(
                "div.sse-bottom > div > div.sse-peak.sse-stat-e.col-sm-4 > div.sse-stat-no"
              )
              .text()
              .trim(),
            previously,
            weeks: +$(el)
              .find(
                "div.sse-bottom > div > div.sse-week.sse-stat-e.col-sm-4 > div.sse-stat-no"
              )
              .text()
              .trim(),
          },
        });
      });

      return res;
    } catch (err) {
      throw err;
    }
  };

  Characters = async (male = true, week) => {
    const FemaleURL = constants.URL_FEMALE_CHARACTERS,
      MaleURL = constants.URL_MALE_CHARACTERS;

    const res = {
      week: "",
      previousWeek: "",
      date: "",
      results: [],
    };

    try {
      const { data } = await axios.get(male == true ? MaleURL : FemaleURL);

      const $ = load(data);

      const listAnime = $(".at-mcc-entry");

      const currentWeek = $("div.at-cth-b-week-no").first().text().trim();
      const previousWeek = $("div.prev-page > a")
        .first()
        .attr("href")
        .split("/")
        .pop()
        .trim();
      const currentDate = $("div.at-cth-b-date").first().text().trim();
      res.week = currentWeek;
      res.previousWeek = previousWeek;
      res.date = currentDate;

      listAnime.each((i, el) => {
        let previously = $(el)
          .find(
            "div.at-mcc-e-movement > div.stats > div.prev.stats-entry > span"
          )
          .text()
          .trim();
        previously = previously === "-" ? "-" : +previously;

        res.results.push({
          name: $(el)
            .find("div.at-mcc-e-details > div.entry-title")
            .text()
            .trim(),
          image: $(el)
            .find("div.at-mcc-e-details > div.at-mcc-e-thumbnail > img")
            .attr("src"),
          anime: $(el)
            .find("div.at-mcc-e-details > div.entry-detail")
            .text()
            .trim(),
          rank: +$(el)
            .find("div.main-rank")
            .text()
            .trim()
            .replaceAll(" Vote", ""),
          stats: {
            peak: +$(el)
              .find("div.stats > div.peak.stats-entry > span")
              .text()
              .trim(),
            previously,
            weeksOnTop: +$(el)
              .find(
                "div.at-mcc-e-movement > div.stats > div.weeks.stats-entry > span"
              )
              .text()
              .trim(),
            status: $(el)
              .find("div.at-mcc-e-movement > div.arrow-container > img")
              .attr("alt")
              .replaceAll("arrow", "")
              .replaceAll("-", " ")
              .trim(),
            stat: $(el)
              .find("div.at-mcc-e-movement > div.arrow-number")
              .text()
              .trim(),
          },
        });
      });

      return res;
    } catch (err) {
      throw err;
    }
  };

  Couple = async () => {
    const res = {
      week: "",
      previousWeek: "",
      date: "",
      results: [],
    };

    try {
      const { data } = await axios.get(constants.URL_COUPLE_SHIP);

      const $ = load(data);

      const listAnime = $(".at-mcc-entry");

      const currentWeek = $("div.at-cth-b-week-no").first().text().trim();
      const previousWeek = $("div.prev-page > a")
        .first()
        .attr("href")
        .split("/")
        .pop()
        .trim();
      const currentDate = $("div.at-cth-b-date").first().text().trim();
      res.week = currentWeek;
      res.previousWeek = previousWeek;
      res.date = currentDate;

      listAnime.each((i, el) => {
        let previously = $(el)
          .find(
            "div.at-mcc-e-movement > div.stats > div.prev.stats-entry > span"
          )
          .text()
          .trim();
        previously = previously === "-" ? "-" : +previously;

        res.results.push({
          names: $(el)
            .find("div.at-mcc-e-details > div.entry-title")
            .text()
            .trim()
            .split(" x "),
          couplesImages: {
            personOne: $(el)
              .find(
                "div.at-mcc-e-details > div.at-mcc-e-thumbnail:nth-child(1) > img"
              )
              .attr("src"),
            personTwo: $(el)
              .find(
                "div.at-mcc-e-details > div.at-mcc-e-thumbnail:nth-child(2) > img"
              )
              .attr("src"),
          },
          anime: $(el)
            .find("div.at-mcc-e-details > div.entry-detail")
            .text()
            .trim(),
          rank: +$(el)
            .find("div.main-rank")
            .text()
            .trim()
            .replaceAll(" Vote", ""),
          stats: {
            peak: +$(el)
              .find("div.stats > div.peak.stats-entry > span")
              .text()
              .trim(),
            previously,
            weeksOnTop: +$(el)
              .find(
                "div.at-mcc-e-movement > div.stats > div.weeks.stats-entry > span"
              )
              .text()
              .trim(),
            status: $(el)
              .find("div.at-mcc-e-movement > div.arrow-container > img")
              .attr("alt")
              .replaceAll("arrow", "")
              .replaceAll("-", " ")
              .trim(),
            stat: $(el)
              .find("div.at-mcc-e-movement > div.arrow-number")
              .text()
              .trim(),
          },
        });
      });

      return res;
    } catch (err) {
      throw err;
    }
  };
}

export default AniTrendz;
