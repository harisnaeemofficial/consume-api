import { api as axios } from "../../../utils/api.js";
import { load } from "cheerio";

class KickAssAnime {
  name = "KickAssAnime";
  baseUrl = "https://www2.kickassanime.ro";
  logo =
    "https://user-images.githubusercontent.com/65111632/95666535-4f6dba80-0ba6-11eb-8583-e3a2074590e9.png";
  classPath = "ANIME.KickAssAnime";

  Search = async (query) => {
    throw new Error("Method not implemented.");
  };

  Info = async (id) => {
    throw new Error("Method not implemented.");
  };

  Sources = async (episodeId) => {
    throw new Error("Method not implemented.");
  };

  Servers = (episodeId) => {
    throw new Error("Method not implemented.");
  };
}

export default KickAssAnime;
