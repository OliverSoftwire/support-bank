import fs from "fs";
import chalk from "chalk";

export function formatCurrency(amount) {
	return `£${amount.toFixed(2)}`;
}

export function formatBalance(balance) {
	return balance < 0 ? chalk.red(`(${formatCurrency(-balance)})`) : chalk.green(formatCurrency(balance));
}

export function isFile(path) {
	return fs.existsSync(path) && fs.lstatSync(path).isFile();
}
