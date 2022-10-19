import moment from "moment-msdate";
import log4js from "log4js";
import { Decimal } from "decimal.js";

import { TransactionError } from "./Errors.js";

const logger = log4js.getLogger("src/Transaction.js");

export const TransactionFormat = {
	CSV: 0,
	JSON: 1,
	XML: 2
}

export class Transaction {
	constructor(date, from, to, narrative, amount) {
		logger.debug(`Creating new transaction ${from} -> ${to}`);

		if (!moment.isMoment(date)) {
			throw new TransactionError(this, "Transaction date is not a Moment");
		}
		if (!date.isValid()) {
			throw new TransactionError(this, "Transaction date is invalid");
		}

		try {
			this.amount = new Decimal(amount);
		} catch (err) {
			logger.error(err);
			throw new TransactionError(this, "Transaction amount is not a number (check the log for details)");
		}

		this.date = date;
		this.from = from;
		this.to = to;
		this.narrative = narrative;
	}

	static fromData(transaction, format) {
		switch (format) {
			case TransactionFormat.CSV:
				return Transaction.fromCSV(transaction);
			case TransactionFormat.JSON:
				return Transaction.fromJSON(transaction);
			case TransactionFormat.XML:
				return Transaction.fromXML(transaction);
			default:
				logger.fatal("Invalid transaction file format");
				throw new Error("Invalid transaction format");
		}
	}

	static fromCSV({ Date, From, To, Narrative, Amount }) {
		return new Transaction(
			moment(Date, "DD/MM/YYYY"),
			From, To,
			Narrative,
			Amount
		);
	}

	static fromJSON({ Date, FromAccount, ToAccount, Narrative, Amount }) {
		return new Transaction(
			moment(Date, "YYYY-MM-DDThh:mm:ss"),
			FromAccount, ToAccount,
			Narrative,
			Amount
		);
	}

	static fromXML({ Description, Value, Parties, _Date }) {
		return new Transaction(
			moment.fromOADate(parseInt(_Date)),
			Parties.From, Parties.To,
			Description,
			Value
		);
	}
}
