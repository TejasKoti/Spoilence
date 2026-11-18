/* Original procedural halftone field. It never samples images or user content. */
(() => {
  "use strict";
  const MAX_PIXELS = 700000;
  const SETTLE_MS = 650;
  const PULSE_INTERVAL_MS = 5000;
  const PULSE_DURATION_MS = 1600;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const VERTEX = `
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `;
  const FRAGMENT = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform vec2 u_cssSize;
    uniform vec2 u_pointer;
    uniform vec2 u_center;
    uniform float u_extent;
    uniform float u_pulse;

    // A circular raised mound plus a single outward elevation ring per pulse.
    float shell(vec2 p) {
      float radius = length(p);
      float dome = exp(-dot(p, p) * 8.0) * 0.5;
      float ringRadius = 0.12 + u_pulse * 1.26;
      float envelope = sin(u_pulse * 3.14159265);
      float ring = exp(-pow((radius - ringRadius) * 22.0, 2.0)) * 0.13 * envelope;
      return dome + ring;
    }
    float bayer2(vec2 p) {
      vec2 q = mod(p, 2.0);
      return q.x * 2.0 + q.y * 3.0 - q.x * q.y * 4.0;
    }
    float threshold(vec2 p) {
      return (4.0 * bayer2(p) + bayer2(floor(p / 2.0)) + 0.5) / 16.0;
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float aspect = u_cssSize.x / u_cssSize.y;
      vec2 p = (uv - u_center) * u_cssSize / u_extent;
      float turn = u_pointer.x * 0.19;
      p = mat2(cos(turn), -sin(turn), sin(turn), cos(turn)) * p;
      p.y *= 1.0 + u_pointer.y * 0.05;
      float h = shell(p);
      float e = 0.008;
      vec2 gradient = vec2(shell(p + vec2(e, 0.0)) - shell(p - vec2(e, 0.0)),
                           shell(p + vec2(0.0, e)) - shell(p - vec2(0.0, e))) / (2.0 * e);
      vec3 normal = normalize(vec3(-gradient * 0.7, 1.0));
      vec3 light = normalize(vec3(-0.7 + u_pointer.x * 0.7, 0.9 + u_pointer.y * 0.5, 0.75));
      float diffuse = max(0.0, dot(normal, light));
      float specular = pow(max(0.0, dot(reflect(-light, normal), vec3(0.0, 0.0, 1.0))), 18.0);
      float surface = smoothstep(0.018, 0.19, h);
      float shade = clamp(diffuse * 0.72 + specular * 0.3 + h * 0.23, 0.0, 1.0);

      // The background grid bends with the same surface across the whole hero.
      vec2 cursor = vec2(0.5) + u_pointer;
      vec2 toCursor = uv - cursor;
      float influence = exp(-dot(toCursor * vec2(aspect, 1.0), toCursor * vec2(aspect, 1.0)) * 3.0);
      vec2 warped = uv + gradient * vec2(0.004 / aspect, 0.004)
                       + u_pointer * 0.018 + toCursor * influence * length(u_pointer) * 0.055;
      vec2 chart = warped * u_cssSize / 3.2;
      vec2 cell = floor(chart);
      vec2 local = abs(fract(chart) - 0.5);
      float mark = 1.0 - smoothstep(0.16 + shade * 0.23, 0.23 + shade * 0.23, max(local.x, local.y));
      float ordered = step(threshold(cell), shade * 0.85 + 0.12);
      vec2 coarse = abs(fract(warped * u_cssSize / 19.0) - 0.5);
      float grid = 1.0 - smoothstep(0.09, 0.14, max(coarse.x, coarse.y));
      float alpha = grid * 0.1 * (1.0 - surface)
                  + mark * surface * 0.82 * mix(0.22, 1.0, ordered);
      float ringRadius = 0.12 + u_pulse * 1.26;
      float wave = exp(-pow((length(p) - ringRadius) * 18.0, 2.0))
                 * sin(u_pulse * 3.14159265);
      alpha = max(alpha, mark * wave * 0.92);
      float leftQuiet = mix(0.38, 1.0, smoothstep(0.16, 0.55, uv.x));
      alpha *= leftQuiet;
      float peach = max(specular * surface * 0.08, clamp(wave * 3.0, 0.0, 1.0));
      vec3 color = mix(vec3(0.89, 0.89, 0.86), vec3(0.99215686, 0.72941176, 0.45490196), peach);
      gl_FragColor = vec4(color, alpha);
    }
  `;

  function mount(scene) {
    if (!scene) return;
    const canvas = scene.querySelector("#shield-core");
    const fallback = scene.querySelector(".core-fallback");
    const pitch = scene.querySelector(".hero-pitch");
    const container = canvas?.parentElement;
    if (!canvas || !container) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    let gl;
    let program = null;
    let buffer = null;
    let position;
    let resolution;
    let cssSize;
    let center;
    let extent;
    let pointer;
    let pulse;
    let width = 1;
    let height = 1;
    let centerX = 0.65;
    let centerY = 0.58;
    let moundExtent = 1;
    let frame = 0;
    let visible = true;
    let lost = false;
    let renders = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let previousTime = 0;
    let deadline = 0;
    let pulseTimer = 0;
    let pulseStart = 0;
    let pulseCount = 0;

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    }
    function stopPulse() {
      window.clearTimeout(pulseTimer);
      pulseTimer = 0;
      pulseStart = 0;
      canvas.dataset.pulsePhase = "0";
    }
    function showFallback() {
      stop();
      stopPulse();
      scene.dataset.renderPath = "static-fallback";
      canvas.hidden = true;
      if (fallback) fallback.removeAttribute("hidden");
    }
    scene.dataset.renderPath = "static-fallback";
    document.documentElement.dataset.motion = reduced.matches ? "off" : "on";
    canvas.dataset.pulseCount = "0";
    canvas.dataset.pulsePhase = "0";
    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
        powerPreference: "low-power",
      });
    } catch {
      showFallback();
      return;
    }
    if (!gl) {
      showFallback();
      return;
    }

    function initialize() {
      const shaders = [];
      try {
        for (const [type, source] of [
          [gl.VERTEX_SHADER, VERTEX],
          [gl.FRAGMENT_SHADER, FRAGMENT],
        ]) {
          const shader = gl.createShader(type);
          if (!shader) throw new Error("Shader allocation failed");
          shaders.push(shader);
          gl.shaderSource(shader, source);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            throw new Error("Shader compilation failed");
        }
        program = gl.createProgram();
        if (!program) throw new Error("Program allocation failed");
        for (const shader of shaders) gl.attachShader(program, shader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
          throw new Error("Program linking failed");
        buffer = gl.createBuffer();
        if (!buffer) throw new Error("Buffer allocation failed");
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
          gl.STATIC_DRAW,
        );
        position = gl.getAttribLocation(program, "a_position");
        resolution = gl.getUniformLocation(program, "u_resolution");
        cssSize = gl.getUniformLocation(program, "u_cssSize");
        center = gl.getUniformLocation(program, "u_center");
        extent = gl.getUniformLocation(program, "u_extent");
        pointer = gl.getUniformLocation(program, "u_pointer");
        pulse = gl.getUniformLocation(program, "u_pulse");
        return true;
      } catch {
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
        buffer = program = null;
        showFallback();
        return false;
      } finally {
        for (const shader of shaders) gl.deleteShader(shader);
      }
    }
    function draw(now = window.performance.now()) {
      if (!program || lost || gl.isContextLost()) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform2f(cssSize, width, height);
      gl.uniform2f(center, centerX, centerY);
      gl.uniform1f(extent, moundExtent);
      gl.uniform2f(pointer, x, y);
      const phase = pulseStart
        ? clamp((now - pulseStart) / PULSE_DURATION_MS, 0, 1)
        : 0;
      gl.uniform1f(pulse, phase);
      canvas.dataset.pulsePhase = phase.toFixed(3);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      canvas.dataset.renderCount = String(++renders);
      scene.dataset.renderPath = "webgl-halftone";
      canvas.hidden = false;
      if (fallback) fallback.setAttribute("hidden", "");
    }
    function canAnimate() {
      return (
        !!program && !lost && visible && !document.hidden && !reduced.matches
      );
    }
    function step(now) {
      frame = 0;
      if (!canAnimate()) return;
      const elapsed = previousTime ? Math.max(0, now - previousTime) : 16.7;
      previousTime = now;
      const blend = 1 - Math.exp(-elapsed / 80);
      x += (targetX - x) * blend;
      y += (targetY - y) * blend;
      const settled =
        now >= deadline ||
        Math.abs(targetX - x) + Math.abs(targetY - y) < 0.0006;
      if (settled) {
        x = targetX;
        y = targetY;
        previousTime = 0;
      }
      const pulsing = pulseStart > 0 && now - pulseStart < PULSE_DURATION_MS;
      if (!pulsing) pulseStart = 0;
      draw(now);
      if (!settled || pulsing) frame = requestAnimationFrame(step);
    }
    function schedule() {
      if (!frame && canAnimate()) frame = requestAnimationFrame(step);
    }
    function schedulePulse() {
      window.clearTimeout(pulseTimer);
      pulseTimer = 0;
      if (!canAnimate()) return;
      pulseTimer = window.setTimeout(() => {
        pulseTimer = 0;
        if (!canAnimate()) return;
        pulseStart = window.performance.now();
        canvas.dataset.lastPulseAt = pulseStart.toFixed(1);
        canvas.dataset.pulseCount = String(++pulseCount);
        schedule();
        schedulePulse();
      }, PULSE_INTERVAL_MS);
    }
    function retarget(nextX, nextY) {
      targetX = nextX;
      targetY = nextY;
      deadline = window.performance.now() + SETTLE_MS;
      schedule();
    }
    function reset() {
      stop();
      stopPulse();
      x = y = targetX = targetY = 0;
      if (visible && !document.hidden) draw();
      schedulePulse();
    }
    function resize() {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const card = pitch?.getBoundingClientRect();
      if (card && card.width > 0 && card.height > 0) {
        centerX = (card.left + card.width / 2 - rect.left) / width;
        centerY = 1 - (card.top + card.height / 2 - rect.top) / height;
        moundExtent = card.width * 1.8;
      } else {
        centerX = 0.65;
        centerY = 0.58;
        moundExtent = Math.min(width, height) * 0.6;
      }
      const ratio = Math.min(1.25, window.devicePixelRatio || 1);
      const scale = Math.min(ratio, Math.sqrt(MAX_PIXELS / (width * height)));
      canvas.width = Math.max(1, Math.floor(width * scale));
      canvas.height = Math.max(1, Math.floor(height * scale));
      canvas.dataset.backingWidth = String(canvas.width);
      canvas.dataset.backingHeight = String(canvas.height);
      if (visible && !document.hidden) draw();
    }

    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      lost = true;
      showFallback();
    });
    canvas.addEventListener("webglcontextrestored", () => {
      lost = false;
      program = buffer = null;
      if (initialize()) {
        reset();
        resize();
      }
    });
    if (!initialize()) return;
    scene.addEventListener(
      "pointermove",
      (event) => {
        if (!canAnimate() || !fine.matches || event.pointerType === "touch")
          return;
        const rect = container.getBoundingClientRect();
        retarget(
          clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5),
          clamp(0.5 - (event.clientY - rect.top) / rect.height, -0.5, 0.5),
        );
      },
      { passive: true },
    );
    scene.addEventListener("pointerleave", () => retarget(0, 0));
    reduced.addEventListener("change", () => {
      document.documentElement.dataset.motion = reduced.matches ? "off" : "on";
      reset();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stop();
        stopPulse();
      } else reset();
    });
    if ("IntersectionObserver" in window)
      new window.IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (!visible) {
          stop();
          stopPulse();
        } else reset();
      }).observe(scene);
    if ("ResizeObserver" in window) {
      const observer = new window.ResizeObserver(resize);
      observer.observe(container);
      if (pitch) observer.observe(pitch);
    } else window.addEventListener("resize", resize, { passive: true });
    resize();
    schedulePulse();
  }
  window.SpoilenceScene = { mount };
})();
