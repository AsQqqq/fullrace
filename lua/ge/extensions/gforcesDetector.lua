local M = {}

-- Обработчик инициализации от UI
local function onGforcesDetectorInit(data)
    print("gForcesDetector: Lua extension initialized")
    
    -- Отправляем сигнал о готовности
    if guihooks then
        guihooks.trigger('GForceDetectorReady', {status = "ready"})
    end
end

-- Обработчик события спавна автомобиля
local function onVehicleSpawned(vehId)
    print("gForcesDetector: Vehicle spawned - " .. (vehId or "unknown"))
    
    if guihooks then
        guihooks.trigger('VehicleSpawned', {vehicleId = vehId})
    end
end

-- Обработчик события сброса автомобиля
local function onVehicleReset(vehId)
    print("gForcesDetector: Vehicle reset - " .. (vehId or "unknown"))
    
    if guihooks then
        guihooks.trigger('VehicleReset', {vehicleId = vehId})
    end
end

-- Регистрируем hook обработчики
if extensions then
    extensions.addHook("gforcesDetectorInit", onGforcesDetectorInit)
end

-- Экспорт функций
M.onGforcesDetectorInit = onGforcesDetectorInit
M.onVehicleSpawned = onVehicleSpawned
M.onVehicleReset = onVehicleReset

return M
