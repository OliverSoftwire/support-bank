import fs from "fs";
import path from "path";

import lodash from "lodash";
import log4js from "log4js";

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

function readTransactionsFile(path) {
	try {
		return fs.readFileSync(path);
	} catch (err) {
		throw new BankError(err.message);
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
		logger.error(err);
		throw new BankError("Failed to parse transactions file (check the log for details)");
	}
}

function stringifyTransactions(transactions) {
	try {
		return stringify(
			transactions.map(({ date, from, to, narrative, amount }) => ({
				Date: date.format("DD/MM/YYYY"),
				From: from,
				To: to,
				Narrative: narrative,
				Amount: amount.toString()
			})),
			{
				header: true
			}
		);
	} catch (err) {
		logger.error(err);
		throw new BankError("Failed to stringify transactions (check the log for details)");
	}
}

export default class Bank {
	constructor() {
		this.transactions = [];
		this.accounts = {};
	}

	accountExists(name) {
		return this.accounts.hasOwnProperty(name);
	}

	createAccount(name) {
		if (this.accountExists(name)) {
			throw new BankError(`Account '${this.getAccount(name).name}' already exists`);
		}

		return this.accounts[name] = new Account(name);
	}

	getAccount(name) {
		if (!this.accountExists(name)) {
			throw new BankError(`Account '${name}' does not exist`);
		}

		return this.accounts[name];
	}

	addTransaction(transaction) {
		logger.debug("Adding transaction");

		const from = this.accountExists(transaction.from) ? this.getAccount(transaction.from) : this.createAccount(transaction.from);
		const to   = this.accountExists(transaction.to)   ? this.getAccount(transaction.to)   : this.createAccount(transaction.to);

		from.processTransaction(transaction);
		to.processTransaction(transaction);

		this.transactions.push(transaction);
	}

	loadTransactions(filepath) {
		const format = transactionFormatFromPath(filepath);

		logger.info(`Reading transactions from ${filepath}`);
		const transactionFileData = readTransactionsFile(filepath);	

		logger.info("Parsing transactions file");
		const newTransactions = parseTransactionFile(transactionFileData, format).map(
			transaction => Transaction.fromData(transaction, format)
		);

		logger.info("Processing transactions");
		newTransactions.forEach(transaction => this.addTransaction(transaction));
	}

	saveTransactions(filepath) {
		logger.info(`Saving transactions to ${filepath}`);

		logger.info("Stringifying transactions");
		const csvString = stringifyTransactions(this.transactions);

		logger.info("Writing to file");
		try {
			fs.writeFileSync(filepath, csvString);
		} catch (err) {
			logger.error(err);
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
