// Add your code here
const async = (fn: () => void) => control.runInParallel(fn);
const π = Math.PI;

function tileSprite(location: tiles.Location) {
    const {col, row} = location;
    let appleSprite = new Sprite(tiles.getTileAt(col, row));
    tiles.setTileAt(location, assets.tile`transparency16`)
    tiles.placeOnTile(appleSprite, location);
    return appleSprite
} 

function lerp(zero: number, one: number, fac: number) {
    return one * fac + zero * (1-fac);
}

function cameraTarget() {
    return {
        x: scene.cameraLeft() + screen.width / 2,
        y: scene.cameraTop() + screen.height / 2
    }
}

function camPosify({x, y}: {x: number, y: number}) {
    return {
        x: x - screen.width / 2,
        y: y - screen.height / 2
    }
}

const curveAlongLine = (line: number) => {
    /* line -= 0.5
    if (line < 0)
        line *= -1;
    let lp = 0.5 - line;
    return lerp(50, 100, lp*2) */
    const ret = Math.sin(line * π);
    console.log(`${line}->${ret}`);
    return ret;
}

curveAlongLine(0);

function jumpCameraTo(sprite: Sprite, cb?: () => void) {
    const origPos = cameraTarget();
    async(() => {
        for (
            let i = 0;
            i < 1;
            i += 0.1,
            pause(
                curveAlongLine(i)
            )
        ) {
            scene.centerCameraAt(
                lerp(origPos.x, sprite.x, i),
                lerp(origPos.y, sprite.y, i)
            )
        }
        scene.cameraFollowSprite(sprite);
        cb && cb();
    })
}

function textQuick(str: string, x: number, y: number, h: number, r: boolean, bg: number, fg: number) {
    const text = textsprite.create(str, bg, fg);
    text.setMaxFontHeight(h);
    text.setFlag(SpriteFlag.RelativeToCamera, r);
    text.setPosition(x, y);
    return text;
}

function nnice(number: number) {
    if (number === Infinity) {
        return "I";
    } else if (isNaN(number)) {
        return "N";
    }
    return number.toString();
}