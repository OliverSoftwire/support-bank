import readlineSync from "readline-sync";
import log4js from "log4js";
import path from "path";

import Bank from "./src/Bank.js";

log4js.configure({
	appenders: {
		file: { type: "fileSync", filename: "logs/debug.log" }
	},
	categories: {
		default: { appenders: ["file"], level: "debug" }
	}
});

const logger = log4js.getLogger("Main");
logger.info("Support Bank started");

const bank = new Bank();

console.log("Welcome to Support Bank");
console.log("Use 'help' to see available commands");

readlineSync.promptCLLoop({
	help: () => {
		console.log("load      - Loads transactions from a file (supports csv)");
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

		console.log(`Loading transactions from ${path.resolve(filepath)}...`);

		try {
			bank.parseTransactions(filepath);
		} catch (err) {
			console.log("An error occured while loading the transactions file:");
			console.log("    " + err.message);
		}
	}
});
