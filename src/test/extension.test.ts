import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// Importing vscode in unit tests requires the extension host. These tests
// avoid that dependency.
// import * as myExtension from '../../extension';

describe('Extension Test Suite', () => {
    it('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });
});
