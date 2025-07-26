local M = {}

local wearMultiplier = 1.0
local initialConditions = { FL = 100, FR = 100, RL = 100, RR = 100 }

-- Установить множитель износа
local function setWearMultiplier(mult)
  wearMultiplier = tonumber(mult) or 1
  log('I', 'tyreWear', 'Wear multiplier set to ' .. wearMultiplier)
end

-- Установить начальные состояния шин
local function setInitialCondition(jsonString)
  local ok, data = pcall(json.decode, jsonString)
  if ok and type(data) == "table" then
    initialConditions = data
    log('I', 'tyreWear', 'Initial conditions set: ' .. jsonString)

    -- Применяем на колеса
    for i, wd in pairs(wheels.wheelRotators) do
      local name = wd.name or ""
      if initialConditions[name] then
        if tyreData and tyreData[i] then
          tyreData[i].condition = initialConditions[name]
        end
      end
    end
  else
    log('E', 'tyreWear', 'Failed to decode tyre condition data!')
  end
end

-- Хук для износа (используется в твоём RecalcTyreWear)
local function applyWearMultiplier(baseWear)
  return baseWear * wearMultiplier
end

M.setWearMultiplier = setWearMultiplier
M.setInitialCondition = setInitialCondition
M.applyWearMultiplier = applyWearMultiplier

return M