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
- Các field "summary", "description", "recommendation", "reason", "description" trong tests phải viết bằng tiếng Việt.
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
- Tạo unit test/testcase tương ứng.
- Nếu có JavaScript inline, phải tạo testcase/unit test cho logic JavaScript quan trọng nếu có thể.
- Trả về JSON hợp lệ duy nhất.

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
      "reason": "vì sao sửa file này bằng tiếng Việt",
      "content": "toàn bộ nội dung mới của file"
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
  "commands": [
    "npm test"
  ]
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
- Test phải phù hợp framework hiện tại.
- Nếu không cần sửa file thì trả changes: [].
- Nếu không cần tạo test thì trả tests: [].
- Bắt buộc toàn bộ nội dung mô tả/review/đề xuất trong JSON phải là tiếng Việt.

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
  };
}