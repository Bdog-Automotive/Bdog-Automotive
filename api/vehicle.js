export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.DVLA_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Vehicle lookup is not configured yet.' });
  }

  try {
    const registrationNumber = String(req.body?.registrationNumber || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    if (!registrationNumber || registrationNumber.length < 2 || registrationNumber.length > 8) {
      return res.status(400).json({ error: 'Please enter a valid UK registration.' });
    }

    const response = await fetch(
      'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
      {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ registrationNumber })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Vehicle not found. Check the registration and try again.' });
      }
      if (response.status === 429) {
        return res.status(429).json({ error: 'Too many lookups right now. Please try again shortly.' });
      }
      return res.status(response.status).json({ error: 'The vehicle service could not complete the lookup.' });
    }

    return res.status(200).json({
      registrationNumber: data.registrationNumber,
      make: data.make,
      yearOfManufacture: data.yearOfManufacture,
      monthOfFirstRegistration: data.monthOfFirstRegistration,
      fuelType: data.fuelType,
      engineCapacity: data.engineCapacity,
      colour: data.colour,
      co2Emissions: data.co2Emissions,
      euroStatus: data.euroStatus,
      taxStatus: data.taxStatus,
      motStatus: data.motStatus,
      typeApproval: data.typeApproval
    });
  } catch (error) {
    console.error('DVLA lookup failed:', error);
    return res.status(500).json({ error: 'Vehicle lookup failed. Please try again.' });
  }
}
