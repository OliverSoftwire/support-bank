import * as fs from "fs";
import { parse } from "csv-parse/sync";
import lodash from "lodash";
import log4js from "log4js";

import { Table } from "console-table-printer";

import Account from "./Account.js";
import { formatBalance } from "./utils.js";
import Transaction from "./Transaction.js";

const logger = log4js.getLogger("Bank");

export default class Bank {
	constructor() {
		this.transactions = [];
		this.accounts = {};
	}

	nameToId(name) {
		return name.toLowerCase();
	}

	createAccount(name) {
		const id = this.nameToId(name);

		if (this.accounts.hasOwnProperty(id)) {
			logger.error(`Account '${this.accounts[id].name}' already exists`);
			throw `Account '${this.accounts[id].name}' already exists`;
		}

		this.accounts[id] = new Account(name);
	}

	getAccount(name) {
		const id = this.nameToId(name);

		if (!this.accounts.hasOwnProperty(id)) {
			logger.error(`Account '${name}' does not exist`);
			throw `Account '${name}' does not exist`;
		}

		return this.accounts[id];
	}

	parseTransactions(path) {
		logger.debug("Reading transactions file");
		const data = fs.readFileSync(path);

		logger.debug("Parsing transactions file");
		this.transactions = parse(data, {
			columns: true,
			skip_empty_lines: true
		}).map(transaction => new Transaction(transaction));

		logger.debug("Extracting unique names");
		const names = this.transactions
			.map(({ from }) => from)
			.concat(this.transactions.map(({ to }) => to));

		logger.debug("Creating accounts");
		lodash.uniq(names).forEach(name => this.createAccount(name));

		logger.debug("Processing transactions");
		this.transactions.forEach(transaction => {
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
