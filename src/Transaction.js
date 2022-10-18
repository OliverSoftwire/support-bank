import moment from "moment";

export default class Transaction {
	constructor({ Date, From, To, Narrative, Amount }) {
		this.date = moment(Date, "DD/MM/YYYY");
		this.from = From;
		this.to = To;
		this.reference = Narrative;
		this.amount = parseFloat(Amount);

		if (Number.isNaN(this.amount)) {
			throw "Transaction amount is not a number";
		}
	}
}
