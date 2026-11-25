// Duel content (PHASE 7): the Wandering Swordmaster and the Masquerade Tournament. Names fixed by the directive.
export const RAVEN = { name: 'レイヴァン・クロイツ', race: '人間', job: '無銘の剣聖', weapon: '無銘・天断', wt: 1, look: { body: 1, skin: 1, hair: 3, hairColor: 9, outfit: 5 },
  // wandering route: roads, mountain passes, forests, wastelands, ruins and dungeon entrances across the continents (zone ids)
  route: ['field_green', 'field_capital', 'field_highland', 'field_greatwood', 'field_mine', 'frostvale', 'weissberg', 'voltplain', 'tempest_ridge', 'amatsukami', 'endless_dune', 'necropolis', 'ashland', 'obsidian_wood', 'crystal_reef', 'storm_archipelago', 'field_lake', 'field_coast'],
  lines: ['「……剣を抜く理由があるなら、相手をしよう」', '「強さに名は要らない。この刀にも名はない」', '「君の武器は何を語る？」', '「勝ち負けより、何を学んだかだ」', '「次に会うとき、君はもっと強くなっているだろう」'],
  trueLines: ['「……ようやく、ここまで来たか。今度は本気で応えよう」'] };
export const MASKED = {
  guide: { name: '仮面の案内人', line: '「強さに名は必要ない。ここでは身分も、過去も、肩書きも関係ない。必要なのは、ただ一つ。戦う理由だ。」' },
  rounds: [{ name: '予選 第一試合' }, { name: '予選 第二試合' }, { name: '予選 第三試合' }, { name: '本戦 準々決勝' }, { name: '本戦 準決勝' }, { name: '決勝' }],
  // special participants appear from the main bracket on (identity hidden until defeated)
  specials: [{ id: 'knight', real: '王国騎士団長', wt: 15, lvAdd: 4 }, { id: 'raven', real: 'レイヴァン・クロイツ', wt: 1, lvAdd: 8 }, { id: 'exbishop', real: '元大罪司教', wt: 22, lvAdd: 6 }, { id: 'unknown', real: '未発見職業の冒険者', wt: 64, lvAdd: 5 }, { id: 'legend', real: '伝説武器の所持者', wt: 79, lvAdd: 7 }],
  king: { name: '仮面の王', real: 'かつて世界最強と呼ばれた冒険者「グレン・アッシュフォード」', wt: 2, lvAdd: 10 },
};
