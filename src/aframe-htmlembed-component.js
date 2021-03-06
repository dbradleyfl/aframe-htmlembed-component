if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

const HTMLCanvas = require('./htmlcanvas.js');

AFRAME.registerComponent('htmlembed', {
  schema: {
    ppu: {
      type: 'number',
      default: 256
    }
  },
  init: function() {
    var htmlcanvas = new HTMLCanvas(this.el, () => {
      if (texture) texture.needsUpdate = true;
    }, (event, data) => {
      switch (event) {
        case 'resize':
          this.el.emit("resize");
          break;
        case 'rendered':
          this.el.emit("rendered");
          break;
        case 'focusableenter':
          this.el.emit("focusableenter", data);
          break;
        case 'focusableleave':
          this.el.emit("focusableleave", data);
          break;
        case 'inputrequired':
          this.el.emit("inputrequired", data);
          break;
      }
    });
    this.htmlcanvas = htmlcanvas;
    var texture = new THREE.CanvasTexture(htmlcanvas.canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true
    });
    var geometry = new THREE.PlaneGeometry();
    var screen = new THREE.Mesh(geometry, material);
    this.el.setObject3D('screen', screen);
    this.screen = screen;
    this.handleRaycasterIntersected = this.handleRaycasterIntersected.bind(this)
    this.handleRaycasterIntersectedCleared = this.handleRaycasterIntersectedCleared.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
  },
  resize() {
    this.width = this.htmlcanvas.width / this.data.ppu;
    this.height = this.htmlcanvas.height / this.data.ppu;
    this.screen.scale.x = Math.max(0.0001,this.width);
    this.screen.scale.y = Math.max(0.0001,this.height);
  },
  update() {
    this.resize();
  },
  pause() {
    this.el.removeEventListener('raycaster-intersected', this.handleRaycasterIntersected);
    this.el.removeEventListener('raycaster-intersected-cleared', this.handleRaycasterIntersectedCleared);
    this.el.removeEventListener('mousedown', this.handleMouseDown);
    this.el.removeEventListener('mouseup', this.handleMouseUp);
  },
  play() {
    this.el.addEventListener('raycaster-intersected', this.handleRaycasterIntersected);
    this.el.addEventListener('raycaster-intersected-cleared', this.handleRaycasterIntersectedCleared);
    this.el.addEventListener('mousedown', this.handleMouseDown);
    this.el.addEventListener('mouseup', this.handleMouseUp);
    this.resize();
  },
  hide() {
    this.el.setAttribute('visible', false);
    if (this.isPlaying) this.pause()
  },
  show() {
    this.el.setAttribute('visible', true);
    if (this.isPlaying === false) this.play()
  },
  handleRaycasterIntersected(evt) {
    this.raycaster = evt.detail.el;
  },
  handleRaycasterIntersectedCleared(evt) {
    this.htmlcanvas.clearHover();
    this.raycaster = null;
  },
  handleMouseDown(evt) {
    if (evt instanceof CustomEvent) {
      this.htmlcanvas.mousedown(this.lastX, this.lastY);
    } else {
      evt.stopPropagation();
    }
  },
  handleMouseUp(evt) {
    if (evt instanceof CustomEvent) {
      this.htmlcanvas.mouseup(this.lastX, this.lastY);
    } else {
      evt.stopPropagation();
    }
  },
  forceRender() {
    this.htmlcanvas.forceRender();
  },
  tick: function() {
    this.resize();
    if (!this.raycaster) {
      return;
    }

    var intersection = this.raycaster.components.raycaster.getIntersection(this.el);
    if (!intersection) {
      return;
    }
    var localPoint = intersection.point;
    this.el.object3D.worldToLocal(localPoint);
    var w = this.width / 2;
    var h = this.height / 2;
    var x = Math.round((localPoint.x + w) / this.width * this.htmlcanvas.canvas.width);
    var y = Math.round((1 - (localPoint.y + h) / this.height) * this.htmlcanvas.canvas.height);
    if (this.lastX != x || this.lastY != y) {
      this.htmlcanvas.mousemove(x, y);
    }
    this.lastX = x;
    this.lastY = y;
  },
  remove: function() {
    this.el.removeObject3D('screen');
  }
});
