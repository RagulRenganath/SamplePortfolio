// ─────────────────────────────────────────────────────────────────
// FRAGMENT SHADER — FluidBackground.frag
//
// Visual architecture:
//   1. Base dark background (near-black, cold blue-grey)
//   2. Multi-octave FBM noise → rolling smoke / molten-metal surface
//   3. Mouse proximity → ripple ring + local luminance lift
//   4. Specular vein system → thin bright filaments of "liquid metal"
//   5. Chromatic micro-shift → subtle RGB separation at edges
//   6. Transition state → aggressive UV warp + fade to black
// ─────────────────────────────────────────────────────────────────

precision highp float;

varying vec2 vUv;
varying vec3 vWorldPos;

uniform float uTime;
uniform vec2  uMouse;       // normalised -1..1 NDC
uniform vec2  uResolution;  // viewport px
uniform float uDistort;     // 0..1 — page-transition drive
uniform float uMouseVel;    // scalar velocity of mouse movement

// ── Noise helpers (same permute as vertex) ────────────────────────
vec3 mod289v3(vec3 x) { return x - floor(x*(1./289.))*289.; }
vec4 mod289v4(vec4 x) { return x - floor(x*(1./289.))*289.; }
vec4 permute4(vec4 x)  { return mod289v4(((x*34.)+1.)*x); }
vec4 taylorInvSqrt4(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }

float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i =floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g =step(x0.yzx,x0.xyz);
  vec3 l =1.-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289v3(i);
  vec4 p=permute4(permute4(permute4(
    i.z+vec4(0.,i1.z,i2.z,1.))
    +i.y+vec4(0.,i1.y,i2.y,1.))
    +i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt4(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

// ── Fractional Brownian Motion — layered noise for organic turbulence ──
float fbm(vec3 p, int octaves) {
  float v = 0.0, amp = 0.5, freq = 1.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    v   += amp * snoise(p * freq);
    amp  *= 0.5;
    freq *= 2.1;
    // Rotate each octave slightly to break axis alignment
    p.xy = mat2(cos(.5),-sin(.5),sin(.5),cos(.5)) * p.xy;
  }
  return v;
}

// ── Smooth ripple ring ─────────────────────────────────────────────
// Returns luminance contribution [0..1] of a ripple at distance d
float rippleRing(float d, float radius, float width, float strength) {
  float ring = exp(-pow((d - radius) / width, 2.0));
  return ring * strength;
}

void main() {
  // ── 1. Screen-space UV (aspect-corrected) ──────────────────────
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 uv = (vUv - 0.5) * aspect;            // -0.5*aspect .. 0.5*aspect

  // Mouse in the same UV space
  vec2 mUv = uMouse * 0.5 * aspect;          // NDC → UV space

  // ── 2. Mouse-driven UV warp ────────────────────────────────────
  float mDist  = length(uv - mUv);
  float mProx  = 1.0 - smoothstep(0.0, 0.55, mDist);   // 0..1 proximity

  // Radial push-pull: UV are displaced TOWARD the cursor near it
  vec2 mDir    = normalize(uv - mUv + 0.0001);
  float warpMag = mProx * 0.018 * (1.0 + uMouseVel * 0.4);
  vec2 warpedUv = uv - mDir * warpMag;

  // ── 3. Transition mega-warp ────────────────────────────────────
  float transNoise = fbm(vec3(uv * 2.5, uTime * 0.9), 4);
  vec2 transWarp   = vec2(transNoise) * uDistort * 0.18;
  warpedUv += transWarp;

  // ── 4. Base FBM field — the "smoke / liquid metal" surface ─────
  float t    = uTime * 0.08;
  vec3 noiseCoord = vec3(warpedUv * 1.6, t);

  // Domain-warped FBM: q and r warp the lookup coordinate itself
  vec2 q = vec2(fbm(noiseCoord,               5),
                fbm(noiseCoord + vec3(5.2,1.3,0.), 5));

  vec2 r = vec2(fbm(noiseCoord + 1.7*q + vec3(1.7, 9.2, 0.), 6),
                fbm(noiseCoord + 1.7*q + vec3(8.3, 2.8, 0.), 6));

  float f = fbm(noiseCoord + 1.8*r, 6);
  f = (f + 1.0) * 0.5;   // remap to 0..1

  // ── 5. Colour palette — dark, cold, with liquid-metal veins ───
  // Base palette: near-black → deep slate blue → pewter highlight
  vec3 colA = vec3(0.03,  0.03,  0.05);   // void black
  vec3 colB = vec3(0.06,  0.07,  0.12);   // deep indigo-coal
  vec3 colC = vec3(0.10,  0.12,  0.20);   // dark slate
  vec3 colD = vec3(0.22,  0.25,  0.38);   // cool grey-blue (veins)
  vec3 colE = vec3(0.55,  0.60,  0.78);   // liquid-metal highlight

  // Smooth 5-stop ramp
  vec3 baseColour = mix(colA, colB, smoothstep(0.0, 0.25, f));
  baseColour      = mix(baseColour, colC, smoothstep(0.25,0.50, f));
  baseColour      = mix(baseColour, colD, smoothstep(0.50,0.75, f));
  baseColour      = mix(baseColour, colE, smoothstep(0.75,1.00, f));

  // ── 6. Specular vein filaments ─────────────────────────────────
  // A second high-frequency FBM creates thin bright lines
  float veinF = fbm(vec3(warpedUv * 3.8 + vec2(12.4, 7.1), t * 1.4), 4);
  float vein  = pow(max(0.0, (veinF + 1.0)*0.5), 6.5) * 0.45;  // sharp highlights
  baseColour += vein * vec3(0.6, 0.65, 0.9);

  // ── 7. Mouse ripple rings ──────────────────────────────────────
  float vel    = clamp(uMouseVel, 0.0, 1.0);
  float ring1  = rippleRing(mDist, 0.06, 0.012, 0.18 * (1.0+vel));
  float ring2  = rippleRing(mDist, 0.14, 0.018, 0.10 * (1.0+vel));
  float ring3  = rippleRing(mDist, 0.26, 0.025, 0.05);
  float rings  = ring1 + ring2 + ring3;
  baseColour  += rings * vec3(0.4, 0.48, 0.72);

  // Soft luminance glow under cursor
  float glowAmt = mProx * 0.12;
  baseColour   += glowAmt * vec3(0.15, 0.18, 0.30);

  // ── 8. Chromatic aberration micro-shift at vein edges ──────────
  // Slight R/B separation where noise gradient is steep
  float gradMag = length(vec2(
    dFdx(f) * uResolution.x,
    dFdy(f) * uResolution.y
  )) * 0.0004;
  baseColour.r += gradMag * 0.35;
  baseColour.b -= gradMag * 0.20;

  // ── 9. Radial vignette — darkens corners, focuses center ───────
  float vigDist = length(vUv - 0.5) * 2.0;  // 0=center, √2=corner
  float vignette = 1.0 - smoothstep(0.4, 1.6, vigDist) * 0.80;
  baseColour    *= vignette;

  // ── 10. Transition: fade to black ─────────────────────────────
  float fadeToBlack = smoothstep(0.5, 1.0, uDistort);
  baseColour = mix(baseColour, vec3(0.0), fadeToBlack);

  // ── 11. Gamma correction (linear → sRGB) ──────────────────────
  baseColour = pow(max(baseColour, 0.0), vec3(1.0 / 2.2));

  gl_FragColor = vec4(baseColour, 1.0);
}
