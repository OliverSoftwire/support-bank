import * as fs from "fs";
import { parse } from "csv-parse/sync";
import lodash from "lodash";
import moment from "moment";

import { Table } from "console-table-printer";

import Account from "./Account.js";
import { formatBalance } from "./utils.js";

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
			skip_empty_lines: true,
			cast: true
		});

		const names = this.transactions
			.map(({ From }) => From)
			.concat(this.transactions.map(({ To }) => To));

		const uniqueNames = lodash.uniq(names);
		uniqueNames.forEach(name => this.createAccount(name));

		this.transactions.forEach(transaction => {
			transaction.Date = moment(transaction.Date, "DD/MM/YYYY");
			console.log(transaction.Date);
			this.getAccount(transaction.From).processTransaction(transaction);
			this.getAccount(transaction.To).processTransaction(transaction);
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
