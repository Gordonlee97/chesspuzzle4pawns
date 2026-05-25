// src/setupTests.ts
// Stub document.elementFromPoint so vi.spyOn can intercept it in jsdom.
// jsdom does not implement elementFromPoint; without this stub, vi.spyOn
// throws "property is not defined on the object".
if (!document.elementFromPoint) {
  document.elementFromPoint = () => null;
}
