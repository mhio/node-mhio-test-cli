const debug = require('debug')('dply:test:test-cli:unit:cli')
const { Cli } = require('../lib/cli')


describe('Unit::test-cli::Cli', function(){

  describe('output interception', function(){

    it('should output test to stdout from binary', function(){
      return Cli.run(['echo','test']).then(result => {
        expect(result).to.have.property('errors').and.to.eql([])
        debug('bin out', result.stdout)
        debug('bin err', result.stderr)
        expect( result.stdout[0] ).to.equal( 'test' )
        expect( result.stderr ).to.have.length(0)
        expect(result).to.have.property('exit').and.equal(0)
      })
    })

    it('should outout testerr to stderr from binary', function(){
      return Cli.run(['node','-e','console.error("testerr")']).then(result => {
        expect(result).to.have.property('errors').and.to.eql([])
        debug('bin out', result.stdout)
        debug('bin err', result.stderr)
        expect( result.stderr[0] ).to.equal( 'testerr' )
        expect( result.stdout ).to.have.length( 0 )
        expect(result).to.have.property('exit').and.equal(0)
      })
    })

  })
})

