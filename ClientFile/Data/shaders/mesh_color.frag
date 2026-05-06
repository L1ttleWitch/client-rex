#version 330 core

// Untextured colored mesh — used for RENDER_COLOR meshes (no diffuse map,
// just BodyLight tint).

in vec4 vColor;

uniform float uAlpha;

out vec4 fragColor;

void main() {
    fragColor = vec4(vColor.rgb, vColor.a * uAlpha);
}
