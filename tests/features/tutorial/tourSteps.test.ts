import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TOUR_STEPS } from '@/features/tutorial/config/tourSteps';
import { toJoyrideSteps } from '@/features/tutorial/utils/toJoyrideSteps';

type Conditions = Parameters<typeof toJoyrideSteps>[1];
const base: Conditions = {
  candidates: false,
  legend: false,
  exclusion: false,
  installed: false,
  platform: 'android',
};
const ids = (c: Partial<Conditions>) =>
  toJoyrideSteps(TOUR_STEPS, { ...base, ...c }).map((s) => s.id);

describe('guided tour', () => {
  it('shows the candidate steps only when there are candidates', () => {
    expect(ids({ candidates: true, legend: false })).toEqual(
      expect.arrayContaining(['filters', 'candidates']),
    );
    expect(ids({ candidates: true, legend: false })).not.toContain('candidates-empty');
    expect(ids({ candidates: false, legend: false })).toContain('candidates-empty');
    expect(ids({ candidates: false, legend: false })).not.toContain('filters');
  });

  it('shows the legend step only when the legend is on the map', () => {
    expect(ids({ candidates: false, legend: true })).toContain('legend');
    expect(ids({ candidates: false, legend: false })).not.toContain('legend');
  });

  it('shows the BDOT10k summary step only after an analysis', () => {
    expect(ids({ candidates: true, legend: false, exclusion: true })).toContain('exclusion');
    expect(ids({ candidates: true, legend: false })).not.toContain('exclusion');
  });

  it('offers installing only in the browser, with the steps for the device', () => {
    expect(ids({ installed: true })).not.toContain('install');
    const content = (platform: Conditions['platform']) =>
      toJoyrideSteps(TOUR_STEPS, { ...base, platform }).find((s) => s.id === 'install')?.content;
    expect(content('ios')).toMatch(/Do ekranu początkowego/);
    expect(content('android')).toMatch(/Zainstaluj aplikację/);
    expect(content('desktop')).toMatch(/paska adresu/);
  });

  it('starts with the welcome and ends on the help button', () => {
    const all = ids({ candidates: true, legend: true });
    expect(all[0]).toBe('welcome');
    expect(all.at(-1)).toBe('help');
  });

  it('every target exists in the code as a data-tour anchor', () => {
    const source = globSync('src/**/*.tsx')
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    for (const step of TOUR_STEPS)
      if (step.target)
        expect(source.includes(`data-tour="${step.target}"`), step.target).toBe(true);
  });

  it('texts have no long dashes', () => {
    for (const s of TOUR_STEPS)
      expect(
        `${s.title} ${s.content} ${Object.values(s.contentByPlatform ?? {}).join(' ')}`,
      ).not.toMatch(/[—–]/);
  });
});
