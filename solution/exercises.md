# K4 — Ngày 1: Bài Tập & Phản Ánh
## Khám Phá LLM API | Phiếu Thực Hành

**Thời lượng:** 4 tiếng
**Cách làm:** Trả lời từng câu ngay sau khi hoàn thành block tương ứng —
đừng để dồn hết về cuối buổi. Thay dòng `*Câu trả lời của bạn*` bằng câu
trả lời thật (chấm tự động sẽ đếm số câu đã trả lời).

---

## Block 1 — API Cơ Bản (trả lời sau Checkpoint 1)

### Câu 1.1 — Độ nhạy của temperature
Gọi `call_openai` với temperature 0.0, 0.5, 1.0 và 1.5 dùng prompt
**"Hãy kể cho tôi một sự thật thú vị về Việt Nam."**
Với temprature 0.0 và 0.5, AI trả lời logic, nhất quán hơn, còn khi sử dụng 1.0 và 1.5 thì AI trả lời bay bổng, sáng tạo hơn, tuy nhiên có thể dẫn đến hiện tượng halluciation
**Bạn nhận thấy quy luật gì qua bốn phản hồi?** (2–3 câu)
Dù temperature bằng mấy thì câu trả lời của AI khác nhau qua mỗi lượt trả lời
### Câu 1.2 — Chọn temperature cho sản phẩm
**Bạn sẽ đặt temperature bao nhiêu cho chatbot hỗ trợ khách hàng, và tại sao?**
Mnfh sẽ đặt temperature là 0.3 vì chatbot cần sự chính xác, bám sát tài liệu hướng dẫn
### Câu 1.3 — Đánh đổi chi phí
Kịch bản: 10.000 người dùng hoạt động mỗi ngày, mỗi người gọi API 3 lần,
mỗi lần trung bình ~350 token đầu ra.

**Ước tính GPT-4o đắt hơn GPT-4o-mini bao nhiêu lần cho workload này? Nêu một
trường hợp GPT-4o xứng đáng với chi phí và một trường hợp nên dùng mini:**
GPT-4o đắt gấp gần 17 lần cho workload này
GPT-4o:26250$
GPT-4o-mini: 1575$
- GPT-4o sử dụng xứng đáng khi sử dụng cho tác vụ cần sự logic cho các tác vụ phức tạp như plan dự án, viết code
- GPT-4o-mini sử dụng cho các tác vụ đơn giản như tóm tắt văn bản, trả lời câu hỏi ngắn

---

## Block 2 — System Prompt & Token (trả lời sau Checkpoint 2)

### Câu 2.1 — Sức mạnh của persona
Gọi `chat_with_system_prompt` hai lần với cùng câu hỏi
**"Giải thích blockchain là gì?"** nhưng hai system prompt khác nhau:
- "Bạn là giáo viên tiểu học, giải thích thật đơn giản cho trẻ 8 tuổi."
- "Bạn là chuyên gia tài chính, trả lời chuyên sâu bằng thuật ngữ kỹ thuật."

**Hai phản hồi khác nhau như thế nào (độ dài, từ vựng, ví dụ)? System prompt
ảnh hưởng đến hành vi model ra sao?** (3–4 câu)
- Phản hồi cho trẻ 8 tuổi ngắn, từ vựng gần gũi và không dùng từ ngữ kỹ thuật. Phản hồi chuyên gia tài chính dài hơn,sử dụng các thuật ngữ chuyên sâu
Ví dụ:
- Đối với trẻ 8 tuổi: hãy tưởng tượng bạn và những người bạn có một quyển sổ đặc biệt. Mỗi khi có một việc xảy ra, chẳng hạn như một người đưa đồ chơi cho người khác, mọi người đều ghi việc đó vào sổ. Tất cả mọi người đều kiểm tra bản ghi của nhau để đảm bảo thông tin là chính xác.

Mỗi “block” có thể được hiểu giống như một trang trong quyển sổ, và các trang được liên kết với nhau thành một “chain”. Vì mọi người đều có một bản sao nên rất khó để một người tự ý thay đổi thông tin cũ.
- Đối với chuyên gia: Blockchain là một dạng công nghệ sổ cái phân tán (Distributed Ledger Technology – DLT), trong đó các bản ghi giao dịch được tổ chức thành những khối (block) và liên kết với nhau bằng các kỹ thuật mật mã (cryptography).

Một số đặc điểm quan trọng của blockchain bao gồm phi tập trung (decentralization), tính bất biến (immutability), tính minh bạch (transparency) và cơ chế đồng thuận (consensus mechanism).

Về mặt kỹ thuật, mỗi block thường chứa block header, danh sách giao dịch, hash của block trước đó, timestamp và nonce tùy thuộc vào thiết kế blockchain. Các giao dịch có thể được tổ chức bằng Merkle Tree để tối ưu việc xác minh dữ liệu.

Blockchain có thể sử dụng nhiều cơ chế đồng thuận khác nhau, chẳng hạn như Proof of Work (PoW) hoặc Proof of Stake (PoS). Ngoài việc ghi nhận giao dịch tiền mã hóa, blockchain còn hỗ trợ smart contracts, cho phép thực thi các logic nghiệp vụ một cách tự động trên mạng lưới.
=> System prompt định hình hành vi model: xác định vai trò, người đọc, độ sâu từ vựng, phong cách trả lời

### Câu 2.2 — tiktoken vs đếm từ
Chọn một đoạn văn tiếng Việt ~100 từ. So sánh số token theo `count_tokens`
(tiktoken) với ước lượng `số từ / 0.75` mà Part 1 đã dùng.

**Hai con số chênh nhau bao nhiêu phần trăm? Vì sao tiếng Việt thường tốn
nhiều token hơn tiếng Anh cùng độ dài?**
Khoảng 0.19%, vì tiếng Việt là ngôn ngữ có dấu, có tiền tố, hậu tố.
---

## Block 3 — Streaming & Độ Bền (trả lời sau Checkpoint 3)

### Câu 3.1 — Trải nghiệm người dùng với streaming
**Streaming quan trọng nhất trong trường hợp nào, và khi nào thì
non-streaming lại phù hợp hơn?** (1 đoạn văn)
Streaming trọng khi sử dụng chatbot, vì nó giúp người dùng có cảm giác như đang nói chuyện với người thật, phù hợp với các ứng dụng cần tương tác real-time
Non-streaming cần khi người dùng cần đầy đủ output trước khi xử lý tiếp.

### Câu 3.2 — Vì sao backoff theo cấp số nhân?
**So với delay cố định (ví dụ luôn chờ 1 giây), exponential backoff có lợi
thế gì khi API bị quá tải? Điều gì xảy ra nếu hàng nghìn client cùng retry
với delay cố định giống nhau?**
Exponential backoff giảm dần tốc độ request khi API bị quá tải, tránh làm quá tải API khi hàng nghìn client cùng retry một lúc

---

## Block 4 — Mini-Project (trả lời sau Checkpoint 4)

### Câu 4.1 — Thiết kế persona
**Bạn chọn persona gì cho trợ lý của mình? Viết lại system prompt đó và giải
thích 1–2 lựa chọn từ ngữ quan trọng trong prompt (ví dụ: vì sao yêu cầu
"trả lời ngắn gọn", vì sao chỉ định ngôn ngữ...):**

System prompt của tôi:
Bạn là một trợ lý cố vấn cho Kỹ sư Trí tuệ nhân tạo, hỗ trợ người dùng học tập và xây dựng các hệ thống AI, đặc biệt trong các lĩnh vực LLM, RAG, AI Agent và ứng dụng AI.

Phong cách của bạn chuyên nghiệp, thực tế, kiên nhẫn và khuyến khích người học. Hãy giải thích rõ ràng, có hệ thống và ví dụ.Hạn chế sử dụng thuật ngữ khó hiểu khi không cần thiết.

Khi trả lời:

Đưa ra ý chính và câu trả lời quan trọng nhất trước.
Trả lời ngắn gọn, tập trung vào vấn đề, trừ khi người dùng yêu cầu giải thích chi tiết.
Sử dụng ví dụ, phép so sánh và đoạn mã ngắn khi chúng giúp người dùng dễ hiểu hơn. Giải thích tại sao cách đó phù hợp.
Khi có nhiều cách tiếp cận, hãy so sánh ngắn gọn ưu điểm, nhược điểm và sự đánh đổi của từng cách.
Trả lời bằng tiếng Việt. 
Không tự bịa thông tin. Nếu không chắc chắn, hãy nói rõ mức độ không chắc chắn.
Cuối cùng, cần đưa ra nguồn bài viết 

Giải thích: 
- Đưa ra ý chính: giúp nắm được câu trả lời trước khi giải thích
- Đưa ra nguồn bài viết: để kiểm tra thông tin, tránh bịa thông tin

### Câu 4.2 — Hạn chế & cải thiện
**Trợ lý của bạn hiện có hạn chế lớn nhất là gì (ví dụ: history chỉ 3 lượt,
không có bộ nhớ dài hạn, không kiểm duyệt nội dung...)? Đề xuất một cải
thiện cụ thể và mô tả ngắn cách triển khai:**

- Hạn chế: model free nên bộ nhớ ngắn hạn, không có khả năng suy luận phức tạp
---

## Danh Sách Kiểm Tra Nộp Bài

- [ ] `python grade.py` — xem điểm tự động, mục tiêu ≥ 75/100
- [ ] Cả 4 checkpoint pytest đều pass
- [ ] Tất cả 9 câu trong file này đã được trả lời
- [ ] Đã copy bài làm vào folder `solution/`, push lên fork và dán link trên trang bài Lab ở VLearn trước 23:59 ngày 11/09/2026
