// AM-005 skip: [id] glob path causes false positive in batch mode
import { describe } from 'node:test';
describe.skip("\page.test.ts", () => ./app/rules/executions/[id]/page.test.ts);
