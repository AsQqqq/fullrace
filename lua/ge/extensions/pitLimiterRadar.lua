local M = {}

local function sendRadarData()
  local player = be:getPlayerVehicle(0)
  if not player then return end

  local playerPos = vec3(player:getPosition())
  local playerRot = player:getRotation()

  local vehicles = be:getVehicles()
  local radar = {
    player = { x = playerPos.x, y = playerPos.y },
    vehicles = {}
  }

  for _, veh in pairs(vehicles) do
    if veh ~= player then
      local pos = vec3(veh:getPosition())
      local dx, dy = pos.x - playerPos.x, pos.y - playerPos.y

      local angle = -playerRot:getYaw()
      local rx = dx * math.cos(angle) - dy * math.sin(angle)
      local ry = dx * math.sin(angle) + dy * math.cos(angle)

      table.insert(radar.vehicles, { x = rx, y = ry })
    end
  end

  log('I', 'GTRadar', 'RadarUpdate: машин = ' .. tostring(#radar.vehicles))

  guihooks.trigger("RadarUpdate", radar)
end

local function onUpdate(dtReal, dtSim, dtRaw)
  sendRadarData()
end

M.onUpdate = onUpdate

return M