"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isDeadStyleSheet = isDeadStyleSheet;
var domStyleSheets = exports.domStyleSheets = new WeakSet();

function isDeadStyleSheet(styleSheet) {
  return !styleSheet.ownerNode && domStyleSheets.has(styleSheet);
}