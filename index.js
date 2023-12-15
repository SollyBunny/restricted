
const can = document.getElementById("can");
const ctx = can.getContext("2d");

let scale = 1, radius = 1;
function resize() {
    can.width = can.clientWidth;
    can.height = can.clientHeight;
    scale = Math.min(can.width, can.height) / 100;
    radius = Math.max(can.width, can.height) * scale;
}
resize();
window.addEventListener("resize", resize);

const engine = Matter.Engine.create();
engine.world.gravity.scale = 0;

function ropeCreate(a, b, length) {
    const rope = Matter.Composite.create({
        name: "rope"
    });
    const divs = length / 8;
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
        const length = Matter.Vector.magnitude(Matter.Vector.sub(
            position, positionOld
        ));
        const rect = Matter.Bodies.rectangle(
            positionOld.x, positionOld.y,
            length, 2
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
                stiffness: 0.8,
                length: 0
            });
            Matter.Composite.addConstraint(engine.world, constraint);
        }
        lastRect = rect;
    }
    Matter.Composite.addConstraint(engine.world, Matter.Constraint.create({
        bodyA: a,
        bodyB: firstRect,
        pointA: Matter.Vector.create(7, 0),
        pointB: Matter.Vector.create(-4, 0),
        stiffness: 0.8,
        length: 0
    }));
    Matter.Composite.addConstraint(engine.world, Matter.Constraint.create({
        bodyA: lastRect,
        bodyB: b,
        pointA: Matter.Vector.create(4, 0),
        pointB: Matter.Vector.create(-4, 0),
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
        ropeCreate(player, p, 50);
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
        mag *= Math.SQRT2;
    }
    Matter.Body.applyForce(
        player, player.position,
        Matter.Vector.create(
            hori * mag,
            vert * mag
        )
    );
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

    // Player Controller
    playerController(players[0], "w", "a", "s", "d");
    playerController(players[1], "t", "f", "g", "h");

    // Render
    ctx.resetTransform();
    ctx.clearRect(0, 0, can.width, can.height);
    ctx.translate(can.width / 2, can.height / 2);
    engine.world.composites.forEach(body => {
        switch (body.name) {
            case "rope": {
                ctx.beginPath();
                ctx.moveTo(body.bodies[0].position.x, body.bodies[0].position.y);
                for (let i = 1; i < body.bodies.length; ++i) {
                    ctx.lineTo(body.bodies[i].position.x, body.bodies[i].position.y)
                }
                ctx.strokeStyle = "red";
                ctx.lineWidth = 2;
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
        }
    });

    // Debug Render
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
    })
}
window.requestAnimationFrame(frame);

const runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);