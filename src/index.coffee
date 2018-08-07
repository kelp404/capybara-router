core = require './lib/core'


exports.setup = core.setup
exports.reload = core.reload
exports.go = core.go
# components
exports.Link = require './lib/components/link'
exports.RouterView = require './lib/components/router-view'
