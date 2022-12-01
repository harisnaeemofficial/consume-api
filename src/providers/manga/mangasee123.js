import { api as axios } from "../../utils/api";
import { load } from "cheerio";
import { isText } from "domhandler";

class Mangasee123 {
  name = "MangaSee";
  baseUrl = "https://mangasee123.com";
  logo =
    "https://scontent.fman4-1.fna.fbcdn.net/v/t1.6435-1/80033336_1830005343810810_419412485691408384_n.png?stp=dst-png_p148x148&_nc_cat=104&ccb=1-7&_nc_sid=1eb0c7&_nc_ohc=XpeoABDI-sEAX-5hLFV&_nc_ht=scontent.fman4-1.fna&oh=00_AT9nIRz5vPiNqqzNpSg2bJymX22rZ1JumYTKBqg_cD0Alg&oe=6317290E";
  classPath = "MANGA.Mangasee123";

  Info = async (mangaId, ...args) => {
    const mangaInfo = {
      id: mangaId,
      title: "",
    };
    const url = `${this.baseUrl}/manga`;

    try {
      const { data } = await axios.get(`${url}/${mangaId}`);
      const $ = load(data);

      const schemaScript = $("body > script:nth-child(15)").get()[0]
        .children[0];
      if (isText(schemaScript)) {
        const mainEntity = JSON.parse(schemaScript.data)["mainEntity"];

        mangaInfo.title = mainEntity["name"];
        mangaInfo.altTitles = mainEntity["alternateName"];
        mangaInfo.genres = mainEntity["genre"];
      }

      mangaInfo.image = $("img.bottom-5").attr("src");
      mangaInfo.headerForImage = { Referer: this.baseUrl };
      mangaInfo.description = $(".top-5 .Content").text();

      const contentScript = $("body > script:nth-child(16)").get()[0]
        .children[0];
      if (isText(contentScript)) {
        const chaptersData = this.processScriptTagVariable(
          contentScript.data,
          "vm.Chapters = "
        );

        mangaInfo.chapters = chaptersData.map((i) => ({
          id: `${mangaId}-chapter-${this.processChapterNumber(i["Chapter"])}`,
          title: `${
            i["ChapterName"] ??
            `Chapter ${this.processChapterNumber(i["Chapter"])}`
          }`,
          releaseDate: i["Date"],
        }));
      }

      return mangaInfo;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  ChapterPages = async (chapterId, ...args) => {
    let images = [];
    const url = `${this.baseUrl}/read-online/${chapterId}-page-1.html`;

    try {
      const { data } = await axios.get(url);
      const $ = load(data);

      const chapterScript = $("body > script:nth-child(19)").get()[0]
        .children[0];
      if (isText(chapterScript)) {
        const curChapter = this.processScriptTagVariable(
          chapterScript.data,
          "vm.CurChapter = "
        );
        const imageHost = this.processScriptTagVariable(
          chapterScript.data,
          "vm.CurPathName = "
        );
        const curChapterLength = Number(curChapter["Page"]);

        for (let i = 0; i < curChapterLength; i++) {
          const chapter = this.processChapterForImageUrl(
            chapterId.replace(/[^0-9.]/g, "")
          );
          const page = `${i + 1}`.padStart(3, "0");
          const mangaId = chapterId.split("-chapter-", 1)[0];
          const imagePath = `https://${imageHost}/manga/${mangaId}/${chapter}-${page}.png`;

          images.push(imagePath);
        }
      }
      const pages = images.map((image, i) => ({
        page: i + 1,
        img: image,
        headerForImage: { Referer: this.baseUrl },
      }));

      return pages;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  Search = async (query, ...args) => {
    let matches = [];
    const sanitizedQuery = query.replace(/\s/g, "").toLowerCase();

    try {
      const { data } = await axios.get("https://mangasee123.com/_search.php");

      for (let i in data) {
        let sanitizedAlts = [];

        const item = data[i];
        const altTitles = data[i]["a"];

        switch (altTitles.length == 0) {
          // Has altTitles, search through them...
          case false:
            sanitizedAlts.map((alt) => {
              alt.replace(/\s/g, "").toLowerCase();
            });
            if (
              item["s"].toLowerCase().includes(sanitizedQuery) ||
              sanitizedAlts.includes(sanitizedQuery)
            )
              matches.push(item);
          // Does not have altTitles, ignore 'a' key:
          case true:
            if (
              item["s"]
                .replace(/\s/g, "")
                .toLowerCase()
                .includes(sanitizedQuery)
            )
              matches.push(item);
        }
      }

      const results = matches.map((val) => ({
        id: val["i"],
        title: val["s"],
        altTitles: val["a"],
        image: `https://temp.compsci88.com/cover/${val["i"]}.jpg`,
        headerForImage: { Referer: this.baseUrl },
      }));

      return { results: results };
    } catch (err) {
      throw new Error(err.message);
    }
  };

  processScriptTagVariable = (script, variable) => {
    const chopFront = script.substring(
      script.search(variable) + variable.length,
      script.length
    );
    const chapters = JSON.parse(chopFront.substring(0, chopFront.search(";")));

    return chapters;
  };

  // e.g. 102055 => [1]--[0205]--[5]
  //                 ?    chap   dec
  processChapterNumber = (chapter) => {
    const decimal = chapter.substring(chapter.length - 1, chapter.length);
    chapter = chapter.replace(chapter[0], "").slice(0, -1);
    if (decimal == "0") return `${+chapter}`;

    if (chapter.startsWith("0")) chapter = chapter.replace(chapter[0], "");

    return `${+chapter}.${decimal}`;
  };

  processChapterForImageUrl = (chapter) => {
    if (!chapter.includes(".")) return chapter.padStart(4, "0");

    const values = chapter.split(".");
    const pad = values[0].padStart(4, "0");

    return `${pad}.${values[1]}`;
  };
}

export default Mangasee123;
