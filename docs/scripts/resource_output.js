// Assume each square is 8 km x 8 km

const RESOURCE_OUTPUT = {
    // Iron Ore kg per year
    1: {
        'excellent': 3000000,
        'medium': 1000000,
        'poor': 300000,
        'very poor': 100000
    },
    // Lumbermill m3 per year
    2: {
        'excellent': 2000,
        'medium': 1000,
        'poor': 500,
        'very poor': 250
    },
    // Rice Paddy - 1 year, 8km x 8km, 50% land usage
    3: {
        'excellent': 7257600,
        'medium': 785600,
        'poor': 665600,
        'very poor': 544000
    },
    // Barley farm - 1 year, 8km x 8km, 50% land usage
    4: {
        'excellent': 57600,
        'medium': 48000,
        'poor': 38400,
        'very poor': 28800
    },
};