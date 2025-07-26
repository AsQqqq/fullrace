'use strict'

angular.module('beamng.apps')
.directive('brake', [function () {
  return {
    template: `
      <div style="width: 100%; height: 100%; position: relative; background-color: transparent">
            
          <div class="ui-left" style="position: absolute; top: 0; right: 0; width: 2.7%; height: 100%; background-color: white;"></div>
          
          <div class="ui-center" style="position: absolute; bottom: 50%; right: 0; width: 73%; height: 1.2%; background-color: white;"></div>
          
          <div class="ui-up" style="position: absolute; top: 0; left: 0; width: 100%; height: 1.2%; background-color: white;"></div>
          <div class="ui-down" style="position: absolute; bottom: 0; left: 0; width: 100%; height: 1.2%; background-color: white;"></div>
          
          <div id="brakeBar" style="width: 70%; height: 94%; background-color: rgb(202, 23, 23); position: absolute; left: 15%; bottom: 3%; transform-origin: bottom; transform: scaleY(0);"></div>
      </div>
    `,
    replace: true,
    restrict: 'EA',
    link: function (scope, element, attrs) {
        let streams = ['electrics']
        StreamsManager.add(streams)

        scope.$on('$destroy', function () {
            StreamsManager.remove(streams)
        })

        scope.$on('streamsUpdate', function (event, streams) {
            if (!streams || !streams.electrics) return

            let brake = Math.max(0, Math.min(1, streams.electrics.brake || 0))
            document.getElementById('brakeBar').style.transform = "scaleY(" + brake + ")";
        })
    }
  }
}])