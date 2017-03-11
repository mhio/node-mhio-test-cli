/* global expect */
const debug = require('debug')('dply:test:test-cli:unit:cli_code')
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
          expect( result ).to.have.property('stdout' ).and.eql(['out\n'])
        })
      })

      it('should write to stderr as well as capture', function(){
        let fn = () => process.stderr.write('err\n')
        return CliCode.run(fn, {write_stderr: true}).then(result => {
          debug('result',result)
          expect( result ).to.have.property('stderr' ).and.eql(['err\n'])
        })
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
          debug('synchronous stderr', result.stderr)
          expect( result.stderr ).to.eql(['err\n'])
        })
      })

    })


    describe('promise functions', function(){

      let cc = null

      afterEach(function(){
        cc.torndown()
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
          expect( result.stdout ).to.eql(['out\n'])
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
          expect( result.stderr ).to.eql(['err\n'])
          expect( result.stdout ).to.eql([])
        })
      })

    })


    describe('callback functions', function(){

      let cc = null

      afterEach(function(){
        cc.torndown()
      })

      it('should print `out` to stdout from cli code via callback', function(){
        let cbfn = (done) => {
          debug('done',done)
          console.log('out')
          done(null, true)
        }
        cc = CliCode.create(cbfn, {callback: true})
        return cc.run().then(result => {
          expect(result).to.have.property('errors').and.to.eql([])
          debug('callback code stdout', result.stdout)
          expect( result.stdout ).to.eql(['out\n'])
        })
      })

      it('should print `err` to stderr from cli code via callback', function(){
        let cbfn = (done) => {
          debug('done',done)
          console.error('err')
          done(null, true)
        }
        cc = CliCode.create(cbfn, {callback: true})
        return cc.run().then(result => {
          expect(result).to.have.property('errors').and.to.eql([])
          debug('callback stderr', result.stderr)
          expect( result.stderr ).to.eql(['err\n'])
        })
      })

    })



  })
})

