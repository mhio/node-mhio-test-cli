// # Cli testing

const { Cli } = require('./cli')
const { CliCode } = require('./cli_code')
const VERSION = require('../package.json').version

module.exports = { Cli, CliCode, VERSION }

