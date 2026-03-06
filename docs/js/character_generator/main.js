  
// Variable declarations
const form = document.getElementById('characterForm');
const casteSelect = document.getElementById('casteInput');
const clanSelect = document.getElementById('clanInput');
const familySelect = document.getElementById('familyInput');
const schoolSelect = document.getElementById('schoolInput');
const schoolSkillSelect = document.getElementById('schoolSkillInput');
const schoolSkill2Select = document.getElementById('schoolSkill2Input');
const schoolSkill3Select = document.getElementById('schoolSkill3Input');
const maritalSelect = document.getElementById('maritalInput');
const maritalSituationSelect = document.getElementById('maritalSituationInput');
const ageSelect = document.getElementById('ageInput');
const sexSelect = document.getElementById('sexInput');
const skillsTable = document.getElementById('skillsTable');
const statusOutput = document.getElementById('statusOutput');
const gloryOutput = document.getElementById('gloryOutput');
const honorOutput = document.getElementById('honorOutput');
const taintOutput = document.getElementById('taintOutput');
const advTable = document.getElementById('advantagesTableOuput');
const disTable = document.getElementById('disadvantagesTableOuput');

// Helper: Generate random integer inclusive
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

casteSelect.addEventListener('change', function() {
	const selectedCaste = this.value;
	let clans = [];

	switch (selectedCaste) {
	case 'Kuge (Imperial Family and Daimyos)':
	  clans = ['Choose', 'Imperial', 'Crab', 'Crane', 'Dragon', 'Lion', 'Mantis', 'Phoenix', 'Phoenix', 'Scorpion', 'Unicorn'];
	  clanSelect.disabled = false;
	  break;
	case 'Buke (Samurai)':
	  clans = ['Choose', 'Crab', 'Crane', 'Dragon', 'Lion', 'Mantis', 'Phoenix', 'Phoenix', 'Scorpion', 'Unicorn'];
	  clanSelect.disabled = false;
	  break;
	case 'Choose':
	  clans = ['Choose', 'None'];
	  clanSelect.disabled = true;
	  break;
	default:
	  clans = ['Choose', 'None'];
	  clanSelect.disabled = false;
	  break;
	}

	// Clear existing options
	clanSelect.innerHTML = '';

	// Populate new ones
	clans.forEach(fam => {
		const opt = document.createElement('option');
		opt.textContent = fam;
		opt.value = fam;
		clanSelect.appendChild(opt);
	});
});

function schoolSkillMatchAndAdd(character, schoolSkillType, aSchoolSkillSelect) {
	aSchoolSkillSelect.innerHTML = '';
	console.log(schoolSkillType);
	if(schoolSkillType.length > 0) {
		aSchoolSkillSelect.disabled = false;
		const defaultOpt = document.createElement('option');
		defaultOpt.textContent = "Choose";
		defaultOpt.value = "Choose";
		aSchoolSkillSelect.appendChild(defaultOpt);
		for(const aSkill of character.getSkills()) {
			let isAMatch = false;
			for(const aSchoolSkillType of schoolSkillType) {
				if(aSkill.type == aSchoolSkillType) {
					isAMatch = true;
				} else if(aSchoolSkillType == 'any') {
					isAMatch = true;
				} else {
					let prefix = aSkill.name.split("-")[0].trim();
					if (prefix == aSchoolSkillType) {
						isAMatch = true;
					}
				}
			}
			if(isAMatch) {
				const opt = document.createElement('option');
				opt.textContent = aSkill.name;
				opt.value = aSkill.name;
				aSchoolSkillSelect.appendChild(opt);
			}
		}
	} else {
		aSchoolSkillSelect.disabled = true;
		aSchoolSkillSelect.hide = true;
		const defaultOpt = document.createElement('option');
		defaultOpt.textContent = "None";
		defaultOpt.value = "None";
		aSchoolSkillSelect.appendChild(defaultOpt);
	}
}

  clanSelect.addEventListener('change', function() {
	const selectedClan = this.value;
	let families = [];
	let schools = [];

	switch (selectedClan) {
	case 'Crab':
	  families = ['Choose', 'Hida', 'Hiruma', 'Kaiu', 'Kuni', 'Yasuki', 'Toritaka'];
	  schools = ['Choose', 'Hida Bushi', 'Kuni Shugenja', 'Yasuki Courtier', 'Hiruma Bushi'];
	  familySelect.disabled = false;
	  schoolSelect.disabled = false;
	  break;
	case 'Crane':
	  families = ['Choose', 'Asahina', 'Daidoji', 'Doji', 'Kakita'];
	  schools = ['Choose', 'Kakita Bushi', 'Asahina Shugenja', 'Doji Courtier',  'Daidoji Iron Warrior'];
	  familySelect.disabled = false;
	  schoolSelect.disabled = false;
	  break;
	case 'Dragon':
	  families = ['Choose', 'Agasha', 'Kitsuki', 'Mirumoto', 'Togashi', 'Tamori'];
	  schools = ['Choose', 'Mirumoto Bushi', 'Tamori Shugenja', 'Kitsuki Investigator', 'Togashi Tattoed Order', 'Agasha Shugenja' ];
	  familySelect.disabled = false;
	  schoolSelect.disabled = false;
	  break;
	case 'Lion':
	  families = ['Choose', 'Akodo', 'Ikoma', 'Kitsu', 'Matsu'];
	  schools = ['Choose', 'Akodo Bushi', 'Kitsu Shugenja', 'Ikoma Bard School', 'Matsu Berserker'];
	  familySelect.disabled = false;
	  schoolSelect.disabled = false;
	  break;
	case 'Mantis':
	  families = ['Choose', 'Yoritomo', 'Tsuruchi', 'Moshi', 'Kitsune', 'Kumamoto'];
	  schools = ['Choose', 'Yoritomo Bushi', 'Moshi Shugenja', 'Yoritomo Courtier', 'Tsuruchi Archer'];
	  familySelect.disabled = false;
	  schoolSelect.disabled = false;
	  break;
	case 'Phoenix':
	  families = ['Choose', 'Asako', 'Isawa', 'Shiba', 'Agasha'];
	  schools = ['Choose', 'Shiba Bushi', 'Isawa Shugenja', 'Asako Loremaster', 'Agasha Shugenja'];
	  familySelect.disabled = false;
	  schoolSelect.disabled = false;
	  break;
	case 'Scorpion':
	  families = ['Choose', 'Bayushi', 'Shosuro', 'Soshi', 'Yogo'];
	  schools = ['Choose', 'Bayushi Bushi', 'Soshi Shugenja', 'Bayushi Courtier', 'Shosuro Infiltrator'];
	  familySelect.disabled = false;
	  schoolSelect.disabled = false;
	  break;
	case 'Unicorn':
	  families = ['Choose', 'Iuchi', 'Moto', 'Otaku', 'Shinjo', 'Ide'];
	  schools = ['Choose', 'Moto Bushi', 'Iuchi Shugenja', 'Ide Emissary', 'Utaku Battle Maiden'];
	  familySelect.disabled = false;
	  schoolSelect.disabled = false;
	  break;
	case 'Imperial':
	  families = ['Choose', 'Hantei', 'Otomo', 'Seppun', 'Miya'];
	  schools = ['Choose', 'Seppun Guardsman', 'Seppun Shugenja', 'Otomo Courtier', 'Miya Herald' ];
	  familySelect.disabled = false;
	  schoolSelect.disabled = false;
	  break;
	case 'Monk':
	  families = ['None'];
	  schools = ['Choose', 'The Four Temples Monk', 'Order of the Heroes', 'Shrine of the Seven Thunders', 'Temple of Kaimetsu-uo', 'Temple of Osano-Wo', 'Temples of the Thousand Fortunes' ];
	  familySelect.disabled = true;
	  schoolSelect.disabled = false;
	  break;
	case 'Ronin':
	  families = ['None'];
	  schools = ['Choose', 'Disciples of Sun Tao', 'Forest Killers', 'Tawagoto\'s Army', 'Tengoku\'s Justice', 'Tessen'];
	  familySelect.disabled = true;
	  schoolSelect.disabled = false;
	  break;
	case 'None':
	default:
	  families = ['None'];
	  schools = ['Choose', 'Peasant', 'Thief', 'Bandit', 'Merchant', 'Geisha', 'Gaijin Warrior', 'Gaijin Diplomat', 'Gaijin Merchant'];
	  familySelect.disabled = true;
	  schoolSelect.disabled = false;
	  break;
	}

	// Clear existing options
	familySelect.innerHTML = '';
	schoolSelect.innerHTML = '';

	// Populate new ones
	families.forEach(fam => {
		const opt = document.createElement('option');
		opt.textContent = fam;
		opt.value = fam;
		familySelect.appendChild(opt);
	});
	
	// Populate new ones
	schools.forEach(fam => {
		const opt = document.createElement('option');
		opt.textContent = fam;
		opt.value = fam;
		schoolSelect.appendChild(opt);
	});
});

	schoolSelect.addEventListener('change', function() {
		schoolSkillSelect.disabled = false;
		let character = new CharacterSheet();
		let schoolSkillType1 = [];
		let schoolSkillType2 = [];
		let schoolSkillType3 = [];
		switch(schoolSelect.value) {
			case 'Hida Bushi':
				schoolSkillType1 = ["bugei"];
				break;
			case 'Kuni Shugenja':
				schoolSkillType1 = ["weapon"];
				break;
			case 'Yasuki Courtier':
				schoolSkillType1 = ["merchant"];
				break;
			case 'Hiruma Bushi':
				schoolSkillType1 = ["any"];
				break;
			case 'Kakita Bushi':
				schoolSkillType1 = ["bugei", "high"];
				break;
			case 'Asahina Shugenja':
				schoolSkillType1 = ["high"];
				schoolSkillType2 = ["artisan"];
				break;
			case 'Doji Courtier':
				schoolSkillType1 = ["artisan", "perform"];
				break;
			case 'Daidoji Iron Warrior':
				schoolSkillType1 = ["any"];
				break;
			case 'Mirumoto Bushi':
				schoolSkillType1 = ["bugei", "high"];
				break;
			case 'Tamori Shugenja':
				schoolSkillType1 = [];
				break;
			case 'Kitsuki Investigator':
				schoolSkillType1 = ["lore"];
				break;
			case 'Togashi Tattoed Order':
				schoolSkillType1 = ["lore"];
				schoolSkillType2 = ["high", "bugei", "merchant"];
				break;
			case 'Akodo Bushi':
				schoolSkillType1 = ["bugei", "high"];
				break;
			case 'Kitsu Shugenja':
				schoolSkillType1 = ["bugei", "high"];
				break;
			case 'Ikoma Bard School':
				schoolSkillType1 = ["high"];
				schoolSkillType2 = ["bugei"];
				break;
			case 'Matsu Berserker':
				schoolSkillType1 = ["bugei"];
				schoolSkillType2 = ["bugei"];
				break;
			case 'Yoritomo Bushi':
				schoolSkillType1 = ["any"];
				break;
			case 'Moshi Shugenja':
				schoolSkillType1 = ["high", "bugei"];
				schoolSkillType2 = ["high", "bugei"];
				break;
			case 'Yoritomo Courtier':
				schoolSkillType1 = ["merchant", "lore"];
				break;
			case 'Tsuruchi Archer':
				schoolSkillType1 = ["bugei", "high"];
				break;
			case 'Shiba Bushi':
				schoolSkillType1 = ["bugei", "high"];
				break;
			case 'Isawa Shugenja':
				schoolSkillType1 = ["lore"];
				schoolSkillType2 = ["high"];
				break;
			case 'Asako Loremaster':
				schoolSkillType1 = ["lore"];
				break;
			case 'Agasha Shugenja':
				schoolSkillType1 = ["craft"];
				schoolSkillType2 = ["bugei", "high"];
				break;
			case 'Bayushi Bushi':
				schoolSkillType1 = ["any"];
				break;
			case 'Soshi Shugenja':
				schoolSkillType1 = ["any"];
				break;
			case 'Bayushi Courtier':
				schoolSkillType1 = ["high"];
				break;
			case 'Shosuro Infiltrator':
				schoolSkillType1 = ["any"];
				break;
			case 'Moto Bushi':
				schoolSkillType1 = ["bugei"];
				schoolSkillType2 = ["any"];
				break;
			case 'Iuchi Shugenja':
				schoolSkillType1 = ["bugei", "high"];
				break;
			case 'Ide Emissary':
				schoolSkillType1 = ["high", "perform"];
				break;
			case 'Utaku Battle Maiden':
				schoolSkillType1 = ["bugei", "high"];
				break;
			case 'Seppun Guardsman':
				schoolSkillType1 = ["high"];
				break;
			case 'Seppun Shugenja':
				schoolSkillType1 = ["bugei", "high"];
				break;
			case 'Otomo Courtier':
				schoolSkillType1 = ["high"];
				break;
			case 'Miya Herald':
				schoolSkillType1 = ["bugei", "high"];
				break;
			case'The Four Temples Monk':
				schoolSkillType1 = ["any"];
				schoolSkillType2 = ["any"];
				break;
			case 'Order of the Heroes':
				schoolSkillType1 = ["any"];
				schoolSkillType2 = ["any"];
				break;
			case 'Shrine of the Seven Thunders':
				schoolSkillType1 = ["lore"];
				schoolSkillType2 = ["any"];
				schoolSkillType3 = ["any"];
				break;
			case 'Temple of Kaimetsu-uo':
				schoolSkillType1 = ["any"];
				schoolSkillType2 = ["any"];
				schoolSkillType3 = ["any"];
				break;
			case 'Temple of Osano-Wo':
				schoolSkillType1 = ["bugei"];
				schoolSkillType2 = ["bugei"];
				break;
			case 'Temples of the Thousand Fortunes':
				schoolSkillType1 = ["lore"];
				schoolSkillType2 = ["any"];
				schoolSkillType3 = ["any"];
				break;
			case 'Disciples of Sun Tao':
				schoolSkillType1 = ["any"];
				schoolSkillType2 = ["any"];
				break;
			case 'Forest Killers':
				schoolSkillType = ["weapon"];
				break;
			case 'Tawagoto\'s Army':
				schoolSkillType = ["any"];
				break;
			case 'Tengoku\'s Justice':
				schoolSkillType = ["any"];
				break;
			case 'Tessen':
				schoolSkillType1 = ["any"];
				schoolSkillType2 = ["any"];
				break;
			default:
				// none
				break;
		}
		
		schoolSkillMatchAndAdd(character, schoolSkillType1, schoolSkillSelect);
		schoolSkillMatchAndAdd(character, schoolSkillType2, schoolSkill2Select);
		schoolSkillMatchAndAdd(character, schoolSkillType3, schoolSkill3Select);
	});
	
	maritalSelect.addEventListener('change', function() {
		switch(maritalSelect.value) {
		case 'Married':
			form.maritalSituationInput.disabled = false;
			form.imperialSpouseInput.disabled = false;
			form.dependantSpouseInput.disabled = false;
		case 'Divorced':
		case 'Widowed':
			form.spouseFamilyInput.disabled = false;
			break;
		default:
			form.maritalSituationInput.disabled = true;
			form.imperialSpouseInput.disabled = true;
			form.imperialSpouseInput.checked = false;
			form.dependantSpouseInput.disabled = true;
			form.dependantSpouseInput.checked = false;
			form.spouseFamilyInput.value = "";
			form.spouseFamilyInput.disabled = true;
			break;
		}
	});
	
	ageSelect.addEventListener('change', function() {
		const ageSelection = document.getElementById('ageInput').value;
		let randomAge = 0;

		switch (ageSelection) {
		case 'Teenager (13 to 16)':
		  randomAge = getRandomInt(13, 16);
		  break;
		case 'Gempukku (16 to 18)':
		  randomAge = getRandomInt(16, 18);
		  break;
		case 'Adult (18 to 24)':
		  randomAge = getRandomInt(18, 24);
		  break;
		case 'Senior (24 to 40)':
		  randomAge = getRandomInt(24, 40);
		  break;
		case 'Venerable (40+)':
		  randomAge = getRandomInt(41, 80);
		  break;
		default:
		  randomAge = getRandomInt(18, 24);
		  break;
		}
		// Output to table
		document.getElementById('ageOutput').textContent = randomAge;
  });

// === Generate random given name based on gender ===
sexSelect.addEventListener('change', function() {
  const sex = document.getElementById('sexInput').value;
  let name = "";

  // 500 male names
  const maleNames = [
    "Akira","Haruto","Takeshi","Ryu","Daichi","Masaru","Kenta","Hiroshi","Kenji","Ren",
    "Shinji","Taro","Isamu","Katsuro","Makoto","Kazuki","Souta","Naoki","Taichi","Riku",
    "Yuji","Hajime","Satoshi","Jun","Daisuke","Koji","Ryo","Kazuya","Tomo","Sho",
    "Takumi","Eiji","Haru","Ryota","Kyo","Arata","Minato","Keisuke","Masato","Shun",
    "Yuto","Rento","Hayato","Itsuki","Reo","Shogo","Yusuke","Koki","Hiroto","Kouhei",
    "Tsubasa","Renji","Kenshin","Rintaro","Tatsuya","Haruki","Yuma","Rion","Noboru","Seiji",
    "Masaki","Yuuta","Toru","Naoya","Kisho","Kouta","Shoma","Kenta","Keita","Haruya",
    "Kanon","Mitsuo","Masahiro","Ryusei","Takeru","Junpei","Hitoshi","Tadashi","Ichiro","Yoshinori",
    "Kyohei","Takashi","Manabu","Ryohei","Kensuke","Kazuto","Atsushi","Hideki","Ken","Akihiko",
    "Shiro","Takao","Kiyoshi","Ryunosuke","Kaito","Masaki","Hikaru","Hajime","Shin","Nobu",
    "Tomoaki","Yoshiki","Kazuhiro","Keiji","Rikuto","Kento","Naoto","Hayashi","Soma","Masayuki",
    "Takuto","Ryuhei","Toruya","Kyoji","Haruya","Yoshito","Tatsuo","Kenzo","Rintarou","Issei",
    "Renya","Yutaro","Ryusei","Tetsuya","Hiroya","Shion","Ryuto","Eita","Tatsuki","Hiroki",
    "Haruaki","Naoki","Kenta","Takanori","Shoji","Toshio","Shinsuke","Kiyota","Yamato","Keisai",
    "Yugo","Ryunosuke","Rihito","Kosei","Shohei","Taiga","Rion","Yuma","Kengo","Aran",
    "Shouma","Renpei","Masato","Daigo","Sora","Hayuma","Toshiki","Itsuo","Shuji","Renya",
    "Soutaro","Takahiro","Aoi","Shunpei","Naohiro","Ryuto","Taketo","Toshihiro","Hiroya","Souta",
    "Takuya","Katsuo","Ritsuki","Yamato","Kazuma","Kenta","Akito","Tomoki","Koki","Yuuki",
    "Ryoji","Jiro","Mikio","Katsumi","Seiichi","Shinya","Koichi","Yujiro","Naohiko","Atsuo",
    "Kento","Yutaka","Satoru","Hironori","Masaki","Rin","Hirofumi","Toru","Kiyoshi","Shoichiro",
    "Yasuhiro","Takuma","Kohei","Taiki","Keita","Daigo","Yoshio","Kenshiro","Kaito","Katsuhiko",
    "Toshi","Souta","Hiro","Shiori","Ryoji","Naoya","Eisuke","Riki","Hayato","Souto",
    "Rento","Reiji","Kyohei","Ryoichi","Kota","Haruya","Masafumi","Rinpei","Taketo","Tetsuro",
    "Kouji","Hitoshi","Yoshinobu","Taku","Aran","Taichi","Renpei","Sota","Junki","Kaito",
    "Rikuya","Hayuma","Ryuichi","Takao","Shinya","Shogo","Haruya","Kazu","Masaya","Kento",
    "Soutarou","Shinsuke","Haru","Tsubasa","Yoshihiro","Shogo","Akihiko","Tetsuya","Kaito","Toru",
    "Naoki","Issei","Masashi","Kenzo","Rintaro","Shohei","Ryuhei","Yutaro","Takuto","Rikuto",
    "Kyoji","Masayuki","Takanori","Tatsuya","Naohiro","Ryu","Haruki","Keisuke","Itsuki","Kento",
    "Haruya","Renya","Souta","Ryusei","Shoma","Yuji","Kouhei","Ren","Ryo","Daisuke",
    "Hajime","Takumi","Kenta","Eiji","Shinji","Akira","Haruto","Ryu","Masaru","Takeshi",
    "Kenji","Katsuro","Makoto","Isamu","Kazuya","Naoki","Taichi","Riku","Yuji","Satoshi",
    "Jun","Koji","Ryo","Tomo","Sho","Takumi","Haru","Kyo","Minato","Keisuke",
    "Masato","Shun","Yuto","Rento","Hayato","Itsuki","Reo","Shogo","Yusuke","Koki",
    "Hiroto","Kouhei","Tsubasa","Renji","Kenshin","Rintaro","Tatsuya","Haruki","Yuma","Rion",
    "Seiji","Masaki","Yuuta","Toru","Naoya","Kisho","Kouta","Shoma","Kenta","Keita",
    "Mitsuo","Masahiro","Ryusei","Takeru","Junpei","Hitoshi","Tadashi","Ichiro","Yoshinori","Kyohei",
    "Takashi","Manabu","Ryohei","Kensuke","Kazuto","Atsushi","Hideki","Ken","Akihiko","Shiro",
    "Takao","Kiyoshi","Ryunosuke","Kaito","Masaki","Hikaru","Hajime","Shin","Nobu","Tomoaki",
    "Yoshiki","Kazuhiro","Keiji","Rikuto","Kento","Naoto","Hayashi","Soma","Masayuki","Takuto",
    "Ryuhei","Toruya","Kyoji","Haruya","Yoshito","Tatsuo","Kenzo","Rintarou","Issei","Renya"
  ];

  // 500 female names
  const femaleNames = [
    "Aiko","Hana","Yumi","Rei","Emi","Naoko","Sayuri","Mika","Keiko","Ayame",
    "Chie","Sakura","Tomoe","Haruka","Rin","Mio","Nanami","Mei","Aya","Hinata",
    "Riko","Yua","Hikari","Eri","Koharu","Miyu","Asuka","Kaori","Saki","Mai",
    "Ami","Yuka","Yoko","Rina","Nozomi","Nana","Miku","Misaki","Airi","Nao",
    "Erika","Yume","Mari","Aya","Risa","Kanon","Hina","Kotone","Yuina","Megumi",
    "Reina","Sayaka","Manami","Ayaka","Kaho","Nene","Hiyori","Chinatsu","Arisa","Riko",
    "Yuria","Aina","Sumire","Aika","Momoka","Yuna","Maho","Natsuki","Chika","Riko",
    "Miyuki","Haruna","Rena","Mayu","Shiori","Suzu","Yoshino","Ayumi","Rika","Mio",
    "Hanae","Satsuki","Noa","Aya","Mina","Kokoro","Hitomi","Ema","Yui","Akane",
    "Kayo","Midori","Reiko","Tamaki","Sayako","Chiyo","Matsuri","Noriko","Takako","Ai",
    "Yoko","Haru","Misa","Yoshiko","Misato","Kiyomi","Ayano","Michiru","Kana","Miho",
    "Fumika","Junko","Sana","Yura","Ami","Natsumi","Minami","Nanaho","Asami","Chisato",
    "Atsuko","Mari","Saori","Satomi","Miki","Kazumi","Hikaru","Aina","Ayane","Yuzuki",
    "Yume","Akari","Mika","Airi","Honoka","Miu","Aki","Mami","Nao","Yuzuna",
    "Mizuki","Emika","Harumi","Eiko","Yuriko","Kumiko","Ayumi","Chikako","Sayaka","Yoko",
    "Yoshie","Tamayo","Naomi","Harue","Reina","Miyako","Yoko","Kaede","Ayaka","Miharu",
    "Tsubaki","Sumire","Yuki","Arisa","Himeka","Miyu","Shizuku","Aya","Airi","Saki",
    "Misaki","Noa","Kaho","Nana","Mai","Riko","Ema","Hana","Ami","Yuna",
    "Sakura","Aoi","Hinata","Nene","Akane","Rin","Riko","Rei","Mio","Hiyori",
    "Rika","Miku","Aya","Ayumi","Sayaka","Mio","Rin","Hana","Airi","Miyu",
    "Mei","Yui","Hina","Kaori","Asuka","Aya","Chie","Tomoe","Reina","Yuna",
    "Riko","Miyuki","Mayu","Hiyori","Noa","Miku","Aika","Mio","Natsuki","Misaki",
    "Hana","Saki","Aya","Rina","Riko","Hina","Yua","Mei","Airi","Miyu",
    "Ayaka","Riko","Nene","Rin","Mio","Yuna","Hana","Kanon","Rei","Mika",
    "Aya","Sayuri","Yuki","Mio","Hiyori","Nene","Reina","Aoi","Hina","Riko",
    "Rika","Miyu","Hana","Mio","Ayaka","Aya","Airi","Riko","Reina","Mio",
    "Misaki","Yuna","Hinata","Aya","Rin","Hiyori","Aoi","Riko","Saki","Aya",
    "Mio","Reina","Hina","Miyu","Riko","Hana","Nene","Aya","Rin","Mio",
    "Rei","Yuna","Airi","Hiyori","Riko","Mio","Aya","Hina","Reina","Riko",
    "Mio","Hana","Airi","Yuna","Reina","Hiyori","Aya","Riko","Mio","Nene",
    "Aoi","Rin","Reina","Aya","Riko","Hina","Hana","Mio","Airi","Rei",
    "Yuna","Nene","Riko","Aya","Miyu","Riko","Rin","Reina","Aya","Mio",
    "Riko","Airi","Yuna","Hiyori","Reina","Aya","Rin","Mio","Riko","Nene",
    "Hana","Aoi","Rin","Aya","Mio","Reina","Riko","Yuna","Airi","Hina",
    "Rei","Rin","Aya","Mio","Hiyori","Riko","Reina","Aya","Hana","Airi",
    "Riko","Mio","Reina","Aya","Yuna","Rin","Nene","Mio","Reina","Riko",
    "Aya","Hiyori","Airi","Hana","Reina","Rin","Aya","Mio","Riko","Hiyori",
    "Reina","Aya","Rin","Mio","Riko","Airi","Hiyori","Yuna","Aya","Riko",
    "Reina","Mio","Rin","Aya","Riko","Hana","Airi","Yuna","Reina","Mio",
    "Rin","Aya","Riko","Hina","Airi","Reina","Mio","Rin","Aya","Riko",
    "Yuna","Airi","Reina","Aya","Rin","Mio","Riko","Hiyori","Aya","Riko",
    "Reina","Mio","Airi","Yuna","Aya","Riko","Hina","Rin","Reina","Aya",
    "Mio","Riko","Hana","Airi","Rei","Yuna","Aya","Rin","Mio","Reina",
    "Riko","Airi","Aya","Rin","Mio","Hiyori","Reina","Aya","Riko","Mio"
  ];

  if (sex === "Male") {
    name = maleNames[getRandomInt(0, maleNames.length - 1)];
	form.facialHairInput.disabled = false;
  } else {
    name = femaleNames[getRandomInt(0, femaleNames.length - 1)];
	form.facialHairInput.disabled = true;
  }

  document.getElementById('nameOutput').textContent = name;
});


// === MBTI Personality Generator ===
function generatePersonalityDescription() {

  const ei = document.getElementById("eiInput").value;
  const si = document.getElementById("siInput").value;
  const tf = document.getElementById("tfInput").value;
  const jp = document.getElementById("jpInput").value;
  
  if (ei == "Choose" || si == "Choose" || tf == "Choose" || jp == "Choose") {
	return;
	}

  // Convert dropdowns to MBTI letters
  const e = ei === "Extraversion" ? "E" : "I";
  const s = si === "Sensing" ? "S" : "N";
  const t = tf === "Thinking" ? "T" : "F";
  const j = jp === "Judging" ? "J" : "P";
  const mbti = `${e}${s}${t}${j}`;

  // Descriptions for each MBTI type
  const descriptions = {
    "ISTJ": "Responsible, detail-oriented, and dependable. Values duty and tradition.",
    "ISFJ": "Warm, conscientious, and loyal. Strives to protect and serve others quietly.",
    "INFJ": "Idealistic and insightful. Guided by strong principles and empathy.",
    "INTJ": "Strategic, independent, and visionary. Excels at long-term planning.",
    "ISTP": "Practical and adaptable. Solves problems with calm logic under pressure.",
    "ISFP": "Gentle, artistic, and reserved. Appreciates harmony and personal freedom.",
    "INFP": "Creative and deeply idealistic. Driven by inner values and compassion.",
    "INTP": "Analytical and curious. Enjoys exploring complex ideas and systems.",
    "ESTP": "Energetic and bold. Thrives on excitement and quick action.",
    "ESFP": "Lively, spontaneous, and sociable. Enjoys living in the moment.",
    "ENFP": "Charismatic and imaginative. Seeks inspiration and new possibilities.",
    "ENTP": "Inventive, clever, and outspoken. Loves to debate and innovate.",
    "ESTJ": "Organized, assertive, and efficient. Natural leader with strong work ethic.",
    "ESFJ": "Caring, responsible, and cooperative. Values harmony and social order.",
    "ENFJ": "Charismatic and empathetic. Inspires others with passion and understanding.",
    "ENTJ": "Commanding, strategic, and decisive. Natural leader who drives change."
  };

  // Choose the description or a default message
  const description = descriptions[mbti] || "Unique blend of traits. Balanced and adaptable personality.";

  // Update output section
  document.getElementById("personalityOutput").textContent = `${mbti} — ${description}`;
}

// === Listen for any change in MBTI dropdowns ===
document.getElementById("eiInput").addEventListener("change", generatePersonalityDescription);
document.getElementById("siInput").addEventListener("change", generatePersonalityDescription);
document.getElementById("tfInput").addEventListener("change", generatePersonalityDescription);
document.getElementById("jpInput").addEventListener("change", generatePersonalityDescription);
  
  const updateOutput = () => {
	
	let character = new CharacterSheet();
	
	// Size
	switch(form.sizeInput.value) {
	case 'Large':
		character.addAdvDis("large");
		break;
	case 'Small':
		character.addAdvDis("small");
		break;
	case 'Average':
	default:
		// Nothing
		break;
	}
	
	// Education level
	switch (form.educationInput.value) {
	case 'Exceptional':
		character.increaseSkill("lore - heraldry", 1);
		character.increaseSkill("commerce", 1);
	case 'Above Average':
		character.increaseSkill("calligraphy", 1);
		switch (form.clanInput.value.toLowerCase()) {
		case 'crab':
			character.increaseSkill("lore - crab", 1);
			break;
		case 'crane':
			character.increaseSkill("lore - crane", 1);
			break;
		case 'dragon':
			character.increaseSkill("lore - dragon", 1);
			break;
		case 'lion':
			character.increaseSkill("lore - lion", 1);
			break;
		case 'mantis':
			character.increaseSkill("lore - mantis", 1);
			break;
		case 'phoenix':
			character.increaseSkill("lore - phoenix", 1);
			break;
		case 'scorpion':
			character.increaseSkill("lore - scorpion", 1);
			break;
		case 'unicorn':
			character.increaseSkill("lore - unicorn", 1);
			break;
		default:
			break;
		}
	case 'Average':
		character.increaseSkill("lore - history", 1);
	case 'Basic':
		character.increaseSkill("etiquette", 1);
	case 'None':
	default:
		// Nothing
	  break;
	}
	
	// hobby
	switch (form.hobbyInput.value) {
	case 'Animal Handling - Horses':
		character.increasePreferredSkill("animal handling", 2, "horses");
		break;
	case 'Animal Handling - Falcons':
		character.increasePreferredSkill("animal handling", 2, "falcons");
		break;
	case 'Animal Handling - Big Cats':
		character.increasePreferredSkill("animal handling", 2, "big cats");
		break;
	case 'Artisan - Bonsai':
		character.increasePreferredSkill("artisan - bonsai", 2, "bonsai");
		break;
	case 'Artisan - Gardening':
		character.increasePreferredSkill("artisan - gardening", 2, "gardening");
		break;
	case 'Artisan - Ikebana':
		character.increasePreferredSkill("artisan - ikebana", 2, "ikebana");
		break;
	case 'Artisan - Origami':
		character.increasePreferredSkill("artisan - origami", 2, "origami");
		break;
	case 'Artisan - Painting':
		character.increasePreferredSkill("artisan - painting", 2, "painting");
		break;
	case 'Artisan - Poetry':
		character.increasePreferredSkill("artisan - poetry", 2, "poetry");
		break;
	case 'Artisan - Sculpture':
		character.increasePreferredSkill("artisan - sculpture", 2, "sculpture");
		break;
	case 'Artisan - Tatooing':
		character.increasePreferredSkill("artisan - tatooing", 2, "tatooing");
		break;
	case 'Athletics - Climbing':
		character.increasePreferredSkill("athletics", 2, "climbing");
		break;
	case 'Athletics - Running':
		character.increasePreferredSkill("athletics", 2, "running");
		break;
	case 'Athletics - Swimming':
		character.increasePreferredSkill("athletics", 2, "swimming");
		break;
	case 'Athletics - Throwing':
		character.increasePreferredSkill("athletics", 2, "throwing");
		break;
	case 'Calligraphy - Cipher (include Commerce - Mathematics)':
		character.increasePreferredSkill("calligraphy", 1, "cipher");
		character.increasePreferredSkill("commerce", 1, "mathematics");
		break;
	case 'Calligraphy - High Rokugani':
		character.increasePreferredSkill("calligraphy", 1, "high rokugani");
		break;
	case 'Commerce - Mathematics':
		character.increasePreferredSkill("commerce", 2, "mathematics");
		break;
	case 'Craft - Cooking':
		character.increasePreferredSkill("craft - cooking", 2, "cooking");
		break;
	case 'Craft - Fishing':
		character.increasePreferredSkill("craft - fishing", 2, "fishing");
		break;
	case 'Craft - Pottery':
		character.increasePreferredSkill("craft - pottery", 2, "pottery");
		break;
	case 'Craft - Tailoring':
		character.increasePreferredSkill("craft - tailoring", 2, "tailoring");
		break;
	case 'Divination - Astrology':
		character.increasePreferredSkill("divination", 2, "astrology");
		break;
	case 'Divination - Kawaru':
		character.increasePreferredSkill("divination", 2, "kawaru");
		break;
	case 'Drinking (disadvantage Compulsion)':
		character.addAdvDis("compulsion - 2", "alcoholic");
		break;
	case 'Gambling (disadvantage Compulsion)':
		character.addAdvDis("compulsion - 2", "gambling");
		break;
	case 'Games - Kemari':
		character.increasePreferredSkill("games - kemari", 2, "kemari");
		break;
	case 'Games - Fortunes & Winds':
		character.increasePreferredSkill("games - fortunes & winds", 2, "fortunes & winds");
		break;
	case 'Games - Go':
		character.increasePreferredSkill("games - go", 2, "go");
		break;
	case 'Games - Letters':
		character.increasePreferredSkill("games - letters", 2, "letters");
		break;
	case 'Games - Sadane':
		character.increasePreferredSkill("games - sadane", 2, "sadane");
		break;
	case 'Games - Shogi':
		character.increasePreferredSkill("games - shogi", 2, "shogi");
		break;
	case 'Horsemanship - Rokugani Pony (include animal handling - horse)':
		character.increasePreferredSkill("horsemanship", 1, "rokugani pony");
		character.increasePreferredSkill("animal handling", 1, "horse");
		break;
	case 'Horsemanship - Gaijin Riding Horse (include animal handling - horse)':
		character.increasePreferredSkill("horsemanship", 1, "gaijin riding horse");
		character.increasePreferredSkill("animal handling", 1, "horse");
		break;
	case 'Horsemanship - Utaku Steed (include animal handling - horse)':
		character.increasePreferredSkill("horsemanship", 1, "utaku steed");
		character.increasePreferredSkill("animal handling", 1, "horse");
		break;
	case 'Hunting':
		character.increasePreferredSkill("hunting", 2, "tracking");
		break;
	case 'Intimidation - Torture (include disadvantage Fascination)':
		character.increasePreferredSkill("intimidation", 2, "torture");
		character.addAdvDis("fascination", "torture");
		break;
	case 'Jiujutsu - Grappling':
		character.increasePreferredSkill("jiujutsu", 2, "grappling");
		break;
	case 'Jiujutsu - Martial Arts':
		character.increasePreferredSkill("jiujutsu", 2, "martial arts");
		break;
	case 'Kyujutsu - Dai-Kyu':
		character.increasePreferredSkill("kyujutsu", 2, "dai-kyu");
		break;
	case 'Kyujutsu - Yumi (include Horsemanship)':
		character.increasePreferredSkill("kyujutsu", 1, "yumi");
		character.increasePreferredSkill("horsemanship", 1);
		break;
	case 'Medicine - Herbalism':
		character.increasePreferredSkill("medicine", 2, "herbalism");
		break;
	case 'Meditation':
		character.increasePreferredSkill("meditation", 2, "fasting");
		break;
	case 'Lore - Anatomy (include disadvantage Fascination)':
		character.increasePreferredSkill("lore - anatomy", 2, "anatomy");
		character.addAdvDis("fascination", "anatomy");
		break;
	case 'Lore - Architecture':
		character.increasePreferredSkill("lore - architecture", 2, "architecture");
		break;
	case 'Lore - Bushido':
		character.increasePreferredSkill("lore - bushido", 2, "bushido");
		break;
	case 'Lore - Elements':
		character.increasePreferredSkill("lore - elements", 2, "elements");
		break;
	case 'Lore - Ghosts':
		character.increasePreferredSkill("lore - ghosts", 2, "ghosts");
		break;
	case 'Lore - Nature':
		character.increasePreferredSkill("lore - nature", 2, "nature");
		break;
	case 'Lore - Heraldry':
		character.increasePreferredSkill("lore - heraldry", 2, "heraldry");
		break;
	case 'Lore - History':
		character.increasePreferredSkill("lore - history", 2, "history");
		break;
	case 'Lore - Spirit Realms':
		character.increasePreferredSkill("lore - spirit realms", 2, "spirit realms");
		break;
	case 'Lore - Theology':
		character.increasePreferredSkill("lore - theology", 2, "theology");
		break;
	case 'Perform - Biwa':
		character.increasePreferredSkill("perform - biwa", 2, "biwa");
		break;
	case 'Perform - Dance':
		character.increasePreferredSkill("perform - dance", 2, "dance");
		break;
	case 'Perform - Drums':
		character.increasePreferredSkill("perform - drums", 2, "drums");
		break;
	case 'Perform - Puppeteer':
		character.increasePreferredSkill("perform - puppeteer", 2, "puppeteer");
		break;
	case 'Perform - Shamisen':
		character.increasePreferredSkill("perform - shamisen", 2, "shamisen");
		break;
	case 'Perform - Song':
		character.increasePreferredSkill("perform - song", 2, "song");
		break;
	case 'Perform - Storytelling':
		character.increasePreferredSkill("perform - storytelling", 2, "storytelling");
		break;
	case 'Sleight of Hands - Prestidigitation':
		character.increasePreferredSkill("sleight of hands", 2, "prestidigitation");
		break;
	case 'Tea Ceremony':
		character.increasePreferredSkill("tea ceremony", 2);
		break;
	case 'Temptation - Seduction (include disadvantage Lechery)':
		character.increasePreferredSkill("temptation", 2, "seduction");
		character.addAdvDis("lechery");
		break;
	default:
		break;
	}
	
	// Clan
	if(form.clanInput.value != "Choose" && form.clanInput.value != "None") {
		character.addKeyword(form.clanInput.value.toLowerCase());
	}
	
	// Family Trait
	switch (form.familyInput.value) {
	case "Hida":
	case "Matsu":
		character.setFamilyTrait("strength", 1);
	  break;
	
	case "Hiruma":
	case "Kakita":
	case "Mirumoto":
	case "Akodo":
	case "Bayushi":
	case "Moto":
	case "Seppun":
		character.setFamilyTrait("agility", 1);
	  break;
	case "Togashi":
	case "Shinjo":
	case "Miya":
		character.setFamilyTrait("reflexes", 1);
	  break;
	case "Daidoji":
	case "Yoritomo":
	case "Kumamoto":
	case "Utaku":
		character.setFamilyTrait("stamina", 1);
	  break;
	
	case "Kaiu":
	case "Kuni":
	case "Asahina":
	case "Kitsu":
	case "Moshi":
	case "Soshi":
	case "Iuchi":
	case "Otomo":
		character.setFamilyTrait("intelligence", 1);
	  break;
	  
	case "Toritaka":
	case "Agasha":
	case "Shiba":
	case "Tsuruchi":
	case "Ide":
		character.setFamilyTrait("perception", 1);
	  break;
	
	case "Yasuki":
	case "Doji":
	case "Asako":
	case "Kitsune":
	case "Shosuro":
	case "Ikoma":
	case "Kitsuki":
		character.setFamilyTrait("awareness", 1);
	  break;
	
	case "Isawa":
	case "Tamori":
	case "Yogo":
		character.setFamilyTrait("willpower", 1);
	  break;
	  
	case "Hantei":
		character.setFamilyTrait("void", 1);
	  break;
	  
	default:
		// Nothing
	  break;
	}
	
	// Marriage
	switch(maritalSituationSelect.value) {
	case 'Bitter Betrothal':
	character.addAdvDis("bitter betrothal");
		break;
	case 'Blissful Betrothal':
	character.addAdvDis("blissful betrothal");
		break;
	default:
		// Nothing
		break;
	}
	
	if(form.imperialSpouseInput.checked) {
		character.addAdvDis("imperial spouse");
	}
	
	console.log(form.dependantSpouseInput.checked);
	if(form.dependantSpouseInput.checked) {
		character.addAdvDis("dependant - 2", "spouse");
	}
	
	if(form.dependantParentsInput.checked) {
		character.addAdvDis("dependant - 4", "parent");
	}
	
	if(form.dependantChildInput.checked) {
		character.addAdvDis("dependant - 6", "child");
	}
	
	// wealth
	if(form.wealthInput.value != "Choose") {
		character.addAdvDis(form.wealthInput.value);
	}
	
	// gentry
	if(form.gentryInput.value != "Choose") {
		character.addAdvDis(form.gentryInput.value);
	}
	
	// Character Flaws
	if(form.characterFlawInput.value != 'Choose') {
		character.addAdvDis(form.characterFlawInput.value);
	}
	
	// Weapon
	if(form.weaponInput.value != 'Choose') {
		character.increasePreferredSkill(form.weaponInput.value, 1);
	}
	
	// school
	switch (form.schoolInput.value) {
	case 'Hida Bushi':
		character.addKeyword("bushi");
		character.setSchoolTrait("stamina", 1);
		character.setSchoolSkill("athletics", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("heavy weapons", 1, "tetsubo");
		character.setSchoolSkill("intimidation", 1);
		character.setSchoolSkill("kenjutsu", 1);
		character.setSchoolSkill("lore - shadowlands", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 3.5;
		character.setBaseSalary(3, 0, 0);
		break;
	case 'Kuni Shugenja':
		character.addKeyword("shugenja");
		character.setSchoolTrait("willpower", 1);
		character.setSchoolSkill("calligraphy", 1, "cipher");
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("lore - shadowlands", 2);
		character.setSchoolSkill("lore - theology", 1);
		character.setSchoolSkill("spellcraft", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 2.5;
		character.setBaseSalary(3, 0, 0);
		break;
	case 'Yasuki Courtier':
		character.addKeyword("courtier");
		character.setSchoolTrait("perception", 1);
		character.setSchoolSkill("commerce", 1, "appraisal");
		character.setSchoolSkill("courtier", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("etiquette", 1);
		character.setSchoolSkill("intimidation", 1);
		character.setSchoolSkill("sincerity", 1, "deceit");
		character.status = 1;
		character.glory = 1;
		character.honor = 2.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Hiruma Bushi':
		character.addKeyword("bushi");
		character.setSchoolTrait("willpower", 1);
		character.setSchoolSkill("athletics", 1);
		character.setSchoolSkill("hunting", 1);
		character.setSchoolSkill("kenjutsu", 1, "katana");
		character.setSchoolSkill("kyujutsu", 1);
		character.setSchoolSkill("lore - shadowlands", 1);
		character.setSchoolSkill("stealth", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 4.5;
		character.setBaseSalary(3, 0, 0);
		break;
	case 'Kakita Bushi':
		character.addKeyword("bushi");
		character.setSchoolTrait("reflexes", 1);
		character.setSchoolSkill("etiquette", 1);
		character.setSchoolSkill("iaijutsu", 1, "focus");
		character.setSchoolSkill("kenjutsu", 1);
		character.setSchoolSkill("kyujutsu", 1);
		character.setSchoolSkill("sincerity", 1);
		character.setSchoolSkill("tea ceremony", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 6.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case 'Asahina Shugenja':
		character.addKeyword("shugenja");
		character.setSchoolTrait("awareness", 1);
		character.setSchoolSkill("calligraphy", 1, "cipher");
		character.setSchoolSkill("etiquette", 1, "focus");
		character.setSchoolSkill("lore - theology", 1);
		character.setSchoolSkill("meditation", 1);
		character.setSchoolSkill("spellcraft", 1);
		character.setSchoolSkill("tea ceremony", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 6.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case 'Doji Courtier':
		character.addKeyword("courtier");
		character.setSchoolTrait("awareness", 1);
		character.setSchoolSkill("calligraphy", 1);
		character.setSchoolSkill("courtier", 1, "manipulation");
		character.setSchoolSkill("etiquette", 1, "courtesy");
		character.setSchoolSkill("perform - storytelling", 1);
		character.setSchoolSkill("sincerity", 1);
		character.setSchoolSkill("tea ceremony", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 6.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case 'Daidoji Iron Warrior':
		character.addKeyword("bushi");
		character.setSchoolTrait("agility", 1);
		character.setSchoolSkill("battle", 1);
		character.setSchoolSkill("kenjutsu", 1, "katana");
		character.setSchoolSkill("defense", 2);
		character.setSchoolSkill("iaijutsu", 1);
		character.setSchoolSkill("kyujutsu", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 6.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case 'Mirumoto Bushi':
		character.addKeyword("bushi");
		character.setSchoolTrait("stamina", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("iaijutsu", 1);
		character.setSchoolSkill("kenjutsu", 1, "katana");
		character.setSchoolSkill("lore - shugenja", 1);
		character.setSchoolSkill("meditation", 1);
		character.setSchoolSkill("theology", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 4.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Tamori Shugenja':
		character.addKeyword("shugenja");
		character.setSchoolTrait("stamina", 1);
		character.setSchoolSkill("athletics", 1);
		character.setSchoolSkill("calligraphy", 1, "cipher");
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("lore - theology", 1);
		character.setSchoolSkill("divination", 1);
		character.setSchoolSkill("medicine", 1);
		character.setSchoolSkill("spellcraft", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 4.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Kitsuki Investigator':
		character.addKeyword("courtier");
		character.setSchoolTrait("perception", 1);
		character.setSchoolSkill("courtier", 1);
		character.setSchoolSkill("etiquette", 1, "courtesy");
		character.setSchoolSkill("investigation", 1, "interrogation");
		character.setSchoolSkill("kenjutsu", 1);
		character.setSchoolSkill("meditation", 1);
		character.setSchoolSkill("sincerity", 1);
		character.setSchoolSkill("spellcraft", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 5.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Togashi Tattoed Order':
		character.addKeyword("monk");
		character.setSchoolTrait("void", 1);
		character.setSchoolSkill("athletics", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("craft - tattooing", 1);
		character.setSchoolSkill("jiujutsu", 1);
		character.setSchoolSkill("meditation", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 4.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Akodo Bushi':
		character.addKeyword("bushi");
		character.setSchoolTrait("perception", 1);
		character.setSchoolSkill("battle", 1, "mass combat");
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("kenjutsu", 1);
		character.setSchoolSkill("kyujutsu", 1);
		character.setSchoolSkill("lore - history", 1);
		character.setSchoolSkill("sincerity", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 6.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Kitsu Shugenja':
		character.addKeyword("shugenja");
		character.setSchoolTrait("perception", 1);
		character.setSchoolSkill("battle", 1);
		character.setSchoolSkill("calligraphy", 1, "cipher");
		character.setSchoolSkill("etiquette", 1);
		character.setSchoolSkill("lore - history", 1);
		character.setSchoolSkill("lore - theology", 1);
		character.setSchoolSkill("spellcraft", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 6.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Ikoma Bard School':
		character.addKeyword("courtier");
		character.setSchoolTrait("intelligence", 1);
		character.setSchoolSkill("courtier", 1);
		character.setSchoolSkill("etiquette", 1);
		character.setSchoolSkill("lore - history", 1, "lion clan");
		character.setSchoolSkill("perform - storytelling", 1);
		character.setSchoolSkill("sincerity", 1, "honesty");
		character.status = 1;
		character.glory = 1;
		character.honor = 6.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Matsu Berserker':
		character.addKeyword("bushi");
		character.setSchoolTrait("strength", 1);
		character.setSchoolSkill("battle", 1);
		character.setSchoolSkill("jiujutsu", 1);
		character.setSchoolSkill("kenjutsu", 1, "katana");
		character.setSchoolSkill("kyujutsu", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 6.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Yoritomo Bushi':
		character.addKeyword("bushi");
		character.setSchoolTrait("strength", 1);
		character.setSchoolSkill("commerce", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("jiujutsu", 1, "improvised weapons");
		character.setSchoolSkill("kenjutsu", 1);
		character.setSchoolSkill("knives", 1, "kama");
		character.setSchoolSkill("sailing", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 3.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case 'Moshi Shugenja':
		character.addKeyword("shugenja");
		character.setSchoolTrait("awareness", 1);
		character.setSchoolSkill("calligraphy", 1, "cipher");
		character.setSchoolSkill("divination", 1);
		character.setSchoolSkill("lore - theology", 1);
		character.setSchoolSkill("meditation", 1);
		character.setSchoolSkill("spellcraft", 1, "kama");
		character.setSchoolSkill("sailing", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 4.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case 'Yoritomo Courtier':
		character.addKeyword("courtier");
		character.setSchoolTrait("willpower", 1);
		character.setSchoolSkill("commerce", 1, "appraisal");
		character.setSchoolSkill("courtier", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("etiquette", 1);
		character.setSchoolSkill("intimidation", 1, "control");
		character.setSchoolSkill("sincerity", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 2.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case 'Tsuruchi Archer':
		character.addKeyword("bushi");
		character.setSchoolTrait("reflexes", 1);
		character.setSchoolSkill("athletics", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("hunting", 1);
		character.setSchoolSkill("investigation", 1);
		character.setSchoolSkill("kyujutsu", 2, "yumi");
		character.status = 1;
		character.glory = 1;
		character.honor = 3.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case 'Shiba Bushi':
		character.addKeyword("bushi");
		character.setSchoolTrait("agility", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("kenjutsu", 1);
		character.setSchoolSkill("kyujutsu", 1);
		character.setSchoolSkill("meditation", 1, "void recovery");
		character.setSchoolSkill("spears", 1);
		character.setSchoolSkill("theology", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 5.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Isawa Shugenja':
		character.addKeyword("shugenja");
		character.setSchoolTrait("intelligence", 1);
		character.setSchoolSkill("calligraphy", 1, "cipher");
		character.setSchoolSkill("lore - theology", 1);
		character.setSchoolSkill("medicine", 1);
		character.setSchoolSkill("meditation", 1);
		character.setSchoolSkill("spellcraft", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 4.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Asako Loremaster':
		character.addKeyword("courtier");
		character.setSchoolTrait("intelligence", 1);
		character.setSchoolSkill("courtier", 1);
		character.setSchoolSkill("etiquette", 1);
		character.setSchoolSkill("lore - history", 1);
		character.setSchoolSkill("lore - theology", 1, "fortunes");
		character.setSchoolSkill("meditation", 1);
		character.setSchoolSkill("sincerity", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 6.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Agasha Shugenja':
		character.addKeyword("shugenja");
		character.setSchoolTrait("intelligence", 1);
		character.setSchoolSkill("calligraphy", 1, "cipher");
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("etiquette", 1);
		character.setSchoolSkill("lore - theology", 1);
		character.setSchoolSkill("spellcraft", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 4.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Bayushi Bushi':
		character.addKeyword("bushi");
		character.setSchoolTrait("intelligence", 1);
		character.setSchoolSkill("courtier", 1, "manipulation");
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("etiquette", 1);
		character.setSchoolSkill("iaijutsu", 1);
		character.setSchoolSkill("kenjutsu", 1);
		character.setSchoolSkill("sincerity", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 2.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Soshi Shugenja':
		character.addKeyword("shugenja");
		character.setSchoolTrait("awareness", 1);
		character.setSchoolSkill("calligraphy", 1, "cipher");
		character.setSchoolSkill("courtier", 1);
		character.setSchoolSkill("etiquette", 1);
		character.setSchoolSkill("lore - theology", 1);
		character.setSchoolSkill("spellcraft", 1);
		character.setSchoolSkill("stealth", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 2.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Bayushi Courtier':
		character.addKeyword("courtier");
		character.setSchoolTrait("awareness", 1);
		character.setSchoolSkill("calligraphy", 1);
		character.setSchoolSkill("courtier", 1, "gossip");
		character.setSchoolSkill("etiquette", 1);
		character.setSchoolSkill("investigation", 1);
		character.setSchoolSkill("sincerity", 1, "deceit");
		character.setSchoolSkill("temptation", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 2.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Shosuro Infiltrator':
		character.addKeyword("ninja");
		character.setSchoolTrait("reflexes", 1);
		character.setSchoolSkill("acting", 1);
		character.setSchoolSkill("athletics", 1);
		character.setSchoolSkill("ninjutsu", 1);
		character.setSchoolSkill("sincerity", 1);
		character.setSchoolSkill("stealth", 2, "sneaking");
		character.status = 1;
		character.glory = 1;
		character.honor = 1.5;
		character.setBaseSalary(5, 0, 0);
		break;
	case 'Moto Bushi':
		character.addKeyword("bushi");
		character.setSchoolTrait("strength", 1);
		character.setSchoolSkill("athletics", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("horsemanship", 1);
		character.setSchoolSkill("hunting", 1);
		character.setSchoolSkill("kenjutsu", 1, "scimitar");
		character.status = 1;
		character.glory = 1;
		character.honor = 3.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case 'Iuchi Shugenja':
		character.addKeyword("shugenja");
		character.setSchoolTrait("perception", 1);
		character.setSchoolSkill("battle", 1);
		character.setSchoolSkill("calligraphy", 1, "cipher");
		character.setSchoolSkill("horsemanship", 1);
		character.setSchoolSkill("lore - theology", 1);
		character.setSchoolSkill("meditation", 1);
		character.setSchoolSkill("spellcraft", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 3.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case 'Ide Emissary':
		character.addKeyword("courtier");
		character.setSchoolTrait("awareness", 1);
		character.setSchoolSkill("calligraphy", 1);
		character.setSchoolSkill("commerce", 1);
		character.setSchoolSkill("courtier", 1);
		character.setSchoolSkill("etiquette", 1, "conversation");
		character.setSchoolSkill("horsemanship", 1);
		character.setSchoolSkill("sincerity", 1, "honesty");
		character.status = 1;
		character.glory = 1;
		character.honor = 5.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case 'Utaku Battle Maiden':
		character.addKeyword("bushi");
		character.setSchoolTrait("reflexes", 1);
		character.setSchoolSkill("battle", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("horsemanship", 2);
		character.setSchoolSkill("kenjutsu", 1);
		character.setSchoolSkill("sincerity", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 6.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case 'Seppun Guardsman':
		character.addKeyword("bushi");
		character.setSchoolTrait("perception", 1);
		character.setSchoolSkill("battle", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("etiquette", 1);
		character.setSchoolSkill("iaijutsu", 1);
		character.setSchoolSkill("kenjutsu", 1, "katana");
		character.setSchoolSkill("kyujutsu", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 6.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case 'Seppun Shugenja':
		character.addKeyword("shugenja");
		character.setSchoolTrait("intelligence", 1);
		character.setSchoolSkill("calligraphy", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("etiquette", 1);
		character.setSchoolSkill("investigation", 1, "notice");
		character.setSchoolSkill("meditation", 1);
		character.setSchoolSkill("lore - theology", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 6.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case 'Otomo Courtier':
		character.addKeyword("courtier");
		character.setSchoolTrait("awareness", 1);
		character.setSchoolSkill("courtier", 1, "manipulation");
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("etiquette", 1);
		character.setSchoolSkill("intimidation", 1, "control");
		character.setSchoolSkill("investigation", 1);
		character.setSchoolSkill("sincerity", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 5.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case 'Miya Herald':
		character.addKeyword("courtier");
		character.setSchoolTrait("awareness", 1);
		character.setSchoolSkill("courtier", 1, "rhetoric");
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("etiquette", 1, "courtesy");
		character.setSchoolSkill("horsemanship", 1);
		character.setSchoolSkill("lore - heraldry", 1);
		character.setSchoolSkill("sincerity", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 6.5;
		character.setBaseSalary(10, 0, 0);
		break;
	case'The Four Temples Monk':
		character.addKeyword("monk");
		character.setSchoolTrait("awareness", 1);
		character.setSchoolTrait("void", 1);
		character.setSchoolSkill("courtier", 1);
		character.setSchoolSkill("etiquette", 1);
		character.setSchoolSkill("jiujutsu", 1);
		character.setSchoolSkill("lore - theology", 1, "shintao");
		character.setSchoolSkill("meditation", 1);
		character.status = 0;
		character.glory = 1;
		character.honor = 6.5;
		character.setBaseSalary(0, 0, 2);
		break;
	case 'Order of the Heroes':
		character.addKeyword("monk");
		character.setSchoolTrait("perception", 1);
		character.setSchoolTrait("void", 1);
		character.setSchoolSkill("athletics", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("jiujutsu", 1);
		character.setSchoolSkill("lore - theology", 1, "shintao");
		character.setSchoolSkill("meditation", 1);
		character.status = 0;
		character.glory = 1;
		character.honor = 4.5;
		character.setBaseSalary(0, 0, 2);
		break;
	case 'Shrine of the Seven Thunders':
		character.addKeyword("monk");
		character.setSchoolTrait("stamina", 1);
		character.setSchoolTrait("void", 1);
		character.setSchoolSkill("athletics", 1);
		character.setSchoolSkill("jiujutsu", 1);
		character.setSchoolSkill("lore - theology", 1, "shintao");
		character.setSchoolSkill("meditation", 1);
		character.status = 0;
		character.glory = 1;
		character.honor = 4.5;
		character.setBaseSalary(0, 0, 2);
		break;
	case 'Temple of Kaimetsu-uo':
		character.addKeyword("monk");
		character.setSchoolTrait("willpower", 1);
		character.setSchoolTrait("void", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("jiujutsu", 1);
		character.setSchoolSkill("lore - theology", 1, "fortunes");
		character.setSchoolSkill("meditation", 1);
		character.status = 0;
		character.glory = 1;
		character.honor = 4.5;
		character.setBaseSalary(0, 0, 2);
		break;
	case 'Temple of Osano-Wo':
		character.addKeyword("monk");
		character.setSchoolTrait("strength", 1);
		character.setSchoolTrait("void", 1);
		character.setSchoolSkill("battle", 1);
		character.setSchoolSkill("jiujutsu", 2);
		character.setSchoolSkill("lore - theology", 1, "fortunes");
		character.setSchoolSkill("meditation", 1);
		character.status = 0;
		character.glory = 1;
		character.honor = 4.5;
		character.setBaseSalary(0, 0, 2);
		break;
	case 'Temples of the Thousand Fortunes':
		character.addKeyword("monk");
		character.setSchoolTrait("agility", 1);
		character.setSchoolTrait("void", 1);
		character.setSchoolSkill("jiujutsu", 1);
		character.setSchoolSkill("lore - history", 1);
		character.setSchoolSkill("lore - theology", 1, "fortunes");
		character.setSchoolSkill("meditation", 1);
		character.status = 0;
		character.glory = 1;
		character.honor = 4.5;
		character.setBaseSalary(0, 0, 2);
		break;
	case 'Disciples of Sun Tao':
		character.addKeyword("bushi");
		character.setSchoolTrait("reflexes", 1);
		character.setSchoolSkill("athletics", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("hunting", 1);
		character.setSchoolSkill("iaijutsu", 1);
		character.setSchoolSkill("kenjutsu", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 4.5;
		character.setBaseSalary(1, 0, 0);
		break;
	case 'Forest Killers':
		character.addKeyword("bushi");
		character.setSchoolTrait("agility", 1);
		character.setSchoolSkill("athletics", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("hunting", 1);
		character.setSchoolSkill("kenjutsu", 1);
		character.setSchoolSkill("kyujutsu", 1);
		character.setSchoolSkill("stealth", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 1.5;
		character.setBaseSalary(2, 0, 0);
		break;
	case 'Tawagoto\'s Army':
		character.addKeyword("bushi");
		character.setSchoolTrait("agility", 1);
		character.setSchoolSkill("battle", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("etiquette", 1);
		character.setSchoolSkill("investigation", 1);
		character.setSchoolSkill("kenjutsu", 1);
		character.setSchoolSkill("spears", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 4.5;
		character.setBaseSalary(1, 0, 0);
		break;
	case 'Tengoku\'s Justice':
		character.addKeyword("bushi");
		character.setSchoolTrait("strength", 1);
		character.setSchoolSkill("athletics", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("horsemanship", 1);
		character.setSchoolSkill("hunting", 1);
		character.setSchoolSkill("kenjutsu", 1);
		character.setSchoolSkill("kyujutsu", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 4.5;
		character.setBaseSalary(1, 0, 0);
		break;
	case 'Tessen':
		character.addKeyword("bushi");
		character.setSchoolTrait("stamina", 1);
		character.setSchoolSkill("battle", 1);
		character.setSchoolSkill("defense", 1);
		character.setSchoolSkill("investigation", 1);
		character.setSchoolSkill("jiujutsu", 1);
		character.setSchoolSkill("war fan", 1);
		character.status = 1;
		character.glory = 1;
		character.honor = 3.5;
		character.setBaseSalary(2, 0, 0);
		break;
	default:
		// none
		break;
	}
	
	// free skills
	if(schoolSkillSelect.value != "Choose" && schoolSkillSelect.value != "None") {
		character.setSchoolSkill(schoolSkillSelect.value, 1);
	}
	
	if(schoolSkill2Select.value != "Choose" && schoolSkill2Select.value != "None") {
		character.setSchoolSkill(schoolSkill2Select.value, 1);
	}
	
	if(schoolSkill3Select.value != "Choose" && schoolSkill3Select.value != "None") {
		character.setSchoolSkill(schoolSkill3Select.value, 1);
	}
	
	// Attractiveness
	switch(form.attractivenessInput.value) {
	case 'Repulsive':
		character.addAdvDis("seven fortune's curse - benten");
	case 'Below Average':
		character.addAdvDis("weakness - awareness");
		break;
	case 'Legendary':
		character.addAdvDis("bad fortune", "secret love");
		character.addAdvDis("fame", "Legendary Looks");
		character.addAdvDis("dangerous beauty");
		character.addAdvDis("seven fortunes' - benten");
		if(character.getTrait("awareness").getTotalRank() < 5) {
			character.increaseTrait("awareness", 1);			
			character.increaseSkill("temptation", 1, "seduction");
			character.increaseSkill("etiquette", 1, "conversations");
		}
	case 'Exceptional':
		character.addAdvDis("voice");
		if(character.getTrait("awareness").getTotalRank() < 5) {
			character.increaseTrait("awareness", 1);			
			character.increaseSkill("temptation", 1, "seduction");
			character.increaseSkill("etiquette", 1, "conversations");
		}
	case 'Above Average':
		if(character.getTrait("awareness").getTotalRank() < 5) {
			character.increaseTrait("awareness", 1);			
			character.increaseSkill("temptation", 1, "seduction");
			character.increaseSkill("etiquette", 1, "conversations");
		}
		break;
	default:
		// nothing
		break;
	}
	
	// health
	switch(form.healthInput.value) {
		case 'Sickly':
			character.addAdvDis("bad health");
		case 'Below Average':
			character.addAdvDis("weakness - stamina");
			break;
		case 'Legendary':
			switch(form.clanInput.value) {
				case 'Crab':
				case 'Lion':
					character.addAdvDis("seven fortunes' - bishamon");
					break;
				case 'Scorpion':
				default:
					character.addAdvDis("seven fortunes' - jurojin");
					break;
			}
			character.addAdvDis("fame", "Legendary Health");
			character.increaseTrait("stamina", 1);
			character.increaseTrait("strength", 1);
			character.increaseTrait("agility", 1);
			character.increaseTrait("reflexes", 1);
			character.increaseSkill("athletics", 1);
		case 'Exceptional':
			character.increaseTrait("stamina", 1);
			character.increaseTrait("strength", 1);
			character.increaseTrait("agility", 1);
			character.increaseTrait("reflexes", 1);
			character.increaseSkill("athletics", 1);
		case 'Above Average':
			character.increaseTrait("stamina", 1);
			character.increaseTrait("strength", 1);
			character.increaseTrait("agility", 1);
			character.increaseTrait("reflexes", 1);
			character.increaseSkill("athletics", 1);
	default:
		// nothing
		break;
	}
	
	// Intelligence
	switch(form.intelligenceInput.value) {
	case 'Retarded':
		character.addAdvDis("frail mind");
	case 'Below Average':
		character.addAdvDis("weakness - intelligence");
		break;
	case 'Legendary':
		character.addAdvDis("fame", "Legendary Intellect");		
		switch(form.clanInput.value) {
			case 'Scorpion':
				character.addAdvDis("crafty");
				break;
			case 'Dragon':
				character.addAdvDis("clear thinker");
				break;
			case 'Phoenix':
				character.addAdvDis("sage");
				break;
			case 'Lion':
				character.addAdvDis("tactician");
				break;
			default:
				character.addAdvDis("precise memory");
				break;
		}
		character.increaseTrait("intelligence", 1);
		character.increaseTrait("perception", 1);
		character.increaseTrait("willpower", 1);
	case 'Exceptional':
		character.increaseTrait("intelligence", 1);
		character.increaseTrait("perception", 1);
		character.increaseTrait("willpower", 1);
	case 'Above Average':
		character.increaseTrait("intelligence", 1);
		character.increaseTrait("perception", 1);
		character.increaseTrait("willpower", 1);
		break;
	default:
		break;
	}
	
	// MBTI adjustments
	const ei = document.getElementById("eiInput").value;
	const si = document.getElementById("siInput").value;
	const tf = document.getElementById("tfInput").value;
	const jp = document.getElementById("jpInput").value;
	
	if(ei == "Extraversion") {
		if(character.getTrait("awareness").getTotalRank() < 5) {
			character.increaseTrait("awareness", 1);
		}
	} else if (ei == "Introversion") {
		if(character.getTrait("willpower").getTotalRank() < 5) {
			character.increaseTrait("willpower", 1);
		}
	}
	
	if(si == "Sensing") {
		if(character.getTrait("perception").getTotalRank() < 5) {
			character.increaseTrait("perception", 1);
		}
	} else if (si == "Intuition") {
		if(character.getTrait("awareness").getTotalRank() < 5) {
			character.increaseTrait("awareness", 1);
		}
	}
	
	if(tf == "Thinking") {
		if(character.getTrait("intelligence").getTotalRank() < 5) {
			character.increaseTrait("intelligence", 1);
		}
	} else if (tf == "Feeling") {
		if(character.getTrait("willpower").getTotalRank() < 5) {
			character.increaseTrait("willpower", 1);
		}
	}
	
	if(jp == "Judging") {
		if(character.getTrait("intelligence").getTotalRank() < 5) {
			character.increaseTrait("intelligence", 1);
		}
	} else if (jp == "Perceiving") {
		if(character.getTrait("perception").getTotalRank() < 5) {
			character.increaseTrait("perception", 1);
		}
	}
	
	// status
	document.getElementById('statusOutput').textContent = character.getStatus();
	document.getElementById('gloryOutput').textContent = character.getGlory();
	document.getElementById('honorOutput').textContent = character.getHonor();
	document.getElementById('taintOutput').textContent = character.getTaint();
	
	//Update traits
	document.getElementById('earthRingRankOutput').textContent = character.getEarthRank();
	document.getElementById('earthRingInsightOutput').textContent = character.getEarthInsight();
	document.getElementById('fireRingRankOutput').textContent = character.getEarthRank();
	document.getElementById('fireRingInsightOutput').textContent = character.getFireInsight();
	document.getElementById('waterRingRankOutput').textContent = character.getFireRank();
	document.getElementById('waterRingInsightOutput').textContent = character.getWaterInsight();
	document.getElementById('airRingRankOutput').textContent = character.getAirRank();
	document.getElementById('airRingInsightOutput').textContent = character.getAirInsight();
	document.getElementById('voidInsightOutput').textContent = character.getVoidInsight();
	
	for(const aTrait of character.getTraits()) {
		document.getElementById(aTrait.name+'RankOutput').textContent = aTrait.getTotalRank();
		document.getElementById(aTrait.name+'IncreaseOutput').textContent = aTrait.increase;
		document.getElementById(aTrait.name+'BaseOutput').textContent = aTrait.base;
		document.getElementById(aTrait.name+'FamilyOutput').textContent = aTrait.family;
		document.getElementById(aTrait.name+'SchoolOutput').textContent = aTrait.school;
		document.getElementById(aTrait.name+'ExpOutput').textContent = aTrait.getExp();
	}
	
	// Income
	document.getElementById('kokuOutput').textContent = character.baseSalaryKoku;
	document.getElementById('buOutput').textContent = character.baseSalaryBu;
	document.getElementById('zeniOutput').textContent = character.baseSalaryZeni;
	
	let monthlySalary = character.getMonthlySalary();
	document.getElementById('monthKokuOutput').textContent = monthlySalary[0];
	document.getElementById('monthBuOutput').textContent = monthlySalary[1];
	document.getElementById('monthZeniOutput').textContent = monthlySalary[2];
	
	let yearlySalary = character.getYearlySalary();
	document.getElementById('yearKokuOutput').textContent = yearlySalary[0];
	document.getElementById('yearBuOutput').textContent = yearlySalary[1];
	document.getElementById('yearZeniOutput').textContent = yearlySalary[2];
	
	// Append skills
	skillsTable.innerHTML = "";
	for (const aSkill of character.getSkills()) {
		if(aSkill.getTotalRank() > 0) {
			const skillTypeCell = document.createElement('td');
			skillTypeCell.textContent = aSkill.type;
			
			const nameCell = document.createElement('td');
			nameCell.textContent = aSkill.name;
			
			const traitCell = document.createElement('td');
			traitCell.textContent = aSkill.trait;
			
			const rollCell = document.createElement('td');
			let aTrait = character.getTrait(aSkill.trait);
			rollCell.textContent = aSkill.getTotalRank()+aTrait.getTotalRank();
			
			const keepCell = document.createElement('td');
			keepCell.textContent = aTrait.getTotalRank();
			
			const rankCell = document.createElement('td');
			rankCell.textContent = aSkill.rank;
			
			const emphasisCell = document.createElement('td');
			emphasisCell.textContent = aSkill.emphasis;
			
			const schoolRankCell = document.createElement('td');
			schoolRankCell.textContent = aSkill.schoolRank;
			
			const schoolEmphasisCell = document.createElement('td');
			schoolEmphasisCell.textContent = aSkill.schoolEmphasis;
			
			const expCell = document.createElement('td');
			expCell.textContent = aSkill.getExp();
			
			const insightCell = document.createElement('td');
			insightCell.textContent = aSkill.getInsight();
			
			
			const newRow = document.createElement('tr');
			newRow.append(skillTypeCell);
			newRow.append(nameCell);
			newRow.append(traitCell);
			newRow.append(rollCell);
			newRow.append(keepCell);
			newRow.append(rankCell);
			newRow.append(emphasisCell);
			newRow.append(schoolRankCell);
			newRow.append(schoolEmphasisCell);
			newRow.append(expCell);
			newRow.append(insightCell);
			skillsTable.appendChild(newRow);
		}
	}
	
	// Append Advantages & Disadvantages
	advTable.innerHTML = "";
	disTable.innerHTML = "";
	for(const aAdvDis of character.getAdvDis()) {
		console.log(aAdvDis.name + " " +aAdvDis.getExp(character.getKeywords()));
		const nameCell = document.createElement('td');
		nameCell.textContent = aAdvDis.name;
		const subtypeCell = document.createElement('td');
		subtypeCell.textContent = aAdvDis.subtype;
		const expCell = document.createElement('td');
		expCell.textContent = aAdvDis.getExp(character.getKeywords());
		const detailCell = document.createElement('td');
		detailCell.textContent = aAdvDis.detail;
		const affinityCell = document.createElement('td');
		affinityCell.textContent = ""; // TODO
		const pageCell = document.createElement('td');
		pageCell.textContent = aAdvDis.page;
		const newRow = document.createElement('tr');
		newRow.append(nameCell);
		newRow.append(subtypeCell);
		newRow.append(expCell);
		newRow.append(detailCell);
		newRow.append(affinityCell);
		newRow.append(pageCell);
		if(aAdvDis.type == "adv") {
			advTable.appendChild(newRow);
		} else {
			disTable.appendChild(newRow);
		}
	}
	
	// Rank
	document.getElementById('expSpentOutput').textContent = character.getExp();
	if(form.expInput.value != 'Choose') {
		document.getElementById('expRemainingOutput').textContent = form.expInput.value - character.getExp();
	}
	document.getElementById('insightOutput').textContent = character.getInsight();
	document.getElementById('rankOutput').textContent = character.getRank();
  };

  form.querySelectorAll('select').forEach(sel => {

  form.querySelectorAll('input').forEach(sel => {
    sel.addEventListener('change', updateOutput);
  });
  sel.addEventListener('change', updateOutput);
  });
