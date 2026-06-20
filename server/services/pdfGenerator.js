const PdfPrinter = require('pdfmake');

// Use core PDF fonts to avoid path configuration issues with external files
const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);

/**
 * Generates a PDF stream of the payslip
 * @param {Object} payroll Payroll mongoose model object
 * @returns {PDFKit.PDFDocument} PDF document stream
 */
const generatePayslipPdf = (payroll) => {
  const employee = payroll.employeeId;
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const payMonth = monthNames[payroll.month - 1];

  const allowancesRows = payroll.allowances.map(a => [
    { text: a.name, margin: [0, 5, 0, 5], font: 'Helvetica' },
    { text: `$${a.amount.toFixed(2)}`, alignment: 'right', margin: [0, 5, 0, 5], font: 'Helvetica' }
  ]);
  if (allowancesRows.length === 0) {
    allowancesRows.push([
      { text: 'None', margin: [0, 5, 0, 5], font: 'Helvetica', color: '#888' },
      { text: '$0.00', alignment: 'right', margin: [0, 5, 0, 5], font: 'Helvetica', color: '#888' }
    ]);
  }

  const deductionsRows = payroll.deductions.map(d => [
    { text: d.name, margin: [0, 5, 0, 5], font: 'Helvetica' },
    { text: `$${d.amount.toFixed(2)}`, alignment: 'right', margin: [0, 5, 0, 5], font: 'Helvetica' }
  ]);
  
  // Add Tax
  deductionsRows.push([
    { text: 'Income Tax', margin: [0, 5, 0, 5], font: 'Helvetica' },
    { text: `$${payroll.taxAmount.toFixed(2)}`, alignment: 'right', margin: [0, 5, 0, 5], font: 'Helvetica' }
  ]);

  const docDefinition = {
    content: [
      // Title Banner
      {
        text: 'HRM SYSTEMS INC.',
        fontSize: 24,
        bold: true,
        color: '#4F8EF7',
        alignment: 'center',
        margin: [0, 0, 0, 10],
        font: 'Helvetica'
      },
      {
        text: `PAYSLIP FOR ${payMonth.toUpperCase()} ${payroll.year}`,
        fontSize: 14,
        bold: true,
        color: '#0A0F1E',
        alignment: 'center',
        margin: [0, 0, 0, 30],
        font: 'Helvetica'
      },

      // Employee Information Block
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              {
                stack: [
                  { text: `Employee: ${employee.firstName} ${employee.lastName}`, bold: true, font: 'Helvetica' },
                  { text: `Code: ${employee.employeeCode}`, margin: [0, 4, 0, 0], font: 'Helvetica' },
                  { text: `Department: ${employee.department ? employee.department.name : 'N/A'}`, margin: [0, 4, 0, 0], font: 'Helvetica' },
                  { text: `Designation: ${employee.designation}`, margin: [0, 4, 0, 0], font: 'Helvetica' }
                ]
              },
              {
                stack: [
                  { text: `Employment Type: ${employee.employmentType}`, alignment: 'right', font: 'Helvetica' },
                  { text: `Salary Band: ${employee.salaryBand}`, alignment: 'right', margin: [0, 4, 0, 0], font: 'Helvetica' },
                  { text: `Processed Date: ${new Date(payroll.processedAt || Date.now()).toLocaleDateString()}`, alignment: 'right', margin: [0, 4, 0, 0], font: 'Helvetica' },
                  { text: `Status: PAID`, alignment: 'right', bold: true, color: '#22c55e', margin: [0, 4, 0, 0], font: 'Helvetica' }
                ]
              }
            ]
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 30]
      },

      // Divider line
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, strokeColor: '#1E2A3A' }],
        margin: [0, 0, 0, 20]
      },

      // Income & Deductions block
      {
        columns: [
          // Earnings Table
          {
            width: '48%',
            stack: [
              { text: 'EARNINGS', bold: true, color: '#4F8EF7', margin: [0, 0, 0, 10], font: 'Helvetica' },
              {
                table: {
                  widths: ['70%', '30%'],
                  body: [
                    [
                      { text: 'Basic Salary', margin: [0, 5, 0, 5], bold: true, font: 'Helvetica' },
                      { text: `$${payroll.basicSalary.toFixed(2)}`, alignment: 'right', margin: [0, 5, 0, 5], bold: true, font: 'Helvetica' }
                    ],
                    ...allowancesRows
                  ]
                },
                layout: 'lightHorizontalLines'
              }
            ]
          },
          // Spacer column
          { width: '4%', text: '' },
          // Deductions Table
          {
            width: '48%',
            stack: [
              { text: 'DEDUCTIONS', bold: true, color: '#f43f5e', margin: [0, 0, 0, 10], font: 'Helvetica' },
              {
                table: {
                  widths: ['70%', '30%'],
                  body: [
                    ...deductionsRows
                  ]
                },
                layout: 'lightHorizontalLines'
              }
            ]
          }
        ]
      },

      // Divider line
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, strokeColor: '#1E2A3A' }],
        margin: [0, 30, 0, 20]
      },

      // Net Pay Summary
      {
        table: {
          widths: ['70%', '30%'],
          body: [
            [
              { text: 'TOTAL NET SALARY DISTRIBUTED', bold: true, fontSize: 12, margin: [0, 5, 0, 5], font: 'Helvetica' },
              { text: `$${payroll.netPay.toFixed(2)}`, alignment: 'right', bold: true, fontSize: 14, color: '#4F8EF7', margin: [0, 5, 0, 5], font: 'Helvetica' }
            ]
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 40]
      },

      // Signatures
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Employee Signature', alignment: 'center', font: 'Helvetica', italic: true, color: '#888' },
              { text: '_______________________', alignment: 'center', margin: [0, 15, 0, 0], font: 'Helvetica' }
            ]
          },
          {
            width: '50%',
            stack: [
              { text: 'Authorized HR Officer', alignment: 'center', font: 'Helvetica', italic: true, color: '#888' },
              { text: '_______________________', alignment: 'center', margin: [0, 15, 0, 0], font: 'Helvetica' }
            ]
          }
        ]
      }
    ],
    defaultStyle: {
      font: 'Helvetica'
    }
  };

  return printer.createPdfKitDocument(docDefinition);
};

module.exports = {
  generatePayslipPdf,
};
