
// # CliCode

// Run cli code in process that would normally do cli things.
// Capture stdout and protect against `process` events.
// This is node `process` voodoo, be warned. It can go horribly
// wrong sometimes and you end up with no stdout or stderr!
// Best used in testing only.

// Based on [yargs `checkOutput`](https://github.com/yargs/yargs/blob/51af0a640ba3df0f86b9ed1dd01ade018af6b279/test/helpers/utils.js)

const Promise = require('bluebird')
const debug = require('debug')('dply:test-cli:cli_code')
const { ExtendedError } = require('@deployable/errors')


class CliCodeError extends ExtendedError {}


class CliCode {

  static init(){

  }

  static create( fn, options = {} ){
    let r = new CliCode(fn, options)
    return r
  }

  static run( fn, options = {} ){
    let r = new CliCode(fn, options)
    return r.run()
  }

  constructor( fn, options = {} ){
    debug('creating CliCode', options)

    // The function to run
    this.function = fn || options.fn || options.function

    // Process arguments to apply to during the run of the function
    this.argv = options.argv || []

    // Arguments to send to the function
    this.args = options.args || []

    // Are we replacing stdout? Defaults to true
    this.stdout = ( options.stdout !== undefined ) ? Boolean(options.stdout) : true

    // Still write stdout?
    this.write_stdout = Boolean(options.write_stdout)

    // Are we replacing stderr? Defaults to true
    this.stderr = ( options.stderr !== undefined ) ? Boolean(options.stderr) : true

    // Still write stderr?
    this.write_stderr = Boolean(options.write_stderr)

    // Store both stderr and stdout somewhere for debug
    this.output = []

    // What style of function are we running? `sync` (default), `promise` or `callback`
    this.function_type = options.function_type || 'sync'
    if ( options.promise === true ) this.function_type = 'promise'
    if ( options.callback === true ) this.function_type = 'callback'

    // Interface for the results object
    this.results = {
      return: null,   // returned value from function
      errors: [],     // Any errors picked up
      stdout: [],     // stdout
      stderr: [],     // stderr
      exit: false,    // did process.exit get called?
      exit_code: null // process.exit code
    }

  }


  setup (resolve, reject) {
    debug('running setup')

    // Inject our new argv.
    this.process_argv = process.argv
    debug('process.argv', process.argv)
    process.argv = this.argv

    // Don't let the code exit to main process.
    this.process_exit = process.exit
    process.exit = (n) => {
      this.results.exit = true
      this.results.exit_code = n
      debug('resolving on process.exit', n)
      resolve(this.results)
    }
    debug('process.exit setup done')

    // Capture errors, promises might cover this now.
    this.process_emit = process.emit
    // /* istanbul ignore next */
    process.emit = (ev, value) => {
      if (ev === 'uncaughtException') {
        this.tearDown()
        value._cc_results = this.results
        this.results.errors.push(value)
        return reject(value)
      }
      return this.process_emit.apply(this.process_emit, arguments)
    }
    debug('process.emit setup done')

    // Replace stdout with our collector
    if (this.stdout) this.replaceStdout()

    // Replace stderr with our collector
    if (this.stderr) this.replaceStderr()

    debug('all the setup is done')
  }

  replaceStderr(){
    this.process_stderr_write = process.stderr.write
    process.stderr.write = (chunk, encoding, fd) => {

      // our DEBUG can be logged normally
      if (
        /^\s\s\u001b\[\d\d;1mdply:test-cli:cli_code/.exec(chunk) ||
        /^\s\s\u001b\[\d\d;1mdply:test:test-cli:unit:cli_code/.exec(chunk)
      ){
        return this.process_stderr_write.call(process.stderr, chunk, encoding)
      }

      // Have we been told to write all stderr as well?
      if ( this.write_stderr ) {
        this.process_stderr_write.call(process.stderr, chunk, encoding)
      }

      // Store stderr in results
      this.results.stderr.push(chunk)

      // Store all ordered output in case there's an error
      this.output.push(['stderr',chunk])
    }
  }

  replaceStdout(){
    this.process_stdout_write = process.stdout.write
    process.stdout.write = (chunk, encoding, fd) => {

      // Have we been told to write all stdout as well?
      if ( this.write_stdout ){
        this.process_stdout_write.call(process.stdout, chunk, encoding)
      }

      // Store stdout in results
      this.results.stdout.push(chunk)

      // Store all ordered output in case there's an error
      this.output.push(['stdout',chunk])
    }
  }

  // Put it all back the way we found it.
  // Needs to always run after the function
  tearDown () {
    debug('running teardown')
    if (this.stdout && this.process_stdout_write )
      process.stdout.write = this.process_stdout_write
    if (this.stderr && this.process_stderr_write)
      process.stderr.write = this.process_stderr_write
    if (this.process_argv) process.argv = this.process_argv
    if (this.process_exit) process.exit = this.process_exit
    if (this.process_emit) process.emit = this.process_emit
    this.teardown_done = true
  }

  // Check if we were torn down properly.
  // If not dump stdout and stderr again
  tornDown () {
    if ( ! this.teardown_done ) {
      debug('not torn down!')
      this.tearDown()
      debug('torn down!')
      this.output.forEach(([type, chunk]) => {
        process.stdout.write('cc '+ type +': ' + chunk)
      })
    } else {
      debug('already torn down!')
    }
  }

  // Run the cli code function
  run () {
    return new Promise((resolve, reject) => {
      if (!this.function) throw new CliCodeError('CliCode requires a function to run')

      this.setup(resolve, reject)
      debug('returned from setup')

      if (this.stdout && !this.process_stdout_write)
        reject(new CliCodeError('Something wrong with stdout setup'))

      if (this.stderr && !this.process_stderr_write)
        reject(new CliCodeError('Something wrong with stderr setup'))

      if (!this.process_argv)
        reject(new CliCodeError('Something wrong with the argv replacement setup'))

      if (!this.process_exit)
        reject(new CliCodeError('Something wrong with the exit replacement setup'))
      //if (!this.process_emit) reject('something wrong with emit setup')

      switch (this.function_type) {
        case 'sync':
          debug('sync run')
          this.results.return = this.function(...this.args)
          resolve(this.results)
          this.tearDown()
          return this.results.return

        case 'callback':
          debug('callback run')
          this.function(...this.args, (err, res)=>{
            if (err) return reject(err)
            this.results.return = res
            resolve(this.results)
            this.tearDown()
          })
          return

        case 'promise':
          debug('promise run')
          this.function(...this.args).then(res => {
            this.results.return = res
            this.tearDown()
            resolve(this.results)
          })
          return

        default:
          throw new Error(`Cli Code: No function type "${this.function_type}"`)
      }

    })
    .catch((e) => {
      if ( this.process_stderr_write )
        this.process_stderr_write.call(process.stderr, this.results.stderr.join(''))
      this.tearDown()
      this.results.errors.push = e
      throw e
    })
    // Be overly cautious and teardown again just in case
    .finally(() => this.tearDown())
  }

}
CliCode.init()

module.exports = { CliCode }

