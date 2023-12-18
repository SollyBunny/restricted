

const floorColors = [[229, 226, 139], [181, 234, 138], [138, 234, 228]];
function createFloor() {
	const pos = this.pos = randomPtInRectMinusCenter(1, 2);
	return [
		pos.x, pos.y,
		floorColors[Math.floor(Math.random() * floorColors.length)],
		(Math.random() * size + size) / 3
	];
}

function createZomb() {
	const pos = this.pos = randomPtInRectMinusCenter(1, 2);
	if (Math.random() < 0.2) {
		return [ // Swarm
			pos.x, pos.y,
			`rgb(${Math.random() * 50 + 100},${Math.random() * 50 + 50},${Math.random() * 100 + 100})`,
			10 + Math.random() * 5,
			0.001 + Math.random() * 0.001,
			1
		];
	} else if (Math.random() < 0.2) { // Speedy
		return [
			pos.x, pos.y,
			`rgb(${Math.random() * 150 + 50},${Math.random() * 100 + 50},${Math.random() * 20})`,
			10 + Math.random() * 5,
			0.0005 + Math.random() * 0.0005,
			0
		];
	} else { // Normal
		return [
			pos.x, pos.y,
			`rgb(${Math.random() * 20},${Math.random() * 50 + 100},${Math.random() * 20})`,
			10 + Math.random() * 5,
			0.0001 + Math.random() * 0.0001,
			0
		];
	}
	
}

function createObstacle() {
	const pos = this.pos = randomPtInRectMinusCenter(1, 2);
	return [
		pos.x, pos.y,
		Math.random()
	];
}