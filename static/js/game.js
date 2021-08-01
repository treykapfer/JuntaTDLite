//init the canvas element and establish size
const canvas = document.getElementById('game_canvas');
const endForm = document.getElementById('enterNamePopUp');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

console.log("Game initialized on " + canvas + ctx);
console.log("Welcome Commander");

//GLOBAL VARIABLES//
//init all arrays to store our objects
const cellSize = 100;
const cellGap = 3;
const gameGrid = [];
const defenders = [];
const miners = [];
const enemies = [];
const projectiles = [];
const resources = [];

//SCALING VARIABLES
let level = 1;
let winningScore = 80;
let enemyRate = 650;
let enemyRateIncrease = 20;
let enemyFloor = 120;
let enemyCeiling = enemyRate;
let morassiumRate = 700;
let enemyDamage = .2;

//others
let enemyPositions = [];
let morassium = 0;
let numberOfCredits = 400;
let incrementer = 10;
let frame = 0;
let killCount = 0;
let enemyBaseSpeed = 0.4;

//SCORE TRACKERS
let casualties = 0;
let extractorDeaths = 0;
let totalMorassium = 0;
let HPKilled = 0;
let playerScore = 0;
let totalMinerCount = 0;
let levelBossKillCount = 0;
let totalBossKillCount = 0;

//SWITCHES
let gameOver = false;
let gameWon = false;
let levelCleared = false;
let bossActive = false;

//MOUSE
const mouse = {
    x: 10,
    y: 10,
    width: 0.1,
    height: 0.1
}

//access mouse position
let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', (e)=> {
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
});

canvas.addEventListener('mouseleave', (e)=> {
    mouse.x = undefined;
    mouse.y = undefined;
});

// GAMEBOARD //
const controlsBar = {
    width: canvas.width,
    height: cellSize,
}

class Cell {
//interlinked//
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }
    
    draw(){
        //this highlights the current cell
        if (mouse.x && mouse.y && collision(this, mouse)){
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

const createGrid = () => {
    for (let y = cellSize; y < canvas.height; y += cellSize){
        for (let x=0; x < canvas.width; x += cellSize){
            gameGrid.push(new Cell(x, y));
        }
    }
}

const handleGameGrid = () => {
    for (let i = 0; i < gameGrid.length; i++){
        gameGrid[i].draw();
    }
}
// PROJECTILES //
const bullet = new Image();
bullet.src = '../static/img/bullet.png';

class Projectile {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.power = 15;
        this.speed = 5;
    }
    update(){
        this.x += this.speed;
    }
    draw(){
        ctx.drawImage(bullet, 0, 0, 64, 64, this.x, this.y - 15, this.width, this.height);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
    }
}

const handleProjectiles = () => {
    for (let i = 0; i < projectiles.length; i++){
        projectiles[i].update();
        projectiles[i].draw();

        //handle collision
        for (let j = 0; j < enemies.length; j++){
            if (enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])) {
                enemies[j].health -= projectiles[i].power;
                projectiles.splice(i, 1);
                i--;
            }
        }

        //lasers need to stop at last cell
        if (projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
            projectiles.splice(i, 1);
            i--;
        }
    }
}

// DEFENDERS //
const defender1 = new Image();
defender1.src = '../static/img/defender1.png';
const tank = new Image();
tank.src = '../static/img/tank.png';
const destroyer = new Image();
destroyer.src = '../static/img/destroyer.png';

//ANIMATION BREAKDOWN
//Frame # increments up through to max frame
//Multiply frame by the sprite width/height

class Defender {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        //as long as this.shooting = true create projectiles
        this.shooting = false;
        this.shootNow = false;
        this.health = 100;
        this.shootingSpeed = 100;
        this.defenderType = defender1;
        //ANIMATION
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 22;
        this.spriteWidth = 181;
        this.spriteHeight = 203;
    }
    draw(){
        ctx.fillStyle = 'gold';
        ctx.font = '14px orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 28, this.y);
        ctx.drawImage(this.defenderType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
    update(){
        if (frame % 4 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
            if (this.frameX === 4) this.shootNow = true;
        }

        if (this.shooting && this.shootNow) {
                let newBullet = new Projectile(this.x + 50, this.y + 35);
                if (this.defenderType == tank) {
                    newBullet.power = 20;
                    newBullet.height = 25;
                    newBullet.width = 25;
                }
                if (this.defenderType == destroyer) {
                    newBullet.power = 25;
                    newBullet.height = 30;
                    newBullet.width = 30;
                }
                projectiles.push(newBullet);
                this.shootNow = false;
            }
        if (this.shooting) {
            if (this.defenderType === defender1) {
            //shooting animation frames
            this.minFrame = 0;
            this.maxFrame = 16;
            }
            else if (this.defenderType === tank) {
                this.minFrame = 0;
                this.maxFrame = 10;
            }
            else {
                this.minFrame = 0;
                this.maxFrame = 7;
            }
        } else {
            //idle animation is not working - fix later
            this.minFrame = 0;
            this.maxFrame = 0;
        }
    }
}


const flame1 = new Image();
flame1.src = '../static/img/flame(1).png';
const flame2 = new Image();
flame2.src = '../static/img/flame(2).png';
const flame3 = new Image();
flame3.src = '../static/img/flame(3).png';
const flame4 = new Image();
flame4.src = '../static/img/flame(4).png';
const flames = [flame1, flame2, flame3, flame4];

const handleDefenders = () => {
    for (let i = 0; i < defenders.length; i++) {
        defenders[i].draw();
        defenders[i].update();
        //CHECK IF DEFENDER ON ROW
        if (enemyPositions.indexOf(defenders[i].y) !== -1){
            defenders[i].shooting = true;
        } else {
            defenders[i].shooting = false;
        }
        for (let j = 0; j < enemies.length; j++) {
        //HANDLE COLLISION
            if (defenders[i] && collision(defenders[i], enemies[j])){
                enemies[j].movement = 0;
                defenders[i].health -= enemyDamage;
                if (defenders[i].defenderType === destroyer) {
                    enemies[j].health -= 0.33;
                    ctx.drawImage(flames[Math.floor(Math.random()*flames.length)], 0, 0, 512, 512, enemies[j].x+Math.floor(Math.random()*5)-20, enemies[j].y+15+Math.floor(Math.random()*5), 72, 36);
                }
                //EXTRA DAMAGE FROM BOSSES
                if (enemies[j].enemyType === boss) {
                    defenders[i].health -= enemyDamage
                }
                if (enemies[j].enemyType === megaboss) {
                    defenders[i].health -= enemyDamage*2
                }
            }
            if (defenders[i] && defenders[i].health <= 0){
                defenders.splice(i, 1);
                i--;
                enemies[j].movement = enemies[j].speed;
                casualties++
            }
        }
    }
}

// FLOATING MESSAGES //
const floatingMessages = [];
class floatingMessage {
    constructor(value, x, y, size, color){
        this.value = value;
        this.x = x;
        this.y = y;
        this.size = size;
        this.duration = 0;
        this.color = color;
        this.opacity = 1;
    }
    update(){
        this.y -= 0.3;
        this.duration += 1;
        if (this.opacity > 0.01) this.opacity -= 0.01;
    }
    draw(){
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = this.size + 'px orbitron';
        ctx.fillText(this.value, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

const handleFloatingMessages = () => {
    for (let i = 0; i < floatingMessages.length; i++) {
        floatingMessages[i].update();
        floatingMessages[i].draw();
        if (floatingMessages[i].duration >= 50){
            floatingMessages.splice(i, 1);
            i--;
        }
    }
}

// ENEMIES //
// SET ENEMY TYPES //
const enemyTypes = [];
const enemy1 = new Image();
enemy1.src = '../static/img/enemy1.png';
enemyTypes.push(enemy1);
const boss = new Image();
boss.src = '../static/img/boss.png';
enemyTypes.push(boss);
const speedling = new Image();
speedling.src = '../static/img/speedling.png';
const enemy2 = new Image();
enemy2.src = '../static/img/enemy2.png';
const megaboss = new Image();
megaboss.src = '../static/img/megaboss.png';
let BossIncrementer = 1;
const superspeedling = new Image();
superspeedling.src = '../static/img/superspeedling.png';

class Enemy {
    constructor(verticalPosition) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * 0.2 + enemyBaseSpeed;
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
        this.enemyType = enemy1;
        //ANIMATION PROPERTIES
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 6;
        this.spriteWidth = 296;
        this.spriteHeight = 156;
    }
    update(){
        //this will make the enemy move to the left
        this.x -= this.movement;
        if (frame % 4 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
        }

    }
    draw(){
        // ctx.fillStyle = 'red';
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '14px orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 25, this.y);
        // ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
        ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
}

//cycle through enemy array with for loop
const handleEnemies = () => {
    for (let i = 0; i < enemies.length; i++){
        enemies[i].update();
        enemies[i].draw();
        //LOSS CONDITION
        if (enemies[i].x < 0){
            gameOver = true;
        }
        if (enemies[i].health <= 0){
            //CHECK IF IT WAS A BOSS
            if (enemies[i].enemyType === boss || enemies[i].enemyType === megaboss) {
                levelBossKillCount++;
            }
            //REFRESH MINER ON COLLISION *CODE 88
            for (let j = 0; j < miners.length; j++){
                if (miners[j] && collision(miners[j], enemies[i])){
                    miners[j].movement = miners[j].speed;
                }
            }
            //FLOATERS
            floatingMessages.push(new floatingMessage(`+${enemies[i].maxHealth / 10}`, enemies[i].x, enemies[i].y, 20, 'gold'));
            //GAIN KILL
            numberOfCredits += enemies[i].maxHealth / 10;
            killCount += 1;
            HPKilled += enemies[i].maxHealth;
            //REMOVE VERTICAL POSITION
            const findThisIndex = enemyPositions.indexOf(enemies[i].y);
            enemyPositions.splice(findThisIndex, 1);
            //REMOVE ENEMY
            enemies.splice(i, 1);
            i--;
        }
    }
    //CREATE basic ENEMY BY RATE
    if (frame % enemyRate === 0 && morassium < winningScore){
        //math.random/floor for a random row on grid
            let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
            enemies.push(new Enemy(verticalPosition));
            enemyPositions.push(verticalPosition);
            //stagger enemy rate
            if (enemyRate > enemyFloor) {
                enemyRate -= enemyRateIncrease;
                if (enemyRate < enemyFloor) {
                    enemyRate = enemyFloor;
                }
            }
    }
    //SPAWNS HIGHER LEVEL ENEMIES AT STAGGERED RATE AFTER LEVEL 4
    if (frame % (enemyRate + (Math.floor(1000/(incrementer-7)))) === 0 && morassium < winningScore && level >= 4) {
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
        let newEnemy2 = new Enemy(verticalPosition);
        newEnemy2.enemyType = enemy2;
        newEnemy2.health = 200;
        newEnemy2.maxHealth = 200;
        newEnemy2.speed = Math.random() * 0.5 + enemyBaseSpeed;
        newEnemy2.movement = newEnemy2.speed;
        enemies.push(newEnemy2);
        enemyPositions.push(verticalPosition);
    }
    //SPAWNS SPEEDLINGS AT LEVEL 3
    if (frame % (enemyRate + (Math.floor(900/(incrementer-6)))) === 0 && morassium < winningScore && level >= 3) {
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
        enemies.push(new Speedling(verticalPosition));
        enemyPositions.push(verticalPosition);
    }

    //SPAWNS BOSS UNITS EVERY 7K FRAMES
    if (frame % (6500 - (incrementer+level)*100) === 0 && morassium < winningScore && level >= 6) {
        for (let i = 0; i < BossIncrementer; i++) {
            let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
            enemies.push(new Boss(verticalPosition));
            enemyPositions.push(verticalPosition);
        }
    }
    //SPAWN MEGA BOSS WITH MINIONS
    if (frame % (9350 - (incrementer+level+BossIncrementer*2)*100) === 0 && morassium < winningScore && level >= 7) {
        for (let i = 0; i < Math.max(BossIncrementer-1,1); i++) {
            let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
            let newMegaBoss = new Boss(verticalPosition);
            newMegaBoss.enemyType = megaboss;
            newMegaBoss.health = 750;
            newMegaBoss.maxHealth = 750;
            newMegaBoss.speed = Math.random() * 0.6 + 0.7 + enemyBaseSpeed;
            newMegaBoss.movement = newMegaBoss.speed;
            newMegaBoss.spriteWidth = 295;
            newMegaBoss.spriteHeight = 230;
            enemies.push(newMegaBoss);
            enemyPositions.push(verticalPosition);
            }
        for (let i = 0; i < 5; i++) {
            let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
            let newEnemy2 = new Enemy(verticalPosition);
            newEnemy2.enemyType = enemy2;
            newEnemy2.health = 200;
            newEnemy2.maxHealth = 200;
            newEnemy2.speed = Math.random() * 0.5 + enemyBaseSpeed;
            newEnemy2.movement = newEnemy2.speed;
            enemies.push(newEnemy2);
            enemyPositions.push(verticalPosition);
        }
    }
    //SPAWNS SUPER SPEEDLINGS AT LEVEL 8
    if (frame % (enemyRate + (Math.floor(900/(incrementer-7)))) === 0 && morassium < winningScore && level >= 8) {
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
        let newSuperSpeedling = new Speedling(verticalPosition);
        newSuperSpeedling.enemyType = superspeedling;
        newSuperSpeedling.health = 100;
        newSuperSpeedling.maxHealth = 100;
        newSuperSpeedling.speed = Math.random() * 0.6 + 2.5 + BossIncrementer/2 + (enemyBaseSpeed*2);
        newSuperSpeedling.movement = newSuperSpeedling.speed;
        enemies.push(newSuperSpeedling);
        enemyPositions.push(verticalPosition);
    }
}

// SPEEDLING HANDLER //
class Speedling {
    constructor(verticalPosition) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * 0.6 + 2 + BossIncrementer/3 + enemyBaseSpeed;
        this.movement = this.speed;
        this.health = 50;
        this.maxHealth = this.health;
        this.enemyType = speedling;
        //ANIMATION PROPERTIES
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 4;
        this.spriteWidth = 258;
        this.spriteHeight = 258;
    }
    update(){
        this.x -= this.movement;
        if (frame % 3 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
        }

    }
    draw(){
        ctx.fillStyle = 'gold';
        ctx.font = '14px orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 25, this.y);
        ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
}

let speedlingMultiplier = 1;
const handleSpeedling = () => {
    if (frame % 2500 === 0 && level !== 1) {
        for (let i = 0; i < speedlingMultiplier; i++) {
            let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
            enemies.push(new Speedling(verticalPosition));
            enemyPositions.push(verticalPosition);
        }
        speedlingMultiplier++;
    }

    if (frame % 3010 === 0 && level >= 9) {
        for (let i = 0; i < speedlingMultiplier/3; i++) {
            let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
            let newSuperSpeedling = new Speedling(verticalPosition);
            newSuperSpeedling.enemyType = superspeedling;
            newSuperSpeedling.health = 100;
            newSuperSpeedling.maxHealth = 100;
            newSuperSpeedling.speed = Math.random() * 0.6 + 2.5 + BossIncrementer/2 + (enemyBaseSpeed*2);
            newSuperSpeedling.movement = newSuperSpeedling.speed;
            enemies.push(newSuperSpeedling);
            enemyPositions.push(verticalPosition);
        }
    } 
}

// BOSS HANDLER //
    class Boss {
        constructor(verticalPosition) {
            this.x = canvas.width;
            this.y = verticalPosition;
            this.width = cellSize + 50 - cellGap * 2;
            this.height = cellSize - cellGap * 2;
            this.speed = Math.random() * 0.6 + 0.4 + enemyBaseSpeed;
            this.movement = this.speed;
            this.health = 500;
            this.maxHealth = this.health;
            this.enemyType = boss;
            //ANIMATION PROPERTIES
            this.frameX = 0;
            this.frameY = 0;
            this.minFrame = 0;
            this.maxFrame = 12;
            this.spriteWidth = 578;
            this.spriteHeight = 450;
        }
        update(){
            this.x -= this.movement;
            if (frame % 3 === 0) {
                if (this.frameX < this.maxFrame) this.frameX++;
                else this.frameX = this.minFrame;
            }

        }
        draw(){
            ctx.fillStyle = 'gold';
            ctx.font = '14px orbitron';
            ctx.fillText(Math.floor(this.health), this.x + 25, this.y);
            ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
        }
    }

const handleBoss = () => {
    //FINAL WAVE SPAWN
    //SPAWN ON 5's
    if (level % 5 === 0 && frame % 5450 === 0) {
            for (let i = 0; i < level/2 - 1; i++) {
                if (level === 5) {
                    let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
                    enemies.push(new Boss(verticalPosition));
                    enemyPositions.push(verticalPosition);
                }
                
                if (level === 10) {
                    let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
                    let newMegaBoss = new Boss(verticalPosition);
                    newMegaBoss.enemyType = megaboss;
                    newMegaBoss.health = 750;
                    newMegaBoss.maxHealth = 750;
                    newMegaBoss.speed = Math.random() * 0.6 + 0.7 + enemyBaseSpeed;
                    newMegaBoss.movement = newMegaBoss.speed;
                    newMegaBoss.spriteWidth = 295;
                    newMegaBoss.spriteHeight = 230;
                    enemies.push(newMegaBoss);
                    enemyPositions.push(verticalPosition);
                }
            }
        //SPEEDLING FRIENDS
        for (let i = 0; i < level; i++) {
            let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
            enemies.push(new Speedling(verticalPosition));
            enemyPositions.push(verticalPosition);
        }
    }
}

//HOTFIX FOR MOVEMENT BUG
//for some reason, bugs were on occassion getting stuck if a lot were on screen at once
const refreshMovement = () => {
    for (let i = 0; i < defenders.length; i++) {
        for (let j = 0; j < enemies.length; j++) {
            if (defenders[i] && !collision(defenders[i], enemies[j])){
                enemies[j].movement = enemies[j].speed;
            }
        }
    }
    if (defenders.length === 0) {
        for (let j = 0; j < enemies.length; j++) {
            enemies[j].movement = enemies[j].speed;
        }
    }
}

// RESOURCES //
const morassiumImg = new Image();
morassiumImg.src = '../static/img/morassium.png';
const amounts = [20, 30, 40];

class Resource {
    constructor(verticalPosition) {
        this.x = Math.max(200, Math.random() * (canvas.width - cellSize));
        this.y = verticalPosition 
        this.width = cellSize * 0.6;
        this.height = cellSize * 0.6;
        this.amount = amounts[Math.floor(Math.random()* amounts.length)];
    }
    draw(){
        ctx.drawImage(morassiumImg, 0, 0, 128, 128, this.x - 15, this.y - 15, this.width, this.height);
        ctx.font = '14px orbitron';
        ctx.fillStyle = 'lime';
        ctx.fillText(this.amount, this.x + 20, this.y + 15);
    }
}
const handleResources = () => {
    if (frame % morassiumRate === 0 && morassium < winningScore && resources.length < 4){
        let verticalPosition = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
        resources.push(new Resource(verticalPosition));
    }
    //THIS DRAWS RESOURCES AND CHECKS IF THERE IS A COLLISION
    //CHANGE THIS to see if a miner is colliding
    for (let i = 0; i < resources.length; i++){
        resources[i].draw();
        // if (resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)){
        //     morassium += resources[i].amount;
        //     floatingMessages.push(new floatingMessage(`+${resources[i].amount}`, resources[i].x, resources[i].y, 20, 'gold'));
        //     resources.splice(i, 1);
        //     i--;
        // }
        for (let j = 0; j < miners.length; j++) {
            if (resources[i] && miners[j] && collision(resources[i], miners[j])) {
                morassium += resources[i].amount;
                totalMorassium += resources[i].amount;
                floatingMessages.push(new floatingMessage(`+${resources[i].amount}`, resources[i].x, resources[i].y, 20, 'lime'));
                resources.splice(i, 1);
                i--;
                miners.splice(j, 1);
                j--;
                return;
            }
        }

    }
}

// MINERS//EXTRACTORS //
const minerImg = new Image();
minerImg.src = '../static/img/miner.png';

class Miner {
    constructor(verticalPosition) {
        this.x = -100;
        this.y = verticalPosition 
        this.width = cellSize - 30 - cellGap * 2;
        this.height = cellSize - 30 - cellGap * 2;
        this.health = 50;
        this.image = minerImg;
        this.speed = 0.7;
        this.movement = this.speed;
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 12;
        this.spriteWidth = 113;
        this.spriteHeight = 135;
    }
    update(){
        this.x += this.movement;
        if (frame % 3 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
        }
    }
    draw(){
        ctx.fillStyle = 'gold';
        ctx.font = '14px orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 20, this.y);
        ctx.drawImage(this.image, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
}

const handleMiners = () => {
    //draw and update the miners
    for (let i = 0; i < miners.length; i++){
        miners[i].update();
        miners[i].draw();

        for (let j = 0; j < enemies.length; j++) {
            //HANDLE COLLISION
            if (miners[i] && miners[i].health <= 0){
                floatingMessages.push(new floatingMessage(-50, miners[i].x, miners[i].y, 20, 'red'));
                numberOfCredits -= 50;
                miners.splice(i, 1);
                i--;
                enemies[j].movement = enemies[j].speed;
                extractorDeaths ++;
                casualties++;

            }
            if (miners[i] && collision(miners[i], enemies[j])){
                enemies[j].movement = 0;
                miners[i].movement = 0;
                miners[i].health -= enemyDamage;
                //REFRESH MINER ON COLLISION SEARCH *CODE 88
            }
        }
    }

    for (let i = 0; i < resources.length; i++) {
        if (miners.length === 0 && resources.length >= 1) {
            let verticalPosition = resources[i].y - 20;
            miners.push(new Miner(verticalPosition));
            totalMinerCount++;
        }
    }
}

// UTILITIES //
const handleGameStatus = () => {
    ctx.fillStyle = 'gold';
    ctx.font = '20px orbitron';
    ctx.fillText('Credits: ' + numberOfCredits, 16, 72);
    ctx.fillText('Level: ' + level, 264, 36);
    ctx.fillText('Score: ' + playerScore, 264, 72);
    ctx.fillText(`Morassium: ${morassium}/${winningScore}`, 16, 36);

    if (gameOver){
        ctx.fillStyle = 'red';
        ctx.font = '60px orbitron';
        ctx.fillText('GAME OVER', 456, 72);
        document.getElementById("hints").innerHTML = "You know the price of failure. Report to HQ immediatley."
    }
    if (morassium >= winningScore && enemies.length === 0) {
        ctx.fillStyle = 'green';
        ctx.font = '60px orbitron';
        levelCleared = true;
    }
    if (level > 10) {
        ctx.fillStyle = 'green';
        ctx.font = '60px orbitron';
        ctx.fillText('YOU WON!', 500, 72);
        document.getElementById("hints").innerHTML = "Good work, Commander. It's brave soldiers like you that keep the empire running!"
        gameWon = true;
    }
}

const handleLevelClear = () => {
    if (levelCleared === true) {
        ///CLEAR STATS AND CASH IN MORASSIUM
        numberOfCredits += Math.floor(morassium*(incrementer/8));
        morassium = 0;
        
        ////DISPLAY MESSAGE
        if (level !== 10) {
        floatingMessages.push(new floatingMessage('LEVEL CLEARED', 444, 60, 32, 'lime'));
        floatingMessages.push(new floatingMessage('...CREDITS RECIEVED', 444, 120, 32, 'lime'));
        }

        ///HINT MESSAGES
        if (level == 1) {
            hints.push("Speedlings move much faster than other bugs, but they're easier to take down");
            hints.push("We've tracked enemy movements.. They're getting faster after each wave!");
        }
        if (level == 3) {
            document.getElementById("hints").innerHTML = "You've got new bugs incoming. We haven't seen these before. These blue ones are faster and stronger."
            hints.push("The bigger the bugs, the higher your payout.");
            hints.push("Speedlings seem to be swarming in larger and larger groups.");
            hints.push("Don't be afraid to throw some grunts in front of our more valuable assets. They know what they signed up for..");
        }

        if (level == 4) {
            document.getElementById("hints").innerHTML = "Be warned.. You've got flying bugs inbound. It looks like they pack a punch."
            hints.push("These flying boss bugs are lethal. They appear to deal twice the damage of normal bugs.");
            hints.push("Looks like we've pissed these buggers off. They're shredding us faster after each wave.");
        }

        if (level == 6) {
            document.getElementById("hints").innerHTML = "Bug activity is spiking. More flying bugs have been spotted on our radar. My god.. they're even bigger than the green ones."
        }

        if (level == 7) {
            document.getElementById("hints").innerHTML = "A new breed of speedling has emerged. Be careful, those red demons will rip you to shreds."
        }

        if (level == 8) {
            document.getElementById("hints").innerHTML = "Speedling activity is at an all time high. Satellites show theyre preparing to attack in swarms with the red ones."
        }

        if (level == 9) {
            document.getElementById("hints").innerHTML = "The bugs are making their final push. Give them everything you've got, Commander. For Imperial Terra!"
            hints.push("One last push, and the bugs are done for. You got this, commander.");
        }

        ///INCRIMENT VARIABLES AND DIFFICULTY
        incrementer++;
        level++;
        if (morassiumRate < 300) morassiumRate += (incrementer*2);
        if (winningScore < 999) winningScore = Math.min(Math.floor(winningScore + incrementer*5, 999));
        
        //ENEMY SCALING
        // enemyRate = Math.floor(enemyRate * (incrementer/10));
        enemyCeiling = Math.max(Math.floor(enemyCeiling - (incrementer*2)), 200);
        enemyRate = enemyCeiling;
        enemyBaseSpeed += .04;
        enemyRateIncrease++;
        enemyFloor = Math.max(enemyFloor - (incrementer), 25);
        if (level >= 5) enemyDamage += .025;
        if (level === 7) BossIncrementer++;
        if (level === 10) BossIncrementer++;

        //CONSOLE LOGS FOR TESTING
        // console.log(`${enemyBaseSpeed} is new base speed`);
        // console.log(`${enemyFloor} is new enemy floor`);
        // console.log(`${enemyCeiling} is new enemy ceiling`);
        // console.log(`${enemyRateIncrease} is new enemy increase rate`);

        //LEVEL CLEAR SCORE FACTOR
        playerScore -= totalMinerCount*10;
        playerScore += levelBossKillCount*1000;
        totalBossKillCount += levelBossKillCount;
        levelBossKillCount = 0;

        //RESET
        levelCleared = false;
        
    }
}

//HANDLE DEFENDER CLICK
canvas.addEventListener('click', ()=> {
    const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
    const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
    let defenderCost = 100;
    let upgradeCost = 500;
    let secondUpgradeCost = 1000;
    //STOP IT IF ITS IN THE HEADER
    if (gridPositionY < cellSize) return;
    //LOOP THROUGH THE ARRAY AND CHECK FOR SAME POSITION
    for (let i = 0; i < defenders.length; i++){
        //loop through the defender array and check their position
        //then get out of the loop if theres a stack
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) {
            if (defenders[i].defenderType === tank) {
                if (numberOfCredits > secondUpgradeCost) {
                numberOfCredits -= secondUpgradeCost;
                ///CREATE DESTROYER
                defenders[i].defenderType = destroyer;
                defenders[i].spriteWidth = 240;
                defenders[i].spriteHeight = 133;
                defenders[i].health = 400;
                defenders[i].shootingSpeed = 45;
                defenders[i].maxFrame = 7;
                return;
                }
                else return;
            }
            else if (defenders[i].defenderType === defender1) {
                if (numberOfCredits >= upgradeCost) {
                    numberOfCredits -= upgradeCost;
                    ///CREATE TANK
                    defenders[i].defenderType = tank;
                    defenders[i].spriteWidth = 175;
                    defenders[i].spriteHeight = 157;
                    defenders[i].health = 250;
                    defenders[i].shootingSpeed = 65;
                    defenders[i].maxFrame = 10;
                    return;
                }
                else return;
            } else return;
        }
    }
    //BUY DEFENDER
    if (numberOfCredits >= defenderCost) {
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfCredits -= defenderCost;
    } else {
        floatingMessages.push(new floatingMessage("You require more credits", mouse.x, mouse.y, 15, 'red'))
    }
});


//ADD HINTS AND LORE
let hints = [];
//HINTS
hints.push("Defenders can be upgraded twice, once for 500 credits, and again for 1000 credits. Click on them once you have the credits required.");
hints.push("Your upgraded defenders fire faster, deal more damage, and have far better durability.");
hints.push("Destroyers are the most powerful upgraded defenders. Their flamethrowers will incinerate anything that gets close.");
hints.push("Failure to defend our extractors as they collect morassium will result in a deduction of your credits.");
hints.push("The Earth High Junta will exchange your morassium for credits after each level.");
hints.push("The longer we take to extract these rocks, the more bugs we attract. Secure the payloads swiftly.");
//LORE
hints.push("Your success on the battlefield will be used to aid our propaganda campaigns back home.");
hints.push("We must be willing to sacrifice as many lives as neccessary to power EarthCoin and her blockchain.");
hints.push("We expect nothing but the highest performance from our commanders. The price of failure is termination.");
hints.push("Bugs, terrorists, commies - an enemy of the empire is an enemy of the empire. Handle them as you know how.");
hints.push("The recent addition of child volunteers into our militias mean we have plenty of expendable troops.");

function cycleHints() {
    if (frame === 0) {
        document.getElementById("hints").innerHTML = "Good luck, commander. Imperial Terra is counting on you!";
    }
    if (frame % 1500 === 0 && frame !== 0) {
    document.getElementById("hints").innerHTML = hints[Math.floor(Math.random()*hints.length)];
    }
}

//LOAD BACKGROUND
const background = new Image();
background.src = '../static/img/background.png';

//DA GAME LOOP
//THIS IS WHAT HAPPENS IN A FRAME
const animate = () => {
    //this clears old highlight
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, 900, 600, 0, 0, 900, 600);
    //call functions
    handleGameGrid();
    handleLevelClear();
    handleResources();
    handleMiners();
    handleDefenders();
    handleBoss();
    handleSpeedling();
    handleEnemies();
    handleProjectiles();
    handleFloatingMessages();
    handleGameStatus();
    refreshMovement();
    cycleHints();
    frame++;
    playerScore = Math.max(0, (HPKilled/2) + ((level-1)*1000) + (totalMorassium*10) + (killCount*10) - (casualties*100) - (extractorDeaths*5000) - Math.floor(frame/100));
    if (!gameOver && !gameWon) requestAnimationFrame(animate);
}

//HANDLE COLLISION
const collision = (first, second) => {
//RETURN TRUE IF COLLIDE
// OR OPERATOR ||
    if (    !(  first.x > second.x + second.width ||
                first.x + first.width < second.x ||
                first.y > second.y + second.height ||
                first.y + first.height < second.y
            )
    ) {return true};
//ELSE RETURNS FALSE
}

//CALL FUNCTIONS // ON LOAD
createGrid();
animate();

//FIX RESIZE
window.addEventListener('resize', ()=> {
    canvasPosition = canvas.getBoundingClientRect();
})