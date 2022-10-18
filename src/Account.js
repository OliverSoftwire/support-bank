import { Table } from "console-table-printer";
import chalk from "chalk";
import { formatBalance, formatCurrency } from "./utils.js";

export default class Account {
	constructor(name) {
		this.name = name;
		this.balance = 0;
		this.transactions = [];
	}

	processTransaction(transaction) {
		if (transaction.from === this.name) {
			this.balance -= transaction.amount;
			this.transactions.push(transaction);
			return;
		}

		if (transaction.to === this.name) {
			this.balance += transaction.amount;
			this.transactions.push(transaction);
			return;
		}

		throw "Invalid transaction, account is neither sender nor receiver";
	}

	toString() {
		const table = new Table({
			title: `${this.name} | Balance: ${formatBalance(this.balance)}`,
			enabledColumns: ["date-formatted", "Payee", "Reference", "Debit", "Credit"],
			sort: (row1, row2) => row1.date.valueOf() - row2.date.valueOf(),
			computedColumns: [
				{
					name: "date-formatted",
					title: "Date",
					function: (row) => row.date.format("YYYY-MM-DD")
				},
				{
					name: "Payee",
					function: (row) => row.from === this.name ? row.to : row.from
				},
				{
					name: "Reference",
					function: (row) => row.reference
				},
				{
					name: "Debit",
					function: (row) => row.from === this.name ? chalk.red(formatCurrency(row.amount)) : ""
				},
				{
					name: "Credit",
					function: (row) => row.from === this.name ? "" : chalk.green(formatCurrency(row.amount))
				}
			]
		});

		table.addRows(Object.values(this.transactions));
		return table.render();
	}
}
