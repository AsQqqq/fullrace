local M = {}

local pitLimiterEnabled = false
local pitStopMenuEnabled = false

-- Переключение Pit Limiter
local function togglePitLimiter()
  pitLimiterEnabled = not pitLimiterEnabled
  log('I', 'PitLimiter', 'togglePitLimiter called, state: ' .. tostring(pitLimiterEnabled))
  guihooks.trigger("PitLimiterChanged", { enabled = pitLimiterEnabled })
  local cmd = string.format('extensions.pitLimiterVehicle.setEnabled(%s)', tostring(pitLimiterEnabled))
  be:getPlayerVehicle(0):queueLuaCommand(cmd)
end

-- Переключение Pit Stop Menu
local function pitStopMenuToggle()
  pitStopMenuEnabled = not pitStopMenuEnabled
  guihooks.trigger("PitStopMenuToggle", { enabled = pitStopMenuEnabled })
end

local function onExtensionLoaded()
  if actions and input then
    
    -- Кнопка Pit Limiter
    actions.registerAction("pitLimiterToggle", "toggle")
    actions.setActionDescription("pitLimiterToggle", "Toggle Pit Limiter")
    input.registerForAction("pitLimiterToggle", togglePitLimiter)

    -- Кнопка Pit Stop Menu
    actions.registerAction("pitStopMenuToggle", "toggle")
    actions.setActionDescription("pitStopMenuToggle", "Toggle Pit Stop Menu")
    input.registerForAction("pitStopMenuToggle", pitStopMenuToggle)
  end
end

M.togglePitLimiter = togglePitLimiter
M.pitStopMenuToggle = pitStopMenuToggle
M.onExtensionLoaded = onExtensionLoaded

return M
