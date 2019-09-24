# [mhio - test cli commands](https://github.com/mhio/mhio-test-cli)

## @mhio/test-cli

Helper classes for testing cli commands and cli code.

Stores the stdout, stderr and return of the command for subsequent testing.

## Install
 
    yarn add mhio-test-cli --dev

    npm install mhio-test-cli --save-dev

## Usage

### Cli

```javascript

const { Cli } = require('@mhio/test-cli') 
Cli.run(['echo', 'test']).then(results => {
  console.log(results.stdout)
  console.log(results.stdout)
  console.log(results.exit_code)
})

```

### Cli Code

```javascript

const { CliCode } = require('@mhio/test-cli') 

const fn = ()=> { 
  console.log('testout')
  console.error('testerr')
  process.exit(1)
}

CliCode.run(fn).then(results => {
  console.log(results.stdout)
  console.log(results.stdout)
  console.log(results.return) // The data the function returns
  console.log(results.exit)   // Did the code try to exit
  console.log(results.exit_code) // What was the exit code
})

```

## About

mhio-test-cli is released under the MIT license.

Copyright 2019 mhio

https://github.com/mhio/mhio-test-cli

