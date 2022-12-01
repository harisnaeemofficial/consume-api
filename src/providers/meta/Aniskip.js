import axios from "axios";

class AniSkip {
  name = "AniSkip";
  classPath = "META.AniSkip";

  aniskipApi = "https://api.aniskip.com/v2";

  getSkipTime = async (malId, episodeNumber, episodeLength) => {
    const url = `${this.aniskipApi}/skip-times/${malId}/${episodeNumber}?types=ed&types=mixed-ed&types=mixed-op&types=op&types=recap&episodeLength=${episodeLength}`;
    const { data } = await axios.get(url).catch((err) => {
      return "No skip times found";
    });

    if (data?.found === false || !data?.results?.length)
      return "No skip times found";

    return data.results;
  };
}

export default AniSkip;
