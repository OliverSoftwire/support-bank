import moment from "moment";
import log4js from "log4js";

import { TransactionError } from "./Errors.js";

const logger = log4js.getLogger("src/Transaction.js");

export const TransactionFormat = {
	CSV: 0,
	JSON: 1,
	XML: 2
}

export class Transaction {
	constructor(transaction, index, format) {
		logger.debug(`Creating new transaction`);

		this.index = index;
		this.format = format;

		switch (format) {
			case TransactionFormat.CSV:
				this.fromCSV(transaction);
				break;
			case TransactionFormat.JSON:
				this.fromJSON(transaction);
				break;
			default:
				throw new TransactionError(this, "Invalid transaction format");
		}

		if (Number.isNaN(this.amount)) {
			throw new TransactionError(this, "Transaction amount is not a number");
		}
	}

	fromCSV({ Date, From, To, Narrative, Amount }) {
		this.date = moment(Date, "DD/MM/YYYY");
		this.from = From;
		this.to = To;
		this.narrative = Narrative;
		this.amount = parseFloat(Amount);
	}

	fromJSON({ Date, FromAccount, ToAccount, Narrative, Amount }) {
		this.date = moment(Date, "YYYY-MM-DDThh:mm:ss");
		this.from = FromAccount;
		this.to = ToAccount;
		this.narrative = Narrative;
		this.amount = Amount;
	}
}
