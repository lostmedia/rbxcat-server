/*
    Filename: Logger.js
    Author: Hunter Webb <github.com/oh>
    Description: A simple logging module with drag and drop functionality.
    Date: 01/07/2024
 */

import chalk from 'chalk';
import * as fs from "fs";

const format = (level, message) => {
    let date = new Date()
    let date_time = date.toISOString()
        .replace("T", " ")
        .replace("Z", "");

    let formatted_message = `[${date_time}] [${level}] ${message}`;

    console.log(formatted_message);

    // Check if there is a directory named "logs", if not then create it
    if (!fs.existsSync("logs")) {
        fs.mkdirSync("logs");
    }

    // Get date in YYYY-MM-DD format
    let _date = date.toISOString().split("T")[0];

    // Check if there is a file in the logs directory with the date as the name
    if (!fs.existsSync("logs/" + _date + ".log")) {
        fs.writeFileSync("logs/" + _date + ".log", "");
    }

    // Append the formatted message to the file
    fs.appendFileSync("logs/" + _date + ".log", formatted_message.replaceAll(/\[..m/g, "") + "\n");
};

const logger = {
    error: (message) => format(chalk.red("ERROR"), message),
    success: (message) => format(chalk.green("SUCCESS"), message),
    info: (message) => format(chalk.blue("INFO"), message),
    warn: (message) => format(chalk.yellow("WARNING"), message),
    debug: (message) => format(chalk.cyan("DEBUG"), message),
    trace: (message) => format(chalk.grey("TRACE"), message),
    fatal: (message) => format(chalk.redBright("FATAL"), message)
};

export default logger;