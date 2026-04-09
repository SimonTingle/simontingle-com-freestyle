"use client";

import { useMemo } from "react";
import { DataTexture, RedFormat, UnsignedByteType, Vector3 } from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise";

/**
 * Generates a heightmap using 4-octave Perlin noise
 * Returns a Uint8Array suitable for use as terrain height data
 */
export function generateHeightMap(
  width: number,
  depth: number,
  scale: number = 1.0
): Uint8Array {
  const perlin = new ImprovedNoise();
  const data = new Uint8Array(width * depth);
  const z = Math.random() * 100; // Random seed per generation

  // Start with base quality, increase frequency per octave
  let quality = 1;

  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < width * depth; i++) {
      const x = i % width;
      const y = Math.floor(i / width);

      // Sample Perlin noise
      const noise = Math.abs(
        perlin.noise((x / quality) * scale, (y / quality) * scale, z) *
          quality *
          1.75
      );

      // Accumulate octave into heightmap
      data[i] += Math.min(255, noise * 255);
    }

    // Increase frequency for next octave
    quality *= 5;
  }

  return data;
}

/**
 * Converts heightmap data to a THREE.DataTexture for GPU usage
 */
export function createHeightTexture(heightData: Uint8Array, width: number, depth: number): DataTexture {
  const texture = new DataTexture(
    heightData,
    width,
    depth,
    RedFormat,
    UnsignedByteType
  );
  texture.magFilter = 1006; // THREE.LinearFilter
  texture.minFilter = 1008; // THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Samples elevation at world coordinates
 * heightMap: Uint8Array from generateHeightMap
 * x, z: world coordinates
 * worldWidth, worldDepth: total world dimensions (in units)
 * elevationScale: height multiplier
 */
export function sampleElevation(
  heightMap: Uint8Array,
  x: number,
  z: number,
  worldWidth: number,
  worldDepth: number,
  elevationScale: number = 35
): number {
  const width = Math.sqrt(heightMap.length); // Assuming square grid

  // Convert world coords to heightmap indices
  const u = (x + worldWidth / 2) / worldWidth;
  const v = (z + worldDepth / 2) / worldDepth;

  // Clamp to valid range
  const xi = Math.max(0, Math.min(width - 1, u * width));
  const zi = Math.max(0, Math.min(width - 1, v * width));

  // Bilinear interpolation
  const x0 = Math.floor(xi);
  const x1 = Math.ceil(xi);
  const z0 = Math.floor(zi);
  const z1 = Math.ceil(zi);

  const fx = xi - x0;
  const fz = zi - z0;

  const h00 = (heightMap[z0 * width + x0] / 255) * elevationScale;
  const h10 = (heightMap[z0 * width + x1] / 255) * elevationScale;
  const h01 = (heightMap[z1 * width + x0] / 255) * elevationScale;
  const h11 = (heightMap[z1 * width + x1] / 255) * elevationScale;

  const h0 = h00 * (1 - fx) + h10 * fx;
  const h1 = h01 * (1 - fx) + h11 * fx;

  return h0 * (1 - fz) + h1 * fz;
}

/**
 * React hook: generates and caches terrain heightmap
 */
export function useTerrainHeightMap(width: number = 1024, depth: number = 1024, scale: number = 1.0) {
  return useMemo(() => {
    console.log('🎲 useTerrainHeightMap: Generating terrain with width:', width, 'depth:', depth, 'scale:', scale);

    try {
      const heightData = generateHeightMap(width, depth, scale);

      // Don't spread large arrays - calculate min/max safely
      let min = heightData[0];
      let max = heightData[0];
      for (let i = 1; i < heightData.length; i++) {
        if (heightData[i] < min) min = heightData[i];
        if (heightData[i] > max) max = heightData[i];
      }

      console.log('✅ useTerrainHeightMap: Height map generated. Length:', heightData.length, 'Min:', min, 'Max:', max);

      const heightTexture = createHeightTexture(heightData, width, depth);
      console.log('✅ useTerrainHeightMap: Height texture created:', heightTexture);

      return {
        heightData,
        heightTexture,
        sampleElevation: (x: number, z: number, elevationScale: number = 35) =>
          sampleElevation(heightData, x, z, width, depth, elevationScale),
      };
    } catch (error) {
      console.error('❌ useTerrainHeightMap: Error generating terrain:', error);
      throw error;
    }
  }, [width, depth, scale]);
}

/**
 * Wind system similar to MeadowScene's WindSystem
 * Uses multi-frequency sine waves for organic gusts
 */
export class TerrainWindSystem {
  private time = 0;
  private baseStrength = 0;
  private gustPhase = 0;

  update(deltaTime: number) {
    this.time += deltaTime;

    // Multi-frequency wind for organic feel
    const gust1 = Math.sin(this.time * 0.3) * 0.6;
    const gust2 = Math.sin(this.time * 0.15 + 1.2) * 0.4;
    const gust3 = Math.sin(this.time * 0.07 + 2.4) * 0.3;

    this.baseStrength = Math.max(0.3, gust1 + gust2 + gust3);
    this.gustPhase = this.time;
  }

  getStrength(): number {
    return Math.max(0.2, this.baseStrength);
  }

  getDirection(): Vector3 {
    const angle = Math.sin(this.gustPhase * 0.5) * Math.PI * 0.4;
    return new Vector3(Math.cos(angle), 0, Math.sin(angle));
  }

  getTime(): number {
    return this.time;
  }
}

export const terrainWindSystem = new TerrainWindSystem();
