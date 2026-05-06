#version 330 core

// Terrain grass billboard fragment shader.
//
// One sampled tap per fragment from a 3-layer GL_TEXTURE_2D_ARRAY built
// in BuildTerrainGPU (BITMAP_MAPGRASS+0/1/2). Alpha-test discard at the
// legacy 0.25 threshold (matches BMD/sprite paths). Output colour is
// the texture pre-multiplied by the per-cell PrimaryTerrainLight
// (sampled in the vertex shader and interpolated as vColor).

in vec2 vUV;
in vec3 vColor;
flat in uint vLayer;

uniform sampler2DArray uGrass;

out vec4 fragColor;

void main() {
    vec4 tex = texture(uGrass, vec3(vUV, float(vLayer)));
    if (tex.a < 0.25) discard;
    fragColor = vec4(tex.rgb * vColor, tex.a);
}
