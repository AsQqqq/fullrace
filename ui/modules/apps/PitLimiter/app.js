'use strict';

angular.module('beamng.apps')
.component('pitLimiterApp', {
  template: `
    <div style="width:100%; height:100%; position:relative; overflow:hidden; display:flex; justify-content:center; align-items:center;">
      <span ng-class="{'blink-text': status}" 
            ng-style="{color: 'white', 'font-size': '24px', 'font-weight': 'bold'}">
        {{ status ? 'BOX MODE' : '' }}
      </span>
    </div>
  `,
  controller: function($scope, $element) {
    // Добавляем стили мигания
    const style = document.createElement('style');
    style.textContent = `
      @keyframes blink {
        0%, 50%, 100% { opacity: 1; }
        25%, 75% { opacity: 0; }
      }
      .blink-text {
        animation: blink 1s infinite;
      }
    `;
    document.head.appendChild(style);

    $scope.status = false;

    $scope.$on("PitLimiterChanged", function (event, data) {
      print("PitLimiterChanged:", data);
      $scope.$evalAsync(() => {
        $scope.status = data.enabled;
      });
    });
  }
});
