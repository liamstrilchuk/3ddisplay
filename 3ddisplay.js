let canvas, ctx;
let camera = {
	rotation: {
		horizontal: 0.01,
		vertical: 0.01
	},
	pos: {
		x: 0,
		y: 0,
		z: 0
	},
	radius: 20,
	focal: 100
};
let fov = 0.8;
let mousePos = [ 0, 0 ];
let mouseDown = false;
let mouseDownRotation = [ 0.01, 0.01 ];
let mouseDownPos = [ 0, 0 ];
const points = createSphere(500);
window.addEventListener("load", onLoad);

function onLoad() {
	canvas = document.querySelector("canvas");
	ctx = canvas.getContext("2d");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	mainLoop();
}

function drawPoint(pos, color="black", size=4) {
	// movement vector of the line between point and camera
	const movement = [ pos[0] - camera.pos.x, pos[1] - camera.pos.y, pos[2] - camera.pos.z ];

	// point on plane, 75% of distance between origin and camera
	const planePoint = [ camera.pos.x * fov, camera.pos.y * fov, camera.pos.z * fov ];

	// D value in Ax + By + Cz + D = 0
	const planeOffset = -(camera.pos.x * planePoint[0] + camera.pos.y * planePoint[1] + camera.pos.z * planePoint[2]);

	// when substituting parametic equations of line, constants is sum of terms with no t
	const constants = planeOffset + camera.pos.x * pos[0] + camera.pos.y * pos[1] + camera.pos.z * pos[2];
	const tValues = camera.pos.x * movement[0] + camera.pos.y * movement[1] + camera.pos.z * movement[2];
	const t = -constants / tValues;

	const collisionPoint = [ pos[0] + t * movement[0], pos[1] + t * movement[1], pos[2] + t * movement[2] ];

	const cv = [ camera.pos.x, camera.pos.y, camera.pos.z ];
	const um = [ cv[0] / mag(cv), cv[1] / mag(cv), cv[2] / mag(cv) ];
	const pp = planePoint;

	const xv = [ -(cv[2] * pp[0]) / (cv[0] * pp[0] + cv[1] * pp[1]), -cv[2] / ((cv[0] * pp[0]) / pp[1] + cv[1]), 1 ];
	const yv = [ um[1] * xv[2] - xv[1] * um[2], um[2] * xv[0] - xv[2] * um[0], um[0] * xv[1] - xv[0] * um[1] ];
	
	const xuv = [ xv[0] / mag(xv), xv[1] / mag(xv), xv[2] / mag(xv) ];
	const yuv = [ yv[0] / mag(yv), yv[1] / mag(yv), yv[2] / mag(yv) ];

	const I = collisionPoint, P = planePoint, X = xuv, Y = yuv;
	const a = (I[1] - P[1] - (I[0] * X[1] - P[0] * X[1]) / X[0]) / (Y[1] - (Y[0] * X[1]) / X[0]);
	const b = (I[0] - P[0] - a * Y[0]) / X[0];

	const renderPoint = [ a * 100, b * 100 ];

	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(renderPoint[0] + canvas.width / 2, renderPoint[1] + canvas.height / 2, Math.max(size - mag(movement) / 17, 0), 0, Math.PI * 2);
	ctx.fill();

	return renderPoint;
}

function mag(vector) {
	return Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2);
}

function drawLine(p1, p2, color) {
	ctx.strokeStyle = color || "black";
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.moveTo(p1[0] + canvas.width / 2, p1[1] + canvas.height / 2);
	ctx.lineTo(p2[0] + canvas.width / 2, p2[1] + canvas.height / 2);
	ctx.stroke();
}

function findCameraPosition() {
	camera.pos.x = Math.cos(camera.rotation.horizontal);
	camera.pos.y = Math.sin(camera.rotation.horizontal);
	camera.pos.z = camera.rotation.vertical;
	const v = [ camera.pos.x, camera.pos.y, camera.pos.z ];
	const m = mag(v);
	camera.pos.x *= camera.radius / m;
	camera.pos.y *= camera.radius / m;
	camera.pos.z *= camera.radius / m;
}

function findPos(r1, r2) {
	return [ 10 * Math.cos(r1) * Math.sin(r2), 10 * Math.cos(r1) * Math.cos(r2), 10 * Math.sin(r1) ];
}

function createSphere(samples) {
	const points = [];
	const phi = Math.PI * (Math.sqrt(5) - 1);
	for (let i = 0; i < samples; i++) {
		const y = 1 - (i / (samples - 1)) * 2;
		const radius = Math.sqrt(1 - y * y);
		const theta = phi * i;
		const x = Math.cos(theta) * radius;
		const z = Math.sin(theta) * radius;
		points.push([ x * 10, y * 10, z * 10 ]);
	}
	return points;
}

function mainLoop() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (!mouseDown) {
		camera.rotation.horizontal = (camera.rotation.horizontal + 0.002) % (Math.PI * 2);
	}
	findCameraPosition();
	for (let point of points) {
		drawPoint(point);
	}
	drawLine(
		drawPoint([10, 0, 0]),
		drawPoint([-10, 0, 0]),
		"red"
	);
	drawLine(
		drawPoint([0, 10, 0]),
		drawPoint([0, -10, 0]),
		"blue"
	);
	drawLine(
		drawPoint([0, 0, 10]),
		drawPoint([0, 0, -10]),
		"green"
	);
	requestAnimationFrame(mainLoop);
}

window.addEventListener("mousedown", () => {
	mouseDown = true;
	mouseDownRotation = [ camera.rotation.horizontal, camera.rotation.vertical ];
	mouseDownPos = [ mousePos[0] + canvas.width / 2, mousePos[1] + canvas.height / 2 ];
});

window.addEventListener("mouseup", () => {
	mouseDown = false;
});

window.addEventListener("mousemove", (e) => {
	mousePos = [ e.clientX, e.clientY ];
	if (mouseDown) {
		camera.rotation.horizontal = mouseDownRotation[0] + (-mouseDownPos[0] + mousePos[0] - canvas.width / 2) / 100;
		camera.rotation.vertical = Math.max(Math.min(mouseDownRotation[1] + (mouseDownPos[1] - mousePos[1] - canvas.height / 2) / 100, Math.PI / 2), -Math.PI / 2);
	}
});