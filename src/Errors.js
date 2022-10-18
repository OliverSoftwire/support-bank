import log4js from "log4js";

const logger = log4js.getLogger("src/Errors.js");

export class TransactionError extends Error {
	constructor({ index, from, to }, message) {
		super(message);

		this.index = index;
		this.from = from;
		this.to = to;

		logger.error(this.toString());
	}

	toString() {
		return `Transaction ${this.index} (${this.from} -> ${this.to}): ${this.message}`;
	}
}

export class AccountError extends Error {
	constructor({ name }, message) {
		super(message);

		this.name = name;

		logger.error(this.toString());
	}

	toString() {
		return `Account ${this.name}: ${this.message}`;
	}
}

export class BankError extends Error {
	constructor(message) {
		super(message);

		logger.error(this.toString());
	}
}
