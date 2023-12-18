const multi = {};

multi.players = new Set();

multi.die = () => {
	for (const rope of ropes) {
		rope.disconnect();
	}
	for (let i = 0; i < 300; ++i) {
		new Zomb(...createZomb());
		await sleep(5);
	}
};

multi.control = (ws, up, down, left, right) {
	const vert = (keys[down] ? 1 : 0) - (keys[up] ? 1 : 0);
	const hori = (keys[right] ? 1 : 0) - (keys[left] ? 1 : 0);
	ws.send({
		type: "control",
		x: hori,
		y: vert,
	});
};

multi.onconnected = () => {
}

multi.onmsg = (ws, msg) => {
	switch (msg.type) {
		case "join": {
			const player = new Player();
			player.ws = ws;
			multi.players.add(player);
			if (multi.players.size === 1) { // this is me
				const up = "w";
				const down = "s";
				const left = "a";
				const right = "d";
				window.addEventListener("keydown", event => {
					keys[event.key.toLowerCase()] = keys[event.key] = true;
					multi.control(ws, up, down, left, right);
				});
				window.addEventListener("keyup", event => {
					keys[event.key.toLowerCase()] = keys[event.key] = true;
					multi.control(ws, up, down, left, right);
				});
			}
			break;
		}
	}
};

multi.onclose = (ws) => {
	alert("Connection Closed");
	document.location.reload();
};

// Internal server

multi.singleplayer = true;
multi.server = window.setInterval(update, 100);

mutli.fakeClient = () => {
	const ws = {
		ip: Math.random(),
		cookie: {},
	};
	ws.close = () => {
		multi.onclose(ws);
	}
	ws.send = (msg) => {
		multi.onmsg(ws, msg);
	}
	return ws;
}

let keys = {};
window.addEventListener("keyup", event => {
	if (event.key === "B") {
		window.debug = 1 - (window.debug || 0);
		return;
	}
});