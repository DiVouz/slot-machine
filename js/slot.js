class Slot {
    #id;
    
    #reelsAmount;
    #reels;
    
    #symbolsVisibleAmount;

    #layersCount;

    #canvas;
    #ctx;

    #prefabsCount;
    #prefabsLoaded;
    #isReady;

    #currentBalance;
    #currentBetIndex;
    #currentFreeSpins;

    #textSize;

    #mainBoxWidth;
    #mainBoxHeight;
    #mainBoxStartX;
    #mainBoxStartY;

    #MAIN_BOX_MARGIN = 32;

    #isSpinPending;

    #lastWinData;

    #autoSpinTimeout;
    #autoPlaySpinsLeft;

    constructor(id, width, height, reelsAmount, symbolsVisibleAmount) {
        this.#id = "slot_" + id;

        this.#reelsAmount = reelsAmount;
        this.#symbolsVisibleAmount = symbolsVisibleAmount;

        this.#currentBalance = 1000.00;
        this.#currentBetIndex = cfg.defualtBetIndex;
        this.#currentFreeSpins = 0;

        this.#isSpinPending = false;

        this.#lastWinData = null;

        this.#autoPlaySpinsLeft = 0;

        this.#layersCount = 0;

        this.#isReady = false;

        this.createCanvas(width, height); // main, the only direct visible
        this.createCanvas(width, height); // winning draw (rect invert clip lines)
        // this.createCanvas(width, height); // draw boxes, like pay table, help, info

        this.createReels();

        this.keyListener();

        this.prefabsWarmUp();

        this.checkForAutoPlay();
    }

    get reelsAmount() {
        return this.#reelsAmount;
    }

    get canvas() {
        return this.#canvas[0];
    }

    get canvasLayers() {
        return this.#canvas;
    }

    get ctx() {
        return this.#ctx[0];
    }

    get ctxLayers() {
        return this.#ctx;
    }

    get textSize() {
        return this.#textSize;
    }

    prefabsWarmUp() {
        this.#prefabsCount = 0;
        this.#prefabsLoaded = 0;
        this.#isReady = false;

        this.imagesWarmUp(); 
        this.soundsWarmUp();
    }

    imagesWarmUp() {
        let imgLength = cfg.symbols.length;
        this.#prefabsCount += imgLength;
        
        for (let i = 0; i < imgLength; i++) {
            let tempImg = new Image;

            let _this = this;
            tempImg.onload = function() {
                _this.#prefabsLoaded++;
            }
            tempImg.src = `assets/images/symbols/${cfg.symbols[i].img}`;
        }
    }

    soundsWarmUp() {

    }

    playSound(src) {
        var tempSound = new Audio(src);   
        tempSound.play();
    }

    createCanvas(width, height) {
        this.#canvas = this.#canvas ? this.#canvas : [];
        this.#ctx = this.#ctx ? this.#ctx : [];

        this.#canvas[this.#layersCount] = document.createElement("canvas");
        
        this.#canvas[this.#layersCount].id = this.#id + '_l_' + this.#layersCount;
        this.resizeCanvas(width, height, this.#layersCount);

        this.#ctx[this.#layersCount] = this.#canvas[this.#layersCount].getContext("2d");

        this.#layersCount++;
    }

    resizeCanvas(width, height, layerIndex) {
        if (layerIndex) {
            this.#canvas[layerIndex].width = width;
            this.#canvas[layerIndex].height = height;
        } else {
            for (let i = 0; i < this.#canvas.length; i++) {
                this.#canvas[i].width = width;
                this.#canvas[i].height = height;
            }
        }

        this.calculateTextSize();
        this.calculateMainBox();
    }

    calculateTextSize() {
        this.#textSize = this.canvas.width / 40.0;
        if (this.#textSize > cfg.text.maxSize) this.#textSize = cfg.text.maxSize; 
    }

    calculateMainBox() {
        this.#mainBoxWidth = this.canvas.width - (this.#MAIN_BOX_MARGIN * 2);
        this.#mainBoxHeight = this.#mainBoxWidth / (this.#reelsAmount / this.#symbolsVisibleAmount);

        if (this.#mainBoxHeight > this.canvas.height - (this.#textSize * 5) - (this.#MAIN_BOX_MARGIN * 2)) {
            this.#mainBoxHeight = this.canvas.height - (this.#textSize * 5) - (this.#MAIN_BOX_MARGIN * 2);
            this.#mainBoxWidth = this.#mainBoxHeight * (this.#reelsAmount / this.#symbolsVisibleAmount);
        }

        this.#mainBoxStartX = (this.canvas.width / 2) - (this.#mainBoxWidth / 2);
        this.#mainBoxStartY = (this.canvas.height / 2) - (this.#mainBoxHeight / 2);
    }

    createReels() {
        this.#reels = [];

        for (let i = 0; i < this.#reelsAmount; i++) {
            this.#reels.push(new Reel(this, i, this.#symbolsVisibleAmount));
        }
    }

    keyListener() {
        let _this = this;

        document.onkeydown = function(e) {
            let keyFound = false;
            
            if (!keyFound) {
                for (let i = 0; i < cfg.keys.spin.length; i++) {
                    if (e.keyCode == cfg.keys.spin[i]) {
                        // spin
                        _this.spin();

                        keyFound = true;
                        break;
                    }
                }
            }

            if (!keyFound) {
                for (let i = 0; i < cfg.keys.increaseBet.length; i++) {
                    if (e.keyCode == cfg.keys.increaseBet[i]) {
                        // increaseBet
                        _this.increaseBet();

                        keyFound = true;
                        break;
                    }
                }
            }

            if (!keyFound) {
                for (let i = 0; i < cfg.keys.decreaseBet.length; i++) {
                    if (e.keyCode == cfg.keys.decreaseBet[i]) {
                        // decreaseBet
                        _this.decreaseBet();

                        keyFound = true;
                        break;
                    }
                }
            }
        }
    }

    isAnyReelSpinning() {
        return this.#reels.some(s => s.isSpinning == true);
    }

    getReelMinLerpStep() {
        let minStep = 1.0;

        for (let i = 0; i < this.#reels.length; i++) {
            if (this.#reels[i].currentLerpStep < minStep) {
                minStep = this.#reels[i].currentLerpStep;
            }
        }
        
        return minStep;
    }

    cleanUpReels() {
        for (let i = 0; i < this.#reels.length; i++) {
            this.#reels[i].cleanUpUnnecessaryRowSymbols();
        }
    }

    generateRandomNumberBaseOnChance(blacklistSymbols) {
        let bucket = [];
        
        for (let symbolIndex = 0; symbolIndex < cfg.symbols.length; symbolIndex++) {
            if (blacklistSymbols.some(s => s == symbolIndex)) {
                continue;
            }

            for (let j = 0; j < cfg.symbols[symbolIndex].chance; j++) {
                bucket.push(symbolIndex);
            }
        }

        return bucket[getRandomInt(0, bucket.length - 1)];
    }

    generateRespectedReelSymbols() {
        let pickedSymbols = [];

        for (let j = 0; j < this.#symbolsVisibleAmount; j++) {
            pickedSymbols.push(this.generateRandomNumberBaseOnChance(pickedSymbols));
        }

        return pickedSymbols;
    }

    spin() {
        if (this.#currentFreeSpins > 0 || (this.#currentBalance >= cfg.bets[this.#currentBetIndex])) {
            if (!this.isAnyReelSpinning()) {
                for (let i = 0; i < this.#reels.length; i++) {
                    this.#reels[i].spin(this.generateRespectedReelSymbols());
                }

                if (this.#currentFreeSpins > 0) {
                    this.#currentFreeSpins--;
                } else {
                    this.#currentBalance -= cfg.bets[this.#currentBetIndex];
                }
        
                if (this.#autoSpinTimeout) clearTimeout(this.#autoSpinTimeout);
                if (this.#autoPlaySpinsLeft > 0) this.#autoPlaySpinsLeft--;

                this.#isSpinPending = true;
                this.#lastWinData = null;

                this.playSound('assets/sounds/spin.mp3');
            }
        } else if (this.#autoSpinTimeout) {
            clearTimeout(this.#autoSpinTimeout);
        }
    }

    increaseBet() {
        if (this.#currentFreeSpins <= 0 && this.#autoPlaySpinsLeft <= 0 && !this.isAnyReelSpinning()) {
            this.#currentBetIndex++;

            if (this.#currentBetIndex >= cfg.bets.length) {
                this.#currentBetIndex = 0;
            }
        }
    }

    decreaseBet() {
        if (this.#currentFreeSpins <= 0 && this.#autoPlaySpinsLeft <= 0 && !this.isAnyReelSpinning()) {
            this.#currentBetIndex--;

            if (this.#currentBetIndex < 0) {
                this.#currentBetIndex = cfg.bets.length - 1;
            }
        }
    }

    calculatePayOut() {
        this.#lastWinData = [];
        
        let totalWins = 0.00;

        let scatterType = 9;
        
        for (let lineIndex = 0; lineIndex < cfg.payTable.length; lineIndex++) {
            let line = cfg.payTable[lineIndex];
            let timesFound = 1;

            let symbolTypeToPay = scatterType;

            for (let i = 1; i < line.length; i++) {
                let prevReelSymbol = this.#reels[i - 1].getCurrentRowSymbols()[line[i - 1]].type;
                let curReelSymbol = this.#reels[i].getCurrentRowSymbols()[line[i]].type;

                if (prevReelSymbol == curReelSymbol || prevReelSymbol == scatterType) {
                    if (prevReelSymbol != scatterType) {
                        symbolTypeToPay = prevReelSymbol;
                    }

                    timesFound++;
                } else {
                    break;
                }
            }

            let amount = cfg.symbols[symbolTypeToPay].payMultiplier[timesFound - 1] * cfg.bets[this.#currentBetIndex];
            
            if (amount > 0.0) {
                totalWins += amount;

                this.#lastWinData.push({
                    amount: amount,
                    lineIndex: lineIndex,
                    timesFound: timesFound
                });

                for (let i = 0; i < timesFound; i++) {
                    this.#reels[i].updateWinningSymbolStatus(line[i], true);
                }
            }
        }

        let scetterDataFound = [];
        let scatterTimerFound = 0;

        for (let reelIndex = 0; reelIndex < this.#reels.length; reelIndex++) {
            for (let visRowIndex = 0; visRowIndex < this.#symbolsVisibleAmount; visRowIndex++) {
                if (this.#reels[reelIndex].getCurrentRowSymbols()[visRowIndex].type == scatterType) {
                    scetterDataFound[reelIndex] = scetterDataFound[reelIndex] ? scetterDataFound[reelIndex] : [];
                    scetterDataFound[reelIndex][visRowIndex] = 1;
                    
                    scatterTimerFound++;
                }
            }
        }

        if (scatterTimerFound >= cfg.minScatterForFreeSpins) {
            for (let reelIndex = 0; reelIndex < scetterDataFound.length; reelIndex++) {
                for (let visRowIndex = 0; visRowIndex < scetterDataFound[reelIndex].length; visRowIndex++) {
                    this.#reels[reelIndex].updateWinningSymbolStatus(visRowIndex, true);
                }
            }

            this.#currentFreeSpins += cfg.freeSpinsToAdd * (scatterTimerFound - cfg.minScatterForFreeSpins + 1);
        }

        this.#currentBalance += totalWins;
        
        if (totalWins > 0 || scatterTimerFound >= cfg.minScatterForFreeSpins) {
            this.playSound('assets/sounds/payout.mp3');
        }

        this.checkForAutoPlay();    
    }

    checkForAutoPlay() {
        if (this.#autoSpinTimeout) clearTimeout(this.#autoSpinTimeout);

        if (this.#autoPlaySpinsLeft > 0) {            
            let _this = this;
            this.#autoSpinTimeout = setTimeout(function() {
                _this.spin();
            }, Math.floor(cfg.autoSpinDelay));
        }
    }

    onDrawTick() {
        this.drawBackground();

        if (!this.#isReady) {
            this.drawLoading();

            if (this.#prefabsLoaded >= this.#prefabsCount) this.#isReady = true;
        } else {
            
            this.drawMainBoxOutline();
            this.drawReels();

            this.drawMainButton();
            this.drawUiText();
            
            this.checkForPendingSpin();
            
            this.drawWinningSymbols();
        }
    }

    drawBackground() {
        this.ctx.fillStyle = `rgba(${cfg.colors.background.r}, ${cfg.colors.background.g}, ${cfg.colors.background.b}, ${cfg.colors.background.a})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawLoading() {
        this.ctx.beginPath();
        
        this.ctx.lineTo(0, 10);
        this.ctx.moveTo(this.canvas.width, 10);
        
        this.ctx.fillStyle = "blue";
        this.ctx.fill();

        this.ctx.beginPath();
        
        this.ctx.lineTo(0, 10);
        this.ctx.moveTo(lerp(0, this.canvas.width, this.#prefabsLoaded / this.#prefabsCount), 10);
        
        this.ctx.fillStyle = "blue";
        this.ctx.fill();
    }

    drawMainBoxOutline() {
        this.ctx.beginPath();
        
        this.ctx.rect(this.#mainBoxStartX, this.#mainBoxStartY, this.#mainBoxWidth, this.#mainBoxHeight);
        
        this.ctx.lineWidth = "5";
        this.ctx.strokeStyle = `rgba(${cfg.colors.main.r}, ${cfg.colors.main.g}, ${cfg.colors.main.b}, ${cfg.colors.main.a})`;
        
        this.ctx.stroke();
    }

    drawReels() {
        let reelWidth = this.#mainBoxWidth / this.#reels.length;
        let reelHeight = this.#mainBoxHeight;

        this.ctx.save();

        this.ctx.beginPath();
        this.ctx.rect(this.#mainBoxStartX, this.#mainBoxStartY, this.#mainBoxWidth, this.#mainBoxHeight);
        this.ctx.clip();

        for (let i = 0; i < this.#reels.length; i++) {
            let reelStartX = this.#mainBoxStartX + (i * reelWidth);
            let reelStartY = this.#mainBoxStartY;

            this.#reels[i].onDrawTick(reelStartX, reelStartY, reelWidth, reelHeight);
        }

        this.ctx.restore();
    }

    drawMainButton() {
        let radius = this.#textSize * 3.5;

        let startX = this.canvas.width - 150;
        let startY = this.canvas.height - (this.#textSize * 0.7) - radius;

        let opacityMulti = 0.8;

        let isAnyReelSpinning = this.isAnyReelSpinning();

        // spinning circle
        this.ctx.beginPath();

        let lerpStep = isAnyReelSpinning ? this.getReelMinLerpStep() : 1.0;
        this.ctx.arc(startX, startY, radius, 0, lerp(0.0, 2 * Math.PI, lerpStep));
        
        this.ctx.lineWidth = "2";
        this.ctx.strokeStyle = `rgba(${cfg.colors.main.r}, ${cfg.colors.main.g}, ${cfg.colors.main.b}, ${cfg.colors.main.a * opacityMulti})`;
        this.ctx.stroke();

        // main circle
        this.ctx.beginPath();

        this.ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        
        this.ctx.lineWidth = "2";
        this.ctx.strokeStyle = `rgba(${cfg.colors.main.r}, ${cfg.colors.main.g}, ${cfg.colors.main.b}, 0.1)`;
        this.ctx.stroke();

        this.ctx.fillStyle = `rgba(${cfg.colors.background.r}, ${cfg.colors.background.g}, ${cfg.colors.background.b}, ${cfg.colors.background.a * opacityMulti})`;
        this.ctx.fill();
        
        // inside symbol
        if (this.#autoPlaySpinsLeft <= 0) {
            if (!isAnyReelSpinning) { // ready
                this.ctx.beginPath();

                this.ctx.arc(startX, startY, radius / 2, 0, 2 * Math.PI);

                this.ctx.lineWidth = "1";
                this.ctx.strokeStyle = `rgba(${cfg.colors.main.r}, ${cfg.colors.main.g}, ${cfg.colors.main.b}, ${cfg.colors.main.a * opacityMulti})`;
                this.ctx.stroke();
            } else { // stop
                let sizeMutiToCircle = 0.4;

                this.ctx.beginPath();

                this.ctx.rect(startX - radius * sizeMutiToCircle, startY - radius * sizeMutiToCircle, radius * 2 * sizeMutiToCircle, radius * 2 * sizeMutiToCircle);
                
                this.ctx.lineWidth = "1";
                this.ctx.strokeStyle = `rgba(${cfg.colors.main.r}, ${cfg.colors.main.g}, ${cfg.colors.main.b}, ${cfg.colors.main.a * opacityMulti})`;
                
                this.ctx.stroke();
            }
        } else {
            let textSize = radius * 0.6;

            drawText(this.ctx,
                [this.#autoPlaySpinsLeft],
                [cfg.colors.main],
                "center", textSize, "Arial",
                startX, startY + (textSize / 3)
            );
        }
    }

    drawUiText() {        
        // game name
        drawText(this.ctx,
            ["Slot Machine"],
            [cfg.colors.secondary],
            "center", this.#textSize * 2, "Arial",
            this.canvas.width / 2, this.#textSize * 2
        );

        // balance
        drawText(this.ctx,
            ["CREDIT  "],
            [cfg.colors.secondary],
            "right", this.#textSize, "Arial",
            150, this.canvas.height - ((this.#textSize * 2 / 10) * 10)
        );

        drawText(this.ctx,
            [formatter.format(this.#currentBalance)],
            [cfg.colors.main],
            "left", this.#textSize, "Arial",
            150, this.canvas.height - ((this.#textSize * 2 / 10) * 10)
        );

        // bet
        drawText(this.ctx,
            ["BET  "],
            [cfg.colors.secondary],
            "right", this.#textSize, "Arial",
            150, this.canvas.height - ((this.#textSize * 2 / 10) * 4)
        );

        drawText(this.ctx,
            [formatter.format(cfg.bets[this.#currentBetIndex])],
            [cfg.colors.main],
            "left", this.#textSize, "Arial",
            150, this.canvas.height - ((this.#textSize * 2 / 10) * 4)
        );

        // win
        if (this.#lastWinData) {
            let totalWin = this.#lastWinData.reduce((a, b) => a + b.amount, 0);
            if (totalWin > 0.0) {
                drawText(this.ctx,
                    ["WIN ", formatter.format(totalWin)],
                    [cfg.colors.secondary, cfg.colors.main], 
                    "center", this.#textSize * 1.2, "Arial",
                    this.canvas.width / 2, this.canvas.height - (this.#textSize * 2)
                );
            }
        }

        // free spins
        if (this.#currentFreeSpins > 0) {
            drawText(this.ctx,
                ["FREE SPINS LEFT ", this.#currentFreeSpins],
                [cfg.colors.secondary, cfg.colors.main], 
                "center", this.#textSize * 0.7, "Arial",
                this.canvas.width / 2, this.canvas.height - (this.#textSize * 0.7)
            );
        }
    }

    checkForPendingSpin() {
        if (this.#isSpinPending) {
            if (!this.isAnyReelSpinning()) {
                this.cleanUpReels();
                this.calculatePayOut();

                this.#isSpinPending = false;
            }
        }
    }

    drawWinningSymbols() {
        if (this.#lastWinData) {
            let reelWidth = this.#mainBoxWidth / this.#reels.length;
            let reelHeight = this.#mainBoxHeight;
            
            let symbolHeight = reelHeight / this.#symbolsVisibleAmount;

            this.#ctx[1].clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.drawWinningLines(reelWidth, reelHeight, symbolHeight);

            this.#ctx[1].globalCompositeOperation = "destination-out";

            this.drawWinningRects(reelWidth, reelHeight, symbolHeight, 0);

            this.#ctx[1].globalCompositeOperation = "source-over";

            this.drawWinningRects(reelWidth, reelHeight, symbolHeight, 1);

            this.ctx.drawImage(this.#canvas[1], 0, 0);
        }

    }

    drawWinningLines(reelWidth, reelHeight, symbolHeight) {
        this.#ctx[1].beginPath();
        
        for (let i = 0; i < this.#lastWinData.length; i++) {
            let winData = this.#lastWinData[i];

            this.#ctx[1].moveTo(this.#mainBoxStartX + (0.5 * reelWidth), this.#mainBoxStartY + reelHeight - (cfg.payTable[winData.lineIndex][0] * symbolHeight) - (0.5 * symbolHeight));

            for (let j = 1; j < cfg.payTable[winData.lineIndex].length; j++) {
                this.#ctx[1].lineTo(this.#mainBoxStartX + (j * reelWidth) + (0.5 * reelWidth), this.#mainBoxStartY + reelHeight - (cfg.payTable[winData.lineIndex][j] * symbolHeight) - (0.5 * symbolHeight));
            }
        }

        this.#ctx[1].lineWidth = "2";
        this.#ctx[1].strokeStyle = `rgba(${cfg.colors.secondary.r}, ${cfg.colors.secondary.g}, ${cfg.colors.secondary.b}, ${cfg.colors.secondary.a})`;
        this.#ctx[1].stroke();
    }

    drawWinningRects(reelWidth, reelHeight, symbolHeight, fORs) {
        let BOX_MARGIN = 8;

        this.#ctx[1].beginPath();

        for (let i = 0; i < this.#lastWinData.length; i++) {
            let winData = this.#lastWinData[i];
            for (let j = 0; j < winData.timesFound; j++) {
                this.#ctx[1].rect(this.#mainBoxStartX + (j * reelWidth) + BOX_MARGIN, this.#mainBoxStartY + reelHeight - ((cfg.payTable[winData.lineIndex][j] + 1) * symbolHeight) + BOX_MARGIN, reelWidth - (BOX_MARGIN * 2), symbolHeight - (BOX_MARGIN * 2));
            }
        }

        if (fORs == 1) {
            this.#ctx[1].lineWidth = "2";
            this.#ctx[1].strokeStyle = `rgba(${cfg.colors.secondary.r}, ${cfg.colors.secondary.g}, ${cfg.colors.secondary.b}, ${cfg.colors.secondary.a})`;
            this.#ctx[1].stroke();
        } else {
            this.#ctx[1].fillStyle = `rgba(${cfg.colors.main.r}, ${cfg.colors.main.g}, ${cfg.colors.main.b}, ${cfg.colors.main.a})`;
            this.#ctx[1].fill();
        }
    }
}
