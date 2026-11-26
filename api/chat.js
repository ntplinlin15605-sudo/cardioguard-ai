export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên Vercel.' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Nội dung câu hỏi trống.' });
  }

  const systemPrompt = `Bạn là Dược sĩ Lâm sàng chuyên khoa Tim mạch. Nhiệm vụ của bạn là phân tích tương tác thuốc tim mạch chính xác, ngắn gọn, dễ tra cứu trên lâm sàng.
Khi trả lời, hãy trình bày rõ ràng theo cấu trúc 4 phần:
1. **Mức độ nghiêm trọng:** Ghi rõ một trong 3 mức: 🔴 NGHIÊM TRỌNG / CHỐNG CHỈ ĐỊNH, 🟠 TRUNG BÌNH / CẦN THEO DÕI CHẶT, hoặc 🟢 NHẸ / AN TOÀN.
2. **Cơ chế tương tác:** Giải thích ngắn gọn cơ chế dược động học (CYP450, P-gp, thải trừ thận...) hoặc dược lực học.
3. **Hậu quả lâm sàng:** Nêu rõ biến cố có thể xảy ra (ví dụ: xuất huyết, tăng kali máu, kéo dài khoảng QT, tiêu cơ vân, tụt huyết áp...).
4. **Hướng xử trí & Khuyến cáo:** Đề xuất thuốc thay thế an toàn hơn, cách chỉnh liều, giãn cách thời gian uống hoặc chỉ số xét nghiệm cần theo dõi (INR, Kali máu, ECG, CK...).`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ]
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Lỗi từ Gemini API' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không nhận được phản hồi từ AI.';
    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi hệ thống: ' + error.message });
  }
}
