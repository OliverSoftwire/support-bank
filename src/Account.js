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
		if (transaction.From === this.name) {
			this.balance -= transaction.Amount;
			this.transactions.push(transaction);
			return;
		}

		if (transaction.To === this.name) {
			this.balance += transaction.Amount;
			this.transactions.push(transaction);
			return;
		}

		throw "Invalid transaction, account is neither sender nor receiver";
	}

	toString() {
		const table = new Table({
			title: `${this.name} | Balance: ${formatBalance(this.balance)}`,
			enabledColumns: ["date-formatted", "Payee", "Reference", "Debit", "Credit"],
			sort: (row1, row2) => row1.Date.valueOf() - row2.Date.valueOf(),
			computedColumns: [
				{
					name: "date-formatted",
					title: "Date",
					function: (row) => row.Date.format("YYYY-MM-DD")
				},
				{
					name: "Payee",
					function: (row) => row.From === this.name ? row.To : row.From
				},
				{
					name: "Reference",
					function: (row) => row.Narrative
				},
				{
					name: "Debit",
					function: (row) => row.From === this.name ? chalk.red(formatCurrency(row.Amount)) : ""
				},
				{
					name: "Credit",
					function: (row) => row.From === this.name ? "" : chalk.green(formatCurrency(row.Amount))
				}
			]
		});

		table.addRows(Object.values(this.transactions));
		return table.render();
	}
}
