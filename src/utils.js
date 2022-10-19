import chalk from "chalk";
import fs from "fs";

export function formatCurrency(amount) {
	return `£${amount}`;
}

export function formatBalance(balance) {
	return balance < 0 ? chalk.red(`(${formatCurrency(-balance)})`) : chalk.green(formatCurrency(balance));
}

export function isFile(path) {
	return fs.existsSync(path) && fs.lstatSync(path).isFile();
}
