class Reel {
    #id;

    #parent;

    #symbolsVisibleAmount;
    #symbols;

    #SYMBOLS_POOL_SIZE = 5;
    
    #rotateSpeed;
    #currentLerpStep;

    #isSpinning;

    constructor(parent, id, symbolsVisibleAmount) {
        this.#id = id;
        this.#parent = parent;

        this.#symbolsVisibleAmount = symbolsVisibleAmount;

        this.#rotateSpeed = 1 / Math.round(cfg.spinTime.normal - ((this.#parent.reelsAmount - 1) * (cfg.spinTime.normal / 20)) + ((cfg.spinTime.normal / 20) * this.#id));
        
        this.#currentLerpStep = 0.0;
        this.#isSpinning = false;

        this.spin();
    }

    get id() {
        return this.#id;
    }

    get parent() {
        return this.#parent;
    }

    get canvas() {
        return this.#parent.canvas;
    }

    get ctx() {
        return this.#parent.ctx;
    }

    get rotateSpeed() {
        return this.#rotateSpeed;
    }

    get isSpinning() {
        return this.#isSpinning;
    }

    get currentLerpStep() {
        return this.#currentLerpStep;
    }

    createNewRowSymbolByType(symbolType) {
        this.#symbols.push(new Symbol(this, symbolType));
    }

    cleanUpUnnecessaryRowSymbols() {
        this.#symbols.splice(0, this.#symbols.length - this.#symbolsVisibleAmount);
    }

    spin(types) {
        if (this.#symbols) {
            this.#currentLerpStep = 0.0;
            this.#isSpinning = true;
        
            for (let i = 0; i < (this.#SYMBOLS_POOL_SIZE * this.#symbolsVisibleAmount); i++) {
                this.createNewRowSymbolByType(getRandomInt(0, cfg.symbols.length));
            }
        } else {
            this.#symbols = [];
        }

        types = types ? types : [];
        for (let i = 0; i < this.#symbolsVisibleAmount; i++) {
            types[i] = types[i] ? types[i] : getRandomInt(0, cfg.symbols.length);
            this.createNewRowSymbolByType(types[i]);
        }    
    }

    updateWinningSymbolStatus(symbolIndex, status) {
        this.#symbols[symbolIndex].updateWinningSymbolStatus(status == true);
    }

    getCurrentRowSymbols() {
        return this.#symbols;
    }

    onDrawTick(reelStartX, reelStartY, reelWidth, reelHeight) {
        this.drawOutline(reelStartX, reelStartY, reelWidth, reelHeight);

        this.drawSymbols(reelStartX, reelStartY, reelWidth, reelHeight);
    }

    drawOutline(reelStartX, reelStartY, reelWidth, reelHeight) {
        this.ctx.beginPath();

        this.ctx.rect(reelStartX, reelStartY, reelWidth, reelHeight);
        
        this.ctx.lineWidth = "1";
        this.ctx.strokeStyle = `rgba(${cfg.colors.main.r}, ${cfg.colors.main.g}, ${cfg.colors.main.b}, ${cfg.colors.main.a})`;
        this.ctx.stroke();
    }

    drawSymbols(reelStartX, reelStartY, reelWidth, reelHeight) {
        if (!this.#symbols) return;

        let reelEndY = reelStartY + reelHeight;
        let symbolHeight = reelHeight / this.#symbolsVisibleAmount;

        let lerpMaxValue = symbolHeight * (this.#symbols.length - this.#symbolsVisibleAmount);
        let lerpValue = lerp(0.0, lerpMaxValue, this.#currentLerpStep);

        if (this.#isSpinning) {
            if (lerpValue >= lerpMaxValue) {
                this.#isSpinning = false;
            } else {
                this.#currentLerpStep += this.#rotateSpeed * msPerFrame;
            }
        };

        for (let i = 0; i < this.#symbols.length; i++) {
            let symbolY = reelEndY - ((i + 1) * symbolHeight) + lerpValue;
            if (symbolY <= (reelEndY + symbolHeight)) {
                if (symbolY >= (reelStartY - symbolHeight)) {
                    this.#symbols[i].onDrawTick(reelStartX, symbolY, reelWidth, symbolHeight);
                }
            }
        }
    }
}
