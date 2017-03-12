/* global expect */
const debug = require('debug')('dply:test:test-cli:unit:cli_code')
const fs = require('fs')
const { CliCode } = require('../lib/cli_code')


describe('Unit::test-cli::CliCode', function(){

  describe('CliCode', function(){

    describe('generic operations', function(){

      it('should capture exit from cli code', function(){
        let fn = () => {
          process.exit(1)
        }
        return CliCode.run(fn).then(result => {
          expect( result ).to.have.property('exit').and.be.true
          expect( result ).to.have.property('exit_code').and.equal(1)
          expect( result ).to.have.property('stderr' ).and.eql([])
          expect( result ).to.have.property('stdout' ).and.eql([])
        })
      })

      it('should run code that doesn\'t exit', function(){
        let fn = () => {}
        return CliCode.run(fn).then(result => {
          expect(result).to.have.property('exit').and.be.false
          expect(result).to.have.property('exit_code').and.be.null
          expect( result ).to.have.property('stderr' ).and.eql([])
          expect( result ).to.have.property('stdout' ).and.eql([])
        })
      })

      it('should write to stdout as well as capture', function(){
        let fn = () => process.stdout.write('out\n')
        return CliCode.run(fn, {write_stdout: true}).then(result => {
          expect( result ).to.have.property('stdout' ).and.eql(['out'])
        })
      })

      it('should write to stderr as well as capture', function(){
        let fn = () => process.stderr.write('err\n')
        return CliCode.run(fn, {write_stderr: true}).then(result => {
          debug('result',result)
          expect( result ).to.have.property('stderr' ).and.eql(['err'])
        })
      })

      it('should not replace stdout when told', function(){
        let fn = () => process.stdout.write('out\n')
        return CliCode.run(fn, {stdout: false}).then(result => {
          expect( result ).to.have.property('stdout' ).and.eql([])
        })
      })

      it('should not replace stderr when told', function(){
        let fn = () => process.stderr.write('err\n')
        return CliCode.run(fn, {stderr: false}).then(result => {
          expect( result ).to.have.property('stderr' ).and.eql([])
        })
      })

      it('should teardown an unfinished test with output to screen', function(){
        let fn = () => process.stderr.write('err\n')
        let cc = CliCode.create(fn)
        cc.setup()
        process.stderr.write('err\n')
        cc.tornDown()
        expect(cc.teardown_done).to.be.true
      })

      it('should teardown an unfinished test', function(){
        let fn = () => process.stderr.write('err\n')
        let cc = CliCode.create(fn)
        cc.tornDown()
        expect(cc.teardown_done).to.be.true
      })

      it('should error when a bad function type is provided', function(){
        let cfn = ()=>{}
        return expect( CliCode.run(cfn, {function_type: 'wakka'}) )
          .to.be.rejectedWith('No function type "wakka"')
      })

      it('should error when no function is provided', function(){
        return expect( CliCode.run() )
          .to.be.rejectedWith('CliCode requires a function to run')
      })

    })


    describe('synchronous functions', function(){

      it('should print `out` to stdout from cli code', function(){
        let fn = () => {
          console.log('out')
          process.exit(0)
        }
        return CliCode.run(fn).then(result => {
          expect(result).to.have.property('errors').and.to.eql([])
          expect(result).to.have.property('exit').and.be.true
          expect(result).to.have.property('exit_code').and.equal(0)
          debug('synchronous stdout', result.stdout)
          expect( result.stdout ).to.eql(['out'])
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
          debug('synchronous stderr', result.stderr)
          expect( result.stderr ).to.eql(['err'])
        })
      })

    })


    describe('promise functions', function(){

      let cc = null

      afterEach(function(){
        cc.tornDown()
      })

      it('should print `out` to stdout from cli code', function(){
        let pfn = () => {
          return new Promise((resolve)=>{
            setTimeout(()=> {
              console.log('out')
              resolve(true)
            }, 2)
          })
        }
        cc = CliCode.create(pfn, {promise: true})
        return cc.run().then(result => {
          expect(result).to.have.property('errors').and.to.eql([])
          expect(result).to.have.property('exit').and.be.false
          expect(result).to.have.property('exit_code').and.be.null
          debug('promise stdout', result.stdout)
          expect( result.stdout ).to.eql(['out'])
          expect( result.stderr ).to.eql([])
        })
      })


      it('should print `out` to stdout from cli code', function(){
        let pfn = () => {
          return new Promise((resolve)=>{
            setTimeout(()=> {
              console.log('out')
              resolve(true)
            }, 2)
          })
        }
        cc = CliCode.create(pfn, {promise: true})
        return cc.run().then(result => {
          expect(result).to.have.property('errors').and.to.eql([])
          expect(result).to.have.property('exit').and.be.false
          expect(result).to.have.property('exit_code').and.be.null
          debug('promise stdout', result.stdout)
          expect( result.stdout ).to.eql(['out'])
          expect( result.stderr ).to.eql([])
        })
      })

      it('should print `err` to stderr from cli code', function(){
        let pfn = () => {
          return new Promise((resolve)=>{
            setTimeout(()=> {
              console.error('err')
              process.exit(1)
            }, 2)
          })
        }
        cc = CliCode.create(pfn, {promise: true})
        return cc.run().then(result => {
          debug('promise stderr', result)
          expect(result).to.have.property('errors').and.to.eql([])
          expect(result).to.have.property('exit').and.be.true
          expect(result).to.have.property('exit_code').and.eql(1)
          expect( result.stderr ).to.eql(['err'])
          expect( result.stdout ).to.eql([])
        })
      })

    })


    describe('callback functions', function(){

      let cc = null
      let throwError = function( string = 'whatever' ){
        throw new Error(string)
      }

      afterEach(function(){
        cc.tornDown()
      })

      it('should print `out` to stdout from cli code via callback', function(){
        let cbfn = (done) => {
          console.log('out')
          done(null, true)
        }
        cc = CliCode.create(cbfn, {callback: true})
        return cc.run().then( result => {
          expect(result).to.have.property('errors').and.to.eql([])
          debug('callback code stdout', result.stdout)
          expect( result.stdout ).to.eql(['out'])
        })
      })

      it('should print `err` to stderr from cli code via callback', function(){
        let cbfn = (done) => {
          console.error('err')
          done(null, true)
        }
        cc = CliCode.create(cbfn, {callback: true})
        return cc.run().then( result => {
          expect(result).to.have.property('errors').and.to.eql([])
          debug('callback stderr', result.stderr)
          expect( result.stderr ).to.eql(['err'])
        })
      })

      it('should pick up an uncaughtException', function(){
        let cbfn = () => {
          process.emit('uncaughtException', new Error('emitted uncaughtException'))
        }
        cc = CliCode.create(cbfn, {callback: true})
        let ccp = cc.run()
        return ccp.then( ()=> {
          throw new Error('nope')
        }).catch(error => {
          let result = error._cc_results
          expect( result ).to.be.an.object
          expect( result.errors).to.have.length(1)
          expect( result.stderr ).to.eql([])
          expect( result.stdout ).to.eql([])
          let err = result.errors[0]
          expect( err.message ).to.eql('emitted uncaughtException')
        })
      })

      it('should pick a callback Error in the provided callback', function(){
        let cbfn = (done) => {
          setTimeout( ()=> done(new Error('yep')), 2)
        }
        cc = CliCode.create(cbfn, {callback: true})
        return expect( cc.run() ).to.be.rejectedWith('yep')
      })

    })



  })
})

