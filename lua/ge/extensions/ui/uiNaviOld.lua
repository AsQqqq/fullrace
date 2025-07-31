-- written by DaddelZeit
-- DO NOT USE WITHOUT PERMISSION

local M = {}

local function getZoneSpeedLimit(pos)
  if not gameplay_city then return end
  local zone = gameplay_city.getHighestPrioZone(pos) or {}
  local customFields = zone.customFields
  if customFields and customFields.values and customFields.values.speedLimit then
    return customFields.values.speedLimit
  end
end

local function getSpeedLimit(pos)
  local n1, n2 = map.findClosestRoad(pos, 15)
  local mapNodes = map.getMap().nodes or {}
  if not mapNodes[n1] or not mapNodes[n2] then return 0 end

  local link = mapNodes[n1].links[n2] or mapNodes[n2].links[n1] or {}
  return link.speedLimit or 0
end

local function onGuiUpdate(dt)
  local veh = getPlayerVehicle(0)
  if not map or not veh then return end
  local cameraForward = core_camera.getForward() or vec3()
  local camPosVec = core_camera.getPosition() or vec3()

  local vehPos = veh:getPosition()
  local data = {
    playerID = veh:getId(),
    objects = {},
    isFreeCam = commands.isFreeCamera() or (gameplay_walk and gameplay_walk.isWalking() or false),
    camRotationZ = math.atan2(cameraForward.x, -cameraForward.y) * 180 / math.pi,
    camPosition = camPosVec:toTable(),
    speedLimit = getZoneSpeedLimit(vehPos) or getSpeedLimit(vehPos) or 0
  }

  -- convert vec3 to JS table
  for id, obj in activeVehiclesIterator() do
    if obj.hiddenInNavi ~= "1" and obj.jbeam ~= "unicycle" then
      local dir = obj:getDirectionVector()
      local pos = obj:getPosition()
      data.objects[id] = {
        posX = -pos.x,
        posY = pos.y,
        rot = math.floor(-math.deg(math.atan2(dir:dot(vec3(1,0,0)), dir:dot(vec3(0,-1,0))))),
      }
    end
  end

  guihooks.trigger('NavigationMapUpdateOld', data)
end

local function getNodes()
  local tmpmap = map.getMap()
  -- local tmpmap = deepcopy(m) -- since we are always just create a new object out of primitive data types in the function below we don't need this copy here
  local newNodes = {}
  if not tmpmap or not tmpmap.nodes then return end
  for k, v in pairs(tmpmap.nodes) do
    if not v.hiddenInNavi then
      newNodes[k] = {
        pos = {v.pos.x, v.pos.y}, -- v.pos.z}, 3d is not used in ui atm anyway
        radius = v.radius
      }
      newNodes[k].links = {}
      for j, w in pairs(v.links) do
        if not w.hiddenInNavi then
          newNodes[k].links[j] = {drivability = w.drivability, oneWay = w.oneWay}
        end
      end
    end
  end
  return newNodes
end

local function minimapFromTerrainBlock()
  log("I","","No minimap data found in levels info.json. Creating minimap data from terrainblock data...")
  local minimap = {}
  local terr = getObjectByClass("TerrainBlock")
  if terr then
    local blockSize = terr:getWorldBlockSize()
    local minimapImage = terr.minimapImage -- minimapImage is a BString
    if minimapImage:startswith("/") then
      minimapImage = minimapImage:sub(2)
    end
    minimap = {
      {
        size = vec3(blockSize, blockSize, terr.maxHeight):toTable(),
        offset = vec3(terr:getPosition().x, terr:getPosition().y + blockSize, 0):toTable(),
        file = minimapImage
      }
    }
  end
  return minimap
end

local function addOldFormatFromMinimap(d)
  if not d then return end
  local mainTile = d.terrainTiles[1]
  if mainTile then
    d.terrainSize = mainTile.size
    d.minimapImage = mainTile.file
    d.squareSize = 1
    d.terrainOffset = { mainTile.offset[1], mainTile.offset[2] - mainTile.size[1] }
  end
end

local function requestUIDashboardMap()
  print("Requesting UI Dashboard Map...")
  local d = {}
  d.nodes = getNodes()

  local levelData = core_levels.getLevelByName(getCurrentLevelIdentifier())
  if levelData then
    if not levelData.minimap then
      levelData.minimap = minimapFromTerrainBlock()
    end
    d.terrainTiles = levelData.minimap
    -- account for old mods still using the old system
    addOldFormatFromMinimap(d)
  end

  guihooks.trigger('NavigationMapOld', d)
end

local function onVehicleSwitched(oid, nid)
  -- we need the tracking information for the ui navigation, so enable it
  if oid ~= -1 then
    local veh = scenetree.findObject(oid)
    if veh then
      veh:queueLuaCommand("mapmgr.enableTracking()")
    end
  end
  if nid ~= -1 then
    local veh = scenetree.findObject(nid)
    if veh then
      veh:queueLuaCommand("mapmgr.enableTracking()")
    end
  end
end

local function onExtensionLoaded()
  guihooks.trigger('RouteUpdate', {})
end

-- public interface
M.onGuiUpdate = onGuiUpdate
M.onVehicleSwitched = onVehicleSwitched
M.onExtensionLoaded = onExtensionLoaded

M.requestUIDashboardMap = requestUIDashboardMap

return M


