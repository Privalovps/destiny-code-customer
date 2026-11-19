import { localDevelopmentEnvironment } from '../server/development-environment';
/** Customer public edition. Purchased-order versions are selected separately, only after authorization. */
export type ReadingRelease='legacy-v4'|'research-c';
export function activeReadingRelease(env:Record<string,string|undefined>=process.env):ReadingRelease{
 // Historical UI rollback is local-only. Public deployments always expose the fixed 1991 C sample/free edition.
 if(localDevelopmentEnvironment(env)&&env.DESTINY_CODE_READING_RELEASE==='legacy-v4')return 'legacy-v4';
 return 'research-c';
}
