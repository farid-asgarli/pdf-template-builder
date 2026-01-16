fetch('http://localhost:5043/api/documents/9d94a352-10cb-4426-b7b1-b05436a909d0/generate-pdf', {
  headers: {
    accept: '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    'sec-ch-ua': '"Brave";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'sec-gpc': '1',
    Referer: 'http://localhost:3000/',
  },
  body: '{"variables":{"isPaid":true,"hasDiscount":false,"discount":78,"taxRate":8.25,"invoiceNumber":"12313123","invoiceDate":"2026-01-15","eventDate":"2026-02-20","dueDate":"2026-01-28","customerName":"Farid Asgarli","companyName":"YoungLA","discountAmount":{"value":1500,"currency":"USD"},"taxAmount":{"value":32.5,"currency":"USD"},"subtotal":{"value":500,"currency":"USD"},"total":{"value":1800,"currency":"USD"},"notes":"Note really","items":[{"name":"Jersey","qty":2,"price":{"value":100,"currency":"USD"},"total":{"value":200,"currency":"USD"}},{"name":"Hoodie","qty":1,"price":{"value":150,"currency":"USD"},"total":{"value":150,"currency":"USD"}},{"name":"Jacket","qty":1,"price":{"value":150,"currency":"USD"},"total":{"value":150,"currency":"USD"}}]},"saveToHistory":false}',
  method: 'POST',
});
