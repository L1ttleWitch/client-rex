#version 330 core

// Variant of sprite3d.frag that discards alpha < 0.25 (matches legacy
// glAlphaFunc(GL_GREATER, 0.25)). Used by alpha-tested sprites where
// the source has hard edges (font glyphs, mask sprites).

in vec2 vUV;
in vec4 vColor;

uniform sampler2D uTex;

out vec4 fragColor;

void main() {
    vec4 sampled = texture(uTex, vUV);
    vec4 c = sampled * vColor;
    if (c.a < 0.25) discard;
    // Defensive RGB-near-zero discard so additive-authored sprites that land
    // on the alpha-test pipeline (e.g. AlphaBlendType=2 packed atlases with
    // hard alpha cutouts) do not paint opaque black squares around the
    // visible glyph. Threshold mirrors sprite3d.frag.
    if (max(sampled.r, max(sampled.g, sampled.b)) < 0.02) discard;
    fragColor = c;
}
