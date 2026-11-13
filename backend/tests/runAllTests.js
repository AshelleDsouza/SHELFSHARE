const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testsDir = __dirname;
const testFiles = fs.readdirSync(testsDir)
  .filter(f => f.endsWith('.test.js'))
  .sort();

console.log(`\n======================================================`);
console.log(`  ShelfShare Automated Backend Test Suite`);
console.log(`  Discovered ${testFiles.length} Test Suites`);
console.log(`======================================================\n`);

let passedSuites = 0;
let failedSuites = 0;

for (const file of testFiles) {
  process.stdout.write(`Running suite: ${file.padEnd(32, ' ')} `);
  const result = spawnSync('node', ['--test', path.join(testsDir, file)], {
    encoding: 'utf8',
    env: process.env
  });

  if (result.status === 0) {
    passedSuites++;
    console.log('[\x1b[32mPASS\x1b[0m]');
  } else {
    failedSuites++;
    console.log('[\x1b[31mFAIL\x1b[0m]');
    console.error(result.stdout || result.stderr);
  }
}

console.log(`\n------------------------------------------------------`);
console.log(`Total Test Suites : ${testFiles.length}`);
console.log(`Passed Suites     : \x1b[32m${passedSuites}\x1b[0m`);
console.log(`Failed Suites     : ${failedSuites > 0 ? `\x1b[31m${failedSuites}\x1b[0m` : '0'}`);
console.log(`======================================================\n`);

if (failedSuites > 0) {
  process.exit(1);
} else {
  console.log(`🎉 All ShelfShare test suites completed successfully!\n`);
  process.exit(0);
}
