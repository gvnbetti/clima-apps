// Shared settings for the validation scripts (Node). Override with WORK.
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..'), WORK = process.env.WORK || path.join(ROOT, '_work'), WX = path.join(ROOT, 'weather', 'files');
fs.mkdirSync(WORK, { recursive: true });
module.exports = { ROOT, WORK, WX };
