function calculateStipend(event) {
  event.preventDefault();
  
  // Get input values
  const incomeKoku = parseInt(document.getElementById('incomeKoku').value) || 0;
  const incomeBu = parseInt(document.getElementById('incomeBu').value) || 0;
  const incomeZeni = parseInt(document.getElementById('incomeZeni').value) || 0;
  const status = parseInt(document.getElementById('status').value) || 1;
  
  // Convert everything to Zeni (1 koku = 50 zeni, 1 bu = 10 zeni)
  const totalZeni = (incomeKoku * 50) + (incomeBu * 10) + incomeZeni;
  
  // Multiply by Status, divide by 6, round down
  const stipendZeni = Math.floor(totalZeni * status / 6);
  
  // Convert back to Koku, Bu, Zeni
  const resultKoku = Math.floor(stipendZeni / 50);
  const remaining = stipendZeni % 50;
  const resultBu = Math.floor(remaining / 10);
  const resultZeni = remaining % 10;
  
  // Display result
  document.getElementById('resultKoku').textContent = resultKoku;
  document.getElementById('resultBu').textContent = resultBu;
  document.getElementById('resultZeni').textContent = resultZeni;
  document.getElementById('result').style.display = 'block';
}
