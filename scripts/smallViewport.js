//
// Viewport scaling for mobile
//

const
    PAD_W = 16,
    CAN_W = 1280,
    CAN_H = 640,
    CAN_Q = window.devicePixelRatio,
    CONTAINER = document.getElementById('scaleContainer');

CONTAINER.style.zoom = `min(1, calc(100svw / ${ CAN_W + (2 * PAD_W) }px), calc(100svh / ${ CAN_H + (2 * PAD_W) }px))`;

var can = document.getElementById('mainCanvas');
can.style.width = CAN_W + 'px';
can.style.height = CAN_H + 'px';
can.width = CAN_W * CAN_Q;
can.height = CAN_H * CAN_Q;

var ctx = can.getContext('2d');
ctx.scale(CAN_Q, CAN_Q);


//
// Mobile controls
//

const HAS_TOUCH =
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0);

let usingTouch = false;

const
    EL_MOBILE_FULLSCREEN = document.querySelector('.mobile__fullscreen'),
    EL_MOBILE_LEFT = document.querySelector('.mobile__arrow-left'),
    EL_MOBILE_RIGHT = document.querySelector('.mobile__arrow-right'),
    EL_MOBILE_UP = document.querySelector('.mobile__arrow-up'),
    EL_MOBILE_DOWN = document.querySelector('.mobile__arrow-down');

EL_MOBILE_FULLSCREEN.onclick = () => {
    dimMobileFullscreen();
    document.getElementById('fullscreen').webkitRequestFullscreen();
}

let touchState = [
    { el: EL_MOBILE_LEFT,  code: 37 , prev: false, new: false, touched: false},
    { el: EL_MOBILE_RIGHT, code: 39 , prev: false, new: false, touched: false},
    { el: EL_MOBILE_UP,    code: 38 , prev: false, new: false, touched: false},
    { el: EL_MOBILE_DOWN,  code: 40 , prev: false, new: false, touched: false}
];

touchState.forEach(b => {
    b.el.ontouchstart = () => {
        if (!b.touched) {
            b.el.classList.add('touched');
            b.touched = true;
            usingTouch = true;
        };
        switch(b.el) {
            case EL_MOBILE_LEFT:
                EL_MOBILE_RIGHT.ontouchend();
            break;
            case EL_MOBILE_RIGHT:
                EL_MOBILE_LEFT.ontouchend();
            break;
            case EL_MOBILE_UP:
                EL_MOBILE_DOWN.ontouchend();
            break;
            case EL_MOBILE_DOWN:
                EL_MOBILE_UP.ontouchend();
            break;
        }
        window.onkeydown({ keyCode: b.code });
    };
    b.el.ontouchend = b.el.ontouchcancel = () => { window.onkeyup({ keyCode: b.code }) };
});

window.ontouchmove = e => {
    Array
        .from(e.touches)
        .forEach(t => {
            const EL = document.elementFromPoint(t.clientX, t.clientY);
            touchState.forEach(b => {
                if (EL === b.el) {
                    b.new = true;
                }
            });
        });
    touchState.forEach(b => {
        if (b.prev !== b.new) {
            if (b.new) {
                b.el.ontouchstart();
            } else {
                b.el.ontouchend();
            }
        }
        b.prev = b.new;
        b.new = false;
    });
};

function showMobileControls() {
    if (HAS_TOUCH) {
        [
            EL_MOBILE_LEFT,
            EL_MOBILE_RIGHT,
            EL_MOBILE_UP,
            EL_MOBILE_DOWN
        ].forEach(el => el.classList.add('active'));
    }
}

function showMobileFullscreen() {
    if (HAS_TOUCH) {
        EL_MOBILE_FULLSCREEN.classList.add('active');
    }
}

function dimMobileFullscreen() {
    if (HAS_TOUCH) {
        EL_MOBILE_FULLSCREEN.classList.add('touched');
    }
}