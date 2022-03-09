import run from './projects';
import * as core from '@actions/core';

try {
  run();
} catch (err) {
  core.setFailed(JSON.stringify(err, null, 2))
}
