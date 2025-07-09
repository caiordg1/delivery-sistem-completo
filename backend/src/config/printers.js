const printersConfig = {
  // Impressora principal (USB)
  main: {
    type: 'EPSON',
    interface: process.env.MAIN_PRINTER_DEVICE || '/dev/usb/lp0',
    width: 48,
    characterSet: 'BRAZIL',
    removeSpecialCharacters: false
  },
  
  // Impressora da cozinha (Rede)
  kitchen: {
    type: 'EPSON',
    interface: `tcp://${process.env.KITCHEN_PRINTER_IP || '192.168.1.100'}:${process.env.KITCHEN_PRINTER_PORT || '9100'}`,
    width: 48,
    characterSet: 'BRAZIL',
    removeSpecialCharacters: false
  }
};

module.exports = printersConfig;
