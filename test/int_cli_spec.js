const debug = require('debug')('dply:test:test-cli:integration:cli')
const yargs = require('yargs')
const {TestEnv} = require('@deployable/test')
const CliCode = require('../lib/cli_code')
const Cli = require('../lib/cli')

describe('integration::template::cli', function(){

  
  describe('cli', function(){

    beforeEach(function () {
      yargs.reset()
    })

    it('should output help from code', function(){
      let fn = () => cli( '--help' )
      return CliCode.run(fn).then(result => {
        expect(result).to.have.property('errors').and.to.eql([])
        expect(result).to.have.property('exit').and.be.true
        expect(result).to.have.property('exit_code').and.equal(0)
        debug('code out', result.stdout)
        let out = result.stdout.join('')
        expect( out ).to.include( '--debug' )
        expect( out ).to.include( '--version' )
        expect( out ).to.include( '--help' )
      })
    })

    it('should output help for build command', function(){
      let fn = () => cli( 'build --help' )
      return CliCode.run(fn).then(result => {
        expect(result).to.have.property('errors').and.to.eql([])
        expect(result).to.have.property('exit').and.be.true
        expect(result).to.have.property('exit_code').and.equal(0)
        debug('code out', result.stdout)
        let out = result.stdout.join('')
        expect( out ).to.include( '--name, -n ' )
        expect( out ).to.include( '--template-path, -p ' )
        expect( out ).to.include( '--output, -o ' )
        expect( out ).to.include( '--replace, -r ' )
        expect( out ).to.include( '--set, -s ' )
        expect( out ).to.include( '--json, -j ' )
        expect( out ).to.include( '--file, -f' )
      })
    })

  })


  describe('command', function(){
    
    let desc_bin = TestEnv.basePath('bin', 'det')
    let desc_output = TestEnv.tmpOutputPath()

    after(function(){
      return TestEnv.cleanAsync(desc_output)
    })
    
    it('should output help from binary', function(){
      return Cli.run(desc_bin).then(result => {
        expect(result).to.have.property('errors').and.to.eql([])
        debug('bin out', result.stdout)
        debug('bin err', result.stderr)
        let err = result.stderr.join('')
        expect( err ).to.match( /--debug/ )
        expect( err ).to.include( '--version' )
        expect( err ).to.include( '--help' )
        expect(result).to.have.property('exit').and.equal(1)
      })
    })

    it('should generate a base template set', function(){
      let args = ['build', 'base', '--name', 'int_command_base', '-o', desc_output]
      return Cli.run(desc_bin, {args: args}).then(result => {
        expect(result).to.have.property('errors').and.to.eql([])
        debug('bin out', result.stdout)
        debug('bin err', result.stderr)
        let out = result.stdout.join('')
        expect( out ).to.include( 'Built "base" in "' )
        expect(result).to.have.property('exit').and.equal(0)
      })
    })

  })

})

