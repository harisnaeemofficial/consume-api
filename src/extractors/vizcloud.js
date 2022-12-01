import axios from "axios";

class VizCloud {
  serverName = "VizCloud";
  sources = [];

  host = "https://vidstream.pro";
  keys = {
    cipher: "",
    encrypt: "",
    main: "",
    operations: new Map(),
    pre: [],
    post: [],
  };

  extract = async (videoUrl, cipher, encrypt) => {
    const groups = new RegExp("(.+?/)e(?:mbed)?/([a-zA-Z0-9]+)").exec(
      videoUrl.href
    );

    this.keys = await this.fetchKeys();

    const id = encrypt(cipher(groups[2], this.keys.cipher), this.keys.encrypt);

    const encrypted = this.encrypt(
      this.dashify(this.encrypt(id, this.keys.pre, encrypt)),
      this.keys.post,
      encrypt
    );
    const url = `${groups[1]}${this.keys.main}/${encrypted}`;

    const { data } = await axios.get(url, {
      headers: {
        Referer: videoUrl.href,
      },
    });

    if (!data.data?.media) throw new Error("Video not found");

    // const file = data.data.media.sources.filter((s: any) => s.file.includes('simple'))[0];
    // const { data: fragments } = await axios.get(file.file);
    // for (const fragment of fragments.split('#EXT-X-STREAM-INF:')) {
    //   const url = fragment.split('\n')[1];
    //   if (url.includes('m3u8')) {
    //     this.sources.push({
    //       url: `${file.file.split('list.m3u8')[0]}${url}`,
    //       quality: url.includes('H1')
    //         ? '360p'
    //         : url.includes('H2')
    //         ? '480p'
    //         : url.includes('H3')
    //         ? '720p'
    //         : '1080p',
    //       isM3U8: true,
    //     });
    //   }
    // }
    data.data.media.sources = data.data.media.sources.filter(
      (s) => !s.file.includes("simple")
    );
    this.sources = [
      ...this.sources,
      ...data.data.media.sources.map((source) => ({
        url: source.file,
        isM3U8: source.file?.includes(".m3u8"),
      })),
    ];
    return this.sources;
  };

  encrypt = (query, steps, encrypt) => {
    let result = query;
    for (const step of steps) {
      switch (step) {
        case "o":
          result = encrypt(result, this.keys.encrypt)?.replace("/", "_");
          break;
        case "s":
          result = this.s(result);
          break;
        case "a":
          result = result?.split("").reverse().join("");
          break;
      }
    }
    return result;
  };

  s = (res) => {
    res = res
      .split("")
      .map((it) => {
        if (/[a-zA-Z]/gm.test(it)) {
          const a = it?.charCodeAt(0) <= 90 ? 90 : 122;
          const b = it?.charCodeAt(0) + 13;
          return String.fromCharCode(a >= b ? b : b - 26);
        }
        return it;
      })
      .join("");
    return res;
  };

  dashify = (input) => {
    const mapped = input
      .split("")
      .map((c, i) => {
        const operation = this.keys.operations
          .get((i % this.keys.operations.size).toString())
          ?.split(" ");
        const operand = parseInt(operation[1]);
        switch (operation[0]) {
          case "*":
            return c.charCodeAt(0) * operand;
          case "+":
            return c.charCodeAt(0) + operand;
          case "-":
            return c.charCodeAt(0) - operand;
          case "<<":
            return c.charCodeAt(0) << operand;
          case "^":
            return c.charCodeAt(0) ^ operand;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      })
      .join("-");
    return mapped;
  };

  fetchKeys = async () => {
    let { data } = await axios.get(
      "https://raw.githubusercontent.com/AnimeJeff/Overflow/main/syek"
    );
    data = JSON.parse(atob(atob(atob(data))));
    return {
      cipher: data.cipherKey,
      encrypt: data.encryptKey,
      main: data.mainKey,
      operations: new Map(Object.entries(data.operations)),
      post: data.post,
      pre: data.pre,
    };
  };
}

export default VizCloud;
