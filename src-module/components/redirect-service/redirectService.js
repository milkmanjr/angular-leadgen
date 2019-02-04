angular.module('angular-leadgen')
  .factory('RedirectService', ['$rootScope', $rootScope => {

    return {

      subscribe: (scope, callback) => {
        let handler = $rootScope.$on('notifying-redirect-admin', callback);
        scope.$on('$destroy', handler);
      },

      notify: () => {
        $rootScope.$emit('notifying-redirect-admin');
      }

  }
}]);