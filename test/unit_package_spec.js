const Something = require('../')

describe('Unit::deployable-test-cli', function(){

  describe('Something does something', function(){
  
    it('should do something with module', function(){
      expect( Something.something() ).to.equal( 1 )
    })

  })

})
