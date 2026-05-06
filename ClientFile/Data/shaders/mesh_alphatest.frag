#version 330 core

// Mesh fragment shader with alpha-test discard (legacy
// glAlphaFunc(GL_GREATER, 0.25)). Used by foliage and pierced surfaces.
// Alpha is fully packed into vColor.a — no uAlpha uniform.

in vec2 vUV;
in vec4 vColor;

uniform sampler2D uTex;

out vec4 fragColor;

void main() {
    vec4 texel = texture(uTex, vUV);
    vec4 c = texel * vColor;
    if (c.a < 0.25) discard;
    // Defensive RGB-near-zero discard for additive-authored effect textures
    // (Components==4 atlases) that pass the 0.25 alpha cutout but carry
    // RGB=0 corners. Without this, alpha=1 RGB=0 pixels render as opaque
    // black squares on the SrcAlpha/OneMinusSrcAlpha pipeline. Threshold
    // mirrors mesh.frag (~1.3/255).
    if (max(texel.r, max(texel.g, texel.b)) < 0.005) discard;
    fragColor = c;
}
