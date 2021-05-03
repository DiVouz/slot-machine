function lerp(startValue, targetValue, step) {
    if (step <= 0.0) return startValue;
    if (step >= 1.0) return targetValue;
    return (1 - step) * startValue + step * targetValue;
}

function getRandomInt(from, to) {
    return Math.floor(Math.random() * to) + from;
}

function drawText(ctx, strings, colors, textAlign, textSize, fontFamily, x, y) {
    if (strings.length > 0) {
        let width = 0;

        ctx.font = `${textSize}px ${fontFamily}`;
        ctx.textAlign = textAlign;
        
        if (strings.length > 1 && textAlign == "center") {
            ctx.textAlign = "left";

            for (let i = 0; i < strings.length; i++) {
                width += ctx.measureText(strings[i]).width;
            }
        }

        let lastColorIndex = 0;
        for (let i = 0; i < strings.length; i++) {
            if (colors[i] != null) lastColorIndex = i;
            ctx.fillStyle = `rgba(${colors[lastColorIndex].r}, ${colors[lastColorIndex].g}, ${colors[lastColorIndex].b}, ${colors[lastColorIndex].a})`;
            
            ctx.fillText(strings[i], x - (width / 2), y);

            if (strings.length > 1) {
                x += ctx.measureText(strings[i]).width;
            }
        }
    }
}
