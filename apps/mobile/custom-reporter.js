/**
 * Custom Terminal Reporter for Metro
 * This file provides a simple reporter implementation to replace the missing TerminalReporter
 */

class CustomTerminalReporter {
  constructor(opts) {
    this.opts = opts || {};
  }

  update() {
    // Empty implementation
  }

  log(message) {
    console.log(message);
  }
}

module.exports = CustomTerminalReporter;