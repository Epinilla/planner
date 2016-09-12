(function() {
  'use strict';

  angular.module('cardinalPlanner', ['ui.router', 'as.sortable', 'ngCookies'])
  
  .constant('BASE_URL', '.')
  
  .factory('AuthenticationService', ['$rootScope', '$http', '$cookies', 'BASE_URL', function($rootScope, $http, $cookies, BASE_URL) {
    var factory = {};
      
    factory.login = function() {
      FB.login(function(response) {
        console.log(response);
        if (response.status == "connected") {
          factory.getAuthToken(response);
        } else {
          alert('Could not login with Facebook, please try again.');
        }
      }, {scope: 'email'});
    }
    
    factory.getLoginStatus = function() {
      if (typeof($cookies.get('auth_token')) != "undefined") {
        $http.defaults.headers.common['Authorization'] = 'Token ' + $cookies.get('auth_token');
        $rootScope.loggedIn = true;
        $rootScope.$emit('loggedIn');
      }
    };
    
    factory.getAuthToken = function(response) {
      $http.post(BASE_URL + '/api/login/', {fb_access_token: response.authResponse.accessToken})
        .then(function(response) {
          console.log(response);
          $http.defaults.headers.common['Authorization'] = 'Token ' + response.data;
          $rootScope.loggedIn = true;
          $rootScope.$emit('loggedIn'); // Controller cannot detect this emission.
          $cookies.put('auth_token', response.data, {'expires': (new Date((new Date()).getFullYear(), (new Date()).getMonth(), (new Date()).getDate() + 7))});
        }, function(response) {
          console.log(response);
          alert('Could not get auth token from server.');
        });
    };
    
    factory.logout = function() {
      delete $http.defaults.headers.common['Authorization']
      $cookies.remove('auth_token');
      $rootScope.loggedIn = false;
      $rootScope.$emit('loggedOut');
    }
    
    return factory;
  }])
  
  .controller('LoginCtrl', function($rootScope, $scope, $state, $http, BASE_URL, AuthenticationService) {
    $scope.login = function() {
      AuthenticationService.login();
    };
    
    $scope.logout = function() {
      AuthenticationService.logout();
    }
    
    $scope.init = function() {
      AuthenticationService.getLoginStatus()
    }
    
    $scope.$on('$stateChangeSuccess', function () {
      // do something
      console.log('state changed success');
    });
  })
  
  .controller('HomeCtrl', function($rootScope, $scope, $state, $http, BASE_URL){
      $http.get(BASE_URL + '/api/stats/').then(
            function(response) {
                $scope.stats = response.data;
            },
            function(response) {
                $scope.stats = null;   
            }
        );
      
    $scope.update = function() {
      if ($scope.search == "") {
        $scope.result = [];
        return;
      }
      $scope.loading = true;
      $http.get(BASE_URL + '/api/search/?q=' + $scope.search)
        .then(function(response) {
          $scope.result = response.data
          $scope.loading = false;
        }, function(response) {
          alert('Could not connect to server.');
          $scope.loading = false;
        });
    };
    return $scope;
  })
  
  .controller('CourseCtrl', function($rootScope, $scope, $state, $http, BASE_URL, course, plans, plan_years){
    
    // Add to Plan
    
    $scope.selectedQuarter = '';
    $scope.selectedYear = '';
    
    $scope.handlePlanClick = function(item, $event) {
      if (!['Autumn', 'Winter', 'Spring'].includes(item)) {
        alert('Please Select a Quarter');
        $event.preventDefault();
      }
      
      if ($scope.selectedQuarter == '') {
        $scope.selectedQuarter = item;
      } else {
        $scope.selectedYear = item;
        
        $scope.plan_year = $.grep(plan_years.data.results, function(e){ return e.year == $scope.selectedYear })[0];
        $scope.new_course_list = $scope.plan_year.courses;
        $scope.new_course_list.push($state.params.id);
        
        $scope.post_data = {plan: $scope.plan_year.plan, year: $scope.plan_year.year};
        $scope.post_data[$scope.selectedQuarter.toLowerCase()] = $scope.new_course_list;
        
        $http.post(BASE_URL + '/api/plan_years/', $scope.post_data)
          .then(function(response) {
            alert('Course Added To Plan.');
        }, function(response) {
          alert('Could not connect to server.');
        });
      }
      
    }
    
    $scope.hasPlan = false;
    
    if (plans.data.results.length > 0) {
      $scope.hasPlan = true;
      $scope.plan = plans.data.results[0];
    }
    
    $scope.plan_years = $.grep(plan_years.data.results, function(e){ return $scope.plan.years.includes(e.id); });
    
    $scope.plan_years_menu = [];
    for (var i in $scope.plan_years) {
      $scope.plan_years_menu.push(
        {label: $scope.plan_years[i].year, children: [
          {label: 'Autumn'},
          {label: 'Winter'},
          {label: 'Spring'},
        ]}
      );
    }
    console.log($scope.plan_years_menu);
    
    // Comments
    $scope.reply = true;
    $scope.minimal = false;
    $scope.collapsible = false;
    $scope.replyingTo = null;
    $scope.newReply = '';
    
    // Reviews
    $scope.canPostReview = true;

    $scope.result = course.data;
    
    // Add Logic Here To Check If User canPostReview
    
    $scope.replyTo = function(comment) {
      $scope.replyingTo = comment;
    };
    
    $scope.cancelReply = function() {
      $scope.replyingTo = null;
    };
    
    $scope.addReply = function() {
      if (!$scope.newReply) {
        return alert("Please fill out a comment.");
      }

      if ($scope.replyingTo) {
        $http.post(BASE_URL + '/api/comments/', {content_object: 'comment:' + $scope.replyingTo.id, text: $scope.newReply})
          .then(function(response) {
            $scope.replyingTo.comments.push(response.data);
            $scope.replyingTo = null;
            $scope.newReply = '';
        }, function(response) {
          alert('Could not connect to server.');
        });
      } else {
        $http.post(BASE_URL + '/api/comments/', {content_object: 'course:' + $state.params.id, text: $scope.newReply})
          .then(function(response) {
            $scope.result.comments.push(response.data);
            $scope.newReply = '';
        }, function(response) {
          alert('Could not connect to server.');
        });
      }
    };
    
    $scope.addReview = function() {
      if (typeof $scope.rating == "undefined" || typeof $scope.grade == "undefined" || $scope.grade == "") {
        return alert("Please fill out your grade and rating.");
      }
      else if (typeof $scope.newReview == "undefined" || $scope.newReview == "") {
        return alert("Please fill out a review in the text box."); 
      }

      $http.post(
          BASE_URL + '/api/reviews/',
          {
              course: $state.params.id,
              rating: $scope.rating,
              grade:$scope.grade,
              instructor:$scope.instructor,
              text: $scope.newReview
          }
      )
        .then(function(response) {
          $scope.result.reviews.unshift(response.data);
          $scope.newReview = '';
          $scope.canPostReview= false;
      }, function(response) {
        alert('Server error: ' + response.data);
      });
    };
    
    return $scope;
  })
  
  .controller('InstructorCtrl', function($rootScope, $scope, $state, $http, BASE_URL, instructor) {
    $scope.result = instructor.data;
  })
  
  .controller('PlannerCtrl', function($rootScope, $scope, $state, $http, $window, BASE_URL, plans, plan_years) {
    
    // Move outside of Controller in run() if possible / Implement a better way
    $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
      if (!$rootScope.loggedIn) {
        $state.go('home');
      }
    });
    
    $rootScope.$on('loggedOut', function() {
      $state.go('home');
    });

    $scope.plans = plans.data.results;
    
    if (plans.data.count == 0 && (typeof($state.params.fromNewPlan) == "undefined" || $state.params.fromNewPlan == false)) {
      $state.go('planner.new_plan');
    } else {
      
      $scope.terms = ['autumn', 'winter', 'spring'];
      
      $scope.courses = {
        'autumn':[],
        'winter':[],
        'spring':[]
      };
      
      $scope.courses_ids = {
        'autumn':[],
        'winter':[],
        'spring':[]
      };
      
      $scope.courses_units = {
        'autumn':{
          'min_units': 0,
          'max_units': 0,
        },
        'winter':{
          'min_units': 0,
          'max_units': 0,
        },
        'spring':{
          'min_units': 0,
          'max_units': 0,
        }
      }
      
      // Get Plan Years
      $scope.plan_years = plan_years.data.results;
      
      $scope.years = _.uniq($scope.plan_years.map(function(py) {
        return py.year;
      }));
      
      $scope.years.sort();
      
      $scope.tabs = {};
      
      for (var i in $scope.years) {
        $scope.tabs[$scope.years[i]] = $scope.years[i];
      }
      
      $scope.selected_plan_year = $scope.plan_years[0];
      $scope.selected_year = $scope.years[0];
      
      $scope.$watch('selected_year', function(selected_year) {
        $scope.selected_plan_year = $.grep($scope.plan_years, function(e){ return e.year == $scope.selected_year; })[0];

        $scope.courses = $scope.selected_plan_year.course_data
        delete $scope.courses['summer'];
      });
      
      $scope.$watch('courses', function(courses) {
        console.log(courses);
        for (var key in courses) {
          $scope.courses_ids[key] = $scope.courses[key].map(function(course) {
            return course.id;
          });
          $scope.courses_units[key]['min_units'] = $scope.courses[key].map(function(course) {
            return course.min_units;
          }).reduce(function(a, b) { return a + b; }, 0);
          $scope.courses_units[key]['max_units'] = $scope.courses[key].map(function(course) {
            return course.max_units;
          }).reduce(function(a, b) { return a + b; }, 0);
        }
        
        if (typeof($scope.selected_plan_year) != "undefined") {
          $scope.saving = true;
          $http.put(BASE_URL + '/api/plan_years/' + $scope.selected_plan_year.id + '/', {plan: $scope.selected_plan_year.plan, year: $scope.selected_plan_year.year, autumn: $scope.courses_ids.autumn, winter: $scope.courses_ids.winter, spring: $scope.courses_ids.spring})
            .then(function(response) {
              console.log(response.data);
              console.log('Updated plan year.');
              $scope.saving = false;
          }, function(response) {
            alert('Could not connect to server.');
          });
        }
        
        console.log($scope.courses_ids);
        console.log($scope.courses_units);
      }, true)
      
      $scope.deleteCourse = function(term, index) {
        $scope.courses[term].splice(index, 1);
      }
      
      $scope.update = function() {
        if ($scope.search == "") {
          $scope.result = [];
          return;
        }
        $scope.loading_search = true;
        $http.get(BASE_URL + '/api/search/?q=' + $scope.search)
          .then(function(response) {
            $scope.result = response.data
            $scope.loading_search = false;
          }, function(response) {
            alert('Could not connect to server.');
            $scope.loading_search = false;
          });
      };
      
      $window.onbeforeunload = function (event) {
        if ($scope.saving) {
          var message = 'Changes you made may not be saved.';
          if (typeof event == 'undefined') {
            event = window.event;
          }
          if (event) {
            event.returnValue = message;
          }
          return message;
        }
      }
      
      $scope.cloneCoursesOptions = {
        accept: function (sourceItemHandleScope, destSortableScope) {
          return true;
        },//override to determine drag is allowed or not. default is true.
        itemMoved: function (event) {},
        orderChanged: function(event) {},
        containment: '#planner',//optional param.
        clone: true, //optional param for clone feature.
        allowDuplicates: false //optional param allows duplicates to be dropped.
      };
      
      $scope.coursesOptions = {
        accept: function (sourceItemHandleScope, destSortableScope) {
          return true;
        },//override to determine drag is allowed or not. default is true.
        itemMoved: function (event) {},
        orderChanged: function(event) {},
        containment: '#planner',//optional param.
        clone: false, //optional param for clone feature.
        allowDuplicates: false //optional param allows duplicates to be dropped.
      };
    }
  })
  
  .controller('PlannerNewPlanCtrl', function($rootScope, $scope, $state, $http, BASE_URL, degrees) {
    $scope.degrees = degrees.data.results;
    $scope.selected_degrees = [];
    $scope.grad_year = '';
    
    $scope.successfulNewPlanYears = 0;
    
    $scope.denied = function() {
      $state.go('home');
    };
    
    $scope.approved = function(event) {
      if (isNaN($scope.grad_year) || !isFinite($scope.grad_year) || $scope.grad_year == false) {
        alert('Graduation Year Needs To Be a Number');
        event.preventDefault();
      }
      
      if ($scope.selected_degrees.length == 0) {
        alert('You need to select at least one projected degree.');
        event.preventDefault();
      }
      
      // Create Plan
      
      $http.post(BASE_URL + '/api/plans/', {degrees: $scope.selected_degrees})
        .then(function(response) {
          $scope.plan = response.data;
          alert('Created a new plan.');
          
          $scope.years = [];
          for (var i = 0; i < 4; i++) {
            $scope.years.push(($scope.grad_year - i - 1) + '-' + ($scope.grad_year - i));
          }
          
          for (var i in $scope.years) {
            $http.post(BASE_URL + '/api/plan_years/', {plan: $scope.plan.id, year: $scope.years[i], summer: [], autumn: [], winter: [], spring: []})
              .then(function(response) {
                $scope.successfulNewPlanYears++;
            }, function(response) {
              alert('Could not connect to server.');
            });
          }
      }, function(response) {
        alert('Could not connect to server.');
      });
    };
    
    $scope.$watch('successfulNewPlanYears', function(value) {
      console.log($scope.successfulNewPlanYears);
      if ($scope.successfulNewPlanYears == 4) {
        $state.go('planner', {fromNewPlan: true}, {reload: true});
      }
    });
    
    $('.ui.modal')
      .modal({
        closable  : false,
        onDeny    : $scope.denied,
        onApprove : $scope.approved,
      })
      .modal('show')
    ;
  })
  
  .filter('capitalize', function() {
      return function(input) {
        return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
      }
  })
  
  .config(function($stateProvider, $urlRouterProvider, $locationProvider) {
  
    $urlRouterProvider.otherwise('/');
  
    $locationProvider.html5Mode(true);
  
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'static/frontend/partials/home.html',
        controller: 'HomeCtrl',
        resolve: {
          'title': function($rootScope) {
            $rootScope.title = "Home";
          }
        }
      })
      .state('course', {
        url: '/course/:id',
        templateUrl: 'static/frontend/partials/course.html',
        controller: 'CourseCtrl',
        resolve: {
          'course': function($stateParams, $http, BASE_URL) {
            return $http({method: 'GET', url: BASE_URL + '/api/courses/' + $stateParams.id});
          },
          'plans': function($http, BASE_URL) {
            return $http({method: "GET", url: BASE_URL + '/api/plans/'})
          },
          'plan_years': function($http, BASE_URL, plans) {
            return $http({method: "GET", url: BASE_URL + '/api/plan_years/'})
          },
          'title': function($rootScope, course) {
            $rootScope.title = course.data.title;
          }
        }
      })
      .state('instructor', {
        url: '/instructor/:sunet',
        templateUrl: 'static/frontend/partials/instructor.html',
        controller: 'InstructorCtrl',
        resolve: {
          'instructor': function($stateParams, $http, BASE_URL) {
            return $http({method: "GET", url: BASE_URL + '/api/instructors/' + $stateParams.sunet});
          },
          'title': function($rootScope, instructor) {
            $rootScope.title = instructor.data.name;
          }
        }
      })
      .state('planner', {
        url: '/planner',
        templateUrl: 'static/frontend/partials/planner.html',
        controller: 'PlannerCtrl',
        resolve: {
          'plans': function($http, BASE_URL) {
            return $http({method: "GET", url: BASE_URL + '/api/plans/'})
          },
          'plan_years': function($http, BASE_URL, plans) {
            return $http({method: "GET", url: BASE_URL + '/api/plan_years/'})
          },
          'title': function($rootScope) {
            $rootScope.title = "Four Year Planner";
          }
        }
      })
      .state('planner.new_plan', {
        url: '/new_plan',
        templateUrl: 'static/frontend/partials/planner/new_plan.html',
        controller: 'PlannerNewPlanCtrl',
        resolve: {
          'degrees': function($http, BASE_URL, plans) {
            return $http({method: "GET", url: BASE_URL + '/api/degrees/?limit=1000'})
          },
          'title': function($rootScope) {
            $rootScope.title = "New Plan";
          }
        }
      })
      .state('error', {
        templateUrl: 'static/frontend/partials/error.html',
        resolve: {
          'title': function($rootScope) {
            $rootScope.title = "Error " + ($rootScope.errorStatus || 'Unknown');
          }
        }
      });
      
    $locationProvider.hashPrefix('!');
  })
  
  .run(function() {
    FastClick.attach(document.body);
  })
  
  .run(function($rootScope, $state) {
    $rootScope.$on('$stateChangeError', 
      function(event, toState, toParams, fromState, fromParams, error){
        event.preventDefault();
        $rootScope.errorStatus = error.status;
        if (toState.name == "course") {
          $rootScope.errorMessage = "Could not find course with given course id: " + toParams.id;
        }
        $state.go('error');
      });
  });

})();