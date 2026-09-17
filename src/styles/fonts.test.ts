import { readFileSync } from 'fs';
import { resolve } from 'path';

test('fonts.css declares all three VITRO font-faces with the expected variable names', () => {
  const css = readFileSync(resolve(__dirname, 'fonts.css'), 'utf-8');
  expect(css).toContain('--font-vitro-core');
  expect(css).toContain('--font-vitro-inspire');
  expect(css).toContain('--font-vitro-pride');
  expect(css).toContain("VITRO CORE OTF.otf");
  expect(css).toContain("VITRO INSPIRE OTF.otf");
  expect(css).toContain("VITRO PRIDE OTF.otf");
});
