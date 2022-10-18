import moment from "moment-msdate";
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
			case TransactionFormat.XML:
				this.fromXML(transaction);
				break;
			default:
				logger.fatal("Invalid transaction file format");
				throw new Error("Invalid transaction format");
		}

		if (!this.date.isValid()) {
			throw new TransactionError(this, "Transaction date is invalid");
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

	fromXML({ Description, Value, Parties, _Date }) {
		this.date = moment.fromOADate(parseInt(_Date));
		this.from = Parties.From;
		this.to = Parties.To;
		this.narrative = Description;
		this.amount = Value;
	}
}
