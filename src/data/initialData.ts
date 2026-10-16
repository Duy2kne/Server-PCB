import { Product, QuoteRequest, CompanySettings } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title: 'Mạch điều khiển Chiller Mini 12V ESP32',
    category: 'Thiết kế PCB',
    status: 'Thương mại sẵn có',
    priceEstimate: 'Liên hệ theo số lượng',
    shortDesc: 'Điều khiển nhiệt độ hồ cá và thiết bị làm lạnh mini qua WiFi/App, cảm biến nhiệt độ chính xác cao, ngõ ra MOSFET công suất và Relay kép.',
    fullDesc: 'Giải pháp bo mạch điều khiển Chiller Mini 12V tối ưu cho hồ thủy sinh, tủ bảo quản mẫu sinh học hoặc hệ thống tản nhiệt Peltier. Sử dụng vi điều khiển ESP32 32-bit lõi kép hỗ trợ kết nối WiFi/BLE, tích hợp web server nội bộ và điều khiển qua app điện thoại. Bo mạch được thiết kế cách ly hoàn toàn giữa khối logic và khối công suất tải cao, chống nhiễu tuyệt đối và có cơ chế giám sát dòng quá tải.',
    imageUrl: '/src/assets/images/chiller_esp32_board_1792125857487.jpg',
    updatedAt: '2026-10-12',
    featured: true,
    specs: [
      { key: 'Vi điều khiển', value: 'ESP32-WROOM-32E (Dual-core 240MHz, WiFi + BLE)' },
      { key: 'Điện áp cấp', value: '12V DC (dải làm việc 9V - 16V DC)' },
      { key: 'Cảm biến nhiệt độ', value: 'DS18B20 chống nước (độ chính xác ±0.1°C) / NTC 10K' },
      { key: 'Ngõ ra tải', value: '4 kênh MOSFET IRFZ44N tản nhiệt nhôm + 2 Relay cách ly quang' },
      { key: 'Giao tiếp điều khiển', value: 'App di động (iOS/Android), Web Dashboard nội bộ, MQTT/Blynk' },
      { key: 'Chuẩn bảo vệ', value: 'Cầu chì tự phục hồi PPTC, Diode chống ngược cực, Snubber lọc xung' }
    ],
    features: [
      'Điều khiển nhiệt độ theo dải hysteresis tùy chỉnh mượt mà',
      'Tự động bù sai số cảm biến và cảnh báo quá nhiệt qua còi chíp & thông báo điện thoại',
      'Giao diện màn hình OLED hiển thị trạng thái thời gian thực',
      'Được phủ conformal coating chống ẩm và ăn mòn hóa chất'
    ]
  },
  {
    id: 'prod-2',
    title: 'Mạch điều khiển nồi hơi tự động 2 que dò',
    category: 'Thiết kế PCB',
    status: 'Sản xuất theo đơn',
    priceEstimate: 'Liên hệ báo giá kỹ thuật',
    shortDesc: 'Sử dụng IC chuyên dụng nhận diện mực nước que thấp - que cao, tự động cấp nước và bảo vệ chống cháy thanh nhiệt (Heater).',
    fullDesc: 'Bo mạch điều khiển cấp nước và bảo vệ an toàn cho nồi hơi công nghiệp, nồi nấu phở, máy xông hơi hoặc buồng hấp tiệt trùng. Mạch ứng dụng nguyên lý dẫn điện của nước với dòng xoay chiều tần số cao để chống hiện tượng điện phân mòn que dò inox. Tích hợp thuật toán chống sóng sánh mặt nước, tự động bật máy bơm cấp nước khi dưới que thấp và dừng khi chạm que cao, ngắt ngay nguồn thanh nhiệt khi cạn nước.',
    imageUrl: '/src/assets/images/boiler_controller_pcb_1792125859286.jpg',
    updatedAt: '2026-10-10',
    featured: true,
    specs: [
      { key: 'IC xử lý trung tâm', value: 'Dedicated AC Probe Level Detection IC + MCU giám sát' },
      { key: 'Điện áp que dò', value: 'Xung AC 8V/2kHz (chống điện phân và rỉ sét que que)' },
      { key: 'Nguồn hoạt động', value: '220V AC / 50Hz (nguồn cách ly biến áp xung công nghiệp)' },
      { key: 'Ngõ ra điều khiển', value: 'Relay Omron 30A cho bơm cấp + Khởi động từ thanh nhiệt' },
      { key: 'Cơ chế trễ', value: 'Lọc nhiễu sóng sánh 3.5 giây chống đóng cắt liên tục' },
      { key: 'Khoảng cách que', value: 'Hỗ trợ cáp tín hiệu que dò dài tới 50 mét' }
    ],
    features: [
      'Cơ chế bảo vệ 3 lớp: Báo động cạn que thấp, tự ngắt thanh nhiệt tức thì',
      'Đèn LED chỉ thị trực quan: Nguồn, Bơm chạy, Que thấp, Que cao, Cảnh báo lỗi',
      'Đạt chuẩn cách điện xung cao áp IEC 60950-1',
      'Độ bền đóng cắt rơ le trên 100.000 chu kỳ tải công nghiệp'
    ]
  },
  {
    id: 'prod-3',
    title: 'Bộ Gateway IoT Công Nghiệp RS485 sang Ethernet / MQTT',
    category: 'Automation Tools',
    status: 'Thương mại sẵn có',
    priceEstimate: 'Liên hệ cấu hình I/O',
    shortDesc: 'Bộ điều khiển truyền thông công nghiệp thu thập dữ liệu Modbus RTU/TCP, đẩy dữ liệu lên Cloud SCADA và giám sát qua Web.',
    fullDesc: 'Gateway IoT công nghiệp chuẩn gá DIN-Rail hỗ trợ thu thập dữ liệu từ các cảm biến nhiệt ẩm, đồng hồ điện tử và biến tần qua RS485 Modbus RTU. Xử lý dữ liệu tại biên (Edge Computing) và truyền lên máy chủ Web Dashboard qua cổng Ethernet hoặc mạng 4G/LTE. Thiết kế đạt tiêu chuẩn chống sốc điện công nghiệp surge 2kV và cách ly quang.',
    imageUrl: '/src/assets/images/automation_software_pcb_1792125859834.jpg',
    updatedAt: '2026-10-08',
    featured: true,
    specs: [
      { key: 'Vi xử lý', value: 'ARM Cortex-M4 168MHz + Bộ nhớ Flash mở rộng' },
      { key: 'Cổng giao tiếp', value: '2x RS485 Isolated, 1x Ethernet 10/100M, 1x USB Type-C' },
      { key: 'Giao thức hỗ trợ', value: 'Modbus RTU, Modbus TCP, MQTT, HTTP RESTful, JSON' },
      { key: 'Nguồn cấp', value: '9V - 36V DC cách ly nguồn xung rộng' },
      { key: 'Chống sốc điện', value: 'Surge protection IEC 61000-4-5 Level 4 (4kV)' },
      { key: 'Nhiệt độ hoạt động', value: '-20°C đến +70°C chuẩn công nghiệp' }
    ],
    features: [
      'Giao diện cấu hình Web trực quan qua cổng Ethernet nội bộ',
      'Tự động kết nối lại khi mất mạng và lưu đệm dữ liệu vào thẻ MicroSD',
      'Đèn LED hiển thị trạng thái nguồn, TX/RX dữ liệu và kết nối mạng',
      'Hỗ trợ nâng cấp phần mềm từ xa qua OTA an toàn'
    ]
  },
  {
    id: 'prod-4',
    title: 'Hệ thống phần mềm Automation giám sát dây chuyền PC/Web',
    category: 'Automation Tools',
    status: 'Dự án OEM/ODM',
    priceEstimate: 'Theo quy mô dây chuyền',
    shortDesc: 'Tool tự động thu thập dữ liệu sản xuất, điều khiển thiết bị và xuất báo cáo tự động trên nền tảng PC và Web SCADA.',
    fullDesc: 'Nền tảng phần mềm SCADA & IoT công nghiệp thu thập dữ liệu sản xuất thời gian thực từ PLC, vi điều khiển bo mạch nhúng, cảm biến và cân định lượng. Cung cấp bảng điều khiển (Dashboard) trực quan theo dõi sản lượng OEE, cảnh báo sự cố qua Telegram/Zalo, điều khiển từ xa quy trình đóng mở van và động cơ với độ trễ thấp.',
    imageUrl: '/src/assets/images/automation_software_pcb_1792125859834.jpg',
    updatedAt: '2026-10-05',
    featured: true,
    specs: [
      { key: 'Kiến trúc phần mềm', value: 'Microservices Electron (Desktop) + Web Realtime Dashboard' },
      { key: 'Chuẩn giao thức hỗ trợ', value: 'Modbus RTU/TCP, CANopen, RS485, MQTT, OPC UA, REST API' },
      { key: 'Khả năng kết nối', value: 'Lên tới 128 trạm máy trạm / sensor đồng thời' },
      { key: 'Tốc độ lấy mẫu', value: '10ms - 100ms với bộ đệm chống mất gói tin' },
      { key: 'Báo cáo xuất dữ liệu', value: 'Tự động tạo file Excel, PDF, đẩy lên Google Sheets hoặc ERP' },
      { key: 'Bảo mật', value: 'Phân quyền 3 cấp Admin / Kỹ sư / Công nhân vận hành' }
    ],
    features: [
      'Bản đồ trực quan hiển thị trạng thái từng dây chuyền sản xuất',
      'Đồ thị phân tích nhiệt độ, áp suất, độ ẩm và điện năng tiêu thụ',
      'Cảnh báo sớm ngưỡng an toàn qua còi báo và tin nhắn tức thời',
      'Hỗ trợ chế độ Offline khi mất kết nối mạng và tự đồng bộ khi có mạng lại'
    ]
  },
  {
    id: 'prod-5',
    title: 'Bo mạch nguồn công nghiệp đa ngõ ra Isolated DC-DC',
    category: 'Gia công & PCBA',
    status: 'Sản xuất theo đơn',
    priceEstimate: 'Liên hệ số lượng gia công SMT',
    shortDesc: 'Mạch hạ áp cách ly công nghiệp 24VDC sang 5V/3A và 3.3V/2A với bộ lọc EMC Class B và bảo vệ chống đột biến điện áp.',
    fullDesc: 'Bo nguồn chuyển đổi DC-DC cách ly galvanically thiết kế phục vụ tủ điện điều khiển công nghiệp, PLC và hệ thống nhúng giao tiếp Modbus/RS485. Tối ưu diện tích mạch trên chuẩn bo 4 lớp, cuộn cảm shielding cao cấp đảm bảo gợn điện áp (ripple noise) dưới 20mVpp.',
    imageUrl: '/src/assets/images/hero_pcb_automation_1792125856876.jpg',
    updatedAt: '2026-10-01',
    featured: false,
    specs: [
      { key: 'Điện áp đầu vào', value: '18V - 36V DC (Đỉnh xung chịu được 45V)' },
      { key: 'Ngõ ra độc lập', value: 'Channnel 1: 5.0V / 3A; Channel 2: 3.3V / 2A' },
      { key: 'Độ gợn sóng (Ripple)', value: '< 20 mVpp ở tải 100%' },
      { key: 'Hiệu suất chuyển đổi', value: 'Lên tới 92%' },
      { key: 'Tiêu chuẩn EMC', value: 'EN55032 Class B, chống tĩnh điện ESD 8kV' }
    ],
    features: [
      'Bảo vệ ngắn mạch ngõ ra với cơ chế tự phục hồi Hiccup',
      'Lớp đồng mạ vàng ENIG 2u dày dặn chịu nhiệt độ môi trường lên tới 85°C',
      'Dễ dàng gắn rail nhôm DIN-Rail tiêu chuẩn tủ điện'
    ]
  }
];

export const INITIAL_LEADS: QuoteRequest[] = [
  {
    id: 'lead-1',
    code: 'DY-REQ-8831',
    fullName: 'Trần Minh Hoàng',
    company: 'Công Ty Cổ Phần Thiết Bị Điện Tân Phát',
    phone: '0912.456.789',
    email: 'hoang.tm@tanphatelectric.vn',
    serviceType: 'Thiết kế PCB',
    quantityEstimate: '500 - 1000 pcs',
    timeline: '3 - 4 tuần',
    requirements: 'Cần thiết kế lại mạch điều khiển động cơ không chổi than BLDC 48V, bổ sung giao tiếp RS485 Modbus RTU và tích hợp bảo vệ quá dòng phần cứng. Có file Schematic nháp dạng PDF.',
    attachedFiles: [
      { name: 'Schematic_Draft_BLDC_v1.pdf', size: '2.4 MB', type: 'application/pdf' },
      { name: 'Mechanical_Envelope_3D.step', size: '5.1 MB', type: 'model/step' }
    ],
    status: 'reviewing',
    createdAt: '2026-10-14T09:30:00Z',
    internalNotes: 'Đã liên hệ sơ bộ qua điện thoại. Khách cần gửi bản Layout mẫu trước ngày 20/10.'
  },
  {
    id: 'lead-2',
    code: 'DY-REQ-8832',
    fullName: 'Nguyễn Thị Bích Phương',
    company: 'AquaTech Solutions Việt Nam',
    phone: '0988.332.115',
    email: 'phuong.aquatech@gmail.com',
    serviceType: 'Gia công & PCBA',
    quantityEstimate: '200 pcs (Chiller Controller)',
    timeline: '2 tuần',
    requirements: 'Đặt gia công PCBA hoàn thiện cho bo mạch Chiller Mini 12V ESP32 theo mẫu sẵn có của DY AUTOMATION, yêu cầu nạp sẵn firmware và phủ keo chống ẩm.',
    attachedFiles: [
      { name: 'Order_Specs_AquaTech_Oct2026.xlsx', size: '420 KB', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    ],
    status: 'quoted',
    createdAt: '2026-10-13T14:15:00Z',
    internalNotes: 'Đã gửi báo giá 200 bộ linh kiện SMT + hàn dán tự động qua email.'
  },
  {
    id: 'lead-3',
    code: 'DY-REQ-8833',
    fullName: 'Lê Quang Vũ',
    company: 'Nhà máy Sản xuất Thiết bị Nhiệt Đông Dương',
    phone: '0977.889.012',
    email: 'vu.le@dongduongthermal.com.vn',
    serviceType: 'Gia công & PCBA',
    quantityEstimate: '500 bo mạch PCBA',
    timeline: 'Trong vòng 2 - 4 tuần',
    requirements: 'Cần gia công sản xuất phôi PCB 4 lớp và hàn dán linh kiện SMT cho 500 bo mạch điều khiển nguồn và rơle nồi hơi. Cần phủ Conformal Coating chống ẩm công nghiệp.',
    attachedFiles: [
      { name: 'Gerber_Boiler_Rev2_Outputs.zip', size: '8.8 MB', type: 'application/zip' }
    ],
    status: 'new',
    createdAt: '2026-10-15T08:00:00Z',
    internalNotes: 'Khách hàng cần báo giá gia công SMT và linh kiện chính hãng cho 500 bộ.'
  }
];

export const INITIAL_SETTINGS: CompanySettings = {
  companyName: 'DY AUTOMATION TECHNOLOGY CO., LTD',
  shortName: 'DY AUTOMATION',
  brandSlogan: 'Giải Pháp Toàn Diện Từ Thiết Kế Hardware, Sản Xuất PCB Đến Phần Mềm Tự Động Hóa SCADA/IoT',
  hotline: '0986.234.568',
  technicalSupport: '0912.890.334 (Kỹ sư trưởng R&D)',
  email: 'contact@dyautomation.vn',
  addressHanoi: 'Số 48 Ngõ 168 Nguyễn Xiển, Thanh Xuân, Hà Nội',
  addressHcm: 'Khu Công Nghệ Cao (SHTP), TP. Thủ Đức, TP. Hồ Chí Minh',
  workingHours: 'Thứ 2 - Thứ 7: 08:00 - 18:00 (Hỗ trợ khẩn cấp 24/7)',
  zaloUrl: 'https://zalo.me/0986234568',
  techStandards: 'IPC-A-610 Class 2 & 3 · ISO 9001:2015 · RoHS Compliant',
  taxCode: '0109988776'
};
