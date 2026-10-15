export class SkillCheck {
  constructor(skill, trait, tn) {
    if (typeof skill !== "string" || skill.trim() !== skill
      || typeof trait !== "string" || trait.trim().length === 0
      || !Number.isInteger(tn) || tn < 1) {
      throw new TypeError("A skill check needs a skill, a trait, and a positive integer TN.");
    }

    Object.assign(this, { skill, trait, tn });
    Object.freeze(this);
  }
}
