const fs = require('node:fs')
const core = require('nutria-image-size-core')
function imageSize(input) { return core.imageSize(typeof input === 'string' ? fs.readFileSync(input) : input) }
Object.assign(imageSize, core, { default: imageSize, imageSize })
module.exports = imageSize
