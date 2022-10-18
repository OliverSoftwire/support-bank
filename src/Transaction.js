import moment from "moment";
import log4js from "log4js";

import { TransactionError } from "./Errors.js";

const logger = log4js.getLogger("src/Transaction.js");

export default class Transaction {
	constructor({ Date, From, To, Narrative, Amount }, index) {
		logger.debug(`Creating new transaction from ${From} to ${To}`);

		this.index = index;

		this.date = moment(Date, "DD/MM/YYYY");
		this.from = From;
		this.to = To;
		this.reference = Narrative;
		this.amount = parseFloat(Amount);

		if (Number.isNaN(this.amount)) {
			throw new TransactionError(this, "Transaction amount is not a number");
		}
	}
}
