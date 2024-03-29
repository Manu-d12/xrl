export let utils = {

    randomColors(length, opacity) {
        return [...new Array(length || 0)].map(() => {
            let r = Math.floor(Math.random() * 255);
            let g = Math.floor(Math.random() * 255);
            let b = Math.floor(Math.random() * 255);
            return 'rgba(' + r + ',' + g + ',' + b + (opacity ? ',' + opacity : '1') + ')';
        });
    },

    paletteColors(length, index, opacity) {
        return length ? [...new Array(length)].map((c, i) => {
            let color = this.palettes[index || 0][i % this.palettes[index || 0].length];
            return opacity ? color.replace(',1)', ',' + opacity + ')') : color;
        }) : [];
    },

    palettes: [
        [
            'rgba(234,85,69,1)',
            'rgba(244,106,155,1)',
            'rgba(239,155,32,1)',
            'rgba(237,191,51,1)',
            'rgba(237,225,91,1)',
            'rgba(189,207,50,1)',
            'rgba(135,188,69,1)',
            'rgba(39,174,239,1)',
            'rgba(179,61,198,1)'
        ],
        [
            'rgba(179,0,0,1)',
            'rgba(124,17,88,1)',
            'rgba(68,33,175,1)',
            'rgba(26,83,255,1)',
            'rgba(13,136,230,1)',
            'rgba(0,183,199,1)',
            'rgba(90,212,90,1)',
            'rgba(139,224,78,1)',
            'rgba(235,220,120,1)'
        ],
        [
            'rgba(17,95,154,1)',
            'rgba(25,132,197,1)',
            'rgba(34,167,240,1)',
            'rgba(72,181,196,1)',
            'rgba(118,198,143,1)',
            'rgba(166,215,91,1)',
            'rgba(201,229,47,1)',
            'rgba(208,238,17,1)',
            'rgba(208,244,0,1)'
        ],
        [
            'rgba(0,0,179,1)',
            'rgba(0,16,217,1)',
            'rgba(0,32,255,1)',
            'rgba(0,64,255,1)',
            'rgba(0,96,255,1)',
            'rgba(0,128,255,1)',
            'rgba(0,159,255,1)',
            'rgba(0,191,255,1)',
            'rgba(0,255,255,1)'
        ],
        [
            'rgba(255,180,0,1)',
            'rgba(210,152,13,1)',
            'rgba(165,124,27,1)',
            'rgba(120,96,40,1)',
            'rgba(54,52,69,1)',
            'rgba(72,68,110,1)',
            'rgba(94,86,155,1)',
            'rgba(119,107,205,1)',
            'rgba(144,128,255,1)'
        ],
        [
            'rgba(25,132,197,1)',
            'rgba(34,167,240,1)',
            'rgba(99,191,240,1)',
            'rgba(167,213,237,1)',
            'rgba(226,226,226,1)',
            'rgba(225,166,146,1)',
            'rgba(222,110,86,1)',
            'rgba(225,75,49,1)',
            'rgba(194,55,40,1)'
        ],
        [
            'rgba(84,190,190,1)',
            'rgba(118,200,200,1)',
            'rgba(152,209,209,1)',
            'rgba(186,219,219,1)',
            'rgba(222,218,210,1)',
            'rgba(228,188,173,1)',
            'rgba(223,151,158,1)',
            'rgba(215,101,139,1)',
            'rgba(200,0,100,1)'
        ],
        [
            'rgba(226,124,124,1)',
            'rgba(168,100,100,1)',
            'rgba(109,75,75,1)',
            'rgba(80,63,63,1)',
            'rgba(51,51,51,1)',
            'rgba(60,78,75,1)',
            'rgba(70,105,100,1)',
            'rgba(89,158,148,1)',
            'rgba(108,212,197,1)'
        ]
    ]

};