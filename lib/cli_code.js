
// # CliCode

// Run cli code in process that would normally do cli things. 
// Capture stdout and protect against `process` events.
// This is node `process` voodoo, be warned. It can go horribly
// wrong sometimes and you end up with no stdout or stderr! 
// Best used in testing only. 

// Based on [yargs `checkOutput`](https://github.com/yargs/yargs/blob/51af0a640ba3df0f86b9ed1dd01ade018af6b279/test/helpers/utils.js)

const Promise = require('bluebird')
const debug = require('debug')('dply:test-cli:cli_code')


class CliCode {

  static run( fn, options = {} ){
    options.fn = fn
    let r = new CliCode(fn, options)
    return r.run()
  }

  constructor( fn, options = {} ){
    debug('creating CliCode', options)

    // The function to run
    this.function = fn || options.fn || options.function
    if (!this.function) throw new Error('CliCode requires a function to run')

    // Arguments to apply to the process
    this.argv = options.argv || []
    
    // Are we replacing stdout? Defaults to true
    this.stdout = ( options.stdout !== undefined ) ? Boolean(options.stdout) : true

    // Are we replacing stderr? Defaults to true
    this.stderr = ( options.stderr !== undefined ) ? Boolean(options.stderr) : true

    // What style of function are we running? `sync` (default), `promise` or `callback`
    this.function_type = options.function_type || 'sync'
   
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
      resolve(this.results)
    }
    debug('process.exit done')

    // Capture errors, promises might cover this now.
    this.process_emit = process.emit
    process.emit = (ev, value) => {
      if (ev === 'uncaughtException') {
        this.teardown()
        return reject(value)
      }
      return this.process_emit.apply(this.process_emit, arguments)
    }
    debug('process.emit done')


    // Replace stdout with our collector
    if (this.stdout){      
      this.process_stdout_write = process.stdout.write
      process.stdout.write = (chunk, encoding, fd) => {
        this.results.stdout.push(chunk)
      }
    }

    // Replace stderr with our collector
    if (this.stderr) {
      this.process_stderr_write = process.stderr.write
      process.stderr.write = (chunk, encoding, fd) => {
        // Allow `debug` from this module to plain stderr
        // Might need something additional for non tty output
        if ( /^\s\s\u001b\[\d\d;1mdply:test-cli:cli_code/.exec(chunk) ) this.process_stdout_write.call(process.stdout, 'stderr:'+chunk, encoding)
        else this.results.stderr.push(chunk)
      }
    }

    debug('done setup')
  }

  // Put it all back the way we found it. 
  // Needs to always run after the function
  teardown () {
    debug('running teardown')
    if (this.process_stdout_write ) process.stdout.write = this.process_stdout_write 
    if (this.process_stderr_write) process.stderr.write = this.process_stderr_write
    if (this.process_argv) process.argv = this.process_argv
    if (this.process_exit) process.exit = this.process_exit
    if (this.process_emit) process.emit = this.process_emit
  }


  // Run the cli code function
  run () {
    return new Promise((resolve, reject) => {
      this.setup(resolve, reject)
      debug('returned from setup')
      if (!this.process_stdout_write) reject('something wrong with stdout setup')
      if (!this.process_stderr_write) reject('something wrong with stderr setup')
      if (!this.process_argv) reject('something wrong with argv setup')
      if (!this.process_exit) reject('something wrong with exit setup')
      //if (!this.process_emit) reject('something wrong with emit setup')

      switch (this.function_type) {
        case 'sync':
          this.results.return = this.function()
          resolve(this.results)
          this.teardown()
          break

        case 'callback':
          this.function((err, res)=>{
            if (err) return reject(err)
            this.results.return = res
            resolve(this.results)
            this.teardown()
          })
          break

        case 'promise':
          resolve(this.function().then(res => {
            this.results.return = res
            return this.results
            this.teardown()
          }))
          break

        default:
          throw new Error(`Cli Code: No function type ${this.function_type}`)
      }

      return this.results.return
    })
    .catch((e) => {
      this.teardown()
      this.results.errors.push = [e]
      console.error(this.results.stderr)
      throw e
      return this.results
    })
    // Be overly cautious and teardown again just in case
    .finally(() => this.teardown())
  }

} 

module.exports = { CliCode }

