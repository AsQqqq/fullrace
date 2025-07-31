angular.module('beamng.apps').directive('gforcesDetector', [function () {
  return {
    templateUrl: '/ui/modules/apps/gforcesdetector/app.html',
    replace: true,
    restrict: 'EA',
    link: function (scope, element, attrs) {
      var streamsList = ['sensors', 'stats'];
      StreamsManager.add(streamsList);
      scope.lastCrash = null;
      var minG = 1.5;
      var lastDeformed = null;
      var clearTimer = null;
      var valueEl, unitEl, mainEl;
      var lastVehicleId = null; // Для отслеживания смены автомобиля
      var lastDamage = null;    // Для отслеживания починки
      
      element.ready(function () {
        valueEl = document.getElementById('gforces-value');
        unitEl = document.getElementById('gforces-unit');
        mainEl = element.find('.gforces-main-design')[0];

        // Устанавливаем начальную прозрачность
        if (element[0] && element[0].parentElement && element[0].parentElement.parentElement) {
          element[0].parentElement.parentElement.style.opacity = '0.2';
        }

        // === Адаптивный скейл ===
        function autoScale() {
          const parent = element[0].parentElement;
          if (!parent) return;
          const scaleX = parent.clientWidth / 300;  // 300 - базовая ширина
          const scaleY = parent.clientHeight / 100; // 100 - базовая высота
          const scale = Math.min(scaleX, scaleY);
          mainEl.style.transform = `scale(${scale})`;
          mainEl.style.transformOrigin = 'center';
        }

        window.addEventListener('resize', autoScale);
        autoScale();
      });
      
      scope.$on('$destroy', function () {
        StreamsManager.remove(streamsList);
        if (clearTimer) clearTimeout(clearTimer);
      });
      
      // Функция для сброса счетчика
      function resetGForceCounter() {
        scope.lastCrash = null;
        lastDeformed = null;
        if (clearTimer) {
          clearTimeout(clearTimer);
          clearTimer = null;
        }
        updateDisplay();
        console.log('gForcesDetector: Counter reset');
        scope.$evalAsync();
      }
      function updateDisplay(g) {
        if (valueEl) {
          // Remove all G-force level classes
          if (mainEl) {
            mainEl.classList.remove('low-g', 'medium-g', 'high-g', 'extreme-g');
          }
          
          // Управление прозрачностью через родительский элемент (как в ZeitSimpleAirSpeed)
          var parentOpacity = '1';
          if (g === undefined) {
            parentOpacity = '0.2';
          }
          
          if (element[0] && element[0].parentElement && element[0].parentElement.parentElement) {
            element[0].parentElement.parentElement.style.opacity = parentOpacity;
          }
          
          if (g !== undefined) {
            valueEl.textContent = g.toFixed(2);
            
            // Apply colors and effects directly via JavaScript
            if (g < 3) {
              // Low G - Green
              valueEl.style.color = '#4CAF50';
              valueEl.style.textShadow = '0 0 20px rgba(76, 175, 80, 0.8), 0 3px 6px rgba(0, 0, 0, 0.8)';
              if (mainEl) {
                mainEl.style.background = 'linear-gradient(145deg, #1e3a1e 0%, #0d1f0d 50%, #050c05 100%)';
                mainEl.style.borderLeft = '3px solid #4CAF50';
              }
            } else if (g < 5) {
              // Medium G - Orange
              valueEl.style.color = '#FF9800';
              valueEl.style.textShadow = '0 0 20px rgba(255, 152, 0, 0.8), 0 3px 6px rgba(0, 0, 0, 0.8)';
              if (mainEl) {
                mainEl.style.background = 'linear-gradient(145deg, #3a2e1e 0%, #1f150d 50%, #0c0905 100%)';
                mainEl.style.borderLeft = '3px solid #FF9800';
              }
            } else if (g < 8) {
              // High G - Red
              valueEl.style.color = '#F44336';
              valueEl.style.textShadow = '0 0 25px rgba(244, 67, 54, 0.9), 0 3px 6px rgba(0, 0, 0, 0.8)';
              valueEl.style.fontWeight = '1000';
              if (mainEl) {
                mainEl.style.background = 'linear-gradient(145deg, #3a1e1e 0%, #1f0d0d 50%, #0c0505 100%)';
                mainEl.style.borderLeft = '3px solid #F44336';
              }
            } else {
              // Extreme G - Pink
              valueEl.style.color = '#E91E63';
              valueEl.style.textShadow = '0 0 30px rgba(233, 30, 99, 1), 0 0 15px rgba(233, 30, 99, 0.8), 0 3px 6px rgba(0, 0, 0, 0.9)';
              valueEl.style.fontWeight = '1000';
              if (mainEl) {
                mainEl.style.background = 'linear-gradient(145deg, #3a1e2e 0%, #1f0d15 50%, #0c0509 100%)';
                mainEl.style.borderLeft = '3px solid #E91E63';
                mainEl.style.animation = 'danger-pulse 0.8s ease-in-out infinite alternate';
              }
            }
            
            if (unitEl) {
              unitEl.style.display = '';
            }
          } else {
            // No data state
            valueEl.textContent = '--.--';
            valueEl.style.color = '#ffffff';
            valueEl.style.textShadow = '0 3px 6px rgba(0, 0, 0, 0.8)';
            valueEl.style.fontWeight = '900';
            if (mainEl) {
              mainEl.style.background = 'linear-gradient(145deg, #2a2a2a 0%, #1e1e1e 50%, #0f0f0f 100%)';
              mainEl.style.borderLeft = 'none';
              mainEl.style.animation = 'none';
            }
            if (unitEl) {
              unitEl.style.display = '';
            }
          }
        }
      }
      
      scope.getGColor = function(g) {
        if (g < 4) return '#37ec37';
        if (g < 6) return '#ffd35b';
        if (g < 8) return '#ffa25b';
        return '#ff5e5e';
      };
      
      function scheduleClear() {
        if (clearTimer) clearTimeout(clearTimer);
        clearTimer = setTimeout(function() {
          scope.$apply(function() { scope.lastCrash = null; updateDisplay(); });
        }, 10000);
      }
      
      scope.$on('streamsUpdate', function (event, streams) {
        if (!streams.sensors || !streams.stats) return;
        
        // Проверяем смену автомобиля по ID
        var currentVehicleId = streams.sensors.vehicleId || streams.stats.vehicleId || 'default';
        if (lastVehicleId !== null && lastVehicleId !== currentVehicleId) {
          console.log('gForcesDetector: Vehicle changed, resetting counter');
          resetGForceCounter();
        }
        lastVehicleId = currentVehicleId;
        
        // Проверяем починку автомобиля по урону
        var currentDamage = streams.stats.damage || streams.stats.beams_deformed || 0;
        if (lastDamage !== null && currentDamage < lastDamage * 0.5) {
          // Если урон значительно уменьшился (более чем в 2 раза), считаем что была починка
          console.log('gForcesDetector: Vehicle repaired, resetting counter');
          resetGForceCounter();
        }
        lastDamage = currentDamage;
        
        var gravity = streams.sensors.gravity;
        gravity = gravity >= 0 ? Math.max(0.1, gravity) : Math.min(-0.1, gravity);
        var gx = streams.sensors.gx2 / -gravity;
        var gy = streams.sensors.gy2 / -gravity;
        var g = Math.sqrt(gx*gx + gy*gy);
        var deformed = streams.stats.beams_deformed || 0;
        if (lastDeformed === null) lastDeformed = deformed;
        if (deformed > lastDeformed && g >= minG) {
          if (!scope.lastCrash || g > scope.lastCrash.g) {
            scope.lastCrash = { g: g };
            scope.$evalAsync();
          }
          scheduleClear();
        }
        lastDeformed = deformed;
        // всегда обновлять отображение с текущими перегрузками
        if (scope.lastCrash) {
          updateDisplay(scope.lastCrash.g);
        } else {
          updateDisplay();
        }
      });
      
      // Отслеживание событий BeamNG для спавна и починки
      scope.$on('VehicleSpawned', function() {
        console.log('gForcesDetector: Vehicle spawned event, resetting counter');
        resetGForceCounter();
      });
      
      scope.$on('VehicleReset', function() {
        console.log('gForcesDetector: Vehicle reset event, resetting counter');
        resetGForceCounter();
      });
      
      scope.$on('VehicleRepaired', function() {
        console.log('gForcesDetector: Vehicle repaired event, resetting counter');
        resetGForceCounter();
      });
      
      // Также слушаем события через bngApi если доступно
      if (typeof bngApi !== 'undefined' && bngApi.engineLua) {
        // Подписываемся на события автомобиля
        bngApi.engineLua('extensions.hook("gforcesDetectorInit", "init")');
      }
      
      scope.$watch('lastCrash', function(val) {
        if (!val && valueEl) updateDisplay();
      });
      
      // Отладочная функция для проверки прозрачности (как в ZeitSimpleAirSpeed)
      function checkOpacity() {
        if (element[0] && element[0].parentElement && element[0].parentElement.parentElement) {
          var currentOpacity = element[0].parentElement.parentElement.style.opacity;
          console.log('gForcesDetector opacity:', currentOpacity);
          return currentOpacity;
        }
        return null;
      }
    }
  };
}]);
