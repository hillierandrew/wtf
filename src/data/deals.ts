export type Deal = {
  id: string;
  name: string;
  price: number;
  save: number;
  kind: string;
  parts: string[];
};

export const DEALS: Deal[] = [
  { id: "u7-z890", name: "Intel Core Ultra 7 270K + MSI PRO Z890-S WIFI + T-Force 32GB DDR5", price: 1279.97, save: 305, kind: "CPU kit", parts: ["Intel Core Ultra 7 270K", "MSI PRO Z890-S WIFI", "T-Force 32GB DDR5 6000 CL30"] },
  { id: "i5-b760", name: "Intel Core i5-14400 + ASUS B760M-AYW WIFI D4 + KLEVV 16GB DDR4", price: 399, save: 205.97, kind: "CPU kit", parts: ["Intel Core i5-14400", "ASUS B760M-AYW WIFI D4 II", "KLEVV BOLT X 16GB DDR4 3200"] },
  { id: "9950-klevv", name: "Ryzen 9 9950X3D2 + GIGABYTE X870E AORUS PRO + KLEVV 64GB DDR5", price: 2799.96, save: 290, kind: "CPU kit", parts: ["AMD Ryzen 9 9950X3D2", "GIGABYTE X870E AORUS PRO", "KLEVV CRAS V RGB 64GB DDR5 6000"] },
  { id: "9950-gskill", name: "Ryzen 9 9950X3D2 + GIGABYTE X870E AORUS PRO + G.SKILL 64GB DDR5", price: 2899.96, save: 850, kind: "CPU kit", parts: ["AMD Ryzen 9 9950X3D2", "GIGABYTE X870E AORUS PRO", "G.SKILL Trident Z5 Neo 64GB DDR5 6000"] },
  { id: "9950-strix", name: "Ryzen 9 9950X3D + ASUS ROG STRIX X870E-H + KLEVV 64GB DDR5", price: 2549.98, save: 409.98, kind: "CPU kit", parts: ["AMD Ryzen 9 9950X3D", "ASUS ROG STRIX X870E-H GAMING WIFI7", "KLEVV CRAS V RGB 64GB DDR5 6000"] },
  { id: "9900-tuf", name: "Ryzen 9 9900X3D + ASUS TUF B850-PLUS WIFI + T-Force 32GB DDR5", price: 1579.98, save: 449.99, kind: "CPU kit", parts: ["AMD Ryzen 9 9900X3D", "ASUS TUF GAMING B850-PLUS WIFI", "T-Force 32GB DDR5 6000 CL30"] },
  { id: "9850-strix", name: "Ryzen 7 9850X3D + ASUS ROG STRIX X870E-H + T-Force RGB 32GB DDR5", price: 1639.96, save: 366.01, kind: "CPU kit", parts: ["AMD Ryzen 7 9850X3D", "ASUS ROG STRIX X870E-H GAMING WIFI7", "T-Force Delta RGB 32GB DDR5 6000"] },
  { id: "9800-tomahawk", name: "Ryzen 7 9800X3D + MSI MAG X870E TOMAHAWK + T-Force 32GB DDR5", price: 1649.98, save: 139.99, kind: "CPU kit", parts: ["AMD Ryzen 7 9800X3D", "MSI MAG X870E TOMAHAWK WIFI", "T-Force 32GB DDR5 6000 CL30"] },
  { id: "9800-b850", name: "Ryzen 7 9800X3D + MSI B850 GAMING PLUS WIFI + T-Force 32GB DDR5", price: 1438.98, save: 260.99, kind: "CPU kit", parts: ["AMD Ryzen 7 9800X3D", "MSI B850 GAMING PLUS WIFI", "T-Force 32GB DDR5 6000 CL30"] },
  { id: "9800-eagle", name: "Ryzen 7 9800X3D + GIGABYTE B850 EAGLE WIFI6E + T-Force 32GB DDR5", price: 1399.98, save: 259.99, kind: "CPU kit", parts: ["AMD Ryzen 7 9800X3D", "GIGABYTE B850 EAGLE WIFI6E", "T-Force 32GB DDR5 6000 CL30"] },
  { id: "9800-board", name: "Ryzen 7 9800X3D + ASUS TUF B850-E WIFI", price: 719.99, save: 129.99, kind: "CPU kit", parts: ["AMD Ryzen 7 9800X3D", "ASUS TUF GAMING B850-E WIFI"] },
  { id: "9800-9070", name: "Ryzen 7 9800X3D + ASUS RX 9070 XT 16GB + TUF 850W", price: 1718.98, save: 570.99, kind: "GPU kit", parts: ["AMD Ryzen 7 9800X3D", "ASUS Prime RX 9070 XT 16GB", "ASUS TUF Gaming 850W"] },
  { id: "5800xt", name: "Ryzen 7 5800XT + ASUS Prime B550M-A WIFI II + KLEVV 16GB DDR4", price: 589.98, save: 69.99, kind: "CPU kit", parts: ["AMD Ryzen 7 5800XT", "ASUS Prime B550M-A WIFI II", "KLEVV BOLT X 16GB DDR4 3200"] },
  { id: "5700x", name: "Ryzen 7 5700X + GIGABYTE B550M GAMING X WIFI6 + KLEVV 16GB DDR4", price: 519.97, save: 145, kind: "CPU kit", parts: ["AMD Ryzen 7 5700X", "GIGABYTE B550M GAMING X WIFI6", "KLEVV BOLT X 16GB DDR4 3200"] },
  { id: "9600-b850", name: "Ryzen 5 9600X + MSI PRO B850M-A WIFI + T-Force 32GB DDR5", price: 1129.98, save: 224.99, kind: "CPU kit", parts: ["AMD Ryzen 5 9600X", "MSI PRO B850M-A WIFI", "T-Force 32GB DDR5 6000 CL30"] },
  { id: "9600-16", name: "Ryzen 5 9600X + GIGABYTE B650 EAGLE AX + KLEVV 16GB DDR5", price: 599.98, save: 194.99, kind: "CPU kit", parts: ["AMD Ryzen 5 9600X", "GIGABYTE B650 EAGLE AX", "KLEVV FIT V 16GB DDR5 5600"] },
  { id: "8400f", name: "Ryzen 5 8400F + GIGABYTE B650 EAGLE AX + KLEVV 16GB DDR5", price: 599.86, save: 145.11, kind: "CPU kit", parts: ["AMD Ryzen 5 8400F", "GIGABYTE B650 EAGLE AX", "KLEVV FIT V 16GB DDR5 5600"] },
  { id: "5600x3d", name: "Ryzen 5 5600X3D + ASUS Prime B550M-A WIFI II", price: 329.98, save: 90, kind: "CPU kit", parts: ["AMD Ryzen 5 5600X3D", "ASUS Prime B550M-A WIFI II"] },
  { id: "5500f", name: "Ryzen 5 5500F + GIGABYTE B550M DS3H AC + KLEVV 16GB DDR4", price: 369.97, save: 70, kind: "CPU kit", parts: ["AMD Ryzen 5 5500F", "GIGABYTE B550M DS3H AC R2", "KLEVV BOLT X 16GB DDR4 3200"] },
  { id: "5500", name: "Ryzen 5 5500 + ASUS PRIME B550M-K WIFI + KLEVV 16GB DDR4", price: 389.97, save: 55, kind: "CPU kit", parts: ["AMD Ryzen 5 5500", "ASUS PRIME B550M-K WIFI", "KLEVV BOLT X 16GB DDR4 3200"] },
  { id: "7800-b650", name: "Ryzen 7 7800X3D + GIGABYTE B650 EAGLE AX + T-Force 32GB DDR5", price: 1299.97, save: 280, kind: "CPU kit", parts: ["AMD Ryzen 7 7800X3D", "GIGABYTE B650 EAGLE AX", "T-Force 32GB DDR5 6000 CL30"] },
  { id: "285k", name: "Intel Core Ultra 9 285K + CORSAIR RGB 32GB DDR5", price: 999.98, save: 432, kind: "CPU kit", parts: ["Intel Core Ultra 9 285K", "CORSAIR Vengeance RGB 32GB DDR5 6000"] },
  { id: "14700k", name: "Intel Core i7-14700K + ASUS B760M-AYW D4 + Corsair 32GB DDR4", price: 699.97, save: 225, kind: "CPU kit", parts: ["Intel Core i7-14700K", "ASUS B760M-AYW WIFI D4 II", "Corsair Vengeance 32GB DDR4 3200"] },
  { id: "9060-850", name: "XFX RX 9060 XT 16GB + CORSAIR RM850e White", price: 1129.98, save: 0, kind: "GPU kit", parts: ["XFX Swift RX 9060 XT 16GB", "CORSAIR RM850e 850W White"] },
  { id: "9060-750", name: "XFX RX 9060 XT 16GB + CORSAIR RM750e White", price: 1109.98, save: 0, kind: "GPU kit", parts: ["XFX Swift RX 9060 XT 16GB", "CORSAIR RM750e 750W White"] },
  { id: "9070-fsp", name: "Sapphire Pulse RX 9070 XT 16GB + FSP Hydro G Pro 1000W", price: 1699.98, save: 120, kind: "GPU kit", parts: ["Sapphire Pulse RX 9070 XT 16GB", "FSP Hydro G Pro 1000W"] },
  { id: "9070-ice", name: "GIGABYTE RX 9070 XT GAMING OC ICE 16GB + CORSAIR RM850e White", price: 1378.99, save: 270, kind: "GPU kit", parts: ["GIGABYTE RX 9070 XT GAMING OC ICE 16GB", "CORSAIR RM850e 850W White"] },
  { id: "5060-psu", name: "MSI RTX 5060 8GB + MSI MAG A550BN", price: 739.98, save: 80, kind: "GPU kit", parts: ["MSI GeForce RTX 5060 8GB", "MSI MAG A550BN 550W"] },
  { id: "5800x3d-gre", name: "Ryzen 7 5800X3D + RX 9070 GRE 12GB + CORSAIR RM850e", price: 1228.97, save: 310.99, kind: "GPU kit", parts: ["AMD Ryzen 7 5800X3D", "GIGABYTE RX 9070 GRE 12GB", "CORSAIR RM850e 850W"] },
  { id: "stand-g29", name: "Wheel Stand 2.0 + Logitech G29", price: 599.98, save: 50, kind: "Racing", parts: ["Next Level Racing Wheel Stand 2.0", "Logitech G29"] },
  { id: "stand-g29-shift", name: "Wheel Stand 2.0 + Logitech G29 + shifter", price: 669.97, save: 50, kind: "Racing", parts: ["Next Level Racing Wheel Stand 2.0", "Logitech G29", "Logitech Driving Force shifter"] },
  { id: "stand-g920", name: "Wheel Stand 2.0 + Logitech G920", price: 599.98, save: 50, kind: "Racing", parts: ["Next Level Racing Wheel Stand 2.0", "Logitech G920"] },
  { id: "moza-r9", name: "MOZA R9 V3 + KS wheel + SR-P pedals", price: 759, save: 78.99, kind: "Racing", parts: ["MOZA R9 V3 wheel base", "MOZA KS wheel", "MOZA SR-P pedals"] },
  { id: "moza-r12", name: "MOZA R12 V2 + KS wheel + SR-P2 pedals", price: 939, save: 88, kind: "Racing", parts: ["MOZA R12 V2 wheel base", "MOZA KS wheel", "MOZA SR-P 2 pedals"] },
  { id: "moza-r21", name: "MOZA R25 Ultra + RS V2 wheel + CRP2 pedals", price: 2129, save: 0, kind: "Racing", parts: ["MOZA R25 Ultra wheel base", "MOZA RS V2 wheel", "MOZA CRP2 pedals"] },
  { id: "fgt-r3", name: "F-GT Lite cockpit + MOZA R3", price: 637, save: 101.99, kind: "Racing", parts: ["Next Level Racing F-GT Lite", "MOZA R3 wheel and pedals"] },
  { id: "fgt-r5", name: "F-GT cockpit + MOZA R5", price: 988.99, save: 100, kind: "Racing", parts: ["Next Level Racing F-GT cockpit", "MOZA R5 bundle"] },
  { id: "fgt-g29", name: "F-GT cockpit + Logitech G29", price: 849.98, save: 50, kind: "Racing", parts: ["Next Level Racing F-GT cockpit", "Logitech G29"] },
  { id: "junior-g29", name: "GT Lite Junior + Logitech G29", price: 649.98, save: 0, kind: "Racing", parts: ["Next Level Racing GT Lite Junior", "Logitech G29"] },
  { id: "case-aio", name: "DarkFlash DY460 case + PCCOOLER 360mm liquid cooler", price: 199.98, save: 60, kind: "Case kit", parts: ["DarkFlash DY460 case", "PCCOOLER GT360M liquid cooler"] },
  { id: "jonsbo", name: "JONSBO D32 PRO + PCCOOLER air cooler", price: 129.99, save: 29.99, kind: "Case kit", parts: ["JONSBO D32 PRO", "PCCOOLER RZ700D air cooler"] },
  { id: "frame-psu", name: "CORSAIR FRAME 4000D + RM850x", price: 269.98, save: 35, kind: "Case kit", parts: ["CORSAIR FRAME 4000D", "CORSAIR RM850x"] },
  { id: "3500-9070", name: "CORSAIR 3500X with cooler and power + RX 9070 XT", price: 1668.99, save: 200, kind: "Case kit", parts: ["CORSAIR 3500X with RM850x and 360mm cooler", "XFX RX 9070 XT"] },
  { id: "rm850e", name: "CORSAIR RM850e + 12V-2x6 cable", price: 149.99, save: 24.99, kind: "Power kit", parts: ["CORSAIR RM850e 850W", "12V-2x6 cable"] },
  { id: "chair-foot", name: "CORSAIR TC100 chair + footrest", price: 234.99, save: 19.99, kind: "Chair", parts: ["CORSAIR TC100 chair", "CORSAIR footrest"] },
  { id: "iskur", name: "Razer Iskur V2 X chair + sleeve", price: 319.99, save: 139.99, kind: "Chair", parts: ["Razer Iskur V2 X", "Chair sleeve"] },
  { id: "hd560", name: "Sennheiser HD 560S + boom microphone", price: 199.99, save: 29.99, kind: "Sound", parts: ["Sennheiser HD 560S", "Boom microphone"] },
];
