export type MockEntry = {
  match: RegExp | string
  reply: string | ((input: string) => string)
}

// Danh sách kịch bản hội thoại mock. Thêm/sửa tại đây.
export const chatMockScripts: MockEntry[] = [
  {
    match: /xin chào|chào bạn|hello|hi/i,
    reply: [
      '<section class="finance-block suggest">',
      '  <h4 class="block-title">Gợi ý</h4>',
      '  <ul>',
      '    <li>Bắt đầu với ngân sách 50/30/20 cho thu nhập hiện tại.</li>',
      '    <li>Thiết lập quỹ dự phòng 3-6 tháng chi tiêu.</li>',
      '  </ul>',
      '</section>',
      '<section class="finance-block pros">',
      '  <h4 class="block-title">Lợi ích</h4>',
      '  <ul>',
      '    <li>Kiểm soát dòng tiền tốt hơn.</li>',
      '    <li>Giảm rủi ro khi có biến cố.</li>',
      '  </ul>',
      '</section>',
      '<section class="finance-block cons">',
      '  <h4 class="block-title">Hạn chế</h4>',
      '  <ul>',
      '    <li>Cần kỷ luật theo dõi chi tiêu hàng tuần.</li>',
      '    <li>Tỷ lệ 50/30/20 có thể cần tinh chỉnh theo thực tế.</li>',
      '  </ul>',
      '</section>',
      '<section class="finance-block do">',
      '  <h4 class="block-title">Nên làm</h4>',
      '  <ul>',
      '    <li>DCA hàng tháng vào quỹ chỉ số/ETF theo khẩu vị rủi ro.</li>',
      '    <li>Tự động hoá tiết kiệm ngay sau khi nhận lương.</li>',
      '  </ul>',
      '</section>',
      '<section class="finance-block info">',
      '  <h4 class="block-title">Bổ sung thông tin</h4>',
      '  <ul>',
      '    <li>Thu nhập bình quân, chi phí cố định/thay đổi mỗi tháng.</li>',
      '    <li>Mục tiêu (mua nhà, học tập, nghỉ hưu) và thời hạn.</li>',
      '  </ul>',
      '</section>'
    ].join('\n')
  },
  {
    match: /lập\s*kế\s*hoạch[^\n]*chứng\s*khoán|kế\s*hoạch\s*đầu\s*tư[^\n]*chứng\s*khoán|đầu\s*tư\s*chứng\s*khoán/i,
    reply: [
      '<section class="finance-block info">',
      '  <h4 class="block-title">Bối cảnh & giả định</h4>',
      '  <ul>',
      '    <li>Mục tiêu: tăng trưởng tài sản dài hạn, chấp nhận biến động ngắn hạn.</li>',
      '    <li>Quỹ dự phòng: 3–6 tháng chi tiêu (ưu tiên hoàn thành trước khi đầu tư).</li>',
      '    <li>Chu kỳ nạp vốn: DCA hàng tháng, kỷ luật theo kế hoạch.</li>',
      '  </ul>',
      '</section>',
      '<section class="finance-block suggest">',
      '  <h4 class="block-title">Khung phân bổ gợi ý</h4>',
      '  <ul>',
      '    <li>60–80%: ETF/Index (VN30/SSIAM VNFIN/ETF thế giới nếu có kênh).</li>',
      '    <li>10–20%: Trái phiếu/quỹ thu nhập cố định (ổn định danh mục).</li>',
      '    <li>10–20%: Cổ phiếu chủ động (bluechip/chủ đề dài hạn) nếu chấp nhận rủi ro.</li>',
      '  </ul>',
      '</section>',
      '<section class="finance-block do">',
      '  <h4 class="block-title">Nên làm (quy trình 6 bước)</h4>',
      '  <ul>',
      '    <li>Xác định mục tiêu/khẩu vị rủi ro/khung thời gian (>= 3–5 năm).</li>',
      '    <li>Thiết lập tài khoản, phí giao dịch thấp, bật bảo mật 2 lớp.</li>',
      '    <li>Xây dựng watchlist: ETF cốt lõi, danh mục cổ phiếu chất lượng.</li>',
      '    <li>Lập lịch DCA theo ngày cố định; tự động chuyển tiền nếu có thể.</li>',
      '    <li>Quy tắc rebalancing 6–12 tháng/lần hoặc khi lệch >5–10%.</li>',
      '    <li>Nhật ký đầu tư: lý do mua/bán, luận điểm, mốc đánh giá.</li>',
      '  </ul>',
      '</section>',
      '<section class="finance-block pros">',
      '  <h4 class="block-title">Lợi ích</h4>',
      '  <ul><li>DCA giảm rủi ro timing; ETF giúp đa dạng hóa.</li><li>Quy trình rõ ràng, dễ tuân thủ dài hạn.</li></ul>',
      '</section>',
      '<section class="finance-block cons">',
      '  <h4 class="block-title">Hạn chế</h4>',
      '  <ul><li>Không loại bỏ hoàn toàn rủi ro thị trường.</li><li>Danh mục chủ động đòi hỏi thời gian nghiên cứu.</li></ul>',
      '</section>',
      '<section class="finance-block info">',
      '  <h4 class="block-title">Thuế & chi phí</h4>',
      '  <ul>',
      '    <li>Thuế cổ tức/lãi vốn theo quy định; phí giao dịch, lưu ký ảnh hưởng lợi nhuận.</li>',
      '    <li>Nên tối ưu tần suất giao dịch để giảm chi phí, tránh lướt sóng quá mức.</li>',
      '  </ul>',
      '</section>',
      '<section class="finance-block info">',
      '  <h4 class="block-title">Bổ sung thông tin cần có</h4>',
      '  <ul>',
      '    <li>Quy mô vốn khởi điểm và nạp thêm hàng tháng.</li>',
      '    <li>Khẩu vị rủi ro (thấp/vừa/cao) và ràng buộc thời gian rút vốn.</li>',
      '  </ul>',
      '</section>'
    ].join('\n')
  },
  {
    // Nhận dạng: lương/thu nhập X triệu/tháng (có thể viết 50tr, 50 triệu, 50,000,000)
    match: /(lương|thu nhập)[^\n\d]*([0-9]{1,3}(?:[\.,][0-9]{1,3})*)\s*(triệu|tr|\b)|([0-9]{2,3}[\.,]?[0-9]{0,3}\.?(?:000)?(?:,?000){1,2})\s*(vnđ|vnd)?[^\n]*(tháng|\/tháng)/i,
    reply: (input: string) => {
      const millionNumber = (() => {
        // Thử bắt số dạng "50 triệu"
        const m1 = /(lương|thu nhập)[^\n\d]*([0-9]{1,3}(?:[\.,][0-9]{1,3})*)\s*(triệu|tr|\b)/i.exec(input)
        if (m1?.[2]) {
          const raw = m1[2].replace(/\./g, '').replace(/,/g, '.')
          const val = parseFloat(raw)
          if (!isNaN(val)) return val
        }
        // Thử dạng số lớn: 50,000,000
        const m2 = /([0-9]{2,3}[\.,]?[0-9]{0,3}\.?(?:000)?(?:,?000){1,2})\s*(vnđ|vnd)?[^\n]*(tháng|\/tháng)/i.exec(input)
        if (m2?.[1]) {
          const digits = m2[1].replace(/[^0-9]/g, '')
          const vnd = parseInt(digits, 10)
          if (!isNaN(vnd) && vnd > 0) return Math.round(vnd / 1_000_000)
        }
        return 50 // fallback mặc định 50 triệu nếu không parse được
      })()

      const monthlyGross = millionNumber // triệu VND/tháng
      const monthlyNetLow = monthlyGross * 0.85
      const monthlyNetHigh = monthlyGross * 0.9
      const monthlyTargetNet = 1000 / 12 // ~83.33 triệu/tháng để đạt 1 tỉ net/12 tháng
      const gapLow = Math.max(0, monthlyTargetNet - monthlyNetHigh)
      const gapHigh = Math.max(0, monthlyTargetNet - monthlyNetLow)

      const f = (n: number) => `${n.toFixed(1)} triệu/tháng`

      return [
        '<section class="finance-block info">',
        '  <h4 class="block-title">Thông tin đầu vào</h4>',
        `  <p>Bạn nhập: lương khoảng <strong>${monthlyGross} triệu/tháng (gross)</strong>.</p>`,
        `  <p>Ước tính net sau PIT và khấu trừ: <strong>${f(monthlyNetLow)} – ${f(monthlyNetHigh)}</strong> (hiệu quả PIT ~5–15%).</p>`,
        '</section>',
        '<section class="finance-block info">',
        '  <h4 class="block-title">Thuế và chi phí</h4>',
        '  <ul>',
        '    <li>Lương chịu PIT lũy tiến; hiệu quả thường ~5–15% tuỳ giảm trừ.</li>',
        '    <li>Nếu có thu nhập ngoài lương: tính thêm thuế kinh doanh/thuế TNCN theo mô hình.</li>',
        '  </ul>',
        '</section>',
        '<section class="finance-block suggest">',
        '  <h4 class="block-title">Gợi ý mục tiêu</h4>',
        `  <ul>`,
        `    <li>Mục tiêu 1 tỉ net/12 tháng ≈ <strong>${f(monthlyTargetNet)}</strong>.</li>`,
        `    <li>Khoảng còn thiếu mỗi tháng (ước tính): <strong>${f(gapLow)} – ${f(gapHigh)}</strong>.</li>`,
        '  </ul>',
        '</section>',
        '<section class="finance-block do">',
        '  <h4 class="block-title">Nên làm</h4>',
        '  <ul>',
        '    <li>Ngân sách 50/30/20 dựa trên lương net; tự động hoá tiết kiệm ngay khi nhận lương.</li>',
        '    <li>Tạo side income để bù phần thiếu: freelancer/sản phẩm số, bán hàng online, cố vấn chuyên môn.</li>',
        '    <li>Đầu tư: duy trì quỹ dự phòng; DCA ETF/Index; thử nghiệm 10–20% vào kênh tăng trưởng nếu chấp nhận rủi ro.</li>',
        '    <li>Thiết lập OKR theo quý: doanh thu, biên lợi nhuận, chỉ số tuần.</li>',
        '  </ul>',
        '</section>',
        '<section class="finance-block pros">',
        '  <h4 class="block-title">Lợi ích</h4>',
        '  <ul><li>Mục tiêu định lượng rõ; dễ theo dõi tiến độ.</li><li>Đa nguồn thu giảm rủi ro phụ thuộc.</li></ul>',
        '</section>',
        '<section class="finance-block cons">',
        '  <h4 class="block-title">Hạn chế</h4>',
        '  <ul><li>Khoảng thiếu lớn nếu lương net còn thấp; cần thời gian xây dựng kênh.</li><li>Đầu tư có biến động; tránh dùng vốn sinh hoạt.</li></ul>',
        '</section>'
      ].join('\n')
    }
  },
  {
    match: /(1\s*[tỉ|tỷ|ty]|1,?000,?000,?000|one billion)[^\n]*?(1\s*năm|12\s*tháng|one year)|(1\s*năm|12\s*tháng)[^\n]*?(1\s*[tỉ|tỷ|ty]|1,?000,?000,?000|one billion)/i,
    reply: [
      '<section class="finance-block info">',
      '  <h4 class="block-title">Xác định điều kiện ban đầu (thiếu dữ kiện)</h4>',
      '  <ul>',
      '    <li>Vốn khởi điểm hiện có? (0đ, 100tr, 500tr...)</li>',
      '    <li>Mức độ rủi ro chấp nhận? (an toàn, vừa phải, cao)</li>',
      '    <li>Nguồn thu nhập hiện tại? (lương, kinh doanh, đầu tư...)</li>',
      '    <li>Thời gian bạn có thể dành thêm mỗi tuần? (giờ/tuần)</li>',
      '  </ul>',
      '</section>',
      '<section class="finance-block suggest">',
      '  <h4 class="block-title">Gợi ý</h4>',
      '  <ul>',
      '    <li>Làm rõ mục tiêu: 1 tỉ sau thuế/chi phí trong 12 tháng.</li>',
      '    <li>Chia nhỏ mục tiêu: ~83,3 triệu/tháng, ~2,78 triệu/ngày.</li>',
      '    <li>Kết hợp 3 trụ: tăng thu nhập chính, side business, đầu tư.</li>',
      '  </ul>',
      '</section>',
      '<section class="finance-block info">',
      '  <h4 class="block-title">Thuế và chi phí</h4>',
      '  <ul>',
      '    <li>Mục tiêu đề xuất: <strong>1 tỉ sau thuế/chi phí</strong> (net).</li>',
      '    <li>Nếu hiệu suất thuế + chi phí ~20–30%, doanh thu trước thuế cần ~1.25–1.43 tỉ.</li>',
      '    <li>Thuế TNCN/doanh nghiệp tùy mô hình; chi phí gồm marketing, nền tảng, logistics, công cụ.</li>',
      '    <li>Với đầu tư: tính thêm phí giao dịch, thuế lãi vốn/cổ tức, chênh lệch mua bán.</li>',
      '  </ul>',
      '</section>',
      '<section class="finance-block pros">',
      '  <h4 class="block-title">Lợi ích</h4>',
      '  <ul>',
      '    <li>Tư duy mục tiêu định lượng, dễ theo dõi tiến độ.</li>',
      '    <li>Đa nguồn thu giúp giảm phụ thuộc 1 kênh.</li>',
      '  </ul>',
      '</section>',
      '<section class="finance-block cons">',
      '  <h4 class="block-title">Hạn chế</h4>',
      '  <ul>',
      '    <li>Mục tiêu rất tham vọng nếu vốn thấp và rủi ro thấp.</li>',
      '    <li>Đầu tư lợi suất cao đi kèm biến động và thua lỗ tiềm ẩn.</li>',
      '  </ul>',
      '</section>',
      '<section class="finance-block do">',
      '  <h4 class="block-title">Nên làm (kế hoạch khung)</h4>',
      '  <ul>',
      '    <li>Tăng thu nhập chính: đàm phán lương, nhận dự án thêm theo kỹ năng.</li>',
      '    <li>Side business: sản phẩm số/dịch vụ freelancer, bán lẻ online, tư vấn chuyên môn.</li>',
      '    <li>Đầu tư: ưu tiên quỹ dự phòng 3-6 tháng; phần còn lại DCA ETF/Index, thí điểm 10-20% vào kênh tăng trưởng nếu chịu rủi ro.</li>',
      '    <li>OKR hàng quý: xác định doanh thu, biên lợi nhuận, chỉ số theo dõi tuần.</li>',
      '  </ul>',
      '</section>',
      '<section class="finance-block info">',
      '  <h4 class="block-title">Bổ sung thông tin cần có</h4>',
      '  <ul>',
      '    <li>Vốn khởi điểm, dòng tiền ròng/tháng.</li>',
      '    <li>Kỹ năng/kinh nghiệm có thể thương mại hoá.</li>',
      '    <li>Mức chấp nhận drawdown và kỳ vọng lợi suất.</li>',
      '  </ul>',
      '</section>'
    ].join('\n')
  },
  {
    match: /giới thiệu dự án|about project|dự án này là gì/i,
    reply: [
      '<section class="finance-block suggest">',
      '  <h4 class="block-title">Gợi ý</h4>',
      '  <p>Đây là bản demo mock hội thoại giữa người dùng và chuyên viên tư vấn tài chính.</p>',
      '</section>',
      '<section class="finance-block pros">',
      '  <h4 class="block-title">Lợi ích</h4>',
      '  <ul><li>Kiểm thử UI/UX hội thoại mà không cần backend.</li><li>Phản hồi có cấu trúc rõ ràng.</li></ul>',
      '</section>',
      '<section class="finance-block cons">',
      '  <h4 class="block-title">Hạn chế</h4>',
      '  <ul><li>Dữ liệu cố định, không học theo ngữ cảnh.</li></ul>',
      '</section>',
      '<section class="finance-block do">',
      '  <h4 class="block-title">Nên làm</h4>',
      '  <ul><li>Điều chỉnh kịch bản trong src/mocks/chatMock.ts theo use case.</li></ul>',
      '</section>',
      '<section class="finance-block info">',
      '  <h4 class="block-title">Bổ sung thông tin</h4>',
      '  <ul><li>Tech: React, Ant Design, ReactMarkdown, rehype-raw.</li></ul>',
      '</section>'
    ].join('\n')
  },
  {
    match: /tính năng|features/i,
    reply: [
      '**Các tính năng chính:**',
      '- Lịch sử hội thoại ở sidebar',
      '- Gợi ý nhập liệu và markdown',
      '- Mô phỏng đang soạn trả lời',
    ].join('\n')
  },
  {
    match: /test mock: (.*)/i,
    reply: (input: string) => {
      const m = /test mock: (.*)/i.exec(input)
      const payload = m?.[1] ?? ''
      return [
        '<section class="finance-block suggest">',
        '  <h4 class="block-title">Gợi ý</h4>',
        `  <p>Đã nhận dữ liệu test: <strong>${payload}</strong></p>`,
        '</section>'
      ].join('\n')
    }
  },
]

export function findMockReply(input: string): string | undefined {
  for (const entry of chatMockScripts) {
    if (typeof entry.match === 'string') {
      if (input.toLowerCase().includes(entry.match.toLowerCase())) {
        return typeof entry.reply === 'function' ? entry.reply(input) : entry.reply
      }
    } else {
      if (entry.match.test(input)) {
        return typeof entry.reply === 'function' ? entry.reply(input) : entry.reply
      }
    }
  }
  return undefined
}


