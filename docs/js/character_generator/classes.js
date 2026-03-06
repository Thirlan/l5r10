class Trait {
	constructor(name, base, ring, expRate) {
		this.name = name;
		this.base = base;
		this.ring = ring;
		this.expRate = expRate;
		this.increase = 0;
		this.school = 0;
		this.family = 0;
	}
	
	getTotalRank() {
		return this.base + this.increase + this.school + this.family;
	}
	
	getExp() {
		let startingRank = this.base + this.school + this.family;
		let diff = (this.getTotalRank()*(this.getTotalRank()+1))/2 - (startingRank*(startingRank+1))/2
		return this.expRate*diff;
	}
	
	increaseRank(amount) {
		this.increase += amount;
	}
	
	setSchool(value) {
		this.school = value;
	}
	
	setFamily(value) {
		this.family = value;
	}
}

class Skill {
	constructor(name, type, trait) {
		this.name = name;
		this.type = type;
		this.trait = trait;
		this.rank = 0;
		this.emphasis = [];
		this.schoolRank = 0;
		this.schoolEmphasis = [];
	}
	
	increaseRank(amount) {
		this.rank += amount;
	}
	
	appendEmphasis(value) {
		this.emphasis.push(value);
	}
	
	appendSchoolEmphasis(value) {
		this.schoolEmphasis.push(value)
	}
	
	setSchool(value) {
		this.schoolRank = value;
	}
	
	getTotalRank() {
		return this.rank + this.schoolRank;
	}
	
	getExp() {
		let exp = (this.getTotalRank())*(this.getTotalRank()+1)/2 - (this.schoolRank)*(this.schoolRank+1)/2;
		exp += 2*(this.emphasis.length);
		return exp;
	}
	
	getInsight() {
		let insight = this.getTotalRank();
		insight += (this.emphasis.length + this.schoolEmphasis.length);
		return insight;
	}
}

class AdvDis {
	constructor(name, type, subtype, exp, affinity, detail, page, expAdj = 1) {
		this.name = name;
		this.type = type;
		this.subtype = subtype;
		this.exp = exp;
		this.detail = detail;
		this.affinity = affinity;
		this.page = page;
		this.expAdj = expAdj;
	}
	
	getExp(keywords=[]) {
		let keywordExists = false;
		for(const keyword of keywords) {
			keywordExists |= this.affinity.includes(keyword);
		}
		
		if(keywordExists) {
			if(this.type == "adv") {
				return Math.max(1, this.exp-this.expAdj);
			} else {
				return Math.min(-1, this.exp+this.expAdj);
			}
		} else {
			return this.exp;
		}
	}
}