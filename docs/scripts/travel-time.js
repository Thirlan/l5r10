// Mode of transport
FOOT = 0
HORSE = 1
CARAVAN = 2
ARMY = 3
RIVER_BOAT = 4
SHIP = 5

// Base Travel Speed
FOOT_KMPH = 5.0
HORSE_KMPH = 10.0
CARAVAN_KMPH = 8.0
ARMY_KMPH = 6.0
RIVER_BOAT_KMPH = 12.0
SHIP_KMPH = 15.0





// Penalties
def water_travel_climate_penalty(climate):
    if climate === POLAR:
        return -0.1;
    return 0;

def water_travel_river_penalty(mode_of_transport):
    if mode_of_transport === SHIP:
        return -0.1;
    return 0;

def water_travel_against_current_penalty(is_against_current):
    if is_against_current:
        // going against the current results in a penalty
        return -0.1;
    else
        // going with the current results in a bonus
        return 0.1;

def water_travel_ocean_penalty(mode_of_transport):
    if mode_of_transport === RIVER_BOAT:
        return -0.1;
    return 0;




def calculateTravelSpeed(mode_of_transport, terrain, climate, vegetation, river, infrastructure, is_against_current):

    // First divide things into land and water transport
    if mode_of_transport === RIVER_BOAT || mode_of_transport === SHIP:
        // Water transport is the simplest because it ignores a lot of the terrain
        if terrain === FLAT || terrain === HILLS || terrain === MOUNTAINS || terrain === WETLANDS || terrain === CLIFF:
            // Water transport cannot traverse these terrains unless there is a river
            if river === 1:
                total_penalty = 1 + water_travel_climate_penalty(climate) + water_travel_river_penalty(mode_of_transport) + water_travel_against_current_penalty(is_against_current);
                if mode_of_transport === RIVER_BOAT:
                    return RIVER_BOAT_KMPH * total_penalty;
                else if mode_of_transport === SHIP:
                    return SHIP_KMPH * total_penalty;
                
        else if terrain === WATER:
            total_penalty = 1 + water_travel_climate_penalty(climate);
                if mode_of_transport === RIVER_BOAT:
                    return RIVER_BOAT_KMPH * total_penalty;
                else if mode_of_transport === SHIP:
                    return SHIP_KMPH * total_penalty;
        
        else if terrain === COASTAL_WATER || terrain === OCEAN:
            total_penalty = 1 + water_travel_climate_penalty(climate) + water_travel_ocean_penalty(mode_of_transport);
            if mode_of_transport === RIVER_BOAT:
                return RIVER_BOAT_KMPH * total_penalty;
            else if mode_of_transport === SHIP:
                return SHIP_KMPH * total_penalty;
    
        
    else if mode_of_transport === FOOT || mode_of_transport === HORSE || mode_of_transport === CARAVAN || mode_of_transport === ARMY:
        
        // Road has the biggest impact on travel speed because it essentially flattens things out
        if infrastructure === ROAD:
            // A full road is essentially perfect travel conditions. Nothing matters at this point except the terrain
            
            else:
                // Other modes of transport are not significantly affected by a full road
                
        else if infrastructure === 1:

        else if infrastructure === 0:

    // Adjust it based on terrain
    travelSpeed = adjustTravelSpeedForTerrain(travelSpeed, terrain)
    travelSpeed = adjustTravelSpeedForClimate(travelSpeed, climate)
    travelSpeed = adjustTravelSpeedForVegetation(travelSpeed, vegetation)
    travelSpeed = adjustTravelSpeedForRiver(travelSpeed, river)
    travelSpeed = adjustTravelSpeedForInfrastructure(travelSpeed, infrastructure)

    return travelSpeed
}