#version 330 core

// TODO Phase 2 — needs a dedicated mesh_chrome.vert that emits vWorldPos
// and vNormal varyings for sphere-map UV computation. Currently this frag
// is paired with mesh_static.vert (which emits vColor + vUV only) and the
// program will fail to link. Chrome rendering remains on the legacy path
// until Phase 2 — do NOT call PipelineMeshChrome() until that is in.

// Chrome / metal / oil mesh material. Texture coordinates are computed
// in the vertex shader from the mesh normal (sphere-map style). See the
// legacy ZzzBMD::RenderMesh CHROME branches for the formula variants:
//   CHROME2: u = (n.z + n.x) * 0.8 + Wave2*2
//            v = (n.y + n.x) * 1.0 + Wave2*3
//   CHROME3: u = dot(n, lightVec)
//            v = 1 - dot(n, lightVec)
//   CHROME4: similar to CHROME3 but with time-modulated light vector
// We pick the CHROME2-style here as the most common; other variants
// are separate shader programs (kept minimal — chrome variants are
// uncommon and easy to compile-fork).

in vec3 vWorldPos;
in vec3 vNormal;
in vec4 vColor;

uniform sampler2D uTex;
uniform float     uAlpha;
uniform float     uChromeWave;   // (WorldTime % 5000) * 0.00024 - 0.4

out vec4 fragColor;

void main() {
    vec3 n = normalize(vNormal);
    float u = (n.z + n.x) * 0.8 + uChromeWave * 2.0;
    float v = (n.y + n.x) * 1.0 + uChromeWave * 3.0;
    vec4 texel = texture(uTex, vec2(u, v));
    fragColor = vec4(texel.rgb * vColor.rgb,
                     texel.a   * vColor.a * uAlpha);
}
