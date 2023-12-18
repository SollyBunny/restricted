
function stubserverhost() {
	let ws = new WebSocket(`wss://${document.location.host}${document.location.pathname}stubserverserver?host`);

	ws.onmessage = msg => {
		const data = msg.data;
		const action = data.slice(0, 1);
		const key = data.slice(1)
		if ("tfgh".indexOf(key) === -1) return;
		if (action === "u") {
			keys[key] = false;
		} else {
			keys[key] = true;
		}
		updateControls();
	};
}
console.log("Run stubserverhost() to start hosting")