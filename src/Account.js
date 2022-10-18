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
		return this.transactions;
	}
}
