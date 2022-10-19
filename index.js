import fs from "fs";
import path from "path";

import readlineSync from "readline-sync";
import log4js from "log4js";

import Bank from "./src/Bank.js";
import { isFile } from "./src/utils.js";

log4js.configure({
	appenders: {
		default: {
			type: "fileSync",
			filename: "logs/debug.log"
		},
		info_file: {
			type: "fileSync",
			filename: "logs/info.log"
		},
		info: {
			type: "logLevelFilter",
			level: "info",
			appender: "info_file"
		}
	},
	categories: {
		default: {
			appenders: ["default", "info"],
			level: "all"
		}
	}
});

const logger = log4js.getLogger("Main");
logger.info("Support Bank started");

const bank = new Bank();

console.log("Welcome to Support Bank");
console.log("Use 'help' to see available commands");

readlineSync.promptCLLoop({
	help: () => {
		console.log("load      - Loads transactions from a file (supports csv, json and xml)");
		console.log("save      - Saves all loaded transactions to a file (csv only)")
		console.log("list      - Lists transactions for a user, or a summary of all accounts if 'all' is passed");
		console.log("exit|quit - exit the prompt");
	},
	exit: () => true,
	quit: () => true,
	list: (...args) => {
		if (!args[0]) {
			console.log("list takes at least one argument");
			return;
		}

		if (args[0].toLowerCase() === "all") {
			console.log(bank.toString());
			return;
		}

		const name = args.join(" ");
		if (!bank.accountExists(name)) {
			console.log(`Account '${name}' does not exist`);
			return;
		}

		console.log(bank.getAccount(name).toString());
	},
	load: (filepath) => {
		if (!filepath) {
			console.log("No file was specified");
			return;
		}

		if (!isFile(filepath)) {
			console.log("Specified path is not a file");
			return;
		}

		console.log(`Loading transactions from ${path.resolve(filepath)}...`);

		try {
			bank.loadTransactions(filepath);
		} catch (err) {
			console.log("An error occured while loading the transactions file:");
			console.log("    " + err.message);
		}
	},
	save: (filepath) => {
		if (!filepath) {
			console.log("No file was specified");
			return;
		}

		if (fs.existsSync(filepath)) {
			if (!isFile(filepath)) {
				console.log("Cannot overwrite path, target is not a file");
				return;
			}

			if (!readlineSync.keyInYNStrict("File already exists, do you want to overwrite?")) {
				return;
			}
		}

		console.log(`Saving transactions to ${path.resolve(filepath)}...`);

		try {
			bank.saveTransactions(filepath);
		} catch (err) {
			console.log("An error occured while saving transactions:");
			console.log("    " + err.message);
		}
	}
});
