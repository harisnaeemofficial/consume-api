import chalk from "chalk";
import moment from "moment";

export const Logger = (req, res, next, cache) => {
  let time = moment().format("HH:mm:ss");

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const realIP = ip === "::1" ? "127.0.0.1" : ip;
  const values = Object.entries(req.query);
  const valuesMap = `QUIRES - [${values
    .map((value) => `${value[0]}: ${value[1]}`)
    .join(", ")}]`;
  const body = Object.entries(req.body);
  const bodyMap = `BODY - [${body
    .map((value) => `${value[0]}: ${value[1]}`)
    .join(", ")}]`;

  console.log(`\n`);
  console.log(chalk.bold.cyanBright(`REQUEST URL ${req.path}`));
  console.log(chalk.bold.yellowBright(`REQUEST FROM ${realIP}`));
  console.log(chalk.bold.greenBright(`REQUEST AT ${time}`));
  if (values.length > 0) console.log(chalk.bold.magentaBright(valuesMap));
  if (body.length > 0) console.log(chalk.bold.magentaBright(bodyMap));
  console.log(`\n`);

  next(); // Passing the request to the next handler in the stack.;
};
