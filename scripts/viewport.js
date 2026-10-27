const
    PAD_W = 16,
    CAN_W = 1280,
    CAN_H = 640,
    CAN_Q = window.devicePixelRatio,
    CONTAINER = document.getElementById('fullscreen');

CONTAINER.style.zoom = `min(1, calc(100svw / ${ CAN_W + (2 * PAD_W) }px), calc(100svh / ${ CAN_H + (2 * PAD_W) }px))`;

var can = document.getElementById('mainCanvas');
can.style.width = CAN_W + 'px';
can.style.height = CAN_H + 'px';
can.width = CAN_W * CAN_Q;
can.height = CAN_H * CAN_Q;

var ctx = can.getContext('2d');
ctx.scale(CAN_Q, CAN_Q);