// LinkedIn GIF dispatcher. One fixed canvas (1080x1350 portrait, 4:5); the story picks a template; every template shares header, CTA footer and flowing-arrow primitives.
import { buildHub } from './gif_hub.js';
import { buildColumns } from './gif_columns.js';
import { buildPipeline } from './gif_pipeline.js';
import { buildLanes } from './gif_lanes.js';
import { buildEcosystem } from './gif_ecosystem.js';
import { buildFramework } from './gif_framework.js';
import { buildExploded } from './gif_exploded.js';
import { buildIsoflow } from './gif_isoflow.js';
import { buildOrbit } from './gif_orbit.js';
import { buildStairs } from './gif_stairs.js';
import { buildTower } from './gif_tower.js';
import { buildSkyline } from './gif_skyline.js';
import { buildConveyor } from './gif_conveyor.js';
import { buildFunnel } from './gif_funnel.js';
const T = { hub: buildHub, columns: buildColumns, pipeline: buildPipeline, lanes: buildLanes, ecosystem: buildEcosystem, framework: buildFramework, exploded: buildExploded, isoflow: buildIsoflow, orbit: buildOrbit, stairs: buildStairs, tower: buildTower, skyline: buildSkyline, conveyor: buildConveyor, funnel: buildFunnel };
export function buildGif(stage, D) {
  const f = T[D.gif.template || 'hub']; if (!f) throw new Error('unknown gif template ' + D.gif.template);
  return f(stage, D);
}
