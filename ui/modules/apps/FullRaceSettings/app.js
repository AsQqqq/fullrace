'use strict';

angular.module('beamng.apps')
.component('raceFullSettings', {
  template: `
    <div style="color:white;margin-bottom:6px;">Pit Limit (km/h):</div>
    <input type="number" ng-model="speed" min="10" max="200" style="width:100%; margin-bottom:10px;"/>

    <div style="color:white;margin-bottom:6px;">Tyre Wear Speed:</div>
    <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px;">
      <button ng-repeat="option in wearOptions"
              ng-click="setWear(option)"
              ng-style="{'background': wearMultiplier==option ? '#4caf50' : '#444', 'color': 'white', 'padding':'5px 10px', 'border':'none', 'cursor':'pointer'}">
        {{option}}x
      </button>
    </div>

    <button ng-click="apply()" style="width:100%;">Apply</button>
  `,
  controller: function($scope) {
    $scope.speed = 80;
    $scope.wearMultiplier = 1;
    $scope.wearOptions = [0.5, 1, 2, 3, 5, 10];

    $scope.setWear = function(option) {
      $scope.wearMultiplier = option;
    };

    $scope.apply = function () {
      const val = parseFloat($scope.speed);
      const wear = parseFloat($scope.wearMultiplier);

      if (!isNaN(val)) {
        bngApi.engineLua(
          `be:getPlayerVehicle(0):queueLuaCommand("extensions.pitLimiterVehicle.setLimitKph(${val})")`
        );
      }

      if (!isNaN(wear)) {
        bngApi.engineLua(
          `be:getPlayerVehicle(0):queueLuaCommand("extensions.auto.LuuksTyreThermalsAndWear.setWearMultiplier(${wear})")`
        );
      }
    };
  }
});
