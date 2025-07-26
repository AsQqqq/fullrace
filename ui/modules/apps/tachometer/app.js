'use strict';

angular.module('beamng.apps')
.component('tachometerUi', {
  template: `
    <div style="
      width:100%;
      height:100%;
      display:flex;
      justify-content:center;
      align-items:center;
      background:rgba(0,0,0,0.5);
      border-radius:4px;
      color:white;
      font-size:18px;
      font-weight:bold;
    ">
      RPM: <span id="rpmValueTach" style="margin-left:5px;">0</span>
    </div>
  `,
  controller: function($scope) {
    const streams = ['engineInfo', 'electrics'];
    StreamsManager.add(streams);

    $scope.$on('$destroy', function () {
      StreamsManager.remove(streams);
    });

    $scope.$on('streamsUpdate', function (event, s) {
      if (!s || !s.electrics) return;

      let rpm = Math.round(s.electrics.rpmTacho || 0);
      document.getElementById('rpmValueTach').textContent = rpm;
    });
  }
});
