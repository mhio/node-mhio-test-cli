const debug = require('debug')('dply:test:test-cli:unit:clicode')
const { CliCode } = require('../lib/cli_code')


describe('Unit::test-cli::CliCode', function(){

  describe('CliCode', function(){

    it('should print `out` to stdout from cli code', function(){
      let fn = () => {
        console.log('out')
        process.exit(0)
      }
      return CliCode.run(fn).then(result => {
        expect(result).to.have.property('errors').and.to.eql([])
        expect(result).to.have.property('exit').and.be.true
        expect(result).to.have.property('exit_code').and.equal(0)
        debug('code stdout', result.stdout)
        expect( result.stdout ).to.eql(['out\n'])
      })
    })

    it('should print `err` to stderr from cli code', function(){
      let fn = () => {
        console.error('err')
        process.exit(0)
      }
      return CliCode.run(fn).then(result => {
        expect(result).to.have.property('errors').and.to.eql([])
        expect(result).to.have.property('exit').and.be.true
        expect(result).to.have.property('exit_code').and.equal(0)
        debug('code stderr', result.stderr)
        expect( result.stderr ).to.eql(['err\n'])
      })
    })

  })
})

