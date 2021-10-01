require('babel-polyfill');
const progress = require('nprogress');
const React = require('react');
const ReactDOM = require('react-dom');
const {RouterView} = require('../');
const router = require('./router');

progress.configure({showSpinner: false});

router.listen('ChangeStart', (action, toState, fromState, next) => {
  progress.start();
  next();
  if (toState.name === 'web') {
    setTimeout(() => {
      router.go({name: 'web.home'}, {replace: true});
    });
  }
});
router.listen('ChangeSuccess', progress.done);
router.listen('ChangeError', error => {
  console.error(error);
  progress.done();
});

ReactDOM.render(
  <RouterView>
    <div className="text-center text-muted py-5">
      <div className="spinner-border">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  </RouterView>,
  document.getElementById('root'),
);
