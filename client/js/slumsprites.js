// Pixel sprites for the slum layers: containers, ladders, shutters, collapses, gaps, signs, wires, hideout props.
export function drawSlumProp(g, p, S = 16) {
  const x = p.x * S, y = p.y * S; const c = (col, a, b, w, h) => { g.fillStyle = col; g.fillRect(x + a, y + b, w, h); };
  switch (p.k) {
    case 'cont': switch (p.ck) {
      case 'crate': c('#6a4a2a', 2, 4, 12, 11); c('#8a6236', 3, 5, 10, 2); c('#4a321c', 2, 9, 12, 1); c('#4a321c', 7, 4, 1, 11); break;
      case 'locker': c('#4a5a66', 3, 1, 10, 15); c('#5e707e', 4, 2, 8, 6); c('#5e707e', 4, 9, 8, 6); c('#20262c', 10, 5, 1, 2); c('#20262c', 10, 12, 1, 2); break;
      case 'safe': c('#2e3238', 2, 3, 12, 12); c('#48505a', 3, 4, 10, 10); c('#c8b060', 7, 8, 3, 3); c('#1a1c20', 8, 9, 1, 1); break;
      case 'corpse': c('#3a2a2a', 3, 9, 11, 5); c('#6a5040', 2, 8, 4, 4); c('#5a1a1a', 8, 13, 5, 2); c('#8a7a60', 11, 9, 3, 3); break;
      case 'relic': c('#3a3450', 3, 9, 10, 6); c('#6a60a0', 5, 4, 6, 6); c('#c0b0ff', 7, 5, 2, 3); c('#4a4468', 2, 14, 12, 2); break;
      case 'cargo': c('#2a5a4a', 1, 4, 14, 11); c('#3a7a62', 1, 5, 14, 1); for (let k = 2; k < 14; k += 3) c('#1e4036', k, 6, 1, 8); c('#e0c040', 6, 8, 4, 2); break;
      case 'trash': c('#3a3a30', 2, 9, 12, 6); c('#5a5a48', 4, 7, 5, 4); c('#6a4a2a', 9, 8, 4, 3); c('#2a6a3a', 6, 6, 2, 2); break;
      case 'desk': c('#5a3e26', 1, 6, 14, 4); c('#3a2818', 2, 10, 2, 5); c('#3a2818', 12, 10, 2, 5); c('#e8e0c8', 4, 4, 4, 3); c('#a0c8ff', 10, 4, 3, 2); break;
      default: c('#6a4a2a', 3, 5, 10, 10);
    } if (p.glow) { g.fillStyle = 'rgba(180,160,255,.35)'; g.fillRect(x, y, S, S); } break;
    case 'ladderUp': case 'ladderDown': { const up = p.k === 'ladderUp'; c('#5a3e22', 3, 0, 2, 16); c('#5a3e22', 11, 0, 2, 16); for (let k = 2; k < 16; k += 4) c('#8a6236', 3, k, 10, 2); c(up ? '#70e070' : '#e0a040', 6, up ? 1 : 12, 4, 3); if (p.temp) c('#ff60a0', 13, 1, 2, 2); break; }
    case 'shutter': c('#4a4a52', 0, 0, 16, 16); for (let k = 1; k < 16; k += 3) c('#6a6a74', 0, k, 16, 1); c('#c8a040', 2, 7, 12, 2); break;
    case 'collapse': c('#4a4038', 1, 6, 14, 10); c('#6a5a4a', 3, 3, 6, 6); c('#5a4a3c', 9, 2, 5, 7); c('#2a2420', 4, 12, 8, 2); break;
    case 'gap': c('#0a0810', 0, 0, 16, 16); c('#3a2c22', 0, 0, 3, 16); c('#3a2c22', 13, 0, 3, 16); c('#1a1418', 4, 6, 8, 1); break;
    case 'hideoutdoor': c('#2a1e18', 3, 1, 10, 15); c('#4a3628', 4, 2, 8, 13); c('#c0a060', 10, 9, 1, 2); c('#ff5050', 6, 4, 4, 1); break;
    case 'entrysign': c('#3a2a1a', 7, 6, 2, 10); c('#c89040', 1, 1, 14, 7); c('#3a2a1a', 3, 3, 10, 1); c('#3a2a1a', 3, 5, 7, 1); break;
    case 'hfac': { const col = { workbench: '#8a6a3a', forge: '#a04020', alchemy: '#3a8a6a', terminal: '#2a4a8a', maptable: '#7a6a4a', display: '#6a4a7a', rest: '#4a6a8a', fence: '#8a7a2a', lab: '#5a3a8a', stash: '#3a3a3a', security: '#8a2a2a' }[p.f] || '#6a5a4a';
      c('#2a2018', 0, 4, 32, 12); c(col, 1, 3, 30, 9); c('#fff', 2, 4, 28, 1); g.globalAlpha = 0.25; c('#fff', 2, 4, 28, 1); g.globalAlpha = 1;
      if (p.f === 'forge') c('#ffb040', 12, 5, 8, 4); if (p.f === 'terminal') { c('#102040', 8, 4, 16, 6); c('#60e0ff', 9, 5, 10, 1); c('#60e0ff', 9, 7, 6, 1); } if (p.f === 'alchemy') { c('#a0ffd0', 8, 4, 3, 5); c('#ff80c0', 18, 5, 3, 4); }
      for (let k = 0; k < (p.lv || 1); k++) c('#ffd040', 2 + k * 3, 13, 2, 2); break; }
    case 'sdecor': switch (p.d) {
      case 'wires': for (let k = 0; k < (p.w || 1) * S; k += 8) c('#1a1a1a', k % (p.w * S || 16), 3 + ((k >> 3) % 3), 8, 1); break;
      case 'sign': c('#2a2a2a', 7, 8, 2, 8); c(['#c04040', '#4080c0', '#c0a040', '#40a060'][p.v || 0], 2, 1, 12, 7); c('#1a1a1a', 4, 3, 8, 1); break;
      case 'laundry': c('#2a2a2a', 0, 2, 16, 1); c('#c8c8d0', 2, 3, 3, 5); c('#c06060', 7, 3, 3, 6); c('#6080c0', 12, 3, 3, 4); break;
      case 'lantern': c('#3a2a1a', 7, 0, 2, 3); c('#ff8040', 5, 3, 6, 6); c('#ffd080', 6, 4, 4, 3); break;
      case 'ac': c('#9aa0a8', 2, 4, 12, 9); c('#6a7078', 3, 5, 10, 7); for (let k = 5; k < 12; k += 2) c('#40464c', 4, k, 8, 1); break;
      case 'neonsign': c('#1a1a22', 1, 2, 14, 8); c(['#ff40a0', '#40e0ff', '#ffd040', '#a060ff'][p.v || 0], 2, 4, 12, 3); break;
      case 'drip': c('#5a7a8a', 7, 2, 1, 4); c('#80a8c0', 7, 8, 1, 2); break;
      case 'puddle': g.fillStyle = 'rgba(90,120,150,.45)'; g.fillRect(x + 2, y + 9, 12, 4); break;
    } break;
  }
}
export const SLUM_PROPS = new Set(['cont', 'ladderUp', 'ladderDown', 'shutter', 'collapse', 'gap', 'hideoutdoor', 'entrysign', 'hfac', 'sdecor']);
