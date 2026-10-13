/** Deletes stale raw coverage before the suite runs. */
import { deleteRawCoverage } from './coverage-utils';

export default async function globalSetup() {
  deleteRawCoverage();
}
