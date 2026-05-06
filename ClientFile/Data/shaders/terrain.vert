#version 330 core

// Terrain chunk vertex shader.
// Vertex layout: position, color (legacy baked light, now unused but kept
// for layout stability), texcoord0 (base layer), texcoord1 (alphamap u/v),
// and a Custom0 attribute (location 14) carrying per-tile texture-array
// layer indices packed as uvec4 (.x = layer0, .y = layer1).
//
// vColor is now sampled per-vertex from uPrimaryLight (a 256x256 RGB8 texture
// uploaded each frame from the legacy PrimaryTerrainLight global, NEAREST
// filter). This restores the per-frame dynamic lighting contract that
// glColor3fv(PrimaryTerrainLight[Index]) gave the immediate-mode pipeline:
// fire glow, skill cast tint, monster aura darkening, and day/night cycle
// all flow through this sampler instead of being frozen at chunk-build time.

layout(location = 0) in vec3  aPosition;
layout(location = 1) in vec4  aColor;     // legacy baked light — unused, kept for layout
layout(location = 2) in vec2  aTexCoord0;
layout(location = 4) in vec2  aTexCoord1;
layout(location = 14) in uvec4 aLayerSlots;  // .x = layer0, .y = layer1, .z = isWater (0/1)

layout(std140) uniform Camera {
    mat4 uProj;
    mat4 uView;
    vec4 uCameraPos;
};

uniform sampler2D uPrimaryLight;  // dynamic per-frame terrain light (slot 2)

out vec4 vColor;
out vec2 vUV0;       // base / overlay tile UV (tiled)
out vec2 vUV1;       // alpha-map UV (normalised 0..1 over full terrain)
out vec3 vViewPos;   // view-space position for fog distance
flat out uint vLayer0;
flat out uint vLayer1;
flat out uint vIsWater;  // 1 on TW_WATER cells, 0 otherwise

void main() {
    vec4 viewPos  = uView * vec4(aPosition, 1.0);
    gl_Position   = uProj * viewPos;
    vViewPos      = viewPos.xyz;
    // aTexCoord1 is gx/256, gy/256 at each corner vertex (BuildTerrainGPU
    // computes it from the integer cell index gx, gy). Multiplying by 256
    // and rounding recovers the integer cell index, which texelFetch reads
    // from the 256x256 light texture exactly. No interpolation between
    // cells — matches legacy per-vertex glColor3fv(PrimaryTerrainLight[i]).
    ivec2 cellXY  = ivec2(round(aTexCoord1 * 256.0));
    cellXY        = clamp(cellXY, ivec2(0), ivec2(255));
    vec3 light    = texelFetch(uPrimaryLight, cellXY, 0).rgb;
    // aColor is left wired through the layout for binding stability but
    // multiplied by zero so the optimiser cannot strip it (some drivers
    // disable the attribute slot when the shader has no live read,
    // which can mismatch the host-side VertexArray layout).
    vColor        = vec4(light, 1.0) + aColor * 0.0;
    vUV0          = aTexCoord0;
    vUV1          = aTexCoord1;
    vLayer0       = aLayerSlots.x;
    vLayer1       = aLayerSlots.y;
    vIsWater      = aLayerSlots.z;
}
