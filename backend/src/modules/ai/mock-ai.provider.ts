import { Injectable } from '@nestjs/common';
import {
  AiProvider,
  AiProviderContext,
  AiProviderInput,
  AiProviderResult,
  AiProviderUnavailable,
} from './ai-provider';

@Injectable()
export class MockAiProvider extends AiProvider {
  async generateText(input: AiProviderInput, context: AiProviderContext): Promise<AiProviderResult> {
    if (context.signal.aborted) throw new AiProviderUnavailable();

    const lastMessage = input.messages[input.messages.length - 1]?.content?.toLowerCase() || '';
    const prompt = input.systemPrompt || '';
    // 1. GREETING & BASIC QUESTIONS
    if (lastMessage.includes('xin chào') || lastMessage.includes('chào bạn') || lastMessage === 'chào') {
      const text =
        'Xin chào! Tôi là Trợ lý AI của DX-OS. Tôi có thể hỗ trợ bạn tra cứu và phân tích số liệu nhân sự, phòng ban, chấm công, nghỉ phép, lương thưởng, hiệu suất và tuân thủ hồ sơ của tổ chức.';
      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 15, outputTokens: 35 },
      };
    }
    // 2. WORKFORCE ANALYTICS
    if (
      lastMessage.includes('phân tích tình hình nhân sự') ||
      lastMessage.includes('phân tích nhân sự') ||
      lastMessage.includes('tình hình nhân sự')
    ) {
      const totalMatch = prompt.match(/Tổng số nhân sự: (\d+)/);
      const activeMatch = prompt.match(/Đang hoạt động: (\d+)/);
      const inactiveMatch = prompt.match(/Ngừng hoạt động: (\d+)/);
      const topDeptMatch = prompt.match(/Phòng ban đông nhất: ([^\n\r]+)/);

      const total = totalMatch ? totalMatch[1] : '5';
      const active = activeMatch ? activeMatch[1] : total;
      const inactive = inactiveMatch ? inactiveMatch[1] : '0';
      const topDept = topDeptMatch ? topDeptMatch[1] : 'Phòng Kỹ thuật';

      const text = `## Tổng quan
Tình hình nhân sự của tổ chức hiện duy trì trạng thái ổn định với tỷ lệ nhân sự hoạt động tích cực đạt mức cao.

## Chỉ số chính
- Tổng số nhân sự: ${total} người
- Nhân sự đang hoạt động (Active): ${active} người (100% nhân sự sẵn sàng làm việc)
- Nhân sự ngừng hoạt động (Inactive): ${inactive} người
- Phòng ban quy mô lớn nhất: ${topDept}

## So sánh
- Cơ cấu nhân sự được phân bổ tập trung vào các phòng ban nghiệp vụ cốt lõi, không có biến động giảm đột biến so với kỳ trước.

## Insight
- Toàn bộ lực lượng lao động hiện tại đều gắn liền với các vị trí công việc cụ thể, đảm bảo vận hành liên tục cho doanh nghiệp.

## Cần chú ý
- Cần tiếp tục theo dõi tiến độ tuyển dụng mới nếu có kế hoạch mở rộng các dự án kỹ thuật trong quý tiếp theo.`;

      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 40, outputTokens: 180 },
      };
    }

    // Single headcount question
    if (lastMessage.includes('bao nhiêu nhân viên') || lastMessage.includes('số lượng nhân viên')) {
      const match = prompt.match(/Tổng số nhân sự: (\d+)/);
      const count = match ? match[1] : '5';
      const text = `Tổ chức hiện có ${count} nhân sự đang hoạt động trong hệ thống DX-OS.`;
      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 20, outputTokens: 20 },
      };
    }
    // 3. ATTENDANCE ANALYTICS
    if (
      lastMessage.includes('phân tích chấm công') ||
      lastMessage.includes('tình hình chấm công') ||
      lastMessage.includes('attendance')
    ) {
      const attRateMatch = prompt.match(/Tỷ lệ đi làm \(Attendance rate\): ([\d.]+)%/);
      const lateRateMatch = prompt.match(/Tỷ lệ đi muộn \(Late rate\): ([\d.]+)%/);
      const lateCountMatch = prompt.match(/Đi muộn: (\d+)/);
      const totalRecMatch = prompt.match(/Tổng lượt ghi nhận: (\d+)/);
      const hoursMatch = prompt.match(/Tổng giờ làm: ([\d.]+) giờ/);

      const attRate = attRateMatch ? attRateMatch[1] : '100';
      const lateRate = lateRateMatch ? lateRateMatch[1] : '20';
      const lateCount = lateCountMatch ? lateCountMatch[1] : '1';
      const totalRec = totalRecMatch ? totalRecMatch[1] : '5';
      const hours = hoursMatch ? hoursMatch[1] : '40';

      const text = `## Tổng quan
Tình hình chấm công trong kỳ ghi nhận tỷ lệ đi làm ổn định, tuy nhiên có phát sinh lượt đi muộn cần theo dõi.

## Chỉ số chính
- Tỷ lệ đi làm (Attendance rate): ${attRate}%
- Tỷ lệ đi muộn (Late rate): ${lateRate}%
- Tổng số lượt đi muộn: ${lateCount} lượt
- Tổng lượt chấm công ghi nhận: ${totalRec} lượt
- Tổng thời lượng làm việc: ${hours} giờ

## So sánh
- So sánh kỳ: Hệ thống ghi nhận số liệu chấm công duy trì liên tục qua các ngày làm việc thực tế.

## Insight
- Đa số nhân sự tuân thủ tốt lịch trình ca làm việc được phân công, đảm bảo số giờ làm việc trung bình tiêu chuẩn.

## Cần chú ý
- Có ${lateCount} lượt đi muộn ghi nhận trong kỳ. Dữ liệu hiện có chưa xác định được nguyên nhân cụ thể dẫn đến việc đi muộn.`;

      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 45, outputTokens: 190 },
      };
    }
    // 4. LEAVE ANALYTICS
    if (
      lastMessage.includes('phân tích nghỉ phép') ||
      lastMessage.includes('tình hình nghỉ phép') ||
      lastMessage.includes('nghỉ phép tháng này')
    ) {
      const pendingMatch = prompt.match(/Đang chờ duyệt: (\d+)/);
      const approvedMatch = prompt.match(/Đã duyệt: (\d+)/);
      const totalDaysMatch = prompt.match(/Tổng ngày nghỉ đã duyệt: ([\d.]+) ngày/);
      const avgDaysMatch = prompt.match(/Ngày nghỉ trung bình mỗi nhân viên active: ([\d.]+) ngày\/người/);

      const pending = pendingMatch ? pendingMatch[1] : '1';
      const approved = approvedMatch ? approvedMatch[1] : '1';
      const totalDays = totalDaysMatch ? totalDaysMatch[1] : '1.5';
      const avgDays = avgDaysMatch ? avgDaysMatch[1] : '0.3';

      const text = `## Tổng quan
Tình hình nghỉ phép được quản lý có tổ chức, các đơn nghỉ phép chủ yếu là nghỉ phép năm theo quy chế doanh nghiệp.

## Chỉ số chính
- Đơn nghỉ phép đang chờ duyệt: ${pending} đơn
- Đơn nghỉ phép đã duyệt: ${approved} đơn
- Tổng số ngày nghỉ được duyệt: ${totalDays} ngày
- Mức độ nghỉ trung bình: ${avgDays} ngày/nhân sự active

## So sánh
- Phân biệt rõ số lượt yêu cầu (${pending} đang chờ, ${approved} đã duyệt) và khối lượng ngày nghỉ thực tế (${totalDays} ngày).

## Insight
- Tỷ lệ nghỉ phép nằm trong giới hạn cho phép, không gây thiếu hụt nhân lực đột xuất trong các bộ phận nghiệp vụ.

## Cần chú ý
- Có ${pending} đơn nghỉ phép đang ở trạng thái chờ duyệt. Quản trị viên và trưởng bộ phận cần xử lý phê duyệt kịp thời để nhân viên chủ động kế hoạch.`;

      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 45, outputTokens: 180 },
      };
    }
    // 5. PERFORMANCE ANALYTICS
    if (
      lastMessage.includes('phân tích hiệu suất') ||
      lastMessage.includes('hiệu suất nhân sự') ||
      lastMessage.includes('kpi')
    ) {
      const ratingMatch = prompt.match(/Điểm đánh giá trung bình: ([\d.]+)\/5/);
      const completionMatch = prompt.match(/Tỷ lệ hoàn thành đánh giá: ([\d.]+)%/);
      const kpiMatch = prompt.match(/Điểm KPI trung bình: ([\d.]+)\/100/);
      const goalMatch = prompt.match(/Tiến độ hoàn thành mục tiêu \(Goal progress\) trung bình: ([\d.]+)%/);

      const rating = ratingMatch ? ratingMatch[1] : '3.8';
      const completion = completionMatch ? completionMatch[1] : '80';
      const kpi = kpiMatch ? kpiMatch[1] : '85';
      const goal = goalMatch ? goalMatch[1] : '75';

      const text = `## Tổng quan
Kết quả đánh giá hiệu suất nhân sự phản ánh tiến độ hoàn thành công việc khả quan và bám sát các mục tiêu quý của tổ chức.

## Chỉ số chính
- Điểm đánh giá trung bình: ${rating}/5 sao
- Tỷ lệ hoàn thành chu kỳ đánh giá: ${completion}%
- Điểm KPI trung bình của các bộ phận: ${kpi}/100 điểm
- Tiến độ hoàn thành mục tiêu (Goal Progress) trung bình: ${goal}%

## So sánh
- Các phòng ban khối Kỹ thuật và Vận hành duy trì tiến độ hoàn thành KPI đồng đều trên 80%.

## Insight
- Nhân sự chủ động cập nhật tiến độ mục tiêu và tham gia quy trình tự đánh giá theo đúng quy chuẩn.

## Cần chú ý
- Không tiết lộ nội dung nhận xét bảo mật cá nhân (self-assessment / manager review) theo chính sách RBAC của hệ thống.`;

      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 45, outputTokens: 185 },
      };
    }
    // 6. COMPLIANCE & DOCUMENTS ANALYTICS
    if (
      lastMessage.includes('phân tích tình trạng hồ sơ') ||
      lastMessage.includes('tuân thủ') ||
      lastMessage.includes('hồ sơ & tuân thủ') ||
      lastMessage.includes('hết hạn')
    ) {
      const totalDocsMatch = prompt.match(/Tổng số tài liệu: (\d+)/);
      const expiringMatch = prompt.match(/Sắp hết hạn 30 ngày: (\d+)/);
      const missingMatch = prompt.match(/Yêu cầu bắt buộc còn thiếu: (\d+)/);
      const compRateMatch = prompt.match(/Tỷ lệ tuân thủ hồ sơ \(Compliance rate\): ([\d.]+)%/);

      const totalDocs = totalDocsMatch ? totalDocsMatch[1] : '10';
      const expiring = expiringMatch ? expiringMatch[1] : '1';
      const missing = missingMatch ? missingMatch[1] : '2';
      const compRate = compRateMatch ? compRateMatch[1] : '80';

      const text = `## Tổng quan
Hệ thống quản trị hồ sơ và tuân thủ pháp lý của doanh nghiệp đang được giám sát chặt chẽ theo các yêu cầu bắt buộc.

## Chỉ số chính
- Tỷ lệ tuân thủ hồ sơ pháp lý (Compliance Rate): ${compRate}%
- Tổng số tài liệu đang lưu trữ: ${totalDocs} hồ sơ
- Hồ sơ/Chứng chỉ sắp hết hạn trong 30 ngày: ${expiring} tài liệu
- Danh mục tài liệu bắt buộc cần bổ sung: ${missing} mục

## So sánh
- Tỷ lệ tuân thủ giữa các phòng ban phản ánh sự đồng bộ trong việc nộp giấy tờ tùy thân và bằng cấp chuyên môn.

## Insight
- Phần lớn nhân sự đã hoàn tất hợp đồng lao động và căn cước công dân gắn chip theo quy định hiện hành.

## Cần chú ý
- Có ${expiring} hồ sơ sắp hết hạn hiệu lực trong vòng 30 ngày tới. Bộ phận HR cần liên hệ nhân sự để làm thủ tục gia hạn hoặc cập nhật văn bản mới.`;

      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 45, outputTokens: 190 },
      };
    }
    // 7. PAYROLL ANALYTICS (Strict RBAC & Currency Segregation)
    if (lastMessage.includes('payroll') || lastMessage.includes('lương')) {
      if (prompt.includes('KHÔNG có quyền xem thông tin lương') || prompt.includes('NGƯỜI DÙNG KHÔNG CÓ QUYỀN payroll:read')) {
        const text = 'Bạn không có quyền truy cập thông tin tiền lương (yêu cầu quyền payroll:read) để thực hiện phân tích này.';
        return {
          text,
          finishReason: 'stop',
          usage: { inputTokens: 20, outputTokens: 24 },
        };
      }

      const text = `## Tổng quan
Chi phí tiền lương được tính toán và phê duyệt theo đúng kỳ kế toán, tuân thủ nguyên tắc hạch toán độc lập theo từng loại tiền tệ.

## Chỉ số chính
- Kỳ lương gần nhất: Đã tính toán và phê duyệt hoàn tất
- Tiền tệ áp dụng: Hạch toán độc lập bằng VND (Tuyệt đối không cộng gộp các loại tiền tệ khác)
- Tỷ lệ chi trả lương đúng hạn đạt 100% cho các nhân sự đủ điều kiện

## So sánh
- So sánh kỳ: Chi phí lương ổn định, tương ứng với số ngày công thực tế và ngày nghỉ hưởng lương hợp lệ.

## Insight
- Cơ cấu thu nhập phản ánh đúng đóng góp ngày công và chính sách đãi ngộ của doanh nghiệp.

## Cần chú ý
- Không có bất thường nào phát sinh trong kỳ tính lương hiện tại.`;

      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 40, outputTokens: 180 },
      };
    }
    // 8. CROSS-DOMAIN HR OVERVIEW
    if (
      lastMessage.includes('tổng quan hr') ||
      lastMessage.includes('tổng quan nhân sự') ||
      lastMessage.includes('tổng quan tình hình hr')
    ) {
      const totalMatch = prompt.match(/Tổng số nhân sự: (\d+)/);
      const count = totalMatch ? totalMatch[1] : '5';

      const text = `## Tổng quan
Báo cáo tổng quan HR thể hiện sự ổn định và gắn kết đồng bộ giữa các phân hệ quản trị doanh nghiệp DX-OS.

## Chỉ số chính
- **Workforce**: ${count} nhân sự đang hoạt động tại các phòng ban chuyên môn
- **Attendance**: Tỷ lệ đi làm đạt mức cao, lịch trình ca làm việc được vận hành đều đặn
- **Leave**: Các yêu cầu nghỉ phép được theo dõi và xét duyệt đúng quy trình
- **Performance**: Điểm đánh giá hiệu suất trung bình và tiến độ KPI khả quan
- **Compliance**: Tỷ lệ tuân thủ hồ sơ pháp lý đạt chuẩn an toàn

## So sánh
- Các chỉ số vận hành duy trì tính nhất quán, không phát hiện sự sụt giảm bất thường giữa các kỳ.

## Insight
- Mô hình vận hành doanh nghiệp số vận hành hiệu quả với dữ liệu được cập nhật tức thời từ các phân hệ chức năng.

## Cần chú ý
- Tiếp tục theo dõi các đơn nghỉ phép đang chờ duyệt và tài liệu sắp hết hạn để đảm bảo tính tuân thủ pháp lý liên tục.`;

      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 50, outputTokens: 210 },
      };
    }
    // 9. TIME-RANGE COMPARISON
    if (lastMessage.includes('so sánh') || lastMessage.includes('tháng này với tháng trước')) {
      const text = `## Tổng quan
So sánh dữ liệu vận hành giữa kỳ hiện tại và kỳ liền kề phản ánh xu hướng ổn định của tổ chức.

## Chỉ số chính
- Tỷ lệ đi làm: Duy trì tương đương so với kỳ trước (thay đổi trong phạm vi ±1.5 điểm phần trăm)
- Lượt đi muộn: Không có biến động lớn về số lượng tuyệt đối
- Khối lượng ngày nghỉ phép: Phù hợp với chu kỳ làm việc thông thường

## So sánh
- Tỷ lệ đi muộn thay đổi trong ngưỡng an toàn, phân biệt rõ giữa điểm phần trăm tuyệt đối và tỷ lệ thay đổi tương đối.
- Nếu một số chỉ tiêu chưa có đủ dữ liệu lịch sử đối chiếu, hệ thống ghi nhận: "Không đủ dữ liệu để thực hiện so sánh chi tiết."

## Insight
- Tính liên tục trong chấm công và nghỉ phép chứng minh môi trường làm việc ổn định.

## Cần chú ý
- Dữ liệu hiện có chưa xác định được nguyên nhân cụ thể nếu có các thay đổi nhỏ về thời gian chấm công.`;

      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 45, outputTokens: 190 },
      };
    }
    // 10. DEPARTMENT COMPARISON
    if (
      lastMessage.includes('phân tích các phòng ban') ||
      lastMessage.includes('phòng ban nào') ||
      lastMessage.includes('các phòng ban')
    ) {
      const text = `## Tổng quan
Cơ cấu các phòng ban trong tổ chức được phân bổ theo chức năng chuyên môn rõ ràng, đảm bảo tính phân quyền và phối hợp công việc.

## Chỉ số chính
- Ban Giám đốc: Đảm bảo điều hành chiến lược và phê duyệt cấp cao
- Phòng Kỹ thuật: Chiếm tỷ trọng nhân sự nòng cốt phục vụ các dự án công nghệ
- Phòng Kinh doanh & Hành chính: Đảm nhiệm kết nối khách hàng và tuân thủ vận hành

## So sánh
- Theo số liệu chấm công và hiệu suất trong kỳ, các phòng ban đều duy trì tỷ lệ đi làm trên 90% với tiến độ KPI tích cực.

## Insight
- Tỷ lệ tuân thủ hồ sơ pháp lý giữa các phòng ban tương đối đồng đều.

## Cần chú ý
- Khi xếp hạng dựa trên tiêu chí cụ thể (ví dụ tỷ lệ đi muộn hoặc compliance), hệ thống nêu rõ căn cứ số liệu thay vì đánh giá chung chung.`;

      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 45, outputTokens: 190 },
      };
    }

    // Single simple questions
    if (lastMessage.includes('đơn nghỉ phép') || lastMessage.includes('chờ duyệt')) {
      const match = prompt.match(/Đang chờ duyệt: (\d+)/);
      const count = match ? match[1] : '1';
      const text = `Hiện có ${count} đơn nghỉ phép đang ở trạng thái chờ cấp quản lý phê duyệt.`;
      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 20, outputTokens: 20 },
      };
    }
    // 11. WORKFLOW & APPROVAL ASSISTANT
    if (
      lastMessage.includes('workflow') ||
      lastMessage.includes('quy trình') ||
      lastMessage.includes('cần xử lý') ||
      lastMessage.includes('cần xác nhận') ||
      lastMessage.includes('việc cần làm')
    ) {
      const text = `## Tổng quan
Hệ thống hiện đang quản lý các quy trình tự động hóa nhân sự (HR Intelligent Workflows), bao gồm quy trình gia hạn hợp đồng lao động và bổ sung hồ sơ.

## Trạng thái các quy trình
- **Quy trình đang chờ HR xác nhận (WAITING)**: 1 quy trình
  - *Quy trình gia hạn hợp đồng lao động*: Hợp đồng lao động của nhân viên sắp hết hạn trong vòng 30 ngày. Đã hoàn tất bước gửi thông báo và đang chờ HR xác nhận điều khoản hợp đồng mới.
- **Quy trình đang hoạt động (RUNNING)**: 0 quy trình
- **Quy trình đã hoàn tất (COMPLETED)**: Các quy trình trước đó đã được lưu vết kiểm toán đầy đủ.

## Insight
- Việc ứng dụng quy trình tự động có sự tham gia của con người (Human-in-the-loop) giúp giảm 80% thời gian theo dõi thủ công hạn hợp đồng mà vẫn đảm bảo 100% quyết định gia hạn được phê duyệt bởi quản trị viên.

## Đề xuất hành động
- Truy cập menu **Quy trình làm việc (Workflows)** để xem chi tiết và nhấn nút **[Xác nhận]** cho các bước đang chờ duyệt.`;

      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 40, outputTokens: 200 },
      };
    }
    // 12. AUTOMATION ENGINE STATUS & ERRORS
    if (
      lastMessage.includes('automation') ||
      lastMessage.includes('tự động hóa') ||
      lastMessage.includes('bị lỗi')
    ) {
      const text = `## Trạng thái HR Automation Engine
Hệ thống HR Automation Engine đang hoạt động ổn định và liên tục rà soát các quy tắc nghiệp vụ theo cơ chế bất biến (idempotent).

## Chỉ số hoạt động
- **Số quy tắc đang kích hoạt**: 4 quy tắc chuẩn (Rà soát hợp đồng 30 ngày, Cảnh báo 7 ngày, Bổ sung giấy tờ thiếu, Nhắc hạn đánh giá hiệu suất)
- **Tình trạng thực thi**: Không ghi nhận lỗi thực thi (0 failed executions) trong các chu kỳ quét gần nhất
- **Idempotency**: Đảm bảo không trùng lặp tác vụ hoặc thông báo trong cùng một chu kỳ quét

## Hành động an toàn (Bounded Actions)
- Tất cả các tác vụ đều tuân thủ danh mục hành động an toàn: Gửi thông báo, Tạo nhiệm vụ, Kích hoạt quy trình, Gửi nhắc nhở. Không có mã lệnh tùy ý nào được thực thi.`;

      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 40, outputTokens: 190 },
      };
    }
    // 13. CONTRACT EXPIRING & COMPLIANCE
    if (
      lastMessage.includes('hợp đồng sắp hết hạn') ||
      lastMessage.includes('hết hạn trong 30 ngày') ||
      lastMessage.includes('hết hạn') ||
      lastMessage.includes('hợp đồng')
    ) {
      const text = `## Báo cáo hợp đồng sắp hết hạn
Theo dữ liệu hồ sơ nhân sự, hệ thống phát hiện các hợp đồng lao động sắp đến hạn kết thúc:

## Danh sách hợp đồng
- **Hợp đồng lao động có thời hạn**: Thời hạn còn lại dưới 30 ngày.
  - Loại văn bản: Hợp đồng lao động (LABOR_CONTRACT)
  - Trạng thái: Đang hiệu lực (ACTIVE) - Sắp hết hạn (EXPIRING_SOON)
  - Quy tắc tự động tương ứng: *Tự động rà soát hợp đồng hết hạn trong 30 ngày & tạo quy trình gia hạn*

## Đề xuất quy trình xử lý
- Quy trình gia hạn hợp đồng tự động đã được kích hoạt và chuẩn bị phiếu đề xuất.
- Đề xuất quản trị viên HR tiến hành rà soát kết quả đánh giá hiệu suất của nhân viên trước khi xác nhận gia hạn.`;

      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 40, outputTokens: 180 },
      };
    }
    // 14. AUTOMATION RECOMMENDATIONS
    if (
      lastMessage.includes('đề xuất các automation') ||
      lastMessage.includes('đề xuất automation') ||
      lastMessage.includes('gợi ý automation')
    ) {
      const text = `## Đề xuất tự động hóa quy trình HR (Automation Recommendations)
Dựa trên phân tích vận hành và tuân thủ dữ liệu tại tổ chức, AI khuyến nghị 3 quy tắc tự động hóa trọng yếu:

1. **Gia hạn hợp đồng tự động (Khuyến nghị cao)**:
   - *Kích hoạt*: Hợp đồng lao động còn 30 ngày hết hạn.
   - *Hành động*: Tạo quy trình gia hạn + gửi thông báo cho HR + yêu cầu xác nhận.
   
2. **Cảnh báo khẩn cấp hồ sơ hết hạn (Khuyến nghị cao)**:
   - *Kích hoạt*: Bất kỳ tài liệu pháp lý nào còn 7 ngày hết hạn.
   - *Hành động*: Gửi thông báo trực tiếp đến nhân viên và quản lý trực tiếp.

3. **Tự động rà soát và đôn đốc tài liệu bắt buộc còn thiếu**:
   - *Kích hoạt*: Nhân viên mới onboard chưa nộp đủ hồ sơ bắt buộc sau 14 ngày làm việc.
   - *Hành động*: Tạo task đôn đốc và gửi thông báo nhắc nhở.`;

      return {
        text,
        finishReason: 'stop',
        usage: { inputTokens: 40, outputTokens: 200 },
      };
    }
    // DEFAULT SYNTHETIC FALLBACK (For unit/integration testing expecting 'mock'.repeat)
    const outputTokens = Math.min(input.maxOutputTokens, 4);
    return {
      text: 'mock'.repeat(outputTokens),
      finishReason: outputTokens < 4 ? 'length' : 'stop',
      usage: {
        inputTokens: Math.ceil(input.messages.reduce((sum, m) => sum + m.content.length, 0) / 4),
        outputTokens,
      },
    };
  }
}
