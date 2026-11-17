/**
 * Minimal assertion harness.
 *
 * Node's own test runner is fine, but this keeps the output readable in CI
 * logs and lets each file print an explicit RED proof: the same assertion is
 * run against a deliberately broken implementation and must fail there.
 */

const results = [];

export function test(name, fn) {
  results.push({ name, fn });
}

export function assert(condition, message) {
  if (!condition) throw new Error(message || 'assertion failed');
}

export function equal(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      (message ? message + ': ' : '') + 'expected ' + JSON.stringify(expected) + ', received ' + JSON.stringify(actual)
    );
  }
}

export function includes(haystack, needle, message) {
  if (String(haystack).indexOf(needle) < 0) {
    throw new Error((message ? message + ': ' : '') + 'expected to find ' + JSON.stringify(needle));
  }
}

export function excludes(haystack, needle, message) {
  if (String(haystack).indexOf(needle) >= 0) {
    throw new Error((message ? message + ': ' : '') + 'expected not to find ' + JSON.stringify(needle));
  }
}

export function matches(value, pattern, message) {
  if (!pattern.test(String(value))) {
    throw new Error((message ? message + ': ' : '') + 'expected ' + pattern + ' to match ' + JSON.stringify(value));
  }
}

/** Runs fn and returns the thrown message, or null if it did not throw. */
export async function failure(fn) {
  try {
    await fn();
    return null;
  } catch (error) {
    return String((error && error.message) || error);
  }
}

export async function run(label) {
  let failed = 0;
  for (const item of results) {
    try {
      await item.fn();
      console.log('  ok    ' + item.name);
    } catch (error) {
      failed += 1;
      console.log('  FAIL  ' + item.name);
      console.log('        ' + String((error && error.message) || error).replace(/\n/g, '\n        '));
    }
  }
  console.log('');
  console.log(
    label + ': ' + (results.length - failed) + ' passed, ' + failed + ' failed, ' + results.length + ' total'
  );
  if (failed > 0) process.exitCode = 1;
  return failed;
}
