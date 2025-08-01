groundModels = {} -- Intentionally global
groundModelsLut = {} -- Intentionally global

local M = {}

M.setWearMultiplier = setWearMultiplier

local OPTIMAL_PRESSURE = 158000 -- In pascal (23 psi)
local WORKING_TEMP = 85         -- The "perfect" working temperature for your tyres
local ENV_TEMP = 21             -- In celsius. Represents both the outside air and surface temp in 1 variable.

local TEMP_CHANGE_RATE = 0.2  -- Global modifier for how fast temperature changes
local TEMP_GAIN_RATE = 0.85    -- Modifier for how fast temperature rises from wheel slip
local TEMP_COOL_RATE = 1.15     -- Modifier for how fast temperature cools down related to ENV_TEMP

local TEMP_CHANGE_RATE_SKIN_FROM_CORE = 0.2

local TEMP_CHANGE_RATE_CORE = 0.1   -- Global modifier for how fast the core temperature changes
local TEMP_GAIN_RATE_CORE = 0.025   -- Modifier for how fast core temperature rises from brake temp
local TEMP_COOL_RATE_CORE = 0.7     -- Modifier for how fast core temperature cools down related to skin temperature

local WEAR_RATE = 0.011
local wearMultiplier = 1.0

local TORQUE_ENERGY_MULTIPLIER = 0.075

local tyreData = {}
local wheelCache = {}

local totalTimeMod60 = 0

-- Research notes on tyre thermals and wear:
-- - Thermals have an obvious impact on grip, but not as much as wear.
-- - Tyres that are too hot or cold wear quicker (although for different reasons).
-- - Tyre pressure heavily affects the thermals and wear (mostly thermals I think).
-- - Brake temperature influences tyre thermals a decent amount as well.

local function sigmoid(x, k)
    local k = k or 10
    return 1 / (1 + k^-x)
end

local function lerp(a, b, t)
    return a + (b - a) * t
end

local function setWearMultiplier(mult)
  wearMultiplier = tonumber(mult) or 1.0
  log('I', 'tyreWear', 'Wear multiplier set to ' .. wearMultiplier)
end

local function resetTyres()
  for i, wd in pairs(wheels.wheelRotators) do
    if tyreData[i] then
      tyreData[i].condition = 100
      tyreData[i].temp = {WORKING_TEMP, WORKING_TEMP, WORKING_TEMP, WORKING_TEMP}
    end
  end
  log('I', 'LuuksTyreThermalsAndWear', 'Tyres fully reset (condition and temperature).')
end

local function setInitialTyreCondition(frontLeft, frontRight, rearLeft, rearRight)
  for i, wd in pairs(wheels.wheelRotators) do
    local name = wd.name
    if name == "FL" and tyreData[i] then
      tyreData[i].condition = frontLeft
    elseif name == "FR" and tyreData[i] then
      tyreData[i].condition = frontRight
    elseif name == "RL" and tyreData[i] then
      tyreData[i].condition = rearLeft
    elseif name == "RR" and tyreData[i] then
      tyreData[i].condition = rearRight
    end
  end
end

M.setInitialTyreCondition = setInitialTyreCondition


local function GetGroundModelData(id)
    local materials, materialsMap = particles.getMaterialsParticlesTable()
    local matData = materials[id] or {}
    local name = matData.name or "DOESNT EXIST"
    -- local name = groundModelsLut[id] or "DOESNT EXIST"
    local data = groundModels[name] or { staticFrictionCoefficient = 1, slidingFrictionCoefficient = 1 }
    return name, data
end

local function CalcBiasWeights(loadBias)
    local weightLeft = math.max(math.min(loadBias, 0) * -0.8, 0.2)
    local weightRight = math.max(math.max(loadBias, 0) * 0.8, 0.2)
    local weightCenter = 1 - weightLeft - weightRight
    return { weightLeft, weightCenter, weightRight }
end

local function TempRingsToAvgTemp(temps, loadBias)
    local weights = CalcBiasWeights(loadBias)
    return temps[1] * weights[1] + temps[2] * weights[2] + temps[3] * weights[3]
end

-- Calculate tyre wear and thermals based on tyre data
-- TODO: loadCoeff seems a bit much right now, 1 of the wheels usually heats up WAY more
local function RecalcTyreWear(dt, wheelID, groundModel, loadBias, treadCoef, slipEnergy, propulsionTorque, brakeTorque, load, angularVel, brakeTemp, tyreWidth)
    local default_working_temp = WORKING_TEMP * treadCoef
    local defaultTyreData = {
        working_temp = default_working_temp,
        temp = { default_working_temp, default_working_temp, default_working_temp, default_working_temp },
        condition = 100, -- 100% perfect tyre condition
    }
    local data = tyreData[wheelID] or defaultTyreData

    local tyreWidthCoeff = (3.5 * tyreWidth) * 0.5 + 0.5
    local loadCoeff = math.max(load, 0) / 630 / tyreWidthCoeff
    local torqueEnergy = math.abs(propulsionTorque * 0.01 + brakeTorque * 0.012) * TORQUE_ENERGY_MULTIPLIER

    local weights = CalcBiasWeights(loadBias)

    local avgTemp = TempRingsToAvgTemp(data.temp, loadBias)

    for i=1,3 do
        local loadCoeffIndividual = loadCoeff * weights[i]
        -- Temperature gain is mostly based on wheel slip, plus the overall propulsion torque
        -- This might be a crude approximation of how it works in real life, but
        -- the goal is to use statistics related to how much friction is generated and
        -- how much energy is being put into the wheel.
        -- I think almost all the heat in real life is generated by friction, but
        -- this also occurs without wheel slip, so I think it's good to use
        -- wheelTorque as well, although weighted down.

        local tempGain = (slipEnergy * 0.80 + torqueEnergy * 0.08 + angularVel * 0.105) * TEMP_CHANGE_RATE * TEMP_GAIN_RATE * dt
        local tempDist = math.abs(data.temp[i] - data.working_temp)
        local tempLerpValue = (tempDist / data.working_temp)^0.8
        tempGain = lerp(tempGain, tempGain * 0.5, tempLerpValue) * loadCoeffIndividual
        tempGain = tempGain * (math.max(groundModel.staticFrictionCoefficient - 0.5, 0.1) * 2)

        local tempCoolingRate = (data.temp[i] - ENV_TEMP) * TEMP_CHANGE_RATE * dt * 0.05 * TEMP_COOL_RATE
        local coolVelCoeff = math.max(((angularVel / math.max(slipEnergy, 0.001)) * 0.00055)^0.75 * 0.84, 1)
        local skinTempDiffCore = (data.temp[4]- avgTemp) * TEMP_CHANGE_RATE_SKIN_FROM_CORE * dt

        local tempDiff = (avgTemp - data.temp[i]) * TEMP_CHANGE_RATE * dt

        data.temp[i] = data.temp[i] + tempGain - tempCoolingRate * coolVelCoeff + tempDiff + skinTempDiffCore
    end

    -- Calculating temperature change of the core
    local avgSkin = (data.temp[1] + data.temp[2] + data.temp[3]) / 3
    local tempCoolingRate = (data.temp[4] - avgSkin) * TEMP_CHANGE_RATE_CORE * dt * TEMP_COOL_RATE_CORE
    local coreTempDiffSkin = (avgSkin - data.temp[4]) * TEMP_CHANGE_RATE_CORE * dt
    local coreTempDiffBrake = (brakeTemp - data.temp[4]) * TEMP_CHANGE_RATE_CORE * dt * TEMP_GAIN_RATE_CORE
    data.temp[4] = data.temp[4] - tempCoolingRate + coreTempDiffSkin + coreTempDiffBrake

    -- Wear is mainly based on the same information as thermals
    -- but also thermals. The further from working temperatures, the
    -- more the tyre will wear in general.
    local thermalCoeff = (math.abs(avgTemp - data.working_temp) / data.working_temp)^0.8
    local wear = (slipEnergy * 0.75 + torqueEnergy * 0.08 + angularVel * 0.05)
             * WEAR_RATE * wearMultiplier * dt * math.max(thermalCoeff, 0.75)
             * groundModel.staticFrictionCoefficient
    data.condition = math.max(data.condition - wear, 0)

    tyreData[wheelID] = data
end

local function CalculateTyreGrip(wheelID, loadBias, treadCoef)
    local data = tyreData[wheelID]

    local avgTemp = TempRingsToAvgTemp(data.temp, loadBias)

    local tyreGrip = 1
    tyreGrip = tyreGrip * (math.min(data.condition / 97, 1)^3.5 * 0.22 + 0.78)
    local tempDist = math.abs(avgTemp - data.working_temp)
    local tempLerpValue = (tempDist / data.working_temp)^0.8
    tyreGrip = tyreGrip * lerp(1, 0.82, tempLerpValue * treadCoef)

    return tyreGrip
end

-- This is a special function that runs every frame, and has full access to
-- vehicle data for the current vehicle.
local function updateGFX(dt)
    local stream = { data = {} }

    local vectorForward = obj:getDirectionVector()
    local vectorUp = obj:getDirectionVectorUp()
    local vectorRight = vectorForward:cross(vectorUp)

    local isAI = false

    for i, wd in pairs(wheels.wheelRotators) do
        local w = wheelCache[i] or {}
        w.name = wd.name
        w.radius = wd.radius
        w.width = wd.tireWidth
        w.wheelDir = wd.wheelDir
        w.angularVelocity = wd.angularVelocity
        w.propulsionTorque = wd.propulsionTorque
        w.lastSlip = wd.lastSlip
        w.lastSideSlip = wd.lastSideSlip
        w.downForce = wd.downForce
        w.brakingTorque = wd.brakingTorque
        w.brakeTorque = wd.brakeTorque
        w.contactMaterialID1 = wd.contactMaterialID1
        w.contactMaterialID2 = wd.contactMaterialID2
        w.treadCoef = wd.treadCoef
        w.softnessCoef = wd.softnessCoef
        w.isBroken = wd.isBroken
        w.isTireDeflated = wd.isTireDeflated
        w.brakeCoreTemperature = wd.brakeCoreTemperature or ENV_TEMP -- Fixes AI

        -- Get camber/toe/caster data
        -- TODO: Get this relative to the track angle? Banked turns kinda mess up now I think
        w.camber = (90 - math.deg(math.acos(obj:nodeVecPlanarCos(wd.node2, wd.node1, vectorUp, vectorRight))))

        wheelCache[i] = w
    end

    -- Based on sensor data, we can estimate how far the load is shifted left-right on the tyre
    local loadBiasSide = sensors.gx2 / 5
    loadBiasSide = sigmoid(loadBiasSide, 2) * 2 - 1
    -- We don't use this system for front-back load, because we can simply guess this
    -- based on individual tyre load!

    for i=0,#wheels.wheelRotators do
        local wheel = obj:getWheel(i)
        if wheel then
            local groundModelName, groundModel = GetGroundModelData(wheelCache[i].contactMaterialID1)

            local staticFrictionCoefficient = groundModel.staticFrictionCoefficient
            local slidingFrictionCoefficient = groundModel.slidingFrictionCoefficient

            local angularVel = math.max(math.abs(wheelCache[i].angularVelocity), obj:getVelocity():length() * 3) * 0.1 * (math.max(groundModel.staticFrictionCoefficient - 0.5, 0.1) * 2)^3
            angularVel = math.floor(angularVel * 10) / 10 -- Round to reduce small issues
            local slipEnergy = wheelCache[i].lastSlip * staticFrictionCoefficient * 1.25
            -- Multiply with wheel direction to flip the torque for right side wheels
            local velCoeff = math.min(angularVel / math.max(slipEnergy, 0.001), 1)
            local propulsionTorque = wheelCache[i].propulsionTorque * wheelCache[i].wheelDir * velCoeff
            local brakeTorque = wheelCache[i].brakingTorque * wheelCache[i].wheelDir * velCoeff
            local load = wheelCache[i].downForce * velCoeff
            local brakeTemp = wheelCache[i].brakeCoreTemperature

            local treadCoef = 1.0 - wheelCache[i].treadCoef * 0.45
            local softnessCoef = wheelCache[i].softnessCoef
            local loadBias = loadBiasSide * 0.22 * softnessCoef + (wheelCache[i].camber / 12) * wheelCache[i].wheelDir
            loadBias = sigmoid(loadBias * 2.5, 5) * 2 - 1

            RecalcTyreWear(dt, i, groundModel, loadBias, treadCoef, slipEnergy, propulsionTorque, brakeTorque, load, angularVel, brakeTemp, wheelCache[i].width)

            local tyreGrip = CalculateTyreGrip(i, loadBias, treadCoef)
            local isNotDeflated = 1
            if wheelCache[i].isTireDeflated or wheelCache[i].isBroken then isNotDeflated = 0 end

            local temps = {}
            for j=1,4 do
                table.insert(temps, math.floor(tyreData[i].temp[j] * 10) / 10)
            end
            table.insert(stream.data, {
                name = wheelCache[i].name,
                tread_coef = treadCoef,
                working_temp = math.floor(tyreData[i].working_temp * 10) / 10,
                temp = temps,
                avg_temp = math.floor(TempRingsToAvgTemp(tyreData[i].temp, loadBias) * 10) / 10,
                condition = math.floor(tyreData[i].condition * 10) / 10 * isNotDeflated,
                tyreGrip = math.floor(tyreGrip * 1000) / 1000,
                load_bias = loadBias,
                contact_material = groundModelName,
                brake_temp = brakeTemp,
                brake_working_temp = 800
            })

            wheel:setFrictionThermalSensitivity(
                -300,       -- frictionLowTemp              default: -300
                1e7,        -- frictionHighTemp             default: 1e7
                1e-10,      -- frictionLowSlope             default: 1e-10
                1e-10,      -- frictionHighSlope            default: 1e-10
                10,         -- frictionSlopeSmoothCoef      default: 10
                tyreGrip,   -- frictionCoefLow              default: 1
                tyreGrip,   -- frictionCoefMiddle           default: 1
                tyreGrip    -- frictionCoefHigh             default: 1
            )
        end
    end
    totalTimeMod60 = (totalTimeMod60 + dt) % 60 -- Loops every 60 seconds
    stream.total_time_mod_60 = totalTimeMod60
    stream.wearMultiplier = wearMultiplier
    gui.send("TyreWearThermals", stream)
end

local function onReset()
    tyreData = {}

    obj:queueGameEngineLua("if luukstyrethermalsandwear then luukstyrethermalsandwear.getGroundModels() end")
end

local function onInit()
    obj:queueGameEngineLua("if luukstyrethermalsandwear then luukstyrethermalsandwear.getGroundModels() end")
end

M.onInit = onInit
M.onReset = onReset
M.updateGFX = updateGFX
M.resetTyres = resetTyres
M.groundModelsCallback = groundModelsCallback

return M
