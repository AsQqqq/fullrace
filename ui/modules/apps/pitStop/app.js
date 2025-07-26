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
            <!-- Замена шин -->
            <div style="margin-bottom: 15px;">
              <button style="
                  padding: 10px 20px;
                  font-size: 16px;
                  background: #333;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
              ">Замена шин</button>
              <div style="margin-top: 5px; font-size: 14px; color: #555;">
                  Время: <span id="tyreTime">--:--:--</span>
              </div>
            </div>

            <!-- Пополнение топлива -->
            <div style="margin-bottom: 20px;">
              <div style="margin-bottom: 6px; font-size: 14px; color: #333;">Заправить до (%):</div>
              <input type="number" 
                    ng-model="fuelTarget"
                    ng-change="updateFuelTarget(fuelTarget)"
                    min="0" max="100" step="1"
                    style="width: 100%; margin-bottom: 10px; padding: 5px; text-align: center;">
              <button ng-click="refuel()" style="
                  padding: 10px 20px;
                  font-size: 16px;
                  background: #333;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
              ">Заправить</button>
              <div style="margin-top: 5px; font-size: 14px; color: #555;">
                  Время: <span id="fuelTime">--:--:--</span>
              </div>
            </div>

          <div ng-if="!conditionsOk" style="color:red; font-weight:bold;">
            Условия пит-стопа не выполнены!
          </div>

          <!-- Информация -->
          <div style="
            text-align: left;
            font-size: 14px;
            line-height: 1.5;
            background: #f8f8f8;
            padding: 10px;
            border-radius: 4px;
            color: #333;
            margin-top: 10px;
          ">
            <div>Износ шин: LF <span id="lfWear">0%</span>, RF <span id="rfWear">0%</span>, LR <span id="lrWear">0%</span>, RR <span id="rrWear">0%</span></div>
            <div>Топливо: {{currentFuel}} %</div>
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
    $scope.fuelTarget = 50; // дефолт
    $scope.currentFuel = 0;

    $scope.updateFuelTarget = function(value) {
      $scope.fuelTarget = parseFloat(value) || 0;
      console.log("fuelTarget changed to:", $scope.fuelTarget);
    };

    // Обновление данных топлива + проверка условий
    $scope.$on('streamsUpdate', function (event, s) {
      if (!s || !s.electrics || !s.engineInfo) return;

      $scope.$evalAsync(() => {
        $scope.currentFuel = Math.round((s.electrics.fuel || 0) * 100);
      });

      const isStopped = (s.electrics.wheelspeed || 0) < 0.1;
      const isEngineOff = (s.electrics.ignitionLevel || 0) === 0;
      const isParkingBrake = (s.electrics.parkingbrake || 0) > 0.1;
      const isNeutral = (s.engineInfo[5] || 0) === 0;

      $scope.conditionsOk = isStopped && isEngineOff && isParkingBrake && isNeutral;
    });

    // Заправка машины
    $scope.refuel = function() {
      console.log("fuelTarget before refuel:", $scope.fuelTarget);
      const percent = Math.max(0, Math.min(100, parseFloat($scope.fuelTarget) || 100)); // parseFloat!
      const ratio = (percent / 100).toFixed(2);

      bngApi.engineLua(`
        local veh = be:getPlayerVehicle(0)
        if veh then
          veh:queueLuaCommand(string.format([[ 
            for _, storage in pairs(energyStorage.getStorages()) do
              local currentRatio = storage.storedEnergy / storage.energyCapacity
              local targetRatio = %.2f
              if currentRatio < targetRatio then
                storage.storedEnergy = storage.energyCapacity * targetRatio
              end
            end
          ]], ${ratio}))
        end
      `);

      console.log("Refuel target:", percent + "%");
    };

    // Слушаем событие из Lua
    $scope.$on("PitStopMenuToggle", function (event, data) {
      $scope.$evalAsync(() => {
        $scope.status = data.enabled; 
      });
    });
  }
});
