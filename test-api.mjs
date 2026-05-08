import fetch from 'node-fetch';

async function test() {
  const prefs = {
    destination: 'Tokyo',
    startDate: '2026-05-10',
    endDate: '2026-05-12',
    budget: 1000,
    currency: 'USD',
    interests: ['Food', 'Culture'],
    pace: 'moderate',
    constraints: []
  };

  try {
    const res = await fetch('http://localhost:8080/api/generate-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs)
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

test();
