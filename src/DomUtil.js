import type { DocumentLike } from '../types';

export function ensureDocumentLike(doc) {
  if (!isDocumentLike(doc)) {
    throw new TypeError('Parameter must be a document or document-like');
  }
}

export function isDocumentLike(doc: DocumentLike): boolean {
  if (doc == null) {
    return false;
  }

  if (!doc.nodeName) {
    return false;
  }

  return (doc.nodeName === '#document' || doc.nodeName === '#document-fragment');
}

export function getRootNode(elem: Node): Node {
  if (elem.parentNode) {
    return getRootNode(elem.parentNode);
  }

  return elem;
}
