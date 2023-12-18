const server = {};

server.rooms = {};

class Room {
	constructor() {
		this.p1 = undefined;
		this.p2 = undefined;
	}
}

server.join = ws => {
	const code = "123";
	ws.room = rooms[code];
	if (ws.room) {
		if (ws.room.p1) {
			if (ws.room.p2) {
				ws.close();
				return;
			} else {
				ws.room.p2 = ws;
			}
		} else {
			ws.room.p1 = ws;
		}
	} else {
		ws.room = rooms[code] = new Room();
		ws.room.p1 = ws;
	}
	if (server.players.size >= 2) {
		ws.close();
		return;
	}
	ws.id = GID;
	GID += 1;
	server.players.add(ws);
};

server.close = ws => {
	if (!ws.room) return;
	if (ws.room.p1 === ws) {
		ws.room.p2.send({"leave"})
	}
	server.players.delete(ws);
};

server.onmsg = (ws, msg) => {
	switch ()
};

server.update = () => {

};