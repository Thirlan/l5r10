export class SkillCheck {
  /**
   * Create one skill or raw-trait check.
   * @param {string} skill Skill name, or an empty string for a raw-trait roll.
   * @param {string} trait Trait name.
   * @param {number} tn Positive integer target number.
   * @throws {TypeError} If a field has an invalid value.
   */
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
