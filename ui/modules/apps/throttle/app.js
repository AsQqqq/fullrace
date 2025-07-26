'use strict'

angular.module('beamng.apps')
.directive('throttle', [function () {
  return {
    template: `
      <div style="width: 100%; height: 100%; position: relative; background-color: transparent">
        
          <div class="ui-left" style="position: absolute; top: 0; left: 0; width: 2.7%; height: 100%; background-color: white;"></div>
          
          <div class="ui-center" style="position: absolute; bottom: 50%; left: 0; width: 73%; height: 1.2%; background-color: white;"></div>
          
          <div class="ui-up" style="position: absolute; top: 0; left: 0; width: 100%; height: 1.2%; background-color: white;"></div>
          <div class="ui-down" style="position: absolute; bottom: 0; left: 0; width: 100%; height: 1.2%; background-color: white;"></div>
          
          <div id="throttleBar" style="width: 70%; height: 94%; background-color: white; position: absolute; left: 15%; bottom: 3%; transform-origin: bottom; transform: scaleY(0);"></div>
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

            let throttle = Math.max(0, Math.min(1, streams.electrics.throttle || 0))
            document.getElementById('throttleBar').style.transform = "scaleY(" + throttle + ")";
        })
    }
  }
}])