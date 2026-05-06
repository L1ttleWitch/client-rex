#version 330 core

// Mesh fragment shader for the BMD additive (RENDER_BRIGHT) path.
//
// Pipeline state from MakeMeshBright:
//   blend = GL_ONE / GL_ONE additive
//   depthWrite = false
//   cull = none
//
// The legacy effect renderer pairs additive blending with
// glAlphaFunc(GL_GREATER, 0.0) (or sometimes 0.25), which discards the
// fully-transparent border pixels of effect textures. Without that the
// alpha=0 pixels still execute the fragment write, and any color in
// them (even RGB=0) competes with depth/blend in subtle ways. Worse,
// if a state leak elsewhere flips off blending mid-frame, those alpha=0
// pixels render as opaque black squares — which is exactly the symptom
// users see on Ice Storm / aura / glow effects.
//
// Use a low threshold (0.01) so genuine glow tails (alpha=0.05..0.5)
// still contribute additively while only the hard-zero borders are
// clipped.

in vec2 vUV;
in vec4 vColor;

uniform sampler2D uTex;

out vec4 fragColor;

void main() {
    vec4 texel = texture(uTex, vUV);
    vec4 c = texel * vColor;
    if (c.a < 0.01) discard;
    fragColor = c;
}
