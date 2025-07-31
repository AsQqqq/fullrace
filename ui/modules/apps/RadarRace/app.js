angular.module('beamng.apps')
.directive('oldnavigation', [function () {
  return {
    template: `
    <div id="radarContainer" style="width:100%; height:100%; background: rgba(255, 255, 255, 0); overflow:hidden; position:relative; opacity:1; transition:opacity 0.5s ease-in-out;">
      <svg id="roads" style="position:absolute; width:100%; height:100%;"></svg>
      <svg id="vehicles" style="position:absolute; width:100%; height:100%;"></svg>
    </div>
    `,
    replace: true,
    restrict: 'EA',
    link: function (scope, element) {
      const radarContainer = element[0].querySelector('#radarContainer');
      const roadsSvg = element[0].querySelector('#roads');
      const vehiclesSvg = element[0].querySelector('#vehicles');

      let vehicleShapes = {};
      let lastPlayerID = -1;
      let size = 200;
      const BASE_ZOOM = 14;
      let radarVisible = true;

      let nodes = null;

      scope.$on('app:resized', function (event, data) {
        size = Math.min(data.width, data.height);
        angular.element(element[0]).css({
          height: `${size}px`,
          width: `${size}px`
        });
      });

      function createVehicleShape(id, isPlayer, size = 0.22) {
        if (vehicleShapes[id]) vehicleShapes[id].remove();

        const basePoints = [
          [0, -10],
          [-8, 10],
          [0, 7],
          [8, 10]
        ];

        const scaledPoints = basePoints
          .map(([x, y]) => `${x * size},${y * size}`)
          .join(' ');

        const shape = hu('<polygon>', vehiclesSvg)
          .attr('points', scaledPoints)
          .css('fill', isPlayer ? '#d4d4d4ff' : '#949494ff')
          .css('stroke', 'rgba(0, 0, 0, 0.2)')
          .css('stroke-width', `${1.5 * size}px`);

        vehicleShapes[id] = shape;
      }

      // Проверка, есть ли машина слева/справа/сзади
      function isVehicleNearby(player, other) {
        const dx = other.posX - player.posX;
        const dy = other.posY - player.posY;

        // угол игрока в радианах
        const rotRad = -player.rot * Math.PI / 180;
        // локальные координаты относительно игрока
        const relX = dx * Math.cos(rotRad) - dy * Math.sin(rotRad);
        const relY = dx * Math.sin(rotRad) + dy * Math.cos(rotRad);

        const range = 30; // дистанция

        // проверяем зоны
        const isSide = Math.abs(relX) <= range && Math.abs(relY) <= 20;
        const isBack = relY <= -5 && Math.abs(relX) <= 20;

        return isSide || isBack;
      }

      // Отрисовка дорог
      function drawRoads() {
        if (!nodes) return;
        roadsSvg.innerHTML = ''; 

        const roadGroup = hu('<g>', roadsSvg)
          .css('opacity', 0.35); 

        for (let key in nodes) {
          const el = nodes[key];
          if (!el.links) continue;
          for (let key2 in el.links) {
            const el2 = nodes[key2];
            if (el2) {
              const roadWidth = (((el.radius || 1) + (el2.radius || 1)) / 2) * 2;
              hu('<line>', roadGroup).attr({
                x1: -el.pos[0],
                y1: el.pos[1],
                x2: -el2.pos[0],
                y2: el2.pos[1],
                'stroke': '#000000',
                'stroke-width': roadWidth,
                'stroke-linecap': 'round',
                'class': 'road-line'
              });
            }
          }
        }
      }

      scope.$on('NavigationMapOld', function (event, data) {
        if (data.nodes) {
          nodes = data.nodes;
          drawRoads();
        }
      });

      scope.$on('NavigationMapUpdateOld', function (event, data) {
        console.log('Objects:', JSON.stringify(data.objects));
        const playerObj = data.objects[data.playerID];
        if (!playerObj) return;

        const zoom = BASE_ZOOM;
        const viewBox = [
          playerObj.posX - zoom,
          playerObj.posY - zoom,
          zoom * 2,
          zoom * 2,
        ].join(' ');

        roadsSvg.setAttribute('viewBox', viewBox);
        vehiclesSvg.setAttribute('viewBox', viewBox);

        roadsSvg.style.transform = `rotate(${-playerObj.rot}deg)`;
        vehiclesSvg.style.transform = `rotate(${-playerObj.rot}deg)`;

        let nearbyVehicle = false;

        // Обновляем позиции машин
        for (let key in data.objects) {
          const o = data.objects[key];
          if (!vehicleShapes[key]) {
            createVehicleShape(key, key == data.playerID);
          }
          vehicleShapes[key].attr(
            'transform',
            `translate(${o.posX},${o.posY}) rotate(${o.rot})`
          );

          if (key !== data.playerID && isVehicleNearby(playerObj, o)) {
            nearbyVehicle = true;
          }
        }

        // Управление прозрачностью радара
        if (nearbyVehicle) {
          if (!radarVisible) {
            radarContainer.style.transition = 'opacity 0.1s ease-in-out';
            radarContainer.style.opacity = 1;
            radarVisible = true;
          }
        } else {
          if (radarVisible) {
            radarContainer.style.transition = 'opacity 0.5s ease-in-out';
            radarContainer.style.opacity = 0;
            radarVisible = false;
          }
        }

        // Обновляем игрока
        if (lastPlayerID !== data.playerID) {
          if (lastPlayerID !== -1) createVehicleShape(lastPlayerID, false);
          createVehicleShape(data.playerID, true);
          lastPlayerID = data.playerID;
        }

        // Удаляем исчезнувшие машины
        for (let key in vehicleShapes) {
          if (!data.objects[key]) {
            vehicleShapes[key].remove();
            delete vehicleShapes[key];
          }
        }
      });

      scope.$on('$destroy', function () {
        bngApi.engineLua('extensions.unload("ui_uiNaviOld")');
      });

      bngApi.engineLua('extensions.load("ui_uiNaviOld")');
      bngApi.engineLua('extensions.ui_uiNaviOld.requestUIDashboardMap()');
    }
  };
}]);
