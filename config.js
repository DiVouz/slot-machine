const cfg = {
    currency: {
        language: "en-US",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    },
    
    reels: 5,
    rows: 3,

    bets: [
        0.01, 0.02, 0.05,
        0.10, 0.20, 0.50,
        1.00, 2.00, 5.00,
        10.00, 20.00, 50.00
    ],
    defualtBetIndex: 6,

    spinTime: {
        normal: 3000,
        fast: 2000,
        turbo: 1000
    },

    symbols: [
        {
            type: "1",
            img: "1.png",
            chance: 1,
            payMultiplier: [0, 0, 5, 25, 100]
        },
        {
            type: "2",
            img: "2.png",
            chance: 1,
            payMultiplier: [0, 0, 5, 25, 100]
        },
        {
            type: "3",
            img: "3.png",
            chance: 1,
            payMultiplier: [0, 0, 5, 25, 100]
        },
        {
            type: "4",
            img: "4.png",
            chance: 1,
            payMultiplier: [0, 0, 5, 40, 150]
        },
        {
            type: "5",
            img: "5.png",
            chance: 1,
            payMultiplier: [0, 0, 5, 40, 150]
        },
        {
            type: "6",
            img: "6.png",
            chance: 1,
            payMultiplier: [0, 5, 30, 100, 750]
        },
        {
            type: "7",
            img: "7.png",
            chance: 1,
            payMultiplier: [0, 5, 30, 100, 750]
        },
        {
            type: "8",
            img: "8.png",
            chance: 1,
            payMultiplier: [0, 5, 40, 400, 2000]
        },
        {
            type: "9",
            img: "9.png",
            chance: 1,
            payMultiplier: [0, 10, 100, 1000, 5000]
        },
        {
            type: "scatter",
            img: "scatter.png",
            chance: 1,
            payMultiplier: [0, 0, 2, 20, 200]
        }
    ],

    minScatterForFreeSpins: 3,
    freeSpinsToAdd: 10,

    autoSpinDelay: 1000,

    payTable: [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
        [2, 2, 2, 2, 2],
        [0, 1, 2, 1, 0],
        [2, 1, 0, 1, 2],
        [1, 0, 0, 0, 1],
        [1, 2, 2, 2, 1],
        [0, 0, 1, 2, 2],
        [2, 2, 1, 0, 0],
        [1, 2, 1, 0, 1]
    ],

    keys: {
        spin: [32],
        increaseBet: [38],
        decreaseBet: [40]
    },

    text: {
        maxSize: 25.0
    },

    colors: {
        background: { r: 0, g: 0, b: 0, a: 1 },
        main: { r: 230, g: 230, b: 230, a: 1 },
        secondary: { r: 255, g: 215, b: 0, a: 1 },
    }
};
