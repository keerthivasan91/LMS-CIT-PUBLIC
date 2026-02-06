// Must run BEFORE app/db imports
jest.spyOn(global, "setInterval").mockImplementation(() => {
  return { unref: () => {} };
});
