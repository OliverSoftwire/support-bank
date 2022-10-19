import log4js from "log4js";

const logger = log4js.getLogger("src/Errors.js");

export class TransactionError extends Error {
	constructor({ from, to }, message) {
		super(message);

		this.from = from;
		this.to = to;
	}

	toString() {
		return `Transaction ${this.from} -> ${this.to}: ${this.message}`;
	}
}

export class AccountError extends Error {
	constructor({ name }, message) {
		super(message);

		this.name = name;
	}

	toString() {
		return `Account ${this.name}: ${this.message}`;
	}
}

export class BankError extends Error {
	constructor(message) {
		super(message);
	}
}
