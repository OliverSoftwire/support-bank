import * as fs from "fs";
import path from "path";

import lodash from "lodash";
import log4js from "log4js";
import moment from "moment";

import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

import { XMLParser } from "fast-xml-parser";

import { Table } from "console-table-printer";

import Account from "./Account.js";
import { formatBalance } from "./utils.js";
import { Transaction, TransactionFormat } from "./Transaction.js";
import { BankError } from "./Errors.js";

const logger = log4js.getLogger("src/Bank.js");
const xmlParser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "_"
});

function transactionFormatFromPath(filepath) {
	switch (path.extname(filepath)) {
		case ".json":
			return TransactionFormat.JSON;
		case ".xml":
			return TransactionFormat.XML;
		case ".csv":
			return TransactionFormat.CSV;
		default:
			logger.warn("Filepath has unknown extension, defaulting to CSV");
			return TransactionFormat.CSV;
	}
}

function fileExistsSafe(path) {
	try {
		return fs.existsSync(path);
	} catch (err) {
		logger.error(err.message);
		throw new BankError("Failed to get if file exists (check the log for details)");
	}
}

function readTransactionsFile(path) {
	if (!fileExistsSafe(path)) {
		throw new BankError(`File ${path} does not exist`);
	}

	try {
		return fs.readFileSync(path);
	} catch (err) {
		logger.error(err.message);
		throw new BankError("Failed to read transactions file (check the log for details)");
	}
}

function parseTransactionFile(data, format) {
	try {
		switch (format) {
			case TransactionFormat.CSV:
				return parse(data, {
					columns: true,
					skip_empty_lines: true
				});
			case TransactionFormat.JSON:
				return JSON.parse(data);
			case TransactionFormat.XML:
				return xmlParser.parse(data).TransactionList.SupportTransaction;
			default:
				logger.fatal("Invalid transaction file format");
				throw new Error("Invalid transaction file format");
		}
	} catch (err) {
		logger.error(err.message);
		throw new BankError("Failed to parse transactions file (check the log for details)");
	}
}

function stringifyTransactions(transactions) {
	try {
		return stringify(transactions, {
			header: true,
			columns: [
				{ key: "date", header: "Date" },
				{ key: "from", header: "From" },
				{ key: "to", header: "To" },
				{ key: "narrative", header: "Narrative" },
				{ key: "amount", header: "Amount" }
			],
			cast: {
				object: (value) => {
					if (!moment.isMoment(value)) {
						return value;
					}

					return value.format("DD/MM/YYYY");
				}
			}
		});
	} catch (err) {
		logger.error(err.message);
		throw new BankError("Failed to stringify transactions (check the log for details)");
	}
}

export default class Bank {
	constructor() {
		this.transactions = [];
		this.accounts = {};
	}

	nameToId(name) {
		return name.toLowerCase();
	}

	accountExists(name) {
		const id = this.nameToId(name);
		return this.accounts.hasOwnProperty(id);
	}

	createAccount(name) {
		if (this.accountExists(name)) {
			throw new BankError(`Account '${this.getAccount(name).name}' already exists`);
		}

		this.accounts[this.nameToId(name)] = new Account(name);
	}

	getAccount(name) {
		if (!this.accountExists(name)) {
			throw new BankError(`Account '${name}' does not exist`);
		}

		return this.accounts[this.nameToId(name)];
	}

	loadTransactions(filepath) {
		const format = transactionFormatFromPath(filepath);

		logger.info(`Reading transactions from ${filepath}`);
		const transactionFileData = readTransactionsFile(filepath);	

		logger.info("Parsing transactions file");
		const newTransactions = parseTransactionFile(transactionFileData, format).map(
			(transaction, index) => new Transaction(transaction, index, format)
		);

		this.transactions = this.transactions.concat(newTransactions);

		logger.info("Extracting unique names");
		const names = this.transactions
			.map(({ from }) => from)
			.concat(this.transactions.map(({ to }) => to));

		logger.info("Creating accounts");
		lodash.uniq(names).forEach(name => {
			if (!this.accountExists(name)) {
				this.createAccount(name);
			}
		});

		logger.info("Processing transactions");
		newTransactions.forEach(transaction => {
			this.getAccount(transaction.from).processTransaction(transaction);
			this.getAccount(transaction.to).processTransaction(transaction);
		});
	}

	saveTransactions(filepath) {
		logger.info(`Saving transactions to ${filepath}`);

		logger.info("Stringifying transactions");
		const csvString = stringifyTransactions(this.transactions);

		logger.info("Writing to file");
		try {
			fs.writeFileSync(filepath, csvString);
		} catch (err) {
			logger.error(err.message);
			throw new BankError("Failed to write file (check the log for details)");
		}
	}

	toString() {
		const table = new Table({
			title: "Accounts Summary",
			enabledColumns: ["name", "balance-coloured"],
			columns: [
				{ name: "name", alignment: "right" , title: "Name"}
			],
			sort: (row1, row2) => row1.name.localeCompare(row2.name),
			computedColumns: [
				{
					name: "balance-coloured",
					title: "Balance",
					function: (row) => formatBalance(row.balance),
					alignment: "left"
				}
			]
		});

		table.addRows(Object.values(this.accounts).map(account => lodash.clone(account)));
		return table.render();
	}
}
