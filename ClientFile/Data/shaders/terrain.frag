#version 330 core

// Terrain fragment shader — per-tile texture variety via sampler2DArray.
//
// uTileArray   — 2D texture array (depth=32), each layer is one tile texture.
// uAlphaMap    — 256x256 R8 splat weight; alpha=0 → base, alpha=1 → overlay.
//
// uWaterMove   — UV scroll offset; the fragment shader applies it per-cell
//                using vIsWater (set from TerrainWall & TW_WATER on the
//                CPU side when chunks are built).
// uAlphaTestEnabled — 1 only for map-specific alpha-test textures (e.g. Kanturu).

in vec4 vColor;
in vec2 vUV0;
in vec2 vUV1;
in vec3 vViewPos;
flat in uint vLayer0;
flat in uint vLayer1;
flat in uint vIsWater;  // per-cell, set from TerrainWall & TW_WATER

uniform sampler2DArray uTileArray;
uniform sampler2D      uAlphaMap;

// Fog mirrors legacy fixed-function fog state (FogEnable global). Most
// maps run with fog OFF (default: World loaders set FogEnable=false; only
// special scenes like EX700 select-server flip it on). Honour the flag
// or the GL3 path tints distant terrain darker than legacy did, which
// reads as 'lighting / brightness wrong' to the user.
uniform int   uFogEnabled;
uniform float uFogStart;
uniform float uFogEnd;
uniform vec4  uFogColor;

// uWaterMove is the legacy `WaterMove` global animated by ProcessTerrain
// (sin-driven UV offset; ZzzLodTerrain.cpp updates it every frame). The
// shader now applies it per-cell instead of per-pass: water cells get the
// scrolling overlay (matches legacy RenderTerrainTile logic at line 1559),
// non-water cells use static UVs. This means the additive water pass is
// no longer needed — single solid pass renders both correctly.
uniform float uWaterMove;
uniform int   uAlphaTestEnabled;

out vec4 fragColor;

void main() {
    vec2 sampleUV = vUV0;
    if (vIsWater == 1u) {
        // Legacy ZzzLodTerrain.cpp:1502 adds WaterMove to U only; V wave
        // comes from TerrainGrassWind which we don't pass to the shader
        // yet (would be a second per-vertex attribute). U-axis scroll
        // alone is the visible shimmer the user expects from rivers and
        // Atlans surface; secondary V wobble can come in a follow-up.
        sampleUV.x += uWaterMove;
    }

    vec4 base    = texture(uTileArray, vec3(sampleUV, float(vLayer0)));
    vec4 overlay = texture(uTileArray, vec3(sampleUV, float(vLayer1)));
    float alpha  = texture(uAlphaMap, vUV1).r;

    if (uAlphaTestEnabled == 1 && base.a < 0.25) discard;

    // Splat blend: alpha=0 → base, alpha=1 → overlay.
    vec3 splat = mix(base.rgb, overlay.rgb, alpha);

    // Defensive fallback: if both base and overlay sample to pure (0,0,0)
    // (texture array unbound, missing tile, glReadPixels readback failure),
    // pretend it was white. Without this the floor is unconditionally
    // BLACK because color = (0,0,0) * vColor = (0,0,0). With this, the
    // user at least sees the baked vertex light and we can reason about
    // texture-vs-light separately. Costs one float compare per fragment.
    float splatLum = splat.r + splat.g + splat.b;
    if (splatLum < 0.001) splat = vec3(1.0);

    // Apply pre-baked vertex light (PrimaryTerrainLight).
    vec3 color = splat * vColor.rgb;

    // Linear fog — legacy parity. Only applied when the engine flipped
    // FogEnable=true (EX700 select-server, certain cinematics). Normal
    // gameplay maps (Lorencia, Devias, Atlans, etc.) leave fog off.
    if (uFogEnabled == 1) {
        float dist = length(vViewPos);
        float fogF = clamp((uFogEnd - dist) / (uFogEnd - uFogStart), 0.0, 1.0);
        color = mix(uFogColor.rgb, color, fogF);
    }

    fragColor = vec4(color, 1.0);
}
