import { callGemini, callGeminiJson } from "./gemini";
import {
  scanProject,
  buildProjectMap,
  buildCodeContext,
} from "./scanner";

export async function selectRelevantFiles(
  rootPath: string,
  userPrompt: string
) {
  const files = await scanProject(rootPath);
  const projectMap = await buildProjectMap(rootPath);

  try {
    const selected = await callGeminiJson<string[]>(`
Bạn là senior developer Việt Nam.

Nhiệm vụ:
Chọn tối đa 12 file liên quan nhất tới yêu cầu của user.

Quy tắc:
- Chỉ trả về JSON array hợp lệ.
- Không markdown.
- Không giải thích.
- Không thêm text ngoài JSON.

Ví dụ output:
["src/App.tsx", "src/utils/api.ts"]

Danh sách file:
${projectMap}

Yêu cầu user:
${userPrompt}
`);

    return selected
      .filter((file: string) => files.includes(file))
      .slice(0, 12);
  } catch {
    return files.slice(0, 8);
  }
}

export async function createSeniorDevPlan(
  rootPath: string,
  userPrompt: string
) {
  const selectedFiles = await selectRelevantFiles(rootPath, userPrompt);
  const codeContext = await buildCodeContext(rootPath, selectedFiles);

  const result = await callGeminiJson<any>(`
Bạn là senior software engineer, code reviewer và test engineer.

QUY TẮC NGÔN NGỮ BẮT BUỘC:
- Luôn trả lời bằng tiếng Việt.
- Các field "summary", "description", "recommendation", "reason", "title", "instructions", "description" trong tests phải viết bằng tiếng Việt.
- Chỉ giữ tiếng Anh cho tên file, tên biến, tên hàm, class CSS, package, command, code và lỗi gốc.
- Không viết giải thích tiếng Anh.
- Nếu nội dung code là tiếng Anh thì giữ nguyên code, nhưng phần phân tích phải là tiếng Việt.

Nhiệm vụ:
- Review code như senior developer.
- Nếu file là .html thì phải kiểm tra đầy đủ cả 3 phần:
  1. HTML markup
  2. CSS trong thẻ <style> hoặc inline style
  3. JavaScript trong thẻ <script>
- Không được bỏ qua JavaScript inline trong file HTML.
- Tìm bug thật, edge case, code smell, security issue, performance issue.
- Đề xuất sửa code.
- Tạo unit test/testcase tương ứng nếu phù hợp.
- Nếu có JavaScript inline, phải tạo testcase/unit test cho logic JavaScript quan trọng nếu có thể.
- Trả về JSON hợp lệ duy nhất.

YÊU CẦU RIÊNG CHO "changes":
Với mỗi file cần sửa, KHÔNG được chỉ ghi một câu ngắn.
Phải giải thích rõ theo kiểu hướng dẫn thao tác code, dễ hiểu cho người mới.

Mỗi item trong "changes" bắt buộc có:
- file: đường dẫn file cần sửa
- title: tiêu đề ngắn nói rõ sửa gì
- reason: giải thích chi tiết vì sao cần sửa, lỗi hiện tại là gì, ảnh hưởng ra sao
- instructions: danh sách từng bước sửa cụ thể
- content: toàn bộ nội dung file sau khi sửa

Ví dụ changes đúng:
[
  {
    "file": "app/page.tsx",
    "title": "Xóa phần hiển thị lệnh đề xuất khỏi giao diện",
    "reason": "File app/page.tsx hiện đang render block Lệnh đề xuất từ result.commands hoặc result.testCommand. Phần này làm giao diện dài và không cần thiết vì người dùng chỉ muốn xem file cần sửa, testcase đề xuất và diff. Cần xóa block render này để giao diện gọn hơn.",
    "instructions": [
      "Mở file app/page.tsx.",
      "Tìm phần JSX đang render tiêu đề Lệnh đề xuất.",
      "Xóa toàn bộ block điều kiện hiển thị result.commands hoặc result.testCommand.",
      "Giữ lại các phần Files sẽ sửa, Unit Test/Testcase đề xuất, Preview Diff và Download ZIP."
    ],
    "content": "toàn bộ nội dung file sau khi sửa"
  }
]

Output bắt buộc là JSON object theo schema này:

{
  "summary": "Tóm tắt ngắn bằng tiếng Việt, nêu rõ đã review HTML, CSS và JavaScript nếu có",
  "selectedFiles": ["file1", "file2"],
  "issues": [
    {
      "severity": "low|medium|high|critical",
      "file": "path/to/file",
      "description": "mô tả vấn đề bằng tiếng Việt",
      "recommendation": "cách sửa bằng tiếng Việt"
    }
  ],
  "changes": [
    {
      "file": "path/to/file",
      "title": "tiêu đề sửa ngắn gọn bằng tiếng Việt",
      "reason": "giải thích chi tiết vì sao cần sửa bằng tiếng Việt",
      "instructions": [
        "bước 1 cần làm",
        "bước 2 cần làm",
        "bước 3 cần làm"
      ],
      "content": "toàn bộ nội dung file sau khi sửa"
    }
  ],
  "tests": [
    {
      "file": "path/to/test-file",
      "type": "unit|integration|e2e",
      "description": "test case kiểm tra gì bằng tiếng Việt",
      "content": "toàn bộ nội dung file test"
    }
  ],
  "commands": []
}

Quy tắc cực kỳ quan trọng:
- Chỉ trả về JSON, không markdown.
- Không dùng dấu \`\`\`.
- Không giải thích ngoài JSON.
- Tất cả chuỗi trong JSON phải escape đúng chuẩn.
- Nếu content file có dấu nháy kép, xuống dòng, ký tự đặc biệt thì vẫn phải escape thành JSON hợp lệ.
- File sửa phải là full content, không dùng patch rút gọn.
- Giữ style code hiện tại.
- Không refactor quá tay.
- Chỉ sửa file cần thiết.
- Nếu không cần sửa file thì trả changes: [].
- Nếu không cần tạo test thì trả tests: [].
- Không đề xuất lệnh chạy test nữa. Luôn trả "commands": [].
- Bắt buộc toàn bộ nội dung mô tả/review/đề xuất trong JSON phải là tiếng Việt.
- Field "reason" phải dài hơn 1 câu và giải thích rõ vấn đề.
- Field "instructions" phải có ít nhất 3 bước nếu file có sửa.
- Field "content" phải là toàn bộ code sau khi sửa, không được chỉ đưa đoạn code nhỏ.

Files đang đọc:
${selectedFiles.join("\n")}

Code context:
${codeContext}

Yêu cầu user:
${userPrompt}
`);

  return {
    ...result,
    selectedFiles,
    commands: [],
  };
}