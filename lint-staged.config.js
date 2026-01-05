/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const ESLint = require('eslint').ESLint;

const removeIgnoredFiles = async (files) => {
	const eslint = new ESLint();
	const isIgnored = await Promise.all(
		files.map((file) => {
			return eslint.isPathIgnored(file);
		})
	);
	return files.filter((_, i) => !isIgnored[i]);
};

module.exports = {
	'!({.esbuild.ts,test/simulation/fixtures/**,test/scenarios/**,.vscode/extensions/**,**/vscode.proposed.*})*{.ts,.js,.tsx}': async (files) => {
		const filesToLint = await removeIgnoredFiles(files);
		const filesString = filesToLint.join(' ');
		return [
			`npm run tsfmt -- ${filesString}`,
			`eslint --max-warnings=0 ${filesString}`
		];
	},
};
