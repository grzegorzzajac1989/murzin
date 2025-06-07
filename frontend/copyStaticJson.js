const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, 'static.json');
const dest = path.join(__dirname, 'build', 'static.json');

fs.copyFileSync(source, dest);
console.log('static.json skopiowany do build');