angular.module('angular-leadgen').directive("preventForZip", function() {
    return {
        restrict: "A",
        transclude: true,
        scope: {
            bindModel: '=ngModel',
        },
        link: function(scope, elem, attrs) {
            var keys = '0123456789'.split('');

            var char;
            elem.on("keypress", function(event) {
                char = String.fromCharCode(event.which)
                if (keys.indexOf(char) === -1)
                    event.preventDefault();
            })
        }
    }

});

angular.module('angular-leadgen').directive("preventForAddress", function() {
    return {
        restrict: "A",
        transclude: true,
        scope: {
            bindModel: '=ngModel',
        },
        link: function(scope, elem, attrs) {
            var keys = '_-.,/#&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '.split('');

            var char;
            elem.on("keypress", function(event) {
                char = String.fromCharCode(event.which)
                if ((!scope.bindModel && char == ' ') || keys.indexOf(char) === -1)
                    event.preventDefault();
            });

            elem.on('keyup', (event) => {
                var value = angular.element(elem).val();
                var char = String.fromCharCode(event.which);

                if (!value) return;

                if (char == ' ' && value.match(/^\s{1,}/)) {
                    angular.element(elem).val(value.replace(/^\s+/g, ''));
                    angular.element(elem)[0].selectionStart = angular.element(elem)[0].selectionEnd = 0;
                }
            });
        }
    }
});

angular.module('angular-leadgen').directive("preventForNames", function() {
    return {
        restrict: "A",
        transclude: true,
        scope: {
            bindModel: '=ngModel',
        },
        link: function(scope, elem, attrs) {
            var keys = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '.split('');

            var char;
            elem.on("keypress", function(event) {
                char = String.fromCharCode(event.which)
                if ((!scope.bindModel && char == ' ') || keys.indexOf(char) === -1) {
                    event.preventDefault();
                }
            });

            elem.on('keyup', (event) => {
                var value = angular.element(elem).val();
                var char = String.fromCharCode(event.which);

                if (!value) return;

                if (char == ' ' && value.match(/^\s{1,}/)) {
                    angular.element(elem).val(value.replace(/^\s+/g, ''));
                    angular.element(elem)[0].selectionStart = angular.element(elem)[0].selectionEnd = 0;
                }
            });
        }
    }
});

angular.module('angular-leadgen').directive("preventForEmails", function() {
    return {
        restrict: "A",
        transclude: true,
        scope: {
            bindModel: '=ngModel',
        },
        link: function(scope, elem, attrs) {
            var keys = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@-.+_'.split('');

            var char;
            elem.on("keypress", function(event) {
                char = String.fromCharCode(event.which)
                if (keys.indexOf(char) === -1)
                    event.preventDefault();
            })
        }
    }
});