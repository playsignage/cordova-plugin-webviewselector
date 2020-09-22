module.exports = function(ctx) {
  //NB! This hook is executed before gradle build started, not with 'cordova prepare'

  // make sure android platform is part of build
  if (ctx.opts.platforms.indexOf('android') < 0) { return; }

  var fs = require('fs');
  var path = require('path');
  var deferral = require('q').defer();

  //since cordova libs folder moved, we must copy the file with node script rather than use the <source-file> tag in plugin.xml 
  fs.createReadStream('plugins/cordova-plugin-webviewselector/src/android/WebViewSelector.java')
    .pipe(fs.createWriteStream('platforms/android/CordovaLib/src/org/apache/cordova/WebViewSelector.java'));

  var fileToPatch = 'platforms/android/CordovaLib/src/org/apache/cordova/CordovaWebViewImpl.java';
  var patch = '        WebViewSelector.updateWebViewPreference(context, preferences);\n';
  var patchAfter = 'public static CordovaWebViewEngine createEngine(Context context, CordovaPreferences preferences) {\n';

  var file = path.join(ctx.opts.projectRoot, fileToPatch);
  fs.readFile(file, 'utf8', function(err, data) {
    var fileContent = data;
    if (fileContent.indexOf('WebViewSelector.updateWebViewPreference') !== -1) {
      return deferral.resolve();
    }
    if (err) {
      deferral.reject('Android webViewSelector hook installation failed at readFile: ' + err);
    } else {
      fileContent = fileContent.replace(patchAfter, patchAfter + patch);
      fs.writeFile(file, fileContent, 'utf8', function (err) {
        if (err) {
          deferral.reject('Android webViewSelector hook installation failed at writeFile: ' + err);
        } else {
          deferral.resolve();
        }
      });
    }
  });

  return deferral.promise;
};
