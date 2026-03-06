  
  class SkillDatabase {
	constructor() {
		this.skillMap = new Map();
		
		// High
		let aSkill = new Skill("acting", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		
		aSkill = new Skill("artisan - bonsai", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("artisan - gardening", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("artisan - ikebana", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("artisan - origami", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("artisan - painting", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("artisan - poetry", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("artisan - sculpture", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("artisan - tatooing", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		
		aSkill = new Skill("calligraphy", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("courtier", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("divination", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("etiquette", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		
		aSkill = new Skill("games - fortunes & winds", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("games - go", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("games - kemari", "high", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("games - letters", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("games - sadane", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("games - shogi", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		
		aSkill = new Skill("investigation", "high", "perception");
		this.skillMap.set(aSkill.name, aSkill);
		
		aSkill = new Skill("lore - architecture", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("lore - bushido", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("lore - crab", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("lore - crane", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("lore - dragon", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("lore - lion", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("lore - mantis", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		aSkill = new Skill("lore - phoenix", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - scorpion", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - unicorn", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - elements", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - gaijin culture", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - ghosts", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - heraldry", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - history", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - nature", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - nonhuman culture", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - omens", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - shugenja", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - spirit realms", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - theology", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		
		aSkill = new Skill("craft - armorsmithing", "high", "strength");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - bowyer", "high", "strength");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - weaponsmithing", "high", "strength");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("medicine", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("meditation", "high", "void");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("perform - biwa", "high", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("perform - dance", "high", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("perform - drums", "high", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("perform - flute", "high", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("perform - oratory", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("perform - puppeteer", "high", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("perform - shamisen", "high", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("perform - song", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("perform - storytelling", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		
		aSkill = new Skill("sincerity", "high", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("spellcraft", "high", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("tea ceremony", "high", "void");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		
		// Bugei
		aSkill = new Skill("athletics", "bugei", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("battle", "bugei", "perception");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("defense", "bugei", "reflexes");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("horsemanship", "bugei", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("hunting", "bugei", "perception");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("iaijutsu", "bugei", "reflexes");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("jiujutsu", "bugei", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("chain weapons", "bugei", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("heavy weapons", "bugei", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("kenjutsu", "bugei", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("knives", "bugei", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("kyujutsu", "bugei", "reflexes");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("ninjutsu", "bugei", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("polearms", "bugei", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("spears", "bugei", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("staves", "bugei", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("war fan", "bugei", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		
		// Merchant
		aSkill = new Skill("animal handling", "merchant", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("commerce", "merchant", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		
		aSkill = new Skill("craft - cooking", "merchant", "perception");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - fishing", "merchant", "perception");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - pottery", "merchant", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - tailoring", "merchant", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - blacksmithing", "merchant", "strength");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - brewing", "merchant", "perception");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - carpentry", "merchant", "strength");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - cartography", "merchant", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - cobbling", "merchant", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - farming", "merchant", "stamina");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - masonry", "merchant", "stamina");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - mining", "merchant", "stamina");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - shipbuilding", "merchant", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - weaving", "merchant", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		
		aSkill = new Skill("engineering", "merchant", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("sailing", "merchant", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		
		// Low
		aSkill = new Skill("forgery", "low", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("intimidation", "low", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("sleight of hands", "low", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("stealth", "low", "agility");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("temptation", "low", "awareness");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - anatomy", "low", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - maho", "low", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - shadowlands", "low", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("lore - underworld", "low", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
		aSkill = new Skill("craft - poison", "low", "intelligence");
		this.skillMap.set(aSkill.name, aSkill);
		this.skillPreference.set(aSkill.name, 0);
	}
	
	getSkills() {
		return this.skillMap.values();
	}
	
	getSkillsByTrait(traitName) {
		let skills = [];
		for (let skill of this.skillMap.values()) {
			if (skill.trait === traitName) {
				skills.push(skill);
			}
		}
		return skills;
	}
}

class CharacterSheet {
	
	constructor() {
		this.skillDatabase = new SkillDatabase();
		this.traitMap = this.skillDatabase.traitMap;
		this.skillMap = this.skillDatabase.skillMap;
		this.traitPreference = this.skillDatabase.traitPreference;
		this.skillPreference = this.skillDatabase.skillPreference;
		this.advDisMap = new Map();
		this.advDisChoiceMap = new Map();
		this.keywords = [];
		this.honor = 0.0;
		this.status = 0.0;
		this.glory = 0.0;
		this.taint = 0.0;
		this.baseSalaryKoku = 0;
		this.baseSalaryBu = 0;
		this.baseSalaryZeni = 0;
		
		let aTrait = new Trait("void", 2, "void", 6);
		this.traitMap.set(aTrait.name, aTrait);
		this.traitPreference.set("void", 1);
		aTrait = new Trait("stamina", 2, "earth", 4);
		this.traitMap.set(aTrait.name, aTrait);
		this.traitPreference.set(aTrait.name, 1);
		aTrait = new Trait("willpower", 2, "earth", 4);
		this.traitMap.set(aTrait.name, aTrait);
		this.traitPreference.set(aTrait.name, 1);
		aTrait = new Trait("reflexes", 2, "air", 4);
		this.traitMap.set(aTrait.name, aTrait);
		this.traitPreference.set(aTrait.name, 1);
		aTrait = new Trait("awareness", 2, "air", 4);
		this.traitMap.set(aTrait.name, aTrait);
		this.traitPreference.set(aTrait.name, 1);
		aTrait = new Trait("agility", 2, "fire", 4);
		this.traitMap.set(aTrait.name, aTrait);
		this.traitPreference.set(aTrait.name, 1);
		aTrait = new Trait("intelligence", 2, "fire", 4);
		this.traitMap.set(aTrait.name, aTrait);
		this.traitPreference.set(aTrait.name, 1);
		aTrait = new Trait("strength", 2, "water", 4);
		this.traitMap.set(aTrait.name, aTrait);
		this.traitPreference.set(aTrait.name, 1);
		aTrait = new Trait("perception", 2, "water", 4);
		this.traitMap.set(aTrait.name, aTrait);
		this.traitPreference.set(aTrait.name, 1);
		
		// Advantages
		let aAdvDis = new AdvDis("absolute direction", "adv", "mental", 1, [], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("allies - influence 1 / devotion 1", "adv", "social", 2, ["crane"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("allies - influence 2 / devotion 1", "adv", "social", 3, ["crane"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("allies - influence 4 / devotion 1", "adv", "social", 5, ["crane"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("allies - influence 1 / devotion 2", "adv", "social", 3, ["crane"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("allies - influence 2 / devotion 2", "adv", "social", 4, ["crane"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("allies - influence 4 / devotion 2", "adv", "social", 6, ["crane"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("allies - influence 1 / devotion 4", "adv", "social", 5, ["crane"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("allies - influence 2 / devotion 4", "adv", "social", 6, ["crane"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("allies - influence 4 / devotion 4", "adv", "social", 8, ["crane"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmail - 1", "adv", "social", 1, ["scorpion"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmail - 2", "adv", "social", 2, ["scorpion"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmail - 3", "adv", "social", 3, ["scorpion"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmail - 4", "adv", "social", 4, ["scorpion"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmail - 5", "adv", "social", 5, ["scorpion"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmail - 6", "adv", "social", 6, ["scorpion"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmail - 7", "adv", "social", 7, ["scorpion"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmail - 8", "adv", "social", 8, ["scorpion"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmail - 9", "adv", "social", 9, ["scorpion"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmail - 10", "adv", "social", 10, ["scorpion"], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("bland", "adv", "physical", 2, [], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blissful betrothal", "adv", "social", 3, [], "", 148);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blood of osano-wo", "adv", "spiritual", 4, ["crab", "mantis"], "", 149);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("chosen by the oracles", "adv", "spiritual", 6, [], "", 149);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("clear thinker", "adv", "mental", 3, ["dragon"], "", 149);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("crab hands", "adv", "physical", 3, ["crab", "bushi"], "", 149);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("crafty", "adv", "mental", 3, ["scorpion", "spider", "ninja"], "", 149);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("dangerous beauty", "adv", "social", 3, ["scorpion"], "", 149);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("daredevil", "adv", "mental", 3, ["mantis"], "", 149);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("dark paragon - control", "adv", "mental", 5, ["spider"], "", 149);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("dark paragon - determination", "adv", "mental", 5, ["spider"], "", 149);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("dark paragon - insight", "adv", "mental", 5, ["spider"], "", 149);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("dark paragon - knowledge", "adv", "mental", 5, ["spider"], "", 149);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("dark paragon - perfection", "adv", "mental", 5, ["spider"], "", 149);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("dark paragon - strength", "adv", "mental", 5, ["spider"], "", 149);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("dark paragon - will", "adv", "mental", 5, ["spider"], "", 149);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("darling of the court", "adv", "social", 2, ["courtier"], "", 150);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("different school", "adv", "social", 5, [], "", 150);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("elemental blessing", "adv", "spiritual", 4, ["phoenix"], "", 150);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("enlightened", "adv", "spiritual", 6, ["dragon", "monk"], "", 150);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("fame", "adv", "social", 3, [], "", 150);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("forbidden knowledge", "adv", "mental", 5, [], "", 150);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("forbidden knowledge - gaijin pepper", "adv", "mental", 5, [], "", 150);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("forbidden knowledge - gozoku", "adv", "mental", 5, [], "", 150);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("forbidden knowledge - kolat", "adv", "mental", 5, [], "", 150);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("forbidden knowledge - lying darkness", "adv", "mental", 5, [], "", 150);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("forbidden knowledge - maho", "adv", "mental", 5, [], "", 150);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("friendly kami", "adv", "spiritual", 5, [], "", 151);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("friend of the brotherhood", "adv", "spiritual", 5, ["dragon"], "", 151);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("friend of the elements", "adv", "spiritual", 4, ["shugenja"], "", 151);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("gaijin gear", "adv", "material", 5, ["mantis", "unicorn"], "", 151);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("gentry - village", "adv", "material", 8, [], "", 151);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("gentry - large village", "adv", "material", 15, [], "", 151);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("gentry - unique holding", "adv", "material", 18, [], "", 151);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("gentry - town", "adv", "material", 20, [], "", 151);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("gentry - city", "adv", "material", 25, [], "", 151);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("gentry - province", "adv", "material", 30, [], "", 151);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("great destiny", "adv", "spiritual", 5, [], "", 152);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("great potential", "adv", "spiritual", 5, [], "", 152);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("hands of stone", "adv", "physical", 5, [], "", 152);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("heart of vengeance", "adv", "social", 5, ["spider"], "", 152);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("hero of the people", "adv", "social", 2, [], "", 152);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("higher purpose", "adv", "mental", 3, [], "", 152);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("imperial spouse", "adv", "social", 5, [], "", 152);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("inheritance", "adv", "material", 5, [], "", 152);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("inner gift - animal ken", "adv", "spiritual", 7, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("inner gift - empathy", "adv", "spiritual", 7, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("inner gift - foresight", "adv", "spiritual", 7, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("inner gift - lesser prophecy", "adv", "spiritual", 7, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("inner gift - spirit touch", "adv", "spiritual", 7, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("irreproachable", "adv", "mental", 2, ["imperial"], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("ishiken-do", "adv", "spiritual", 8, ["phoenix"], "", 153, 2); // 6 points for phoenix
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("kharmic tie - 1", "adv", "spiritual", 1, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("kharmic tie - 2", "adv", "spiritual", 2, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("kharmic tie - 3", "adv", "spiritual", 3, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("kharmic tie - 4", "adv", "spiritual", 4, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("kharmic tie - 5", "adv", "spiritual", 5, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("languages - yobanjin", "adv", "mental", 1, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("languages - senpet", "adv", "mental", 1, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("languages - yodotai", "adv", "mental", 1, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("languages - mekham", "adv", "mental", 1, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("languages - merenae", "adv", "mental", 1, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("languages - rhuumal", "adv", "mental", 1, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("languages - thrane", "adv", "mental", 1, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("languages - nezumi", "adv", "mental", 3, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("languages - naga", "adv", "mental", 3, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("large", "adv", "physical", 4, ["crab"], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("leadership", "adv", "social", 6, ["lion"], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("luck - 3", "adv", "spiritual", 3, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("luck - 6", "adv", "spiritual", 6, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("luck - 9", "adv", "spiritual", 9, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("magic resistance - 2", "adv", "spiritual", 2, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("magic resistance - 4", "adv", "spiritual", 4, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("magic resistance - 6", "adv", "spiritual", 6, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("multiple schools - courtier", "adv", "social", 2, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("multiple schools", "adv", "social", 10, [], "", 153);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("paragon - compassion", "adv", "mental", 7, ["lion"], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("paragon - courage", "adv", "mental", 7, ["lion"], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("paragon - courtesy", "adv", "mental", 7, ["lion"], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("paragon - duty", "adv", "mental", 7, ["lion"], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("paragon - honesty", "adv", "mental", 7, ["lion"], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("paragon - honor", "adv", "mental", 7, ["lion"], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("paragon - sincerity", "adv", "mental", 7, ["lion"], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("perceived honor - 2", "adv", "social", 2, [], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("perceived honor - 4", "adv", "social", 4, [], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("perceived honor - 6", "adv", "social", 6, [], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("perceived honor - 8", "adv", "social", 8, [], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("perceived honor - 10", "adv", "social", 10, [], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("precise memory", "adv", "mental", 3, [], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("prodigy", "adv", "physical", 12, [], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("quick", "adv", "physical", 6, ["ninja"], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("quick healer", "adv", "mental", 3, [], "", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("read lips", "adv", "mental", 4, [], "courtier", 154);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sacred weapon - kaiu blade", "adv", "material", 6, [], "", 155);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sacred weapon - kakita blade", "adv", "material", 5, [], "", 155);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sacred weapon - twin sister blades", "adv", "material", 3, [], "", 155);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sacred weapon - akodo blade", "adv", "material", 6, [], "", 155);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sacred weapon - storm kama", "adv", "material", 6, [], "", 155);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sacred weapon - inquisitor's strike", "adv", "material", 6, [], "", 155);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sacred weapon - shosuro blade", "adv", "material", 5, [], "", 155);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sacred weapon - black steel blade", "adv", "material", 6, [], "", 155);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sacred weapon - moto scimitar", "adv", "material", 6, [], "", 155);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sacrosanct", "adv", "social", 4, ["imperial"], "", 155);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sage", "adv", "mental", 4, ["phoenix", "shugenja"], "", 155);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sensation", "adv", "social", 3, [], "", 155);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("servant - artisan", "adv", "mental", 5, ["crane"], "", 155, 2); //-2 for clans
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("servant - attendant", "adv", "mental", 5, ["scorpion"], "", 155, 2); //-2 for clans
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("servant - budoka", "adv", "mental", 5, ["lion"], "", 155, 2); //-2 for clans
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("servant - craftsman", "adv", "mental", 5, ["dragon"], "", 155, 2); //-2 for clans
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("servant - eta", "adv", "mental", 5, ["crab"], "", 155, 2); //-2 for clans
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("servant - groom", "adv", "mental", 5, ["unicorn"], "", 155, 2); //-2 for clans
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("servant - merchant", "adv", "mental", 5, ["mantis"], "", 155, 2); //-2 for clans
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("servant - scribe", "adv", "mental", 5, ["phoenix"], "", 155, 2); //-2 for clans
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("servant - sohei", "adv", "mental", 5, ["spider"], "", 155, 2); //-2 for clans
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortunes' - benten", "adv", "spiritual", 4, ["crane"], "", 155);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortunes' - bishamon", "adv", "spiritual", 5, ["crab", "lion"], "", 155);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortunes' - daikoku", "adv", "spiritual", 4, ["mantis"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortunes' - ebisu", "adv", "spiritual", 4, ["unicorn"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortunes' - fukurokujin", "adv", "spiritual", 4, ["dragon", "phoenix"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortunes' - hotei", "adv", "spiritual", 4, [], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortunes' - jurojin", "adv", "spiritual", 4, ["scorpion"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortunes' - benten", "adv", "spiritual", 4, ["crane"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortunes' - benten", "adv", "spiritual", 4, ["crane"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortunes' - benten", "adv", "spiritual", 4, ["crane"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("silent", "adv", "physical", 3, ["ninja"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("social position", "adv", "social", 6, [], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("soul of artistry", "adv", "mental", 0, [], "", 156); // TODO
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("strength of the earth", "adv", "physical", 3, ["bushi"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("tactician", "adv", "mental", 4, ["lion", "bushi"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("touch of the spirit realms - chikushudo", "adv", "spiritual", 5, ["shugenja"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("touch of the spirit realms - gaki-do", "adv", "spiritual", 5, ["shugenja"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("touch of the spirit realms - jigoku", "adv", "spiritual", 5, ["shugenja"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("touch of the spirit realms - maigo no musha", "adv", "spiritual", 5, ["shugenja"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("touch of the spirit realms - meido", "adv", "spiritual", 5, ["shugenja"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("touch of the spirit realms - sakkaku", "adv", "spiritual", 5, ["shugenja"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("touch of the spirit realms - tengoku", "adv", "spiritual", 5, ["shugenja"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("touch of the spirit realms - toshigoku", "adv", "spiritual", 5, ["shugenja"], "", 156);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("touch of the spirit realms - yomi", "adv", "spiritual", 5, ["shugenja"], "", 157);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("touch of the spirit realms - yume-do", "adv", "spiritual", 5, ["shugenja"], "", 157);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("virtuous", "adv", "mental", 3, [], "", 157);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("voice", "adv", "physical", 3, [], "", 157);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("wary", "adv", "mental", 3, [], "", 157);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("way of the land", "adv", "mental", 2, ["unicorn"], "", 157);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("wealthy - 1", "adv", "material", 1, ["crane", "unicorn", "imperial"], "", 157);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("wealthy - 2", "adv", "material", 2, ["crane", "unicorn", "imperial"], "", 157);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("wealthy - 3", "adv", "material", 3, ["crane", "unicorn", "imperial"], "", 157);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("wealthy - 4", "adv", "material", 4, ["crane", "unicorn", "imperial"], "", 157);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("wealthy - 5", "adv", "material", 5, ["crane", "unicorn", "imperial"], "", 157);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		
		// Disadvantages
		aAdvDis = new AdvDis("antisocial - 2", "dis", "social", -3, ["crab"], "", 158); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("antisocial - 4", "dis", "social", -3, ["crab"], "", 158); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("ascetic", "dis", "mental", -2, ["dragon", "monk"], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("bad eyesight", "dis", "physical", -2, [], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("bad fortune", "dis", "spiritual", -3, [], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("bad fortune - moto curse", "dis", "spiritual", -3, ["unicorn"], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("bad fortune - yogo curse", "dis", "spiritual", -3, ["scorpion"], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("bad health", "dis", "physical", -4, [], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("bitter betrothal", "dis", "social", -2, [], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmailed - 1", "dis", "social", -1, [], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmailed - 2", "dis", "social", -2, [], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmailed - 3", "dis", "social", -3, [], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmailed - 4", "dis", "social", -4, [], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmailed - 5", "dis", "social", -5, [], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmailed - 6", "dis", "social", -6, [], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmailed - 7", "dis", "social", -7, [], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmailed - 8", "dis", "social", -8, [], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmailed - 9", "dis", "social", -9, [], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("blackmailed - 10", "dis", "social", -10, [], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("black sheep", "dis", "social", -3, [], "", 158);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("brash", "dis", "mental", -3, ["lion"], "", 159); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("can't lie", "dis", "mental", -2, [], "", 159); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("cast out - 1", "dis", "social", -1, [], "", 159);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("cast out - 2", "dis", "social", -2, [], "", 159);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("cast out - 3", "dis", "social", -3, [], "", 159);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("compulsion - 2", "dis", "mental", -2, [], "", 159); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("compulsion - 3", "dis", "mental", -3, [], "", 159); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("compulsion - 4", "dis", "mental", -4, [], "", 159); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("consumed - control", "dis", "mental", -4, ["spider"], "", 159); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("consumed - determination", "dis", "mental", -6, ["spider"], "", 159); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("consumed - insight", "dis", "mental", -4, ["spider"], "", 159); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("consumed - knowledge", "dis", "mental", -4, ["spider"], "", 159); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("consumed - perfection", "dis", "mental", -5, ["spider", "crane"], "", 159); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("consumed - strength", "dis", "mental", -5, ["spider"], "", 160); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("consumed - will", "dis", "mental", -4, ["spider"], "", 160); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("contrary", "dis", "mental", -3, ["imperial", "courtier"], "", 160); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("cursed by the realm - chikushudo", "dis", "spiritual", -4, ["shugenja"], "", 160);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("cursed by the realm - gaki-do", "dis", "spiritual", -4, ["shugenja"], "", 160);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("cursed by the realm - jigoku", "dis", "spiritual", -4, ["shugenja"], "", 160);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("cursed by the realm - maigo no musha", "dis", "spiritual", -4, ["shugenja"], "", 160);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("cursed by the realm - meido", "dis", "spiritual", -4, ["shugenja"], "", 160);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("cursed by the realm - sakkaku", "dis", "spiritual", -4, ["shugenja"], "", 160);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("cursed by the realm - tengoku", "dis", "spiritual", -4, ["shugenja"], "", 160);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("cursed by the realm - toshigoku", "dis", "spiritual", -4, ["shugenja"], "", 160);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("cursed by the realm - yomi", "dis", "spiritual", -4, ["shugenja"], "", 160);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("cursed by the realm - yume-do", "dis", "spiritual", -4, ["shugenja"], "", 160);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("dark fate", "dis", "spiritual", -3, [], "", 160);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("dark secret", "dis", "mental", -4, ["ninja"], "", 160);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("dependant - 2", "dis", "social", -2, [], "", 160); // marriage
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("dependant - 4", "dis", "social", -4, [], "", 160);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("dependant - 6", "dis", "social", -6, [], "", 160); // child
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("dishonored", "dis", "social", -5, [], "", 160);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("disbeliever", "dis", "mental", -3, [], "", 160);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("disturbing countenance", "dis", "physical", -2, ["spider"], "", 161); // attractiveness
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("doubt", "dis", "mental", -4, [], "", 161);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("driven", "dis", "mental", -2, [], "", 161); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("elemental imbalance - 2", "dis", "mental", -2, [], "", 161);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("elemental imbalance - 4", "dis", "mental", -4, [], "", 161);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("elemental imbalance - 6", "dis", "mental", -6, [], "", 161);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("elemental imbalance - 8", "dis", "mental", -8, [], "", 161);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("epilepsy", "dis", "physical", -4, [], "", 161);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("fascination", "dis", "mental", -1, [], "", 161); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("failure of bushido - compassion", "dis", "mental", -3, ["ninja"], "", 161); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("failure of bushido - courage", "dis", "mental", -4, ["ninja"], "", 161); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("failure of bushido - courtesy", "dis", "mental", -4, ["ninja"], "", 161); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("failure of bushido - duty", "dis", "mental", -6, ["ninja"], "", 161);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("failure of bushido - honesty", "dis", "mental", -3, ["ninja"], "", 161); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("failure of bushido - honor", "dis", "mental", -3, ["ninja"], "", 161); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("failure of bushido - sincerity", "dis", "mental", -4, ["ninja"], "", 161); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("frail mind", "dis", "mental", -3, [], "", 161);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("gaijin name", "dis", "mental", -1, ["unicorn"], "", 161);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("greedy", "dis", "mental", -3, ["mantis"], "", 162); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("gullible", "dis", "mental", -4, [], "", 162); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("haunted", "dis", "spiritual", -3, [], "", 162);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("hostage", "dis", "social", -3, [], "", 162);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("idealistic", "dis", "mental", -2, [], "", 162); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("infamous", "dis", "social", -2, [], "", 162);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("insensitive", "dis", "mental", -2, [], "", 162); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("jealousy", "dis", "mental", -3, [], "", 162); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("lame", "dis", "physical", -4, [], "", 162);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("lechery", "dis", "social", -2, [], "", 162); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("lord moon's curse - 3", "dis", "spiritual", -3, [], "", 162);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("lord moon's curse - 5", "dis", "spiritual", -5, [], "", 162);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("lord moon's curse - 7", "dis", "spiritual", -7, [], "", 162);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("lost love", "dis", "mental", -3, [], "", 162);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("low pain threshold", "dis", "physical", -4, [], "", 162);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("missing limb", "dis", "physical", -6, [], "", 163);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("momoku", "dis", "spiritual", -8, [], "", 163);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("obligation - 3", "dis", "social", -3, [], "", 163);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("obligation - 6", "dis", "social", -6, [], "", 163);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("obtuse", "dis", "mental", -3, ["crab", "bushi"], "", 163); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("overconfident", "dis", "mental", -3, ["lion", "mantis"], "", 163); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("permanent wound", "dis", "physical", -4, [], "", 163);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("phobia - 1", "dis", "mental", -1, [], "", 163);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("phobia - 2", "dis", "mental", -2, [], "", 163);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("phobia - 3", "dis", "mental", -3, [], "", 163);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("rumormonger", "dis", "social", -4, ["courtier"], "", 163); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortune's curse - benten", "dis", "spiritual", -3, [], "", 163); // attractiveness
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortune's curse - bishamon", "dis", "spiritual", -3, [], "", 163); // health
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortune's curse - daikoku", "dis", "spiritual", -3, [], "", 163); // wealth
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortune's curse - ebisu", "dis", "spiritual", -3, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortune's curse - fukurokujin", "dis", "spiritual", -3, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortune's curse - hotei", "dis", "spiritual", -6, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("seven fortune's curse - jurojin", "dis", "spiritual", -3, [], "", 164); // healthy
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("shadowland taint", "dis", "spiritual", -4, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("small", "dis", "physical", -3, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("social disadvantage", "dis", "social", -3, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("soft-hearted", "dis", "mental", -2, ["phoenix"], "", 164); // character flaw
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sworn enemy - 3", "dis", "social", -3, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sworn enemy - 4", "dis", "social", -4, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sworn enemy - 5", "dis", "social", -5, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sworn enemy - 6", "dis", "social", -6, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("sworn enemy - 7", "dis", "social", -7, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("touch of the void", "dis", "spiritual", -3, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("true love", "dis", "mental", -3, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("unlucky - 2", "dis", "spiritual", -2, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("unlucky - 4", "dis", "spiritual", -4, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("unlucky - 6", "dis", "spiritual", -6, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("unlucky - 8", "dis", "spiritual", -8, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("unlucky - 10", "dis", "spiritual", -10, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("weakness - strength", "dis", "physical", -6, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("weakness - perception", "dis", "physical", -6, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("weakness - agility", "dis", "physical", -6, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("weakness - intelligence", "dis", "physical", -6, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("weakness - stamina", "dis", "physical", -6, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("weakness - willpower", "dis", "physical", -6, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("weakness - reflexes", "dis", "physical", -6, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("weakness - awareness", "dis", "physical", -6, [], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("wrath of the kami - earth", "dis", "spiritual", -3, ["shugenja"], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("wrath of the kami - fire", "dis", "spiritual", -3, ["shugenja"], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("wrath of the kami - wind", "dis", "spiritual", -3, ["shugenja"], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("wrath of the kami - water", "dis", "spiritual", -3, ["shugenja"], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
		aAdvDis = new AdvDis("wrath of the kami - void", "dis", "spiritual", -3, ["shugenja"], "", 164);
		this.advDisChoiceMap.set(aAdvDis.name, aAdvDis);
	}
	
	increaseSkill(name, amount, emphasis) {
		let aSkill = this.skillMap.get(name);
		aSkill.increaseRank(amount);
		if(emphasis) {
			aSkill.appendEmphasis(emphasis);
		}
	}
	
	increasePreferredSkill(name, amount, emphasis) {
		let aSkill = this.skillMap.get(name);
		aSkill.increaseRank(amount);
		if(emphasis) {
			aSkill.appendEmphasis(emphasis);
		}
		let preferenceLevel = this.skillPreference.get(name);
		this.skillPreference.set(name, preferenceLevel+1);
		let traitPreferenceLevel = this.traitPreference.get(aSkill.trait);
		this.traitPreference.set(name, traitPreferenceLevel+1);
	}
	
	increaseTrait(name, amount) {
		this.traitMap.get(name).increaseRank(amount);
	}
	
	setSchoolTrait(name, amount) {
		this.traitMap.get(name).setSchool(amount);
	}
	
	setFamilyTrait(name, amount) {
		this.traitMap.get(name).setFamily(amount);
	}
	
	setSchoolSkill(name, amount, emphasis) {
		let aSkill = this.skillMap.get(name);
		aSkill.setSchool(amount);
		if(emphasis) {
			aSkill.appendSchoolEmphasis(emphasis);
		}
		let preferenceLevel = this.skillPreference.get(name);
		this.skillPreference.set(name, preferenceLevel+1);
		let traitPreferenceLevel = this.traitPreference.get(aSkill.trait);
		this.traitPreference.set(name, traitPreferenceLevel+1);
	}
	
	addAdvDis(name, detail) {
		const nameExists = [...this.advDisChoiceMap.keys()].includes(name);
		if(nameExists) {
			let aAdvDis = this.advDisChoiceMap.get(name);
			if(detail) {
				aAdvDis.detail = detail;
			}
			this.advDisMap.set(name, aAdvDis);
		}
	}
	
	increaseTraitPreference(name) {
		let traitPreferenceLevel = traitPreference.get(name);
		traitPreference.set(name, traitPreferenceLevel+1);
	}
	
	getTraits() {
		return this.traitMap.values();
	}
	
	getTrait(name) {
		return this.traitMap.get(name);
	}
	
	getAdvDis() {
		return this.advDisMap.values();
	}
	
	getAdvDisChoices() {
		return this.advDisChoiceMap.values();
	}
	
	getEarthRank() {
		let willpower = this.traitMap.get("willpower");
		let stamina = this.traitMap.get("stamina");
		return Math.min(willpower.getTotalRank(), stamina.getTotalRank());
	}
	
	getAirRank() {
		let awareness = this.traitMap.get("awareness");
		let reflexes = this.traitMap.get("reflexes");
		return Math.min(awareness.getTotalRank(), reflexes.getTotalRank());
	}
	
	getFireRank() {
		let intelligence = this.traitMap.get("intelligence");
		let agility = this.traitMap.get("agility");
		return Math.min(intelligence.getTotalRank(), agility.getTotalRank());
	}
	
	getWaterRank() {
		let perception = this.traitMap.get("perception");
		let strength = this.traitMap.get("strength");
		return Math.min(perception.getTotalRank(), strength.getTotalRank());
	}
	
	getVoidRank() {
		let voidTrait = this.traitMap.get("void");
		return voidTrait.getTotalRank();
	}
	
	getEarthInsight() {
		return this.getEarthRank()*10;
	}
	
	getAirInsight() {
		return this.getAirRank()*10;
	}
	
	getFireInsight() {
		return this.getFireRank()*10;
	}
	
	getWaterInsight() {
		return this.getWaterRank()*10;
	}
	
	getVoidInsight() {
		return this.getVoidRank()*10;
	}
	
	getKeywords() {
		return this.keywords;
	}
	
	addKeyword(keyword) {
		this.keywords.push(keyword);
	}
	
	getHonor() {
		return this.honor;
	}
	
	getGlory() {
		return this.glory;
	}
	
	getStatus() {
		return this.status;
	}
	
	getTaint() {
		return this.taint;
	}
	
	setBaseSalary(koku, bu, zeni) {
		this.baseSalaryKoku = koku;
		this.baseSalaryBu = bu;
		this.baseSalaryZeni = zeni;
	}
	
	getYearlySalary() {
		let total = this.baseSalaryKoku * 50 + this.baseSalaryBu * 5 + this.baseSalaryZeni;
		let status = Math.max(1, this.status);
		total = (2 * status * total);
		let zeni = total%10;
		total = (total - zeni)/10;
		let bu = total%5;
		let koku = (total - bu)/5;
		return [koku, bu, zeni];
	}
	
	getMonthlySalary() {
		let total = this.baseSalaryKoku * 50 + this.baseSalaryBu * 5 + this.baseSalaryZeni;
		let status = Math.max(1, this.status);
		total = (2 * status * total)/12;
		let zeni = total%10;
		total = (total - zeni)/10;
		let bu = total%5;
		let koku = (total - bu)/5;
		return [koku, bu, zeni];
	}
	
	getExp() {
		let exp = 0;
		for (const aTrait of this.getTraits()) {
			exp += aTrait.getExp();
		}
		for (const aSkill of this.getSkills()) {
			exp += aSkill.getExp();
		}
		for (const aAdvDis of this.getAdvDis()) {
			exp += aAdvDis.getExp(this.keywords);
		}
		return exp;
	}
	
	getInsight() {
		let insight = 0;
		insight += this.getEarthInsight();
		insight += this.getAirInsight();
		insight += this.getFireInsight();
		insight += this.getWaterInsight();
		insight += this.getVoidInsight();
		for (const aSkill of this.getSkills()) {
			insight += aSkill.getInsight();
		}
		return insight;
	}
	
	getRank() {
		let insight = this.getInsight();
		if(insight < 150) {
			return 1;
		}
		insight -= 150;
		return 1 + insight/25;
	}
  }
