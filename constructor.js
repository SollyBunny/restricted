

const floorColors = [[229, 226, 139], [181, 234, 138], [138, 234, 228]];
function createFloor() {
	const pos = this.pos = randomPtInRectMinusCenter(2, 3);
	return [
		pos.x, pos.y,
		floorColors[Math.floor(Math.random() * floorColors.length)],
		(Math.random() * sizeChunk + sizeChunk) / 2
	];
}

function createZomb() {
	const pos = this.pos = randomPtInRectMinusCenter(0.1, 1);
	if (Math.random() < 0.05) {
		return [ // Swarm
			pos.x, pos.y,
			`rgb(${Math.random() * 50 + 100},${Math.random() * 50 + 50},${Math.random() * 100 + 100})`,
			10 + Math.random() * 5,
			0.0005 + Math.random() * 0.0005,
			1
		];
	} else if (Math.random() < 0.05) { // Speedy
		return [
			pos.x, pos.y,
			`rgb(${Math.random() * 150 + 50},${Math.random() * 100 + 50},${Math.random() * 20})`,
			10 + Math.random() * 5,
			0.0002 + Math.random() * 0.0002,
			0
		];
	} else if (Math.random() < 0.02) { // Biggun
		return [
			pos.x, pos.y,
			`rgb(${Math.random() * 10},${Math.random() * 50 + 90},${Math.random() * 10})`,
			50 + Math.random() * 5,
			0.005 + Math.random() * 0.002,
			0
		];
	} else if (Math.random() < 0.8) { // Joiny
		return [
			pos.x, pos.y,
			`rgb(${Math.random() * 20},${Math.random() * 50 + 100},${Math.random() * 20})`,
			10 + Math.random() * 5,
			0.0001 + Math.random() * 0.0001,
			2
		];
	} else { // Normal
		return [
			pos.x, pos.y,
			`rgb(${Math.random() * 20 + 100},${Math.random() * 100 + 150},${Math.random() * 20 + 100})`,
			15 + Math.random() * 5,
			0.00008 + Math.random() * 0.00008,
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