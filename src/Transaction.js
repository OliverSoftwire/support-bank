import moment from "moment";
import log4js from "log4js";

const logger = log4js.getLogger("Transaction");

export default class Transaction {
	constructor({ Date, From, To, Narrative, Amount }) {
		logger.debug(`Creating new transaction from ${From} to ${To}`);

		this.date = moment(Date, "DD/MM/YYYY");
		this.from = From;
		this.to = To;
		this.reference = Narrative;
		this.amount = parseFloat(Amount);

		if (Number.isNaN(this.amount)) {
			logger.error("Transaction amount is not a number");
			throw "Transaction amount is not a number";
		}
	}
}
