class Symbol {
    #parent;

    #type;

    #currentOffsetY;

    #img;

    #isReadyForDraw;

    #isThisAWinningSymbol;

    #IMAGE_MARGIN = 16;
    
    #currentMargin;
    #currentLerpWay;
    #currentLerpStep;

    constructor(parent, typeIndex) {
        this.#parent = parent;

        this.#type = typeIndex;

        this.#isReadyForDraw = false;

        this.#isThisAWinningSymbol = false;

        this.#currentMargin = this.#IMAGE_MARGIN;
        this.#currentLerpWay = 0;
        this.#currentLerpStep = 0.0;
        
        this.createImage();
    }

    get type() {
        return this.#type;
    }

    get canvas() {
        return this.#parent.canvas;
    }

    get ctx() {
        return this.#parent.ctx;
    }

    createImage() {
        this.#img = new Image();

        let _this = this;
        this.#img.onload = function() {
            _this.#isReadyForDraw = true;
        }

        this.#img.src = `assets/images/symbols/${cfg.symbols[this.#type].img}`;
    }

    updateWinningSymbolStatus(status) {
        this.#isThisAWinningSymbol = status == true;
    }

    onDrawTick(x, y, width, height) {
        if (this.#isReadyForDraw) {
            this.ctx.drawImage(this.#img, x + this.#currentMargin, y + this.#currentMargin, width - (this.#currentMargin * 2), height - (this.#currentMargin * 2));
            this.updateMargin();
        }
    }

    updateMargin() {
        if (this.#isThisAWinningSymbol) {
            let lerpValue = lerp(this.#IMAGE_MARGIN * (1 - this.#currentLerpWay), this.#IMAGE_MARGIN * this.#currentLerpWay, this.#currentLerpStep);
            this.#currentLerpStep += 1 / 1000 * msPerFrame;

            this.#currentMargin = lerpValue;
            
            if (lerpValue >= this.#IMAGE_MARGIN) {
                this.#currentLerpStep = 0.0;
                this.#currentLerpWay = (this.#currentLerpWay - 1) * (this.#currentLerpWay - 1); 
            }
        } else {
            this.#currentMargin = this.#IMAGE_MARGIN;
        }
    }
}