const Module = require('module')
const orig = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === './useMultimodalFusion' && parent?.filename?.includes('multimodal-fusion-workspace')) {
    return require.resolve('./src/multimodal-fusion-workspace/useMultimodalFusion.mock')
  }
  return orig.call(Module, request, parent, isMain, options)
}
const React = require('react')
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
)
const { MultimodalFusionWorkspace } = require('./src/multimodal-fusion-workspace/index')
const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, {}))
const m1 = html.match(/mf-task-insights-task-001[^<]*/g)
console.log('mf-task-insights-task-001:', m1)
const m2 = html.match(/mf-task-anomalies-task-001[^<]*/g)
console.log('mf-task-anomalies-task-001:', m2)
console.log('html length:', html.length)
console.log('---mf-task-001---')
const m3 = html.match(/mf-task-001[^<]*/g)
console.log(m3)