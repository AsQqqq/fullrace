angular.module('beamng.apps')
.directive('tyreWearThermals', [function () {
    return {
        template: `
        <div class="tyre-wrapper" style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr auto 1fr;
            gap: 10% 30%; 
            color: white;
            justify-items: center;
            align-items: center;
            padding: 5%;
            position: relative;
            width: 100%;
            height: 100%;
        ">

        <!-- Front Left (FL) -->
        <div class="tyre" style="width:55%; height:150%; display:flex; flex-direction:column; align-items:center; grid-row: 1; grid-column: 1;">
            <div class="tyre-bar-container" style="width:55%; height:150%; background:rgba(0,0,0,0.4); position:relative; overflow:hidden;">
                <div class="tyre-fill fl" style="width:100%; position:absolute; bottom:0; height:50%; background:#fff;"></div>
            </div>
        </div>

        <!-- Front Right (FR) -->
        <div class="tyre" style="width:55%; height:150%; display:flex; flex-direction:column; align-items:center; grid-row: 1; grid-column: 2;">
            <div class="tyre-bar-container" style="width:55%; height:150%; background:rgba(0,0,0,0.4); position:relative; overflow:hidden;">
                <div class="tyre-fill fr" style="width:100%; position:absolute; bottom:0; height:60%; background:#fff;"></div>
            </div>
        </div>

        <!-- Иконка по центру -->
        <div id="tempIcon" style="
            grid-row: 2;
            grid-column: 1 / span 2;
            opacity: 0.4; 
            width: 20%;
            max-width: 100px;
            justify-self: center;
            align-self: center;
            transition: opacity 0.3s ease-in-out;
        ">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-temperature">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5" />
                <path d="M10 9l4 0" />
            </svg>
        </div>

        <!-- Rear Left (RL) -->
        <div class="tyre" style="width:55%; height:150%; display:flex; flex-direction:column; align-items:center; grid-row: 3; grid-column: 1;">
            <div class="tyre-bar-container" style="width:55%; height:150%; background:rgba(0,0,0,0.4); position:relative; overflow:hidden;">
                <div class="tyre-fill rl" style="width:100%; position:absolute; bottom:0; height:40%; background:#fff;"></div>
            </div>
        </div>

        <!-- Rear Right (RR) -->
        <div class="tyre" style="width:55%; height:150%; display:flex; flex-direction:column; align-items:center; grid-row: 3; grid-column: 2;">
            <div class="tyre-bar-container" style="width:55%; height:150%; background:rgba(0,0,0,0.4); position:relative; overflow:hidden;">
                <div class="tyre-fill rr" style="width:100%; position:absolute; bottom:0; height:70%; background:#fff;"></div>
            </div>
        </div>
        `,
        replace: true,
        restrict: 'EA',
        link: function (scope, element) {
            let streamsList = ['TyreWearThermals'];
            StreamsManager.add(streamsList);

            // Ссылка на иконку температуры
            const tempIcon = element[0].querySelector('#tempIcon');
            let blinkInterval = null;

            scope.$on('$destroy', function() {
                StreamsManager.remove(streamsList);
                if (blinkInterval) clearInterval(blinkInterval);
            });

            scope.$on('streamsUpdate', function(event, streams) {
                const data = streams.TyreWearThermals.data;
                if (!data) return;

                let maxTemp = 0;

                // Обновление колес
                ['fl', 'fr', 'rl', 'rr'].forEach((cls) => {
                    const wheelData = data.find(w => w.name.toLowerCase() === cls);
                    if (!wheelData) return;

                    const temp = Math.floor(wheelData.avg_temp);
                    const cond = Math.floor(wheelData.condition);
                    maxTemp = Math.max(maxTemp, temp);

                    const fill = element[0].querySelector(`.${cls}`);
                    if (fill) {
                        fill.style.height = cond + '%';
                    }
                });

                // Если температура высокая, мигаем
                if (maxTemp > 95) {
                    if (!blinkInterval) {
                        blinkInterval = setInterval(() => {
                            tempIcon.style.opacity = (tempIcon.style.opacity === '0.4') ? '1' : '0.4';
                        }, 500);
                    }
                } else {
                    // Прекращаем мигание
                    if (blinkInterval) {
                        clearInterval(blinkInterval);
                        blinkInterval = null;
                    }
                    tempIcon.style.opacity = '0.4';
                }
            });
        }
    }
}]);
