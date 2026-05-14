  
async function testTR() {
  const start = "01/01/2024";
  const end = "01/05/2024";
  const serie = 188; // TR Mensal
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados?formato=json&dataInicial=${start}&dataFinal=${end}`;
  
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    console.log("Registros TR encontrados:", data);
    
    let fator = 1;
    data.forEach((r: any) => {
      const valor = parseFloat(r.valor.replace(",", "."));
      fator *= (1 + valor / 100);
      console.log(`Mês: ${r.data} | Valor: ${valor}% | Fator Acumulado: ${fator}`);
    });
    
    console.log("Fator Final:", fator);
  } catch (e) {
    console.error(e);
  }
}

testTR();
