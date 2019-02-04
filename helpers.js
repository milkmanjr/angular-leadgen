var yargs     = require('yargs').argv,
  actions     = {},

  currentPath = require('path').join(process.cwd(), yargs.file);

/**
* @function Logs out of leadgen via the command line.
*/
actions.logout = function () {
  actions.updateJSON({staff_code: ''})
    .then(() => {
      console.log(`logged out of admin interface successfully.`);
    });
}

/**
* @function Sets the collection method
*/
actions.setCollectionMethod = function (type) {
  actions.updateJSON({collection_method: type})
    .then(() => {
      console.log(`changed collection method to "${type}"`)
    });
}

/**
* @function Updates the file
*/
actions.updateJSON = function (changes) {
  var fs = require('fs'),
    file = require(currentPath);

  return new Promise((resolve, reject) => {
    fs.writeFile(currentPath, JSON.stringify(Object.assign({}, file, changes)), function (err) {
      if (err) {
        console.error('could not write json file');
        reject(err)
        return
      }

      resolve();
    });
  });
}

/**
* @notes based on the action, do what we are supposed
* to do.
*/
switch (yargs.action) {
  default:
  case 'logout':
    actions.logout()
  break;

  case 'wheelstand':
    actions.setCollectionMethod('wheelstand');
  break;

  case 'kiosk':
    actions.setCollectionMethod('kiosk');
  break;
}