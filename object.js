
const sprites = new Set();
class Sprite {
	container = sprites;
	hidden = false;
	added = false;
	add() {
		this.body.plugin.parent = this;
		if (this.added) return;
		this.added = true;
		if (!this.hidden)
			Matter.Composite.add(engine.world, this.body)
		this.container.add(this);
	}
	del() {
		if (!this.added) return;
		this.added = false;
		if (!this.hidden)
			Matter.Composite.remove(engine.world, this.body);
		this.container.delete(this);
	}
	hide() {
		if (this.hidden) return;
		this.hidden = true;
		Matter.Composite.remove(engine.world, this.body);
	}
	unhide() {
		if (!this.hidden) return;
		this.hidden = false;
		Matter.Composite.add(engine.world, this.body);
	}
	update() { }
	render() { }
}

const ropes = new Set();
class Rope extends Sprite {
	container = ropes;
	constructor(a, b, length) {
		super();
		this.a = a;
		this.b = b;
		this.length = length;
		this.thickness = 5;
		this.segmentSize = 5;
		this.segmentLength = this.length / this.segmentSize;
		this.body = Matter.Composite.create();
		this.hasReachedLength = false;
		this.timeStart = performance.now();
		for (let i = 1; i < this.segmentLength; ++i) {
			const lerp = i / this.segmentLength;
			const alerp = 1 - lerp;
			const position = Matter.Vector.create(
				a.position.x * alerp + b.position.x * lerp,
				a.position.y * alerp + b.position.y * lerp,
			);
			const rect = Matter.Bodies.rectangle(
				position.x, position.y,
				this.segmentSize, this.thickness,
				{
					frictionAir: 0.5,
					frictionStatic: 0.8
				}
			);
			const angle = Matter.Vector.angle(a.position, b.position);
			Matter.Body.rotate(rect, angle, position);
			Matter.Composite.add(this.body, rect);
		}
		const rects = this.body.bodies;
		const midpoint = Math.floor(rects.length / 2);
		for (let i = midpoint; i > 0; --i) {
			Matter.Composite.addConstraint(this.body, Matter.Constraint.create({
				bodyA: rects[i - 1],
				bodyB: rects[i],
				pointA: Matter.Vector.create(this.segmentSize / 2, 0),
				pointB: Matter.Vector.create(-this.segmentSize / 2, 0),
				stiffness: 1,
				damping: 1,
				length: 0.1
			}));
		}
		for (let i = midpoint; i < rects.length - 1; ++i) {
			Matter.Composite.addConstraint(this.body, Matter.Constraint.create({
				bodyA: rects[i],
				bodyB: rects[i + 1],
				pointA: Matter.Vector.create(this.segmentSize / 2, 0),
				pointB: Matter.Vector.create(-this.segmentSize / 2, 0),
				stiffness: 1,
				damping: 1,
				length: 1
			}));
		}
		this.connect();
		this.add();
	}
	connect() {
		this.disconnect();
		this.connected = true;
		const rects = this.body.bodies;
		if (!this.constraintA || this.constraintA.bodyA !== this.a) {
			this.constraintA = Matter.Constraint.create({
				bodyA: this.a,
				bodyB: rects[0],
				pointB: Matter.Vector.create(-this.segmentSize / 2, 0),
				stiffness: 1,
				length: Math.max(
					Math.abs(this.a.bounds.max.x - this.a.bounds.min.x),
					Math.abs(this.a.bounds.max.y - this.a.bounds.min.y),
					1
				) / 2 + 2
			});
		}
		if (!this.constraintB || this.constraintA.bodyB !== this.b) {
			this.constraintB = Matter.Constraint.create({
				bodyA: rects[rects.length - 1],
				bodyB: this.b,
				pointA: Matter.Vector.create(this.segmentSize / 2, 0),
				stiffness: 1,
				length: Math.max(
					Math.abs(this.b.bounds.max.x - this.b.bounds.min.x),
					Math.abs(this.b.bounds.max.y - this.b.bounds.min.y),
					1
				) / 2 + 2
			});
		}
		Matter.Composite.addConstraint(this.body, this.constraintA);
		Matter.Composite.addConstraint(this.body, this.constraintB);
	}
	disconnect() {
		this.connected = false;
		Matter.Composite.removeConstraint(this.body, this.constraintA);
		Matter.Composite.removeConstraint(this.body, this.constraintB);
	}
	update() {
		if (outside(this.body.bodies[Math.floor(this.body.bodies.length / 2)].position, 3)) {
			this.del();
			return;
		}
		if (!this.connected) return;
		const disSquard = Matter.Vector.magnitudeSquared(Matter.Vector.sub(this.a.position, this.b.position));
		if (this.hasReachedLength) {
			if (disSquard > this.length * this.length * 1.5 * 1.5) {
				const velocity = Matter.Vector.mult(
					Matter.Vector.add(
						this.a.velocity,
						this.b.velocity
					), 2
				); // avg(a.vel + b.vel) * 4
				const speed = Math.max(10, Matter.Vector.magnitude(velocity));
				this.body.bodies.forEach(body => {
					Matter.Body.setVelocity(body, velocity);
					Matter.Body.setSpeed(body, speed);
					Matter.Body.setInertia(body, Infinity);
					body.frictionStatic = body.frictionAir = 0;
				})
				this.disconnect();
				window.setTimeout(() => {
					new Rope(this.a, this.b, this.length);
				}, 2000);
			}
		} else {
			if (
				timeNow - this.timeStart > 1000 ||
				disSquard < this.length * this.length * 0.9 * 0.9
			) {
				this.hasReachedLength = true;
			}
		}
	}
	render() {
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.beginPath();
		if (this.connected) {
			ctx.moveTo(this.a.position.x, this.a.position.y);
		} else {
			ctx.moveTo(this.body.bodies[0].position.x, this.body.bodies[0].position.y);
		}
		let i;
		for (i = 1; i < this.body.bodies.length - 2; ++i) {
			const xc = (this.body.bodies[i].position.x + this.body.bodies[i + 1].position.x) / 2;
			const yc = (this.body.bodies[i].position.y + this.body.bodies[i + 1].position.y) / 2;
			ctx.quadraticCurveTo(this.body.bodies[i].position.x, this.body.bodies[i].position.y, xc, yc);
		}
		if (this.connected) {
			ctx.quadraticCurveTo(this.body.bodies[i].position.x, this.body.bodies[i].position.y, this.b.position.x, this.b.position.y);
		} else {
			ctx.quadraticCurveTo(this.body.bodies[i].position.x, this.body.bodies[i].position.y, this.body.bodies[i + 1].position.x, this.body.bodies[i + 1].position.y);
		}
		ctx.lineWidth = 2;
		const hue = (
			(1 -
				Matter.Vector.magnitude(Matter.Vector.sub(this.body.bodies[0].position, this.body.bodies[this.body.bodies.length - 1].position))
			/ (this.length * 1.5)) * 120
		);
		ctx.strokeStyle = `hsl(${hue}deg 50% 50%)`;
		ctx.stroke();
		// Barbs
		ctx.beginPath();
		const thickness = this.thickness / 3;
		for (let i = this.body.bodies.length % 2; i < this.body.bodies.length; i += 2) {
			const body = this.body.bodies[i];
			ctx.save();
			ctx.translate(body.position.x, body.position.y);
			ctx.rotate(body.angle);
			ctx.moveTo(-thickness, -thickness);
			ctx.lineTo(thickness, thickness);
			ctx.moveTo(thickness, -thickness);
			ctx.lineTo(-thickness, thickness);
			ctx.restore();
		}
		ctx.strokeStyle = "#725e1b";
		ctx.lineWidth = 2;
		ctx.stroke();
	}
}

const players = new Set();
const playerColors = ["red", "blue", "green", "pink", "brown", "purple"]
class Player extends Sprite {
	container = players;
	constructor() {
		super();
		this.vert = 0;
		this.hori = 0;
		this.radius = 15;
		this.hp = 1;
		const num = players.size;
		this.body = Matter.Bodies.circle(
			(num % 2 == 0 ? -this.radius : this.radius) * 2 * (Math.floor(num / 2) + 1), 0, this.radius,
			{
				frictionAir: 0.2
			}
		);
		this.color = playerColors[num];
		this.speed = 0.003;
		for (const other of players) {
			new Rope(this.body, other.body, 100);
		};
		this.add();
	}
	update() {
		// Bounds
		const x = sideX(this.body.position.x);
		const y = sideY(this.body.position.y);
		let mag = this.speed;
		if (x < -0.9) {
			Matter.Body.applyForce(
				this.body, this.body.position,
				Matter.Vector.create(mag * 2, 0)
			);
		} else if (x > 0.9) {
			Matter.Body.applyForce(
				this.body, this.body.position,
				Matter.Vector.create(mag * -2, 0)
			);
		}
		if (y < -0.9) {
			Matter.Body.applyForce(
				this.body, this.body.position,
				Matter.Vector.create(0, mag * 2)
			);
		} else if (y > 0.9) {
			Matter.Body.applyForce(
				this.body, this.body.position,
				Matter.Vector.create(0, mag * -2)
			);
		}
		// Die
		if (this.hp <= 0) return;
		if (outside(this.body.position, 1.1)) {
			this.hp = 0;
			this.color = "gray";
			die();
			return;
		} else if (this.hp < 1) {
			this.hp += timeDelta / 10000;
			if (this.hp > 1) this.hp = 1;
		}
		for (const zomb of zombs) {
			if (Matter.Collision.collides(this.body, zomb.body, engine.pairs)) {
				this.hp -= timeDelta * 0.01;
				if (this.hp <= 0) {
					this.hp = 0;
					this.color = "gray";
					die();
					return;
				}
				break;
			}
		}
		// Controller
		if (this.vert !== 0 && this.hori !== 0) mag /= Math.SQRT2;
		const force = Matter.Vector.create(
			this.hori * mag,
			this.vert * mag
		);
		Matter.Body.applyForce(
			this.body, this.body.position, force
		);
	}
	render() {
		ctx.save();
		ctx.translate(this.body.position.x, this.body.position.y)
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.lineWidth = 1;
		ctx.strokeStyle = "black";
		// Health Bar
		if (this.hp > 0) {
			ctx.fillStyle = "black";
			ctx.beginPath();
			ctx.rect(-this.radius * 1.5, -this.radius * 1.5, this.radius * 3, this.radius * 0.2)
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = this.color;
			ctx.fillRect(-this.radius * 1.5, -this.radius * 1.5, this.radius * 3 * this.hp, this.radius * 0.2);
		} else {
			ctx.fillStyle = this.color;
		}
		// Player
		ctx.beginPath();
		ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.restore();
	}
}

const floors = new Set();
class Floor extends Sprite {
	container = floors;
	constructor(x, y, color, radius) {
		super();
		this.radius = radius;
		this.color = color
		this.body = Matter.Bodies.circle(
			x, y, 
			this.radius,
			{
				isStatic: true,
				isSensor: true
			}
		);
		this.pts = [];
		for (let i = 0; i < 20; ++i) {
			const dir = i / 20 * 2 * Math.PI;
			this.pts.push(Matter.Vector.create(
				Math.sin(dir) * this.radius + (Math.random() - 0.5) * size / 3,
				Math.cos(dir) * this.radius + (Math.random() - 0.5) * size / 3
			));
		}
		this.add();
		for (const other of grass) {
			if (Matter.Collision.collides(other.body, this.body, engine.pairs)) {
				other.color = [
					this.color[0] - Math.random() * 50 - 30,
					this.color[1] - Math.random() * 50 - 30,
					this.color[2] - Math.random() * 50 - 30
				];
			};
		}
	}
	update() {
		if (outside(this.body.position, 3)) {
			this.del();
		}
	}
	render() {
		ctx.save();
		ctx.translate(this.body.position.x, this.body.position.y);
		ctx.beginPath();
		ctx.moveTo(this.pts[0].x, this.pts[0].y);
		let i;
		for (i = 1 ; i < this.pts.length - 1; ++i) {
			const xc = (this.pts[i].x + this.pts[i + 1].x) / 2;
			const yc = (this.pts[i].y + this.pts[i + 1].y) / 2;
			ctx.quadraticCurveTo(this.pts[i].x, this.pts[i].y, xc, yc);
		}
		ctx.quadraticCurveTo(this.pts[i].x, this.pts[i].y, this.pts[0].x, this.pts[0].y);
		ctx.fillStyle = `rgb(${this.color[0]},${this.color[1]},${this.color[2]})`;
		ctx.fill();
		ctx.restore();
	}
}

const grass = new Set();
class Grass extends Sprite {
	container = grass;
	constructor(internal) {
		super();
		if (internal) {
			this.pos = Matter.Vector.create(
				(Math.random() - 0.5) * (width + size) + offset.x,
				(Math.random() - 0.5) * (height + size) + offset.y
			);
		} else {
			this.pos = randomPtInRectMinusCenter(0, 1);
		}
		this.body = Matter.Bodies.rectangle(
			this.pos.x, this.pos.y, 10, 10,
			{
				isSensor: true,
				isStatic: true
			}
		);
		this.thickness = Math.random() * 2 + 5;
		this.pts = [];
		for (let i = 0; i < Math.random() * 3 + 1; ++i) {
			this.pts.push(Matter.Vector.create(
				Math.random() * 30 - 15,
				Math.random() * 10 + 7,
			));
		}
		for (const floor of floors) {
			if (Matter.Vector.magnitudeSquared(
				Matter.Vector.sub(
					floor.body.position,
					this.pos
				)
			) < floor.size * floor.size) {
				this.color = [
					floor.color[0] - Math.random() * 50 - 30,
					floor.color[1] - Math.random() * 50 - 30,
					floor.color[2] - Math.random() * 50 - 30
				];
				break;
			}
		}
		if (!this.color) {
			this.color = [
				202 - Math.random() * 50,
				229 - Math.random() * 50,
				95 - Math.random() * 50
			];
		}
		this.add();
	}
	update() {
		if (outside(this.pos, 2)) {
			this.del();
		}
	}
	render() {
		if (outside(this.pos, 1.1)) return;
		ctx.beginPath();
		for (let i = 0; i < this.pts.length; ++i) {
			const x = this.pts[i].x + Math.sin(performance.now() / 300 + i) * 5;
			ctx.moveTo(this.pos.x - this.thickness / 2, this.pos.y); // left side
			ctx.lineTo(this.pos.x + this.thickness / 2, this.pos.y); // right side
			ctx.quadraticCurveTo( // right to top
				this.pos.x + this.thickness / 2, this.pos.y - this.thickness / 2,
				this.pos.x + x, this.pos.y - this.pts[i].y
			);
			ctx.quadraticCurveTo( // top to left
				this.pos.x - this.thickness / 2, this.pos.y - this.thickness / 2,
				this.pos.x - this.thickness / 2, this.pos.y
			);
		}
		ctx.fillStyle = `rgb(${this.color[0]},${this.color[1]},${this.color[2]})`;
		ctx.fill();
	}
}

const obstacles = new Set();
class Obstacle extends Sprite {
	container = obstacles;
	constructor(x, y, seed) {
		super();
		this.body = Matter.Composite.create({
			friction: 0.2
		});
		this.thickness = 18 + Math.random() * 4;
		this.pos = Matter.Vector.create(x, y);
		this.pts = [this.pos];
		let position = this.pos;
		const circ = Matter.Bodies.circle(position.x, position.y, this.thickness / 2, {
			isStatic: true
		});
		Matter.Composite.add(this.body, circ);
		for (let i = 0; i < seed * 3 + 3; ++i) {
			const mag = (seed * 3 + 2) * this.thickness;
			seed = (seed ** 2 + Math.SQRT2) % 1;
			const dir = seed * Math.PI - Math.PI / 2;
			seed = (seed ** 2 + Math.E) % 1;
			position = Matter.Vector.create(
				Math.cos(dir) * mag + this.pts[this.pts.length - 1].x,
				Math.sin(dir) * mag + this.pts[this.pts.length - 1].y
			);
			this.pts.push(position);
			const circ = Matter.Bodies.circle(position.x, position.y, this.thickness / 2, {
				isStatic: true
			});
			Matter.Composite.add(this.body, circ);
		}
		for (let i = 0; i < this.pts.length - 1; ++i) {
			const a = this.pts[i];
			const b = this.pts[i + 1];
			const rect = Matter.Bodies.rectangle(
				(a.x + b.x) / 2, (a.y + b.y) / 2,
				Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2),
				this.thickness,
				{
					angle: Math.atan2(b.y - a.y, b.x - a.x),
					isStatic: true
				}
			);
			Matter.Composite.add(this.body, rect);
		}
		this.add();
	}
	update() {
		if (outside(this.pos, 3)) {
			this.del();
		}
	}
	render() {
		if (outside(this.pos, 2)) return;
		ctx.beginPath();
		ctx.moveTo(this.pts[0].x, this.pts[0].y);
		for (let i = 1; i < this.pts.length; ++i) {
			ctx.lineTo(this.pts[i].x, this.pts[i].y);
		}
		ctx.lineWidth = this.thickness;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.strokeStyle = "gray";
		ctx.stroke();
	}
}

const zombs = new Set();
class Zomb extends Sprite {
	container = zombs;
	constructor(x, y, color, radius, speed) {
		super();
		this.speed = speed;
		this.radius = radius;
		this.color = color;
		this.body = Matter.Bodies.circle(
			x, y,
			this.radius,
			{
				frictionAir: 0.2
			}
		);
		this.add();
	}
	update() {
		// Die
		if (outside(this.body.position, 4)) {
			this.del();
		}
		for (const rope of ropes) {
			const collides = Matter.Query.collides(this.body, rope.body.bodies);
			if (collides.length > 0) {
				this.del();
				return
			}
		}
		// Follow
		let playerClosest = undefined;
		let playerDistance = Infinity;
		for (const player of players) {
			if (player.hp <= 0) continue;
			const dis = Matter.Vector.magnitudeSquared(
				Matter.Vector.sub(
					player.body.position, this.body.position
				)
			);
			if (dis < playerDistance) {
				playerDistance = dis;
				playerClosest = player;
			}
		}
		const force = Matter.Vector.normalise(Matter.Vector.sub(
			playerClosest ? playerClosest.body.position : Matter.Vector.create(offset.x + Math.sin(this.body.angle) * size, offset.y + Math.cos(this.body.angle) * size),
			this.body.position
		));
		Matter.Body.applyForce(this.body, 
			Matter.Vector.add(this.body.position, Matter.Vector.mult(Matter.Vector.rotate(force, Math.PI / 2), this.radius * 1)),
			Matter.Vector.mult(force, this.speed)
		);
	}
	render() {
		ctx.save();
		ctx.translate(this.body.position.x, this.body.position.y);
		ctx.rotate(this.body.angle);
		ctx.strokeStyle = "black";
		ctx.lineWidth = 1;
		ctx.fillStyle = this.color;
		// Arms
		ctx.beginPath();
		ctx.rect(this.radius / 2, -this.radius / 2, this.radius, this.radius / 5); // left arm
		ctx.rect(this.radius / 2, this.radius / 2, this.radius, this.radius / 5); // right arm
		ctx.fill();
		ctx.stroke();
		// Body
		ctx.beginPath();
		ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.restore();
	}
}