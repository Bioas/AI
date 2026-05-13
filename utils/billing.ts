export function generateInvoiceData(input: any) {
  if (!input) {
    throw new Error('No input data provided');
  }


  const room = input.room;
  const tenant = input.tenant;
  const roomNumber = room?.number;
  const rent = input.rent;
  const waterCost = input.waterCost;
  const elecCost = input.elecCost;
  const date = input.date;

  const total = rent + waterCost + elecCost;

  return {
    roomNumber,
    tenant,
    rent: rent || 0,
    waterCost: waterCost || 0,
    elecCost: elecCost || 0,
    total: total,
    date: date || new Date().toISOString(),
  };
}
