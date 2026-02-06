exports.getPolicy = (designation) => {
  let earned = 0;
    const d = (designation || "").toLowerCase();

    if (
      d.includes("dean") ||
      d.includes("hod") ||
      d.includes("registrar") ||
      d.includes("principal")
    ) {
      earned = 20;
    } else {
      earned = 8;
    }

  return {
    casual: 15,
    earned,
    rh: 2
}
};
