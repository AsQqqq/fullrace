'use strict';

angular.module('beamng.apps')
.component('tyreWearMonitor', {
  template: `
    <div style="padding:10px; color:white; font-size:14px; background:rgba(0,0,0,0.5); border-radius:6px; width:300px;">
      <div style="margin-bottom:6px; font-weight:bold;">Tyre Wear & Thermals</div>
      <div style="margin-bottom:6px;">Wear Multiplier: {{wearMultiplier}}x</div>
      
      <table style="width:100%; border-collapse: collapse; text-align:center; margin-bottom:10px;">
        <thead>
          <tr>
            <th style="border-bottom:1px solid #888;">Wheel</th>
            <th style="border-bottom:1px solid #888;">Cond %</th>
            <th style="border-bottom:1px solid #888;">Temp °C</th>
            <th style="border-bottom:1px solid #888;">Grip</th>
          </tr>
        </thead>
        <tbody>
          <tr ng-repeat="t in tyres">
            <td>{{t.name}}</td>
            <td>{{t.condition}}</td>
            <td>{{t.avg_temp}}</td>
            <td>{{t.tyreGrip}}</td>
          </tr>
        </tbody>
      </table>

      <!-- Tachometer -->
      <div style="font-size: 14px; line-height: 1.4; text-align: left; padding: 5px; border: 1px solid #444; border-radius: 4px;">
        <div>RPM: <span id="rpmValue">0</span></div>
        <div>Throttle: <span id="throttleValue">0%</span></div>
        <div>Brake: <span id="brakeValue">0%</span></div>
        <div>Speed: <span id="speedValue">0 km/h</span></div>
        <div>Gear: <span id="gearValue">N</span></div>
        <div>Fuel: <span id="fuelValue">0%</span></div>
      </div>
    </div>
  `,
  controller: function($scope) {
    // Tyre Wear Logic
    $scope.wearMultiplier = 1;
    $scope.tyres = [];

    $scope.$on('TyreWearThermals', function(event, data) {
      if (!data || !data.data) return;
      $scope.tyres = data.data;
      $scope.wearMultiplier = data.wearMultiplier || 1;
      $scope.$applyAsync();
    });

    // Tachometer Logic
    const streams = ['engineInfo', 'electrics', 'throttle', 'brake'];
    StreamsManager.add(streams);

    $scope.$on('$destroy', function () {
      StreamsManager.remove(streams);
    });

    $scope.$on('streamsUpdate', function (event, s) {
      if (!s || !s.electrics || !s.engineInfo) return;

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
    });
  }
});
