
// # Cli

// Run cli commands that would normally do cli things.
// Capture stdout/stderr/return code

const Promise = require('bluebird')
const debug = require('debug')('dply:test-cli:cli')
const spawn = require('child_process').spawn
const { ExtendedError } = require('@deployable/errors')


class CliError extends ExtendedError {}


class Cli {

  static run( command, options ){
    let r = new Cli(command, options)
    return r.run()
  }

  // ## new Cli
  // Setup a command to run. Options are through to `process.spawn`

  // Usage:
  //
  //     new Cli('echo')
  //     new Cli(['echo','test'])
  //     new Cli(['echo'],{args:'test'})

  constructor( command, options = {} ){
    debug('creating Cli', command)
    if ( command instanceof Array ){
      this.command = command[0]
      this.args = command.slice(1)
    } else {
      this.command = command
    }

    if (options.args) this.args  = (this.args) ? this.args.concat(options.args) : options.args
    this.cwd   = options.cwd
    this.env   = options.env
    this.argv0 = options.process_name || options.argv0
    this.shell = options.shell || false
    this.stdout_cb = options.stdout_cb
    this.stderr_cb = options.stderr_cb

    this.results = {
      errors: [],     // Any errors picked up
      stdout: [],     // stdout
      stderr: [],     // stderr
      exit_code: null // process.exit code
    }

  }


  spawnOpts(){
    return {
      cwd: this.cwd,
      env: this.env,
      argv0: this.argv0,
      shell: this.shell
    }
  }

  setup (resolve, reject) {
    debug('running setup')
    debug('done setup')
  }

  // Put anything back the way we found it in `setup`.
  teardown () {
    debug('running teardown')
    debug('done teardown')
  }


  // Run the cli code function
  run () {
    return new Promise((resolve, reject) => {
      if (!this.command) throw new CliError('Cli requires a command to run')

      this.setup(resolve, reject)

      let res = this.results
      let proc = this.proc = spawn(this.command, this.args, this.spawnOpts())

      proc.stdout.on('data', (chunk) => {
        res.stdout.push(chunk.toString())
        if (this.stdout_cb) this.stdout_cb(chunk)
      })

      proc.stderr.on('data', (chunk) => {
        res.stderr.push(chunk.toString())
        if (this.stderr_cb) this.stderr_cb(chunk)
      })

      proc.on('close', (code) => {
        res.exit_code = code
        resolve(res)
        this.teardown()
      })

    })
    .catch((e) => {
      this.teardown()
      throw e
    })
    // and some excessive teardown
    .finally(() => this.teardown())
  }

}


module.exports = { Cli, CliError }
