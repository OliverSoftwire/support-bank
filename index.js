import fs from "fs";
import path from "path";

import readlineSync from "readline-sync";
import log4js from "log4js";
import moment from "moment";

import Bank from "./src/Bank.js";
import { isFile } from "./src/utils.js";
import { Transaction } from "./src/Transaction.js";

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
		console.log("exit|quit - exit the prompt");
		console.log("load      - Loads transactions from a file (supports csv, json and xml)");
		console.log("save      - Saves all loaded transactions to a file (csv only)")
		console.log("list      - Lists transactions for a user, or a summary of all accounts if 'all' is passed");
		console.log("add       - Adds a new transaction (accounts that do not exist will be created)");
		console.log("    Usage: add <YYYY-MM-DD|today> <from> <to> <amount> [reference]");
		console.log("    Example: add 2022-10-01 \"Alice A\" \"Bob B\" 15.99 \"Phone Charger\"");
	},
	exit: () => true,
	quit: () => true,
	list: (...args) => {
		if (!args[0]) {
			console.log("list takes at least one argument");
			return;
		}

		if (args[0].toLowerCase() === "all" && args.length === 1) {
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

		console.log(`Loading transactions from ${path.resolve(filepath)}...`);

		try {
			bank.loadTransactions(filepath);
		} catch (err) {
			logger.error(err);
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
			logger.error(err);
			console.log("An error occured while saving transactions:");
			console.log("    " + err.message);
		}
	},
	add: (date, from, to, amount, reference = "") => {
		if (!date) {
			console.log("No date specified");
			return;
		}

		if (!from) {
			console.log("No origin account specified");
			return;
		}

		if (!to) {
			console.log("No destination account specified");
			return;
		}

		if (!amount) {
			console.log("No amount specified");
			return;
		}

		date = date === "today" ? moment() : moment(date, "YYYY-MM-DD");
		if (date.isAfter()) {
			console.log("Cannot create a transaction in the future");
			return;
		}

		try {
			bank.addTransaction(new Transaction(date, from, to, reference, amount));
		} catch (err) {
			logger.error(err);
			console.log("An error occured while adding the transaction:");
			console.log("    " + err.message);
		}
	}
});
