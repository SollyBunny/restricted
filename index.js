
const can = document.getElementById("can");
const ctx = can.getContext("2d");

let scale = 1, radius = 1;
let offset = { x: 0, y: 0 };
function resize() {
    can.width = can.clientWidth;
    can.height = can.clientHeight;
    scale = Math.min(can.width, can.height) / 500;
    radius = Math.max(can.width, can.height) * scale;
}
resize();
window.addEventListener("resize", resize);

const engine = Matter.Engine.create();
engine.world.gravity.scale = 0;
engine.positionIterations *= 2;
engine.constraintIterations *= 2;
engine.velocityIterations *= 2;

function ropeCreate(a, b, length) {
    const rope = Matter.Composite.create({
        name: "rope",
    });
    rope.plugin.ropeStart = a;
    rope.plugin.ropeEnd = b;
    rope.plugin.ropeLength = length;
    const segment = 6;
    const divs = length / segment;
    let positionOld;
    let position = a.position;
    let lastRect = undefined;
    let firstRect = undefined;
    for (let i = 1; i < divs; ++i) {
        const lerp = i / divs;
        const alerp = 1 - lerp;
        positionOld = position;
        position = Matter.Vector.create(
            a.position.x * alerp + b.position.x * lerp,
            a.position.y * alerp + b.position.y * lerp,
        );
        const angle = Matter.Vector.angle(a.position, b.position);
        const rect = Matter.Bodies.rectangle(
            positionOld.x, positionOld.y,
            segment, 5,
            {
                friction: 0,
            }
        );
        if (!firstRect) {
            firstRect = rect;
        }
        Matter.Body.rotate(rect, angle, positionOld);
        if (lastRect) {
            Matter.Composite.add(rope, rect);
            const constraint = Matter.Constraint.create({
                bodyA: lastRect,
                bodyB: rect,
                pointA: Matter.Vector.create(4, 0),
                pointB: Matter.Vector.create(-4, 0),
                stiffness: 1,
                length: 0
            });
            Matter.Composite.addConstraint(engine.world, constraint);
        }
        lastRect = rect;
    }
    Matter.Composite.addConstraint(engine.world, Matter.Constraint.create({
        bodyA: a,
        bodyB: firstRect,
        pointA: Matter.Vector.create(-1, 0),
        pointB: Matter.Vector.create(-5, 0),
        stiffness: 0.8,
        length: 0
    }));
    Matter.Composite.addConstraint(engine.world, Matter.Constraint.create({
        bodyA: b,
        bodyB: lastRect,
        pointA: Matter.Vector.create(11, 0),
        pointB: Matter.Vector.create(5, 0),
        stiffness: 0.8,
        length: 0
    }));
    Matter.Composite.add(engine.world, rope);
}

const players = [];

function playerCreate() {
    const num = players.length;
    const player = Matter.Bodies.circle(
        (num % 2 == 0 ? -20 : 20) * (Math.floor(num / 2) + 1), 0, 10,
        {
            name: "player",
            frictionAir: 0.2
        }
    );

    players.forEach(p => {
        ropeCreate(player, p, 100);
    });

    Matter.Composite.add(engine.world, player);
    players.push(player);

}
playerCreate();
playerCreate();

function playerController(player, up, left, down, right) {
    const vert = (keys[down] ? 1 : 0) - (keys[up] ? 1 : 0);
    const hori = (keys[right] ? 1 : 0) - (keys[left] ? 1 : 0);
    let mag = 0.001;
    if (vert !== 0 && hori !== 0) {
        mag /= Math.SQRT2;
    }
    Matter.Body.applyForce(
        player, player.position,
        Matter.Vector.create(
            hori * mag,
            vert * mag
        )
    );
}

const obstacles = [];

function obstacleCreate() {
    const obstacle = Matter.Composite.create({
        "name": obstacle
    });
    let position = Matter.Vector.create(0, 0);
    for (let i = 0; i < Math.random() * 5; ++i) {
        positionOld = position;
        const mag = Math.random() * 5 + 3;
        const dir = Math.random() * 2 * Math.PI;
        position = Matter.Vector.add(positionOld, Matter.Vector.create(
            Math.sin(dir) * mag,
            Math.cos(dir) * mag
        ));
        const rect = Matter.Bodies.rect(
            positionOld.x, positionOld.y,
            mag, 10
        );
        Matter.Body.rotate(dir);
        Matter.Composite.add(obstacle, rect);
    }
    Matter.Composite.add(world.engine, obstacle);
    obstacles.push(obstacle);
}

const keys = {};
window.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();
    keys[key] = true;
});
window.addEventListener("keyup", event => {
    const key = event.key.toLowerCase();
    keys[key] = false;
});

let timeOld = performance.now(), timeDelta = 1;
function frame() {
    window.requestAnimationFrame(frame);
    timeNow = performance.now();
    timeDelta = timeNow - timeOld;
    timeOld = timeNow;

    offset.x -= timeDelta / 30;

    // Player Controller
    playerController(players[0], "w", "a", "s", "d");
    playerController(players[1], "t", "f", "g", "h");

    // Render
    ctx.resetTransform();
    ctx.clearRect(0, 0, can.width, can.height);
    ctx.translate(can.width / 2, can.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(offset.x, offset.y);
    engine.world.composites.forEach(body => {
        switch (body.name) {
            case "rope": {
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.beginPath();
                ctx.moveTo(body.plugin.ropeStart.position.x, body.plugin.ropeStart.position.y);
                let i;
                for (i = 1; i < body.bodies.length - 1; ++i) {
                    const xc = (body.bodies[i].position.x + body.bodies[i + 1].position.x) / 2;
                    const yc = (body.bodies[i].position.y + body.bodies[i + 1].position.y) / 2;
                    ctx.quadraticCurveTo(body.bodies[i].position.x, body.bodies[i].position.y, xc, yc);
                }
                ctx.quadraticCurveTo(body.bodies[i].position.x, body.bodies[i].position.y, body.plugin.ropeEnd.position.x, body.plugin.ropeEnd.position.y);
                ctx.lineWidth = 2;
                const hue = (
                    body.plugin.ropeLength - 
                    Matter.Vector.magnitude(Matter.Vector.sub(body.plugin.ropeStart.position, body.plugin.ropeEnd.position))
                );
                ctx.strokeStyle = `hsl(${hue}deg 50% 50%)`;
                ctx.stroke();
                break;
            }
        }
    });
    engine.world.bodies.forEach(body => {
        switch (body.name) {
            case "player": {
                ctx.beginPath();
                ctx.arc(body.position.x, body.position.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = "black";
                ctx.fill();
                break;
            }
            case "obstacle": {
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.beginPath();
                ctx.moveTo(body.plugin.ropeStart.position.x, body.plugin.ropeStart.position.y);
                for (let i = 1; i < body.bodies.length; ++i) {
                    ctx.lineTo(body.bodies[i].position.x, body.bodies[i].position.y, xc, yc);
                }
                ctx.lineWidth = 10;
                ctx.strokeStyle = "gray";
                ctx.stroke();
                break;
            }
        }
    });

    // Debug Render
    if (window.debug) {
        Matter.Composite.allBodies(engine.world).forEach(body => {
            ctx.beginPath();
            ctx.moveTo(body.vertices[0].x, body.vertices[0].y);
            for (let i = 1; i < body.vertices.length; ++i) {
                ctx.lineTo(body.vertices[i].x, body.vertices[i].y);
            }
            ctx.lineTo(body.vertices[0].x, body.vertices[0].y);
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }
}
window.requestAnimationFrame(frame);

const runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);