/* global expect sinon */
const debug = require('debug')('mhio:test:test-cli:unit:cli')
const { Cli } = require('../../lib/cli')


describe('Unit::test-cli::Cli', function(){

  describe('output interception', function(){

    it('should output test to stdout from binary', function(){
      return Cli.run(['echo','test']).then(result => {
        expect(result).to.have.property('errors').and.to.eql([])
        debug('bin out', result.stdout)
        debug('bin err', result.stderr)
        expect( result.stdout[0] ).to.equal( 'test\n' )
        expect( result.stderr ).to.have.length(0)
        expect(result).to.have.property('exit_code').and.equal(0)
      })
    })

    it('should outout testerr to stderr from binary', function(){
      return Cli.run(['node','-e','console.error("testerr")']).then(result => {
        expect(result).to.have.property('errors').and.to.eql([])
        debug('bin out', result.stdout)
        debug('bin err', result.stderr)
        expect( result.stderr[0] ).to.equal( 'testerr\n' )
        expect( result.stdout ).to.have.length( 0 )
        expect(result).to.have.property('exit_code').and.equal(0)
      })
    })

    it('should reject on missing command', function(){
      return expect( Cli.run() )
        .to.be.rejectedWith('Cli requires a command to run')
    })

    it('should output to stdout', function(){
      return Cli.run('echo', {args: ['test']}).then(results => {
        expect(results.stdout.join('')).to.equal('test\n')
      })
    })

    it('should output to stderr', function(){
      return Cli.run(['echo','a'], {args: ['test']}).then(results => {
        expect(results.stdout.join('')).to.equal('a test\n')
      })
    })

    it('should run the supplied stdout callback on stdout', function(){
      let spy = sinon.spy()
      return Cli.run(['echo','test'], {stdout_cb: spy}).then(results => {
        expect(results.stdout.join('')).to.equal('test\n')
        expect(spy.called).to.be.true
      })
    })

    it('should run the supplied stderr callback on stderr', function(){
      let spy = sinon.spy()
      return Cli.run(['node','-e','console.error("no")'], {stderr_cb: spy})
      .then(results => {
        expect(results.stderr.join('')).to.equal('no\n')
        expect(spy.called).to.be.true
      })
    })

  })
})

