// # Cli testing

const { Cli, CliError } = require('./cli')
const { CliCode, CliCodeError } = require('./cli_code')
const VERSION = require('../package.json').version

module.exports = { Cli, CliError, CliCode, CliCodeError, VERSION }

