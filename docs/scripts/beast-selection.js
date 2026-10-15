import { Beast } from "./beast.js";

export class BeastSelection {
  constructor(beast, selectionFrom, selectionTo) {
    if (!(beast instanceof Beast)
      || !Number.isInteger(selectionFrom) || selectionFrom < 0
      || !Number.isInteger(selectionTo) || selectionTo <= selectionFrom) {
      throw new TypeError("A beast selection needs a beast and a valid selection range.");
    }

    Object.assign(this, {
      name: beast.name,
      encounterType: beast.encounterType,
      rank: beast.rank,
      selectionFrom,
      selectionTo,
      spotSkillCheck: Object.freeze([...beast.spotSkillCheck]),
      avoidSkillCheck: Object.freeze([...beast.avoidSkillCheck]),
      escapeSkillCheck: Object.freeze([...beast.escapeSkillCheck]),
      impactSkillCheck: Object.freeze([...beast.impactSkillCheck]),
      encounterDescription: beast.encounterDescription,
    });
    Object.freeze(this);
  }
}
