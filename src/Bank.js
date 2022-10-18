import * as fs from "fs";
import { parse } from "csv-parse/sync";
import lodash from "lodash";
import log4js from "log4js";

import { Table } from "console-table-printer";

import Account from "./Account.js";
import { formatBalance } from "./utils.js";
import Transaction from "./Transaction.js";
import { BankError } from "./Errors.js";

const logger = log4js.getLogger("src/Bank.js");

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

	parseTransactions(path) {
		logger.debug("Reading transactions file");

		let data;
		try {
			data = fs.readFileSync(path);
		} catch (err) {
			logger.error(err.message);
			throw new BankError("Failed to read transactions file (check the log for details)");
		}

		logger.debug("Parsing transactions file");
		let newTransactions;
		try {
			newTransactions = parse(data, {
				columns: true,
				skip_empty_lines: true
			})
		} catch (err) {
			logger.error(err.message);
			throw new BankError("Failed to parse transactions file (check the log for details)");
		}

		logger.debug("Creating transactions");
		newTransactions = newTransactions.map((transaction, index) => new Transaction(transaction, index));
		this.transactions = this.transactions.concat(newTransactions);

		logger.debug("Extracting unique names");
		const names = this.transactions
			.map(({ from }) => from)
			.concat(this.transactions.map(({ to }) => to));

		logger.debug("Creating accounts");
		lodash.uniq(names).forEach(name => {
			if (!this.accountExists(name)) {
				this.createAccount(name);
			}
		});

		logger.debug("Processing transactions");
		newTransactions.forEach(transaction => {
			this.getAccount(transaction.from).processTransaction(transaction);
			this.getAccount(transaction.to).processTransaction(transaction);
		});
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

		table.addRows(Object.values(this.accounts));
		return table.render();
	}
}
