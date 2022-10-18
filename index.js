import readlineSync from "readline-sync";
import log4js from "log4js";

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
bank.parseTransactions("DodgyTransactions2015.csv");

console.log("Welcome to Support Bank");
console.log("Use 'help' to see available commands");

readlineSync.promptCLLoop({
	help: () => {
		console.log("list      - Lists transactions for a user, or a summary of all accounts if 'all' is passed");
		console.log("exit|quit - exit the prompt");
	},
	exit: () => true,
	quit: () => true,
	list: (firstName, lastName) => {
		if (!firstName) {
			console.log("list takes at least one argument");
			return;
		}

		if (firstName.toLowerCase() === "all") {
			console.log(bank.toString());
			return;
		}

		if (!lastName) {
			console.log("First argument was not all and no last name given");
		}

		const account = bank.getAccount(`${firstName} ${lastName}`);
		console.log(account.toString());
	}
});
