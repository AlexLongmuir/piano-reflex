"use client";

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

// A concert-hall light wash: two slow interfering waves of warm brass light
// falling from the top of the frame, over near-black, with a soft vignette.
// Deliberately quiet — it should read as atmosphere, not decoration.
const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;

float wave(vec2 uv, float speed, float scale, float phase) {
  float x = uv.x * scale + phase;
  return sin(x + u_time * speed) * sin(x * 0.61 - u_time * speed * 0.7);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec3 ink = vec3(0.043, 0.043, 0.051);
  vec3 brass = vec3(0.84, 0.65, 0.31);

  float fall = pow(1.0 - uv.y, 1.6);
  float beams = 0.5 + 0.5 * wave(uv, 0.07, 5.0, 0.0);
  beams *= 0.6 + 0.4 * wave(uv, 0.05, 11.0, 2.7);

  float light = (1.0 - fall) * beams;
  light *= smoothstep(0.0, 0.55, uv.y);

  float vignette = smoothstep(1.25, 0.45, length(uv - vec2(0.5, 0.62)));

  vec3 color = ink + brass * light * 0.045 * vignette;
  color += brass * pow(max(1.0 - uv.y, 0.0), 6.0) * 0.012;

  gl_FragColor = vec4(color, 1.0);
}
`;

export function AmbientCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };

    const vert = compile(gl.VERTEX_SHADER, VERT);
    const frag = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vert || !frag) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");

    // render at reduced resolution — it's a soft wash, sharpness is wasted
    const resize = () => {
      const scale = 0.5 * Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(2, Math.floor(window.innerWidth * scale));
      canvas.height = Math.max(2, Math.floor(window.innerHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const start = performance.now();
    const draw = () => {
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reducedMotion) frame = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
