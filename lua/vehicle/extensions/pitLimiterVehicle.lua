local M = {}

local limiterEnabled = false
local speedLimit = 60 / 3.6

function M.setEnabled(state)
  limiterEnabled = state
end

function M.setLimitKph(kph)
  speedLimit = kph / 3.6
end

local function updateGFX(dt)
  if limiterEnabled then
    local speed = obj:getVelocity():length()
    if speed > speedLimit then
      -- Жёсткое ограничение газа
      electrics.values.throttle = 0
    end
  end
end

M.updateGFX = updateGFX

return M