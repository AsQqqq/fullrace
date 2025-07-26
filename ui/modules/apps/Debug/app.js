'use strict';

angular.module('beamng.apps')
.component('tyreWearMonitor', {
  templateUrl: '/ui/modules/apps/Debug/app.html',
  controller: ['$scope', function($scope) {
    // Переменные UI
    $scope.wearMultiplier = 1;
    $scope.tyres = [];
    $scope.data1 = '';
    $scope.data2 = '';
    $scope.data3 = '';
    $scope.data4 = '';

    // Потоки
    const tyreStreams = ['TyreWearThermals'];
    const streams = ['engineInfo', 'electrics', 'throttle', 'brake'];
    StreamsManager.add(tyreStreams);
    StreamsManager.add(streams);

    $scope.$on('$destroy', function() {
      StreamsManager.remove(tyreStreams);
      StreamsManager.remove(streams);
    });

    // Переменные для расхода топлива
    let distanceTravelled = 0,
        fuelUsed = 0,
        avgFuelConsumption = 0,
        range = 0,
        fuelLevelLastReset = 0,
        autoResetOk = false,
        lastWheelSpeed = 0,
        timer = 0,
        prevTime = performance.now(),
        curTime = prevTime;
    let lastFuelCapacity;

    $scope.reset = function() {
      fuelUsed = 0;
      avgFuelConsumption = 0;
      range = 0;
      fuelLevelLastReset = 0;
      autoResetOk = false;
      timer = 0;
      prevTime = performance.now();
      curTime = prevTime;
    };

    $scope.$on('VehicleFocusChanged', function() {
      $scope.reset();
    });

    $scope.$on('streamsUpdate', function(event, s) {
      if (!s) return;

      // --- ЛОГИКА ШИН ---
      if (s.TyreWearThermals && s.TyreWearThermals.data) {
        $scope.wearMultiplier = s.TyreWearThermals.wearMultiplier || 1;
        $scope.tyres = s.TyreWearThermals.data.map(t => ({
          name: t.name,
          condition: Math.floor(t.condition)
        }));
      }

      // --- ЛОГИКА ТАХОМЕТРА + ТОПЛИВА ---
      if (s.electrics && s.engineInfo) {
        // RPM
        let rpm = Math.round(s.electrics.rpmTacho || 0);
        document.getElementById('rpmValue').textContent = rpm;

        // Throttle
        let throttle = Math.round((s.electrics.throttle || 0) * 100);
        document.getElementById('throttleValue').textContent = throttle + '%';

        // Brake
        let brake = Math.round((s.electrics.brake || 0) * 100);
        document.getElementById('brakeValue').textContent = brake + '%';

        // Speed
        let speed = Math.round((s.electrics.wheelspeed || 0) * 3.6);
        document.getElementById('speedValue').textContent = speed + ' km/h';

        // Gear
        let gear = s.engineInfo[5] || 0;
        if (gear === 0) gear = 'N';
        else if (gear === -1) gear = 'R';
        document.getElementById('gearValue').textContent = gear;

        // Fuel
        let fuel = Math.round((s.electrics.fuel || 0) * 100);
        document.getElementById('fuelValue').textContent = fuel + '%';

        // --- РАСЧЕТ СРЕДНЕГО РАСХОДА ---
        let wheelSpeed = s.electrics.wheelspeed;
        let currentFuel = s.engineInfo[11];
        let fuelCapacity = s.engineInfo[12];

        prevTime = curTime;
        curTime = performance.now();
        timer -= 0.001 * (curTime - prevTime);
        if (timer < 0) {
          if (wheelSpeed > 0.2 && wheelSpeed != lastWheelSpeed) {
            distanceTravelled += ((1.0 - timer) * wheelSpeed);
          }
          timer = 1;
        }
        lastWheelSpeed = wheelSpeed;

        if (fuelLevelLastReset === 0 && currentFuel > 0) {
          distanceTravelled = 0;
          fuelLevelLastReset = currentFuel;
          lastFuelCapacity = fuelCapacity;
        }

        if (autoResetOk &&
            (currentFuel >= fuelLevelLastReset || fuelCapacity != lastFuelCapacity)) {
          distanceTravelled = 0;
          fuelLevelLastReset = currentFuel;
          lastFuelCapacity = fuelCapacity;
          autoResetOk = false;
        }

        if (!autoResetOk &&
            (currentFuel < fuelLevelLastReset || distanceTravelled > 0)) {
          autoResetOk = true;
        }

        fuelUsed = fuelLevelLastReset - currentFuel;
        avgFuelConsumption = (distanceTravelled > 0)
          ? fuelUsed / distanceTravelled
          : 0;

        range = (avgFuelConsumption > 0)
          ? UiUnits.buildString('distance', currentFuel / avgFuelConsumption, 2)
          : (s.electrics.wheelspeed > 0.1 ? 'Infinity' : UiUnits.buildString('distance', 0));

        $scope.data1 = UiUnits.buildString('distance', distanceTravelled, 1);
        $scope.data2 = UiUnits.buildString('volume', fuelUsed, 2) + '/'
                      + UiUnits.buildString('volume', currentFuel, 2) + '/'
                      + UiUnits.buildString('volume', fuelCapacity, 1);
        $scope.data3 = UiUnits.buildString('consumptionRate', avgFuelConsumption, 1);
        $scope.data4 = range;
      }

      $scope.$applyAsync();
    });
  }]
});
