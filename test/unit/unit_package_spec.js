/* global expect */
const { CliCode, Cli, VERSION } = require('../../')

describe('Unit::test-cli::package', function(){

  describe('require', function(){

    it('should load the CliCode class', function(){
      expect( CliCode ).to.be.ok
    })

    it('should load the Cli class', function(){
      expect( Cli ).to.be.ok
    })

    it('should export a VERSION for the module', function(){
      expect( VERSION ).to.be.ok
      expect( VERSION ).to.be.a('string')
      expect( VERSION ).to.match(/^\d+\.\d+\.\d+/)
    })

  })

})
