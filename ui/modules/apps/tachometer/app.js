'use strict';

angular.module('beamng.apps')
.component('tachometerUi', {
  templateUrl: '/ui/modules/apps/tachometer/app.html',
  controller: function($scope, $element) {
    const streams = ['engineInfo', 'electrics'];
    StreamsManager.add(streams);

    const tachFill = $element[0].querySelector('#tachFill');
    const speedEl = $element[0].querySelector('#speedValue');
    const gearEl = $element[0].querySelector('#gearValue');

    const maxRPM = 7200;
    const pathLength = 180;
    tachFill.style.strokeDasharray = pathLength;

    $scope.$on('$destroy', function () {
      StreamsManager.remove(streams);
    });

    $scope.$on('streamsUpdate', function (event, s) {
      if (!s || !s.electrics || !s.engineInfo) return;

      // --- RPM как дуга ---
      const rpm = Math.round(s.electrics.rpmTacho || 0);
      const rpmPercent = Math.min(1, rpm / maxRPM);
      tachFill.style.strokeDashoffset = (pathLength - (pathLength * rpmPercent));
      console.log('RPM:', rpm, 'Offset:', tachFill.style.strokeDashoffset);

      // --- Скорость ---
      const speed = Math.round((s.electrics.wheelspeed || 0) * 3.6);
      if (speedEl) speedEl.textContent = speed;

      // --- Передача ---
      let gear = s.engineInfo[5] || 0;
      if (gear === 0) gear = 'N';
      else if (gear === -1) gear = 'R';
      if (gearEl) gearEl.textContent = gear;
    });
  }
});
