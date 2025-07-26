'use strict';

angular.module('beamng.apps')
.component('pitstopUi', {
  template: `
    <div ng-if="status" style="
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.56);
      display: flex;
      justify-content: center;
      align-items: center;
    ">
      <div style="
          background: white;
          color: black;
          padding: 30px;
          border-radius: 8px;
          width: 400px;
          text-align: center;
          font-family: Arial, sans-serif;
      ">
          <h2 style="margin-bottom: 20px; font-size: 24px; font-weight: bold;">Пит-Стоп Меню</h2>

          <div ng-if="conditionsOk">
            <!-- Выбор замены шин -->
            <div style="margin-bottom: 15px; text-align:left;">
              <label>
                <input type="checkbox" ng-model="doTyres" ng-change="updateTyreTarget(doTyres)">
                Замена шин (10 сек)
              </label>
            </div>

            <!-- Пополнение топлива -->
            <div style="margin-bottom: 20px; text-align:left;">
              <div style="margin-bottom: 6px; font-size: 14px; color: #333;">Заправить до (%):</div>
              <input type="number" 
                    ng-model="fuelTarget"
                    ng-change="updateFuelTarget(fuelTarget)"
                    min="0" max="100" step="1"
                    style="width: 100%; margin-bottom: 10px; padding: 5px; text-align: center;">
              <div style="font-size: 12px; color: #555;">Текущее: {{currentFuel}}%</div>
            </div>

            <!-- Выполнить питстоп -->
            <button ng-click="startPitStop()" style="
                  padding: 10px 20px;
                  font-size: 16px;
                  background: #333;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
              ">Выполнить Пит-Стоп</button>
          </div>

          <div ng-if="!conditionsOk" style="color:red; font-weight:bold;">
            Условия пит-стопа не выполнены!
          </div>
      </div>
    </div>
  `,
  controller: function($scope) {
    const streams = ['engineInfo', 'electrics'];
    StreamsManager.add(streams);

    $scope.$on('$destroy', function () {
      StreamsManager.remove(streams);
    });

    $scope.status = false;
    $scope.conditionsOk = false;
    $scope.fuelTarget = 50;
    $scope.currentFuel = 0;
    $scope.doTyres = false;

    // Новая переменная для хранения последнего значения топлива
    let lastFuelLevel = 0;

    $scope.updateFuelTarget = function(value) {
      $scope.fuelTarget = Math.max(0, Math.min(100, parseFloat(value) || 0));
      $scope.userSetFuel = true;
      console.log("fuelTarget changed to:", $scope.fuelTarget);
    };
    
    $scope.updateTyreTarget = function(value) {
      $scope.doTyres = value;
      console.log("Tyre changed to:", $scope.doTyres);
    };

    // Обновление данных топлива + проверка условий
    $scope.$on('streamsUpdate', function (event, s) {
      if (!s || !s.electrics || !s.engineInfo) return;

      $scope.$evalAsync(() => {
        const rawFuel = (s.electrics.fuel || 0) * 100;

        // Если двигатель работает или fuel > 0, обновляем lastFuelLevel
        if (rawFuel > 0.1) {
          lastFuelLevel = Math.round(rawFuel);
        }

        // Текущее топливо = lastFuelLevel, если двигатель заглушен
        $scope.currentFuel = lastFuelLevel;

        // Если пользователь не трогал fuelTarget, синхронизируем его с баком
        if (!$scope.userSetFuel) {
          $scope.fuelTarget = $scope.currentFuel;
        }
      });

      const isStopped = (s.electrics.wheelspeed || 0) < 0.1;
      const isEngineOff = (s.electrics.ignitionLevel || 0) === 0;
      const isParkingBrake = (s.electrics.parkingbrake || 0) > 0.1;
      const isNeutral = (s.engineInfo[5] || 0) === 0;

      $scope.conditionsOk = isStopped && isEngineOff && isParkingBrake && isNeutral;
    });

    $scope.startPitStop = function() {
      let doFuel = $scope.fuelTarget > $scope.currentFuel;
      let totalTime = 0;
      if ($scope.doTyres) totalTime += 10;
      if (doFuel) totalTime += 20;

      console.log(`Pitstop started: tyres=${$scope.doTyres}, fuel=${doFuel}, time=${totalTime}s`);

      bngApi.engineLua(`
        extensions.pitstopControl.startPitTimer(${totalTime}, ${$scope.doTyres}, ${doFuel}, ${($scope.fuelTarget / 100).toFixed(2)})
      `);
    };

    $scope.$on("PitStopMenuToggle", function (event, data) {
      $scope.$evalAsync(() => {
        $scope.status = data.enabled; 
      });
    });
  }
});
