const typhoons = [
    {
        name: "ATSANI",
        lastUpdate: new Date(), //ngày giờ hiện tại
        predict: [
            {
                timestamp: new Date(), //ngày giờ của dự đoán
                position: { //vị trí tâm bão
                    lat: 8.8,
                    lon: 147.4
                },
                hPa: 1000, //áp suất không khí
                maxSusWind : [18,65], //vận tốc gió [m/s, km/h]
                radius15: 210, 
                radius25: null,
                intensity: null,
                movingDirection: "NNW",
                movingSpeed: 31,
            },

            //key - value
            {
                timestamp: (new Date()).setDate(new Date().getDate() +1),
                position: {
                    lat: 10.8,
                    lon: 146.0
                },
                hPa: 992,
                maxSusWind : [23,83],
                radius15: 220,
                radius25: null,
                intensity: null,
                movingDirection: "NW",
                movingSpeed: 22,
            },

            {
                timestamp: (new Date()).setDate(new Date().getDate() +2),
                position: {
                    lat: 12.0,
                    lon: 143.7
                },
                hPa: 985,
                maxSusWind : [27,77],
                radius15: 240,
                radius25: 60,
                intensity: "Normal",
                movingDirection: "WNW",
                movingSpeed: 23,
            },

            {
                timestamp: (new Date()).setDate(new Date().getDate() +3),
                position: {
                    lat: 12.9,
                    lon: 141.5
                },
                hPa: 980,
                maxSusWind : [29,104],
                radius15: 260,
                radius25: 70,
                intensity: "Normal",
                movingDirection: "WNW",
                movingSpeed: 22,
            },

            {
                timestamp: (new Date()).setDate(new Date().getDate() +4),
                position: {
                    lat: 14.1,
                    lon: 139.6
                },
                hPa: 975,
                maxSusWind : [32,115],
                radius15: 270,
                radius25: 80,
                intensity: "Normal",
                movingDirection: "WNW",
                movingSpeed: 21,
            },

            {
                timestamp: (new Date()).setDate(new Date().getDate() +5),
                position: {
                    lat: 16.6,
                    lon: 136.0
                },
                hPa: 965,
                maxSusWind : [37,133],
                radius15: 300,
                radius25: 90,
                intensity: "Strong",
                movingDirection: "NW",
                movingSpeed: 20,
            },

            {
                timestamp: (new Date()).setDate(new Date().getDate() +6),
                position: {
                    lat: 18.4,
                    lon: 133.4
                },
                hPa: 960,
                maxSusWind : [39,140],
                radius15: 330,
                radius25: 100,
                intensity: "Strong",
                movingDirection: "NW",
                movingSpeed: 14,
            },

            {
                timestamp: (new Date()).setDate(new Date().getDate() +6),
                position: {
                    lat: 19.5,
                    lon: 132.0
                },
                hPa: 955,
                maxSusWind : [40,144],
                radius15: 330,
                radius25: 100,
                intensity: "Strong",
                movingDirection: "NW",
                movingSpeed: 8,
            }
        ]
    }
];

export default typhoons;