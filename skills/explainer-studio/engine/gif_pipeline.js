// Template "pipeline": a top-down workflow. Start node -> stages (labelled bands holding 2-4 nodes) -> result. Arrows carry dots between nodes and bands.
import { C, E, box, tx, enter, seg, eo } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, flow, node, badge, layer, W, TOP, BOTTOM } from './gif_common.js';

export function buildPipeline(stage, D) {
  const S = scene(stage, D), g = S.g, p = g.pipeline, N = p.stages.length;
  header(S);
  const nodeH = { 2: 156, 3: 142, 4: 110 }[N], bandH = nodeH + 62, bigH = 88, avail = BOTTOM - TOP;
  const gap = Math.min(70, Math.max(36, (avail - 2 * bigH - N * bandH) / (N + 1)));
  const used = 2 * bigH + N * bandH + (N + 1) * gap; let y = TOP + Math.max(0, Math.round((avail - used) / 2));
  const cx = 540; let t = .9;
  const bigNode = (id, d, grp, yy) => {
    const P = PAL[grp], b = box(S.root, { x: 250, y: yy, w: 580, h: bigH, r: 30, bd: P.bd, bw: 3, css: `box-shadow:0 5px 0 ${C.line};` });
    badge(b, d.icon, P, { x: 16, y: (bigH - 6 - 56) / 2, s: 56 });
    tx(b, id + '-t', d.title, { x: 86, y: d.sub ? 8 : 20, w: 480, h: 38, size: 28, weight: 700 });
    if (d.sub) tx(b, id + '-s', d.sub, { x: 86, y: 46, w: 480, h: 32, size: 20, weight: 500, color: C.mid });
    return b;
  };
  // start
  const sNode = bigNode('ps', p.start, 'blue', y); reveal(S, sNode, t, { sc: .9 }); t += .55; y += bigH;
  let prevBottom = y;
  p.stages.forEach((st, i) => {
    const P = PAL[st.group], top = prevBottom + gap, n = st.nodes.length, link = st.link !== false, ng = link ? 44 : 24, inner = 984, nw = Math.floor((inner - (n - 1) * ng) / n);
    flow(S, `M${cx} ${prevBottom + 2} V${top - 2}`, i === 0 ? PAL.blue.bd : PAL[p.stages[i - 1].group].bd, { t0: t, dur: .5, w: 4.5 }); t += .45;
    const band = box(S.root, { x: 24, y: top, w: 1032, h: bandH, r: 30, fill: P.soft, bd: P.bd, bw: 2.5, shadow: false, css: 'border-style:dashed;' });
    const lw = Math.min(520, st.label.length * 13 + 40), lab = box(S.root, { x: 48, y: top - 19, w: lw, h: 38, r: 19, fill: '#fff', bd: P.bd, bw: 2.5, shadow: false });
    tx(lab, `pl${i}`, st.label, { x: 0, y: 0, w: lw - 5, h: 34, size: 20, weight: 700, color: P.ink, align: 'center', ls: .06 });
    reveal(S, band, t, { dy: 8, sc: .98, d: .45 }); reveal(S, lab, t + .15, { dy: 6, d: .35 }); t += .35; const ls = layer(S);
    st.nodes.forEach((nd, j) => {
      const nx = 24 + 24 + j * (nw + ng), ny = top + 38, b = node(S, `pn${i}${j}`, { x: nx, y: ny, w: nw, h: nodeH - 0, title: nd.title, sub: nd.sub, group: st.group, tsize: n === 4 ? 23 : 26, ssize: n === 4 ? 18 : 20, center: true, r: 20, fill: '#fff' });
      reveal(S, b, t, { dy: 12, sc: .92, d: .4 });
      if (link && j > 0) flow(S, `M${nx - ng + 3} ${ny + nodeH / 2} H${nx - 3}`, P.bd, { t0: t - .1, dur: .35, w: 4, head: 12, svg: ls });
      t += .4;
    });
    prevBottom = top + bandH; t += .2;
  });
  const top = prevBottom + gap, lastG = PAL[p.stages[N - 1].group].bd;
  flow(S, `M${cx} ${prevBottom + 2} V${top - 2}`, lastG, { t0: t, dur: .5 }); t += .45;
  const rNode = bigNode('pr', p.result, 'green', top); reveal(S, rNode, t, { sc: .9 });
  footer(S);
  return finish(S);
}
