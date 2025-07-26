'use strict';

angular.module('beamng.apps')
.component('pitstopTimer', {
  template: `
    <div ng-if="visible" style="
        position: absolute;
        top: 0; left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(0, 0, 0, 0);
        font-size: 28px;
        color: white;
        font-weight: bold;
        font-family: Arial, sans-serif;
    ">
        {{ totalTimeLeft }}s
    </div>
  `,
  controller: function($scope, $interval) {
    $scope.totalTimeLeft = 0;
    $scope.visible = false;

    $interval(() => {
      bngApi.engineLua('extensions.pitstopControl.getPitTimer()', (time) => {
        $scope.$applyAsync(() => {
          $scope.totalTimeLeft = time;
          $scope.visible = time > 0;
        });
      });
    }, 1000);
  }
});
