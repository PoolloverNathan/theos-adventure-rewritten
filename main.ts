let corgJumps = 0;
let battleMode: boolean = false;
let lastBattle: number;
let lastMsOnGround: number;
let maxMsBreath: number = 5000;
const battleIntroTime = 250;
const battleCorg = corgio._corgi_right[0];

const battleModeRenderer = scene.createRenderable(200, (target, camera) => {
    const time = game.runtime() - lastBattle;
    const introCounter = Math.max((battleIntroTime - time) / battleIntroTime, 0);
    const mesBoxOffset = introCounter * (screen.height / 2)
    const charOffset = introCounter * screen.height / 10;
    target.fill(0xF);
    target.fillRect(0, screen.height - 32, screen.width, 32, 0xF)
    target.fillRect(8, Math.floor(screen.height * 2 / 3) + mesBoxOffset, screen.width - 16, screen.height * 1 / 3 - 8, 0x1)
    target.fillRect(10, Math.floor(screen.height * 2 / 3) + mesBoxOffset + 2, screen.width - 20, screen.height * 1 / 3 - 12, 0xF)
    
    // target.drawTransparentImage(battleCorgAnim[Math.floor(time / 100) % battleCorgAnim.length], 10 - charOffset, screen.height * 1/3);
    target.drawTransparentImage(battleCorg, 10 - charOffset, screen.height * 1 / 3);
}, () => battleMode)

console.error((screen.width - 16) + " " + (screen.height * 1 / 3 - 8))

function enterBattle() {
    myCorg.horizontalMovement(false);
    myCorg.verticalMovement(false);
    myCorg.sprite.setVelocity(0, 0);
    let exclaim = new Sprite(assets.image`exclaim`)
    exclaim.setPosition(myCorg.sprite.x + (exclaim.sx - myCorg.sprite.sx) / 2, myCorg.sprite.y - exclaim.sy / 2 - 24)
    pause(500);
    exclaim.destroy();
    battleMode = true; lastBattle = game.runtime();
}

function exitBattle() {
    myCorg.horizontalMovement()
    myCorg.verticalMovement()
    battleMode = false;
}

scene.onOverlapTile(SpriteKind.Player, assets.tile`fallOutMarker`, (sprite, location) => {
    scene.centerCameraAt(scene.cameraProperty(CameraProperty.X), scene.cameraProperty(CameraProperty.Y))
    async(() => {
        pause(1000)
        killCorg();
    })
})

scene.onOverlapTile(SpriteKind.Player, assets.tile`apple`, (sprite: Sprite, location: tiles.Location) => {

    // const ts = tileUtil.(location, tiles.getTileAt(location.col, location.row))
    
    let appleSprite = tileSprite(location)
    corgJumps++;
    forever(() => {
        effects.disintegrate.start(appleSprite);
    })
    if (location.col % 2 === 0) checkpoint(location);
    console.log("Apple!");
})

const Air = StatusBarKind.create();
statusbars.onZero(Air, function(status: StatusBarSprite) {
    let airbarcp = new Sprite(airbar.image);
    airbarcp.setPosition(airbar.x, airbar.y);
    airbar.destroy();
    forever(() => effects.disintegrate.start(airbarcp));
    drownCorg();
})
statusbars.onStatusReached(Air, statusbars.StatusComparison.GTE, statusbars.ComparisonType.Percentage, 100, function(status: StatusBarSprite) {
    status.setFlag(SpriteFlag.Invisible, true)
})
statusbars.onStatusReached(Air, statusbars.StatusComparison.LT, statusbars.ComparisonType.Percentage, 100, function (status: StatusBarSprite) {
    status.setFlag(SpriteFlag.Invisible, false)
})
scene.onOverlapTile(SpriteKind.Player, assets.tile`cpFlag`, (sprite: Sprite, location: tiles.Location) => {

    // const ts = tileUtil.(location, tiles.getTileAt(location.col, location.row))

    let appleSprite = tileSprite(location)
    forever(() => {
        effects.disintegrate.start(appleSprite);
    })
    checkpoint(location);
    music.jumpUp.play();
    console.log("CHECKPOINT!");
})

const MAPS = {
    level1: assets.tilemap`level1`,
    level2: assets.tilemap`level2`
}

enum Entrance {
    Normal,
    Door0,
    Door1,
    Door2,
    Door3
}

// @ts-ignore
type Mapping<K, V> = { [key in K]: V }
const Exits: Mapping<string, Mapping<Entrance, string>> = {
    level1: {
        [Entrance.Normal]: "level2"
    },
    level2bonus: {
        [Entrance.Door0]: "level2"
    }
}

// @ts-ignore
const Entrances: Mapping<string, Mapping<Entrance, [number, number]>> = {
    level1: {
        [Entrance.Normal]: [9, 14]
    },
    level2: {
        [Entrance.Normal]: [1, 26],
        [Entrance.Door0]: [30, 26]
    },
    level2bonus: {
        [Entrance.Door0]: [2, 10]
    }
}

function checkpoint(location: tiles.Location) {
    cp = location;
    let cpText = textsprite.create("Checkpoint!", 0, 15);
    tiles.placeOnTile(cpText, location.getNeighboringLocation(CollisionDirection.Top));
    async(() => {
        pause(500)
        forever(() => {
            effects.disintegrate.start(cpText);
        })
    })
}

let lavaCooldown = false;
scene.onOverlapTile(SpriteKind.Player, assets.tile`lavaTop`, (sprite) => {
    if (lavaCooldown || myCorg.sprite !== sprite) return;
    lavaCooldown = true;
    killCorg(() => lavaCooldown = false)
})

const Car = SpriteKind.create();
sprites.onOverlap(SpriteKind.Player, Car, (p, car) => {
    myCorg.horizontalMovement(false)
    myCorg.verticalMovement(false)
    p.follow(car);
    pause(500);
    car.vx = 50;
    animation.runImageAnimation(car, assets.animation`car3Right`, 500, false)
    p.setFlag(SpriteFlag.Invisible, true)
    pauseUntil(() => car.isHittingTile(CollisionDirection.Right));
    pause(500);
    color.FadeToWhite.startScreenEffect(1000);
    loadTilemap((<any>Exits)[TM_NAME][Entrance.Normal]);
    p.follow(null);
    color.startFadeUntilDone(color.White, color.originalPalette);
})

const TileSprite = SpriteKind.create();
const carSprite = sprites.vehicle.car30.clone();
carSprite.flipX();
sprites.onCreated(TileSprite, (sprite) => {
    sprite.z = 1;
})
tiles.addEventListener(tiles.TileMapEvent.Loaded, (map) => {
    tileUtil.createSpritesOnTiles(assets.tile`carMarker`, carSprite, Car)
    for (let car of sprites.allOfKind(Car)) {
        tiles.setTileAt(car.tilemapLocation(), assets.tile`sky`);
        car.y += 8;
        car.z = 0;
    }
    tileUtil.createSpritesOnTiles(assets.tile`forestTiles9Priority`, sprites.builtin.forestTiles9, TileSprite);
    tileUtil.createSpritesOnTiles(assets.tile`forestTiles10Priority`, sprites.builtin.forestTiles10, TileSprite);
});

const ghostsOfCorg: Sprite[] = [];

let killCorgDb = false;
function killCorg(cb?: () => void, disDelay?: number) {
    if (!disDelay) disDelay = 0;
    if (killCorgDb) return;
    killCorgDb = true;
    myCorg.horizontalMovement(false);
    myCorg.verticalMovement(false);
    let savedSprite = myCorg.sprite;
    const {x, y} = savedSprite;
    async(() => {
        pause(disDelay);
        forever(() => effects.disintegrate.start(savedSprite))
    });
    myCorg.sprite.setStayInScreen(false);
    async(() => {
        pause(500)
        newCorg(cp)
        killCorgDb = false;
        cb && cb();
        // pause(500);
        let goc = sprites.create(assets.image`ghost_of_corg`, GhostOfCorg);
        goc.setPosition(x, y)
        ghostsOfCorg.push(goc);
        updateGhostFollowing();
    })
}

let splashtheoName = textsprite.create("THEO's", 0, 15)
splashtheoName.setMaxFontHeight(24);
splashtheoName.setPosition(scene.screenWidth() / 2 - splashtheoName.sx / 2, 24)

let splashadventure = textsprite.create("adventure", 0, 15)
splashadventure.setMaxFontHeight(12);
splashadventure.setPosition(scene.screenWidth() / 2 - splashadventure.sx / 2, 48)

let splashstart = textsprite.create("Press A to start", 15, 1)
splashstart.setMaxFontHeight(8);
splashstart.setPosition(scene.screenWidth() / 2 - splashstart.sx / 2, screen.height - 32)

let splashCopyright = textsprite.create(`Copyright Nathan Kulzer`, 0, 15)
splashCopyright.setMaxFontHeight(8);
// splashCopyright.setScale(2/3, ScaleAnchor.Middle)
splashCopyright.setPosition(scene.screenWidth() / 2 - splashCopyright.sx / 2, screen.height - 16)

let splashCopyright2 = textsprite.create(`2022-${randint(20000, 100000)}`, 0, 15)
splashCopyright2.setMaxFontHeight(8);
// splashCopyright.setScale(2/3, ScaleAnchor.Middle)
splashCopyright2.setPosition(scene.screenWidth() / 2 - splashCopyright2.sx / 2, screen.height - 8)

let myCorg: Corgio; let airbar: StatusBarSprite; newCorg();
myCorg.sprite.setPosition(screen.width / 2 - myCorg.sprite.sx / 2, screen.height / 2 - myCorg.sprite.sy / 2);

function drownCorg() {
    if (killCorgDb) return;
    killCorgDb = true;
    const cachedCorg = myCorg;
    myCorg.horizontalMovement(false);
    myCorg.verticalMovement(false);
    myCorg.sprite.setVelocity(0, 50);
    music.thump.play();
    async(() => {
        pauseUntil(() => cachedCorg.sprite.vy <= 0);
        killCorgDb = false;
        killCorg(() => {}, 500)
    });
}
const GhostOfCorg = SpriteKind.create();

let ghostCounter = textsprite.create("0", colors.BLACK, colors.TAN);
ghostCounter.setMaxFontHeight(8);
ghostCounter.setFlag(SpriteFlag.RelativeToCamera, true);
// ghostCounter.setImage(assets.image`ghost_of_corg`)
ghostCounter.setPosition(ghostCounter.width /2, ghostCounter.height /2)
function updateGhostFollowing() {
    ghostsOfCorg.reduce((a, b) => (b.follow(a), b), myCorg.sprite);
    if (ghostsOfCorg.length) ghostCounter.setText(ghostsOfCorg.length + "")
}

function newCorg(location?: tiles.Location) {
    myCorg = corgio.create(SpriteKind.Player)
    myCorg.maxJump = Infinity;
    myCorg.horizontalMovement()
    myCorg.verticalMovement()
    myCorg.sprite.z = -1;
    airbar = statusbars.create(20, 4, Air);
    airbar.setColor(colors.AQUA, colors.CLEAR);
    airbar.attachToSprite(myCorg.sprite)
    airbar.setFlag(SpriteFlag.Invisible, true)
    if (location) {
        myCorg.sprite.setStayInScreen(false)
        tiles.placeOnTile(myCorg.sprite, location)
        jumpCameraTo(myCorg.sprite, () => myCorg.sprite.setStayInScreen(true));
        music.footstep.play();
    }
    updateGhostFollowing();
    myCorg.sprite.setImage(myCorg.sprite.image.clone());
}

color.setPalette(color.White);
scene.setBackgroundColor(1);
color.startFadeUntilDone(color.White, color.originalPalette)
// scene.setBackgroundImage(assets.image`splash`);
let fancy: boolean;
pauseUntil(() => (fancy = controller.A.isPressed()) || controller.B.isPressed());
myCorg.maxJump = 0;
splashstart.vy = 20;
let startLevel;
// if (fancy) {
startLevel = "level" + game.askForString("START LEVEL?", 12)
const debug = game.ask("DEBUG?");
if (debug) {
    const debugTexts = {
        location: textQuick("", 0, 16, 8, true, colors.BLACK, colors.CYAN),
        cp: textQuick("", 0, 24, 8, true, colors.BLACK, colors.GREEN),
        velocity: textQuick("", 0, 32, 8, true, colors.BLACK, colors.ORANGE),
    }

    forever(() => {
        if (!myCorg) return;
        const S = myCorg.sprite;
        const C = cp;
        if (!C) return;
        debugTexts.location.setText(`L:${S.x},${S.y}`);
        debugTexts.cp.setText(`C:${C.col},${C.row} J:${nnice((<any>myCorg).remainingJump)}/${nnice(corgJumps)},${nnice(myCorg.maxJump)}`);
        debugTexts.velocity.setText(`V:${Math.round(S.vx)},${Math.round(S.vy)}`)
    })
}
// }
if (fancy) color.FadeToWhite.startScreenEffect();
if (fancy) color.pauseUntilFadeDone();
const defaultGravity = myCorg.gravity;
let lastTick = game.runtime()
forever(() => {
    let dx = game.runtime() - lastTick;
    lastTick += dx;
    if (killCorgDb) return;
    updateGhostFollowing();
    let { col, row } = myCorg.sprite.tilemapLocation();
    if (tiles.tileAtLocationEquals(myCorg.sprite.tilemapLocation(), assets.tile`waterTop`)) {
        myCorg.maxJump = Infinity;
        (<any>myCorg).remainingJump = Infinity;
        myCorg.gravity = -5;
        if (<any>myCorg.sprite.vy > 10) myCorg.sprite.vy = 10;
        lastMsOnGround = lastTick;
        /* airbar.value = (); */
    } else {
        myCorg.maxJump = corgJumps;
        if (myCorg.sprite.isHittingTile(CollisionDirection.Bottom)) lastMsOnGround = lastTick;
        if ((<any>myCorg).remainingJump > 100) (<any>myCorg).remainingJump = corgJumps;
        myCorg.gravity = defaultGravity;
        airbar.value += dx / 20;
    }
})

let TM_NAME: string = null;
function loadTilemap(tm: string, entrance: Entrance = Entrance.Normal) {
    // @ts-ignore
    if (!MAPS[tm]) throw(`Unknown tilemap ${tm}`);
    scene.setTileMapLevel((<Mapping<string, tiles.TileMapData>>MAPS)[tm]);
    TM_NAME = tm;
    // @ts-ignore
    const [cpx, cpy] = Entrances[tm][entrance];
    cp = tiles.getTileLocation(cpx, cpy)
}

function loadExit(entrance: Entrance = Entrance.Normal) {

}

// loadTilemap("level1")
loadTilemap(startLevel)
scene.setBackgroundColor(1);
scene.setBackgroundImage(assets.image`transparency16`);
let cp: tiles.Location;
tiles.placeOnTile(myCorg.sprite, cp)
scene.cameraFollowSprite(myCorg.sprite);
if (fancy) color.startFade(color.White, color.originalPalette)
if (fancy) color.pauseUntilFadeDone();
myCorg.horizontalMovement()
controller.B.onEvent(ControllerButtonEvent.Pressed, killCorg)
controller.A.onEvent(ControllerButtonEvent.Pressed, () => battleMode ? exitBattle() : enterBattle())