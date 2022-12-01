import axiosCache from "axios-cache-adapter";
const { setup, RedisStore } = axiosCache;
import redis from "redis";

const client = redis.createClient({
  url: "redis://default:HuENOL0ny457ZfrCvnk8IUIf28DFoQNb@redis-14928.c3.eu-west-1-1.ec2.cloud.redislabs.com:14928",
});
const store = new RedisStore(client);

const cache = {
  exclude: {
    methods: [],
    query: false,
  },
  readOnError: (error) => {
    return error?.response?.status >= 400 && error?.response?.status < 600;
  },
  limit: 10000 * 5,
  clearOnStale: false,
  maxAge: 1000 * 60 * 60 * 24 * 2,
  store,
};

export const api = setup({
  timeout: 10000 * 6,
  cache: {
    ...cache,
    maxAge: 1000 * 60 * 60 * 2,
  },
});
