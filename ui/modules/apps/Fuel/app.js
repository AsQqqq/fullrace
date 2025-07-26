'use strict'

angular.module('beamng.apps')
.directive('fuel', [function () {
  return {
    template: `
    <div style="width: 100%; height: 100%; position: relative; background-color: transparent;">
      <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 80%;">
        <!-- Полукруг -->
        <path d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="#fff"
              stroke-width="1"/>
        
        <!-- Деления -->
        <g id="ticks"></g>

        <!-- Заполнение топлива -->
        <path id="fuelBar" d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="#fff"
              stroke-width="3"
              stroke-dasharray="126"
              stroke-dashoffset="126"/>
        
        <!-- Буквы E и F -->
        <text x="0" y="53" fill="white" font-size="8" font-family="Arial" font-weight="bold">E</text>
        <text x="94" y="53" fill="white" font-size="8" font-family="Arial" font-weight="bold">F</text>

        <!-- Иконка бензоколонки -->
        <g transform="translate(33, 30) scale(0.4)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M14 11h1a2 2 0 0 1 2 2v3a1.5 1.5 0 0 0 3 0v-7l-3 -3" />
                <path d="M4 20v-14a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v14" />
                <path d="M3 20l12 0" />
                <path d="M18 7v1a1 1 0 0 0 1 1h1" />
                <path d="M4 11l10 0" />
            </svg>
        </g>
      </svg>

      <!-- ТАЙМЕР -->
      <div style="position: absolute; bottom: 0; width: 100%; text-align: center; background-color: #1111112a;">
          <p style="font-size: 22px; margin: 5px 0; font-weight: bold; color: white;" id="timeLeft">--:--:--</p>
      </div>
    </div>
    `,
    replace: true,
    restrict: 'EA',
    link: function (scope, element, attrs) {
      let streams = ['engineInfo', 'electrics', 'throttle', 'brake']
      StreamsManager.add(streams)

      const ticksGroup = element[0].querySelector('#ticks')
      const cx = 50, cy = 50, r = 40
      const bigTick = 6, smallTick = 4
      const angles = [180, 135, 90, 45, 0]

      angles.forEach((angle, i) => {
        const rad = angle * Math.PI / 180
        const x1 = cx + r * Math.cos(rad)
        const y1 = cy - r * Math.sin(rad)
        const tickLen = (i % 2 === 0) ? bigTick : smallTick
        const x2 = cx + (r - tickLen) * Math.cos(rad)
        const y2 = cy - (r - tickLen) * Math.sin(rad)

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', x1.toFixed(1))
        line.setAttribute('y1', y1.toFixed(1))
        line.setAttribute('x2', x2.toFixed(1))
        line.setAttribute('y2', y2.toFixed(1))
        line.setAttribute('stroke', 'white')

        if (i === 0 || i === 4) {
          line.setAttribute('stroke-width', '1')
          line.setAttribute('transform', 'translate(0, -0.5)')
        } else {
          line.setAttribute('stroke-width', '2')
        }
        ticksGroup.appendChild(line)
      })

      function setFuelLevel(scale) {
        const length = 126
        const offset = length - length * scale
        const fuelBar = element[0].querySelector('#fuelBar')
        fuelBar.style.strokeDashoffset = offset
      }

      function formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const pad = n => n.toString().padStart(2, '0');
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
      }

      function updateTimeLeft(fuel, speed, throttle) {
        // Примерная модель расхода: 0.0004 л/с при 0 скорости + поправка на throttle
        const baseConsumption = 0.0004 + speed * 0.00002;
        const consumptionRate = baseConsumption * (1 + throttle * 0.8);
        const timeLeftSec = fuel / Math.max(consumptionRate, 0.0001);
        element[0].querySelector('#timeLeft').textContent = formatTime(timeLeftSec);
      }

      scope.$on('$destroy', function () {
        StreamsManager.remove(streams)
      })

      scope.$on('streamsUpdate', function (event, streams) {
        if (!streams || !streams.electrics || !streams.engineInfo) return

        const fuel = streams.electrics.fuel || 0 // литры
        const speed = streams.electrics.wheelspeed || 0 // м/с
        const throttle = streams.electrics.throttle || 0 // 0..1

        setFuelLevel(fuel)
        updateTimeLeft(fuel, speed, throttle)
      })
    }
  }
}])