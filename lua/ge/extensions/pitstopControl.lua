local M = {}
local pitTimer = 0
local locked = false
local doTyres = false
local doFuel = false
local fuelPercent = 1.0

-- Запустить таймер пит-стопа
local function startPitTimer(totalTime, tyres, fuel, targetFuel)
  pitTimer = totalTime or 0
  doTyres = tyres or false
  doFuel = fuel or false
  fuelPercent = targetFuel or 1.0
  locked = pitTimer > 0
  log('I', 'pitstopControl', string.format('Pitstop started (time=%.1fs, tyres=%s, fuel=%s, target=%.2f)', pitTimer, tostring(doTyres), tostring(doFuel), fuelPercent))
end

-- Обновление каждый кадр
local function onUpdate(dt)
  if pitTimer > 0 then
    pitTimer = pitTimer - dt
    local veh = be:getPlayerVehicle(0)
    if veh and locked then
      veh:queueLuaCommand([[
        input.event("throttle", 0)
        input.event("brake", 1)
        electrics.setIgnitionLevel(0)
      ]])
    end
    if pitTimer <= 0 then
      pitTimer = 0
      local veh = be:getPlayerVehicle(0)
      if veh then
        if doTyres then
          veh:queueLuaCommand('extensions.LuuksTyreThermalsAndWear.resetTyres()')
        end
        if doFuel then
          veh:queueLuaCommand(string.format([[
            for _, storage in pairs(energyStorage.getStorages()) do
              storage.storedEnergy = storage.energyCapacity * %.2f
            end
          ]], fuelPercent))
        end
      end
      doTyres = false
      doFuel = false
      locked = false
    end
  end
end

local function getPitTimer()
  return math.ceil(pitTimer)
end

M.startPitTimer = startPitTimer
M.getPitTimer = getPitTimer
M.onUpdate = onUpdate
return M
