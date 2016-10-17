'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ensureDocumentLike = ensureDocumentLike;
exports.isDocumentLike = isDocumentLike;
exports.getRootNode = getRootNode;
function ensureDocumentLike(doc) {
  if (!isDocumentLike(doc)) {
    throw new TypeError('Parameter must be a document or document-like');
  }
}

function isDocumentLike(doc) {
  if (doc == null) {
    return false;
  }

  if (!doc.nodeName) {
    return false;
  }

  return doc.nodeName === '#document' || doc.nodeName === '#document-fragment';
}

function getRootNode(elem) {
  if (elem.parentNode) {
    return getRootNode(elem.parentNode);
  }

  return elem;
}