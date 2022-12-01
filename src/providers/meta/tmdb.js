import { api as axios } from "../../utils/api";

import { TvType } from "../../models";

import GogoAnime from "../anime";

class Tmdb {
  name = "Tmbd";
  baseUrl = "https://www.themoviedb.org/";
  logo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tmdb.new.logo.svg/1280px-Tmdb.new.logo.svg.png";
  classPath = "MOVIES.Tmbd";
  supportedTypes = new Set([TvType.MOVIE, TvType.TVSERIES, TvType.ANIME]);

  provider;

  constructor(provider) {
    this.provider = provider || new GogoAnime();
  }

  Search = async (query, page = 1) => {
    throw new Error("Method not implemented.");
  };

  Info = async (mediaId) => {
    throw new Error("Not implemented");
  };

  Source = async (id, ...args) => {
    return this.provider.Source(id, ...args);
  };

  Servers = async (episodeId, ...args) => {
    return this.provider.Servers(episodeId, ...args);
  };
}

export default Tmdb;
