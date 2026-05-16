

async function test() {
    const req = {
        valor: 100,
        dateInit: '1990-01-01',
        dateFim: '2024-05-01'
    };
    const serieId = 11; // Selic

    console.time('sequential');
    // Simulate current sequential logic
    // ... we need to mock fetch or use the real one if environment allows
    console.timeEnd('sequential');
}
