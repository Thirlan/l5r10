const schoolIncome = {
  Crab: {
    'Hida Bushi': 3,
    'Hiruma Bushi': 3,
    'Kuni Shugenja': 3,
    'Yasuki Courtier': 9
  },
  Crane: {
    'Asahina Shugenja': 10,
    'Daidoji Iron Warrior': 10,
    'Doji Courtier': 10,
    'Kakita Bushi': 10
  },
  Dragon: {
    'Agasha Shugenja': 5,
    'Kitsuki Investigator': 5,
    'Mirumoto Bushi': 5,
    'The Togashi Tattooed Order': 5
  },
  Imperial: {
    'Miya Herald': 5,
    'Otomo Courtier': 10,
    'Seppun Guardsman': 10,
    'Seppun Shugenja': 10
  },
  Lion: {
    'Akodo Bushi': 5,
    'Ikoma Bard': 5,
    'Kitsu Shugenja': 5,
    'Matsu Berserker': 5
  },
  Phoenix: {
    'Asako Loremaster': 3,
    'Isawa Shugenja': 5,
    'Shiba Bushi': 5
  },
  Scorpion: {
    'Bayushi Bushi': 5,
    'Bayushi Courtier': 5,
    'Shosuro Infiltrator': 5,
    'Soshi Shugenja': 5
  },
  Unicorn: {
    'Ide Emissary': 10,
    'Iuchi Shugenja': 10,
    'Shinjo Bushi': 10,
    'Utaku Battle Maiden': 10
  },
  Badger: { 'Ichiro Bushi': 3 },
  Centipede: { 'Moshi Shugenja': 10 },
  Dragonfly: { 'Tonbo Shugenja': 3 },
  Falcon: { 'Toritaka Bushi': 3 },
  Fox: { 'Kitsune Shugenja': 3 },
  Hare: { 'Usagi Bushi': 3 },
  Mantis: { 'Mantis Bushi': 10, 'Mantis Shugenja': 10 },
  Sparrow: { 'Suzume Bushi': 3 },
  Tortoise: { 'Kasuga Smuggler': 5 }
};

function populateSchools() {
  const clan = document.getElementById('clan').value;
  const schoolSelect = document.getElementById('school');
  const schools = schoolIncome[clan] || {};

  schoolSelect.replaceChildren(new Option('Select a school', ''));
  Object.keys(schools).forEach((school) => {
    schoolSelect.add(new Option(school, school));
  });
  schoolSelect.disabled = Object.keys(schools).length === 0;
}

function populateIncome() {
  const clan = document.getElementById('clan').value;
  const school = document.getElementById('school').value;
  const income = schoolIncome[clan]?.[school];

  if (income === undefined) {
    return;
  }

  document.getElementById('incomeKoku').value = income;
  document.getElementById('incomeBu').value = 0;
  document.getElementById('incomeZeni').value = 0;
}

document.addEventListener('DOMContentLoaded', () => {
  const clanSelect = document.getElementById('clan');
  Object.keys(schoolIncome).forEach((clan) => {
    clanSelect.add(new Option(clan, clan));
  });
  clanSelect.addEventListener('change', populateSchools);
  document.getElementById('school').addEventListener('change', populateIncome);
});

function calculateStipend(event) {
  event.preventDefault();

  const incomeKoku = parseInt(document.getElementById('incomeKoku').value) || 0;
  const incomeBu = parseInt(document.getElementById('incomeBu').value) || 0;
  const incomeZeni = parseInt(document.getElementById('incomeZeni').value) || 0;
  const status = parseInt(document.getElementById('status').value) || 1;

  const totalZeni = L5RCurrency.toZeni({ koku: incomeKoku, bu: incomeBu, zeni: incomeZeni });
  const stipendZeni = Math.floor(totalZeni * status / 6);
  const result = L5RCurrency.fromZeni(stipendZeni);

  document.getElementById('resultKoku').textContent = result.koku;
  document.getElementById('resultBu').textContent = result.bu;
  document.getElementById('resultZeni').textContent = result.zeni;
  document.getElementById('result').style.display = 'block';
}
