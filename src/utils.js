import fs from "fs";
import chalk from "chalk";

export function formatCurrency(amount) {
	return `£${amount}`;
}

export function formatBalance(balance) {
	return balance < 0 ? chalk.red(`(${formatCurrency(-balance)})`) : chalk.green(formatCurrency(balance));
}

export function isFile(path) {
	return fs.existsSync(path) && fs.lstatSync(path).isFile();
}

export function capitaliseEachWord(str) {
	return str.split(" ").filter(word => word).map(word => word[0].toUpperCase() + word.slice(1).toLowerCase()).join(" ");
}
