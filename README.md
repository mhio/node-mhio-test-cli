# [Deployable - Test Cli](https://github.com/deployable/deployable-test-cli)

## @deployable/test-cli

Helper classes for testing cli commands and cli code.

Stores the stdout, stderr and return of the command for subsequent testing.

## Install
 
    yarn add deployable-test-cli --dev

    npm install deployable-test-cli --save-dev

## Usage

### Cli

```javascript

const { Cli } = require('@deployable/test-cli') 
Cli.run(['echo', 'test']).then(results => {
  console.log(results.stdout)
  console.log(results.stdout)
  console.log(results.exit_code)
})

```

### Cli Code

```javascript

const { CliCode } = require('@deployable/test-cli') 

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

deployable-test-cli is released under the MIT license.

Copyright 2016 Matt Hoyle - code at deployable.co

https://github.com/deployable/deployable-test-cli

