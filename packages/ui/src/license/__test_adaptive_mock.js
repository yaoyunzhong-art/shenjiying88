
const React = require('react');
const MockContext = React.createContext({
  device: { type: 'pc', width: 1280, height: 720, isTouch: false, isMobile: false, pixelRatio: 1 },
  breakpoint: 'xl',
  is: { pc: true, h5: false, app: false, pad: false, miniapp: false },
});
exports.AdaptiveProvider = function({ children }) {
  return React.createElement(MockContext.Provider, { value: {
    device: { type: 'pc', width: 1280, height: 720, isTouch: false, isMobile: false, pixelRatio: 1 },
    breakpoint: 'xl',
    is: { pc: true, h5: false, app: false, pad: false, miniapp: false },
  }}, children);
};
exports.useAdaptive = function() {
  return { device: { type: 'pc', width: 1280, height: 720, isTouch: false, isMobile: false, pixelRatio: 1, scale: 1 },
    breakpoint: 'xl',
    is: { pc: true, h5: false, app: false, pad: false, miniapp: false } };
};
exports.AdaptiveContext = MockContext;
