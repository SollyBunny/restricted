
const can = document.getElementById("can");
const ctx = can.getContext("2d");

const perf = {
	lastReset: -Infinity,
	fps: [0, 0, 0, 0],
	render: [0, 0, 0, 0],
	physics: [0, 0, 0, 0],
};

let scale = 1, radius = 500, aspect = 1;
let width, height;
let offset = { x: 0, y: 0 };
const size = 500;
function resize() {
	can.width = can.clientWidth;
	can.height = can.clientHeight;
	scale = Math.min(can.width, can.height) / size;
	radius = Math.max(can.width, can.height) / scale * 1.2;
	aspect = can.width / can.height;
	width = can.width / scale;
	height = can.height / scale;
}
resize();
window.addEventListener("resize", resize);

const engine = Matter.Engine.create();
engine.world.gravity.scale = 0;
engine.enableSleeping = true;
// engine.positionIterations *= 2;
// engine.constraintIterations *= 2;
// engine.velocityIterations *= 2;

function randomPtInRectMinusCenter(min, max) {
	max *= size;
	min *= size;
	const dis = max - min;
	let i = 0;
	while (1) {
		let x = (Math.random() - 0.5) * (width + max);
		let y = (Math.random() - 0.5) * (height + max);
		i += 1;
		if (i > 100) console.log("aghhh")
		if (i > 50 || (
			(x < (-min - width) / 2 || x > (min + width) / 2) ||
			(y < (-min - height) / 2 || y > (min + height) / 2)
		)) {
			return { x: x + offset.x, y: y + offset.y };
		}
	}
}
function sideX(a) {
	a -= offset.x;
	if (Math.abs(a) < width / 2) {
		return a / (width / 2);
	}
	return (a - (width / 2 * Math.sign(a))) / size * 2 + Math.sign(a);
}
function sideY(a) {
	a -= offset.y;
	if (Math.abs(a) < height / 2) {
		return a / (height / 2);
	}
	return (a - (height / 2 * Math.sign(a))) / size * 2 + Math.sign(a);
}
function outside(vec, by) {
	by = by || 1.1;
	if (Math.abs(sideX(vec.x)) > by) return true;
	if (Math.abs(sideY(vec.y)) > by) return true;
	return false;
}

let timeOld = performance.now(), timeDelta = 1;
function frame() {
	window.requestAnimationFrame(frame);
	timeNow = performance.now();
	timeDelta = Math.min(timeNow - timeOld, 60);
	timeOld = timeNow;

	{
		const x = timeNow / 5000000;
		const dir = (
			Math.cos(5 * x) * Math.sin(4 * x) +
			Math.sin(3 * x) * Math.cos(2 * x)
		) * 2 * Math.PI;
		const mag = timeDelta / 30;
		offset.x += Math.sin(dir) * mag;
		offset.y += Math.cos(dir) * mag;
	}

	for (let i = grass.size; i < size; ++i) {
		new Grass();
	}

	// Render
	ctx.resetTransform();
	ctx.fillStyle = "#d4ef69";
	ctx.fillRect(0, 0, can.width, can.height);
	ctx.translate(can.width / 2, can.height / 2);
	if (window.debug && window.debugscale) {
		ctx.scale(scale / window.debugscale, scale / window.debugscale);
	} else {
		ctx.scale(scale, scale);
	}
	ctx.translate(-offset.x, -offset.y);

	if (floors.size < 5) {
		new Floor(...createFloor());
	}
	if (obstacles.size < 10) {
		new Obstacle(...createObstacle());
	}
	if (zombs.size < 40) {
		new Zomb(...createZomb());
	}

	floors.forEach(i => { i.render(); i.update(); });
	grass.forEach(i => { i.render(); i.update(); });
	obstacles.forEach(i => { i.render(); i.update(); });
	zombs.forEach(i => { i.render(); i.update(); });
	ropes.forEach(i => { i.render(); i.update(); });
	players.forEach(i => { i.update(); i.render(); })

	if (window.debug) {
		if (p1) p1.hp = 1.5;
		if (p2) p2.hp = 1.5;
		perf.render[0] = performance.now() - timeNow;
		perf.physics[0] = engine.timing.lastElapsed;
		perf.fps[0] = 1000 / timeDelta;
		// TODO: avg, min, max, reset
		// Debug Camera Outline
		const colors = ["red", "orange", "yellow", "lime", "green", "cyan", "blue"];
		ctx.lineWidth = 5;
		for (let i = 0; i < colors.length; ++i) {
			ctx.strokeStyle = colors[i];
			ctx.strokeRect(
				-width / 2 - size * i / 2 + offset.x,
				-height / 2 - size * i / 2 + offset.y,
				width + size * i,
				height + size * i
			);	
		}
		// Debug Render
		const outline = new Path2D();
		const centers = new Path2D();
		const constraints = new Path2D();
		Matter.Composite.allBodies(engine.world).forEach(body => {
			centers.moveTo(body.vertices[0].x, body.vertices[0].y);
			centers.arc(body.position.x, body.position.y, 2, 0, 2 * Math.PI)
			outline.moveTo(body.vertices[0].x, body.vertices[0].y);
			for (let i = 1; i < body.vertices.length; ++i) {
				outline.lineTo(body.vertices[i].x, body.vertices[i].y);
			}
			outline.lineTo(body.vertices[0].x, body.vertices[0].y);
		});
		Matter.Composite.allConstraints(engine.world).forEach(constraint => {
			let a = Matter.Vector.create();
			if (constraint.bodyA) a = Matter.Vector.add(a, constraint.bodyA.position);
			if (constraint.pointA) a = Matter.Vector.add(a, constraint.pointA);
			let b = Matter.Vector.create();
			if (constraint.bodyB) b = Matter.Vector.add(b, constraint.bodyB.position);
			if (constraint.pointB) b = Matter.Vector.add(b, constraint.pointB);
			constraints.moveTo(a.x, a.y);
			constraints.lineTo(b.x, b.y);
		});
		ctx.lineWidth = 1;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.strokeStyle = "blue";
		ctx.stroke(outline);
		ctx.fillStyle = "#f00";
		ctx.fill(centers);
		ctx.lineWidth = 3;
		ctx.strokeStyle = "#0f0";
		ctx.stroke(constraints);
		// Draw debug text
		{
			ctx.resetTransform();
			ctx.fillStyle = "black";
			ctx.textBaseline = "top";
			const size = 20;
			ctx.font = `${size}px sans-serif`;
			ctx.fillText(`FPS: ${perf.fps[0].toFixed(1)}`, 5, 5);
			ctx.fillText(`Render: ${perf.render[0].toFixed(1)}ms`, 5, 5 + size);
			ctx.fillText(`Physics: ${perf.physics[0].toFixed(1)}ms`, 5, 5 * 2 + size * 2);
			ctx.fillText(`Offset: ${offset.x.toFixed(1)}, ${offset.y.toFixed(1)}`, 5, 5 * 3 + size * 3);
		}
		// Debug Update
		if (!window.debugscale) window.debugscale = 1;
		if (keys["A"]) offset.x -= timeDelta * window.debugscale;
		if (keys["D"]) offset.x += timeDelta * window.debugscale;
		if (keys["W"]) offset.y -= timeDelta * window.debugscale;
		if (keys["S"]) offset.y += timeDelta * window.debugscale;
		if (keys["Q"]) {
			window.debugscale -= 0.1;
			if (window.debugscale < 0.2) window.debugscale = 0.1;
		}
		if (keys["E"]) {
			window.debugscale += 0.1;
		}
	}
}
window.requestAnimationFrame(frame);

const runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);

function clearContainer(container) {
	for (const obj of container) {
		obj.del();
	}
	container.clear();
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function die(force) {
	if (window.debug) return;
	if (!force) {
		for (const player of players) {
			// Not everyone's dead yet!
			if (player.hp > 0) return;
		}
	}
	for (const rope of ropes) {
		rope.disconnect();
	}
	reset();
}
function reset() {
	[zombs, floors, grass, obstacles, players, ropes].forEach(clearContainer);
	offset.x = 0;
	offset.y = 0;
	keys = {};
	new Floor(...createFloor());
	p1 = new Player();
	p2 = new Player("t", "f", "g", "h");
	for (let i = 0; i < size; ++i) {
		new Grass(true);
	}
}

let p1, p2;
function updateControl(p, up, left, down, right) {
	p.vert = (keys[down] ? 1 : 0) - (keys[up] ? 1 : 0);
	p.hori = (keys[right] ? 1 : 0) - (keys[left] ? 1 : 0);
}
function updateControls() {
	updateControl(p1, "w", "a", "s", "d");
	updateControl(p2, "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight");
}

window.addEventListener("keydown", event => {
	keys[event.key.toLowerCase()] = keys[event.key] = true;
	updateControls();
});
window.addEventListener("keyup", event => {
	if (event.key === "B") {
		window.debug = 1 - (window.debug || 0);
	}
	keys[event.key.toLowerCase()] = keys[event.key] = false;
	updateControls();
});

reset();