
async function testTRDaily() {
  const start = "01/01/2024";
  const end = "10/01/2024";
  const serie = 226; // TR Diária
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados?formato=json&dataInicial=${start}&dataFinal=${end}`;
  
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    console.log("Registros TR Diária encontrados:", data);
  } catch (e) {
    console.error(e);
  }
}

testTRDaily();
