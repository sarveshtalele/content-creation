// LinkedIn GIF dispatcher. One fixed canvas (1080x1350 portrait, 4:5); the story picks a template; every template shares header, CTA footer and flowing-arrow primitives.
import { buildHub } from './gif_hub.js';
import { buildColumns } from './gif_columns.js';
import { buildPipeline } from './gif_pipeline.js';
import { buildLanes } from './gif_lanes.js';
import { buildEcosystem } from './gif_ecosystem.js';
import { buildFramework } from './gif_framework.js';
const T = { hub: buildHub, columns: buildColumns, pipeline: buildPipeline, lanes: buildLanes, ecosystem: buildEcosystem, framework: buildFramework };
export function buildGif(stage, D) {
  const f = T[D.gif.template || 'hub']; if (!f) throw new Error('unknown gif template ' + D.gif.template);
  return f(stage, D);
}
