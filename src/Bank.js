import * as fs from "fs";
import { parse } from "csv-parse/sync";
import lodash from "lodash";

import { Table } from "console-table-printer";

import Account from "./Account.js";
import { formatBalance } from "./utils.js";
import Transaction from "./Transaction.js";

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
			throw `Account '${this.accounts[id].name}' already exists`;
		}

		this.accounts[id] = new Account(name);
	}

	getAccount(name) {
		const id = this.nameToId(name);

		if (!this.accounts.hasOwnProperty(id)) {
			throw `Account '${name}' does not exist`;
		}

		return this.accounts[id];
	}

	parseTransactions(path) {
		const data = fs.readFileSync(path);
		this.transactions = parse(data, {
			columns: true,
			skip_empty_lines: true
		}).map(transaction => new Transaction(transaction));

		const names = this.transactions
			.map(({ from }) => from)
			.concat(this.transactions.map(({ to }) => to));

		const uniqueNames = lodash.uniq(names);
		uniqueNames.forEach(name => this.createAccount(name));

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
