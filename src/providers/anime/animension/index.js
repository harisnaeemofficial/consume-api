import { api as axios } from "../../../utils/api.js";
import { load } from "cheerio";

class Animension {
  name = "Animension";
  baseUrl = "https://animension.to";
  logo = "https://enime.moe/favicon.ico";
  classPath = "ANIME.Enime";

  apiUrl = "https://animension.to/public-api";

  Search = async (query, page = 1) => {
    const searchResult = {
      currentPage: page,
      hasNextPage: false,
      results: [],
    };

    try {
      const { data } = await axios.get(
        `${this.apiUrl}/search.php?search_text=${query}&page=${page}`
      );

      searchResult.hasNextPage = data.length >= 25;

      data.forEach((res, i) => {
        searchResult.results.push({
          title: res[0],
          id: res[1],
          url: `${this.baseUrl}/${res[1]}`,
          image: res[2],
          isDub: res[3] === 1,
        });
      });

      return searchResult;
    } catch (err) {
      throw err;
    }
  };
}

export default Animension;
