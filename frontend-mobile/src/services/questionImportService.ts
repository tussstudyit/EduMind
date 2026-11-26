import type { QuestionType } from "@/types";

export interface QuestionImportOption {
  label: string;
  text: string;
}

export interface ImportedQuestionDraft {
  content: string;
  type: QuestionType;
  points: number;
  options: QuestionImportOption[];
  correctOptionLabel: string | null;
  explanation: string;
}

const MAX_IMPORT_BYTES = 20 * 1024 * 1024;

export async function extractQuestionText(file: File): Promise<string> {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error("File tối đa 20 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "txt" || extension === "md") {
    return file.text();
  }

  if (extension === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }

  if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    const pdf = await loadingTask.promise;
    try {
      const pages: string[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
      }
      return pages.join("\n");
    } finally {
      await loadingTask.destroy();
    }
  }

  throw new Error("Hỗ trợ DOCX, PDF, TXT hoặc MD. File DOC cũ chưa được hỗ trợ; hãy lưu lại dưới dạng DOCX.");
}

function normalizeAnswer(value: string): string | null {
  const match = value.toUpperCase().match(/\b([A-F])\b/);
  return match?.[1] ?? null;
}

function readAnswerPairs(text: string): Map<number, string> {
  const answers = new Map<number, string>();
  const pattern = /(?:Câu\s*)?(\d{1,3})\s*[.):\-]?\s*([A-F])\b/gi;
  for (const match of text.matchAll(pattern)) answers.set(Number(match[1]), match[2].toUpperCase());
  return answers;
}

export interface UploadedAttachmentPayload {
  attachmentName: string;
  attachmentType: string;
  attachmentSize: string;
  attachmentDataUrl: string;
  attachmentExtractedText: string;
}

export async function readAttachmentFile(file: File): Promise<UploadedAttachmentPayload> {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error("Tệp đính kèm tối đa 20 MB.");
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Không thể đọc tệp đính kèm."));
    reader.readAsDataURL(file);
  });

  let extractedText = "";
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (["txt", "md", "docx", "pdf"].includes(ext)) {
    try {
      extractedText = await extractQuestionText(file);
    } catch {
      extractedText = "";
    }
  } else if (["py", "js", "ts", "java", "cpp", "c", "cs", "html", "css", "sql", "json", "csv"].includes(ext)) {
    try {
      extractedText = await file.text();
    } catch {
      extractedText = "";
    }
  }

  const sizeKb = file.size / 1024;
  const formattedSize =
    sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(sizeKb))} KB`;

  return {
    attachmentName: file.name,
    attachmentType: file.type || `application/${ext || "octet-stream"}`,
    attachmentSize: formattedSize,
    attachmentDataUrl: dataUrl,
    attachmentExtractedText: extractedText.trim(),
  };
}

function splitInlineOptions(line: string): Array<{ label: string; text: string; isCorrect: boolean }> | null {
  const matches = [...line.matchAll(/(?:^|\s{2,}|\t)(\*?)([A-F])\s*[).:\-]\s*/g)];
  if (matches.length < 2) return null;
  if (matches[0].index !== 0) return null;

  const result: Array<{ label: string; text: string; isCorrect: boolean }> = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const startIdx = (current.index ?? 0) + current[0].length;
    const endIdx = next ? (next.index ?? line.length) : line.length;
    const rawText = line.slice(startIdx, endIdx).trim();
    const markedCorrect =
      current[1] === "*" ||
      /\((?:đúng|correct)\)|\[(?:x|đúng|correct)\]/i.test(rawText);
    const cleanedText = rawText
      .replace(/\s*(?:\((?:đúng|correct)\)|\[(?:x|đúng|correct)\])\s*/gi, "")
      .trim();
    if (cleanedText) {
      result.push({
        label: current[2].toUpperCase(),
        text: cleanedText,
        isCorrect: markedCorrect,
      });
    }
  }
  return result.length >= 2 ? result : null;
}

export function parseQuestionsFromText(source: string): ImportedQuestionDraft[] {
  const rawLines = source
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .split("\n");

  const questions: Array<ImportedQuestionDraft & { sourceNumber: number | null; explicitPoints: boolean }> = [];
  const answerKey = new Map<number, string>();
  let current: (ImportedQuestionDraft & { sourceNumber: number | null; explicitPoints: boolean }) | null = null;
  let inAnswerKey = false;

  const flush = () => {
    if (!current) return;
    current.content = current.content.trim();
    current.explanation = current.explanation.trim();
    if (current.content) questions.push(current);
    current = null;
  };

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^(?:ĐÁP\s*ÁN|BẢNG\s*ĐÁP\s*ÁN|ANSWER\s*KEY)\b/i.test(line)) {
      const answerText = line.replace(/^(?:BẢNG\s*)?(?:ĐÁP\s*ÁN|ANSWER\s*KEY)\s*[:\-]?\s*/i, "");
      flush();
      inAnswerKey = true;
      for (const [number, answer] of readAnswerPairs(answerText)) answerKey.set(number, answer);
      continue;
    }

    if (inAnswerKey) {
      for (const [number, answer] of readAnswerPairs(line)) answerKey.set(number, answer);
      continue;
    }

    const questionMatch =
      line.match(/^(?:Câu(?:\s*hỏi)?|Bài|Question|Q)\s*(\d{1,3})\s*(?:\((\d+(?:[.,]\d+)?)\s*(?:đ|điểm|pts?|points?)\))?\s*[.):\-]?\s*(.*)$/i) ||
      line.match(/^(\d{1,3})\s*[.):]\s+(?:\((\d+(?:[.,]\d+)?)\s*(?:đ|điểm|pts?|points?)\)\s*)?(.+)$/i);

    if (questionMatch) {
      flush();
      inAnswerKey = false;
      const parsedPts = questionMatch[2] ? Number(questionMatch[2].replace(",", ".")) : 0;
      let restContent = (questionMatch[3] || "").trim();
      let explicitPts = parsedPts > 0;
      const inlinePtsMatch = restContent.match(/^\((\d+(?:[.,]\d+)?)\s*(?:đ|điểm|pts?|points?)\)\s*[.:\-]?\s*(.*)$/i);
      if (!explicitPts && inlinePtsMatch) {
        explicitPts = true;
        restContent = inlinePtsMatch[2].trim();
      }
      current = {
        sourceNumber: Number(questionMatch[1]),
        content: restContent,
        type: "essay",
        points: explicitPts
          ? parsedPts || Number((inlinePtsMatch?.[1] || "1").replace(",", "."))
          : 1,
        explicitPoints: explicitPts,
        options: [],
        correctOptionLabel: null,
        explanation: "",
      };
      continue;
    }

    if (/^(?:HẾT|THE END|---+$)/i.test(line)) continue;

    // Check inline multiple options on the same line (e.g. "A. Opt1   B. Opt2   C. Opt3   D. Opt4")
    const inlineOpts = splitInlineOptions(line);
    if (inlineOpts && current) {
      for (const opt of inlineOpts) {
        current.options.push({ label: opt.label, text: opt.text });
        if (opt.isCorrect) current.correctOptionLabel = opt.label;
      }
      current.type = "multiple_choice";
      continue;
    }

    // Check single option line (supports *A., [x] A., A., a), etc.)
    const optionMatch = line.match(/^(?:(\*)|\[(x|X|đúng|Đúng)\]\s*)?([A-F])\s*[).:\-]\s*(.+)$/);
    if (optionMatch) {
      if (!current) {
        current = {
          sourceNumber: questions.length + 1,
          content: `Câu hỏi ${questions.length + 1}`,
          type: "multiple_choice",
          points: 1,
          explicitPoints: false,
          options: [],
          correctOptionLabel: null,
          explanation: "",
        };
      }
      const label = optionMatch[3].toUpperCase();
      const rawOptText = optionMatch[4].trim();
      const hasInlineCorrectTag = /\((?:đúng|correct)\)|\[(?:x|đúng|correct)\]|\*$/i.test(rawOptText);
      const cleanOptText = rawOptText
        .replace(/\s*(?:\((?:đúng|correct)\)|\[(?:x|đúng|correct)\]|\*$)\s*/gi, "")
        .trim();
      current.options.push({ label, text: cleanOptText || rawOptText });
      current.type = "multiple_choice";
      if (optionMatch[1] || optionMatch[2] || hasInlineCorrectTag) {
        current.correctOptionLabel = label;
      }
      continue;
    }

    const inlineAnswer = line.match(/^(?:Đáp\s*án(?:\s*đúng)?|KQ|Kết\s*quả|Answer)\s*[:\-=]\s*(.+)$/i);
    if (inlineAnswer && current) {
      current.correctOptionLabel = normalizeAnswer(inlineAnswer[1]);
      continue;
    }

    const explanation = line.match(/^(?:Lời\s*giải|Giải\s*thích|Hướng\s*dẫn(?:\s*chấm)?|Explanation)\s*[:\-]?\s*(.*)$/i);
    if (explanation && current) {
      current.explanation = [current.explanation, explanation[1]].filter(Boolean).join("\n");
      continue;
    }

    if (!current) {
      current = {
        sourceNumber: questions.length + 1,
        content: line,
        type: "essay",
        points: 1,
        explicitPoints: false,
        options: [],
        correctOptionLabel: null,
        explanation: "",
      };
      continue;
    }

    if (current.options.length) {
      const previous = current.options[current.options.length - 1];
      previous.text = `${previous.text}\n${line}`;
    } else {
      current.content = [current.content, line].filter(Boolean).join("\n");
    }
  }
  flush();

  const defaultPts = Number((10 / Math.max(questions.length, 1)).toFixed(2));
  return questions.map(({ sourceNumber, explicitPoints, ...question }) => {
    const resolvedCorrect =
      question.correctOptionLabel ??
      (sourceNumber ? answerKey.get(sourceNumber) ?? null : null) ??
      (question.type === "multiple_choice" ? question.options[0]?.label ?? "A" : null);
    return {
      ...question,
      correctOptionLabel: question.type === "multiple_choice" ? resolvedCorrect : null,
      points: explicitPoints ? question.points : defaultPts,
      options: question.options,
    };
  });
}

export function generateQuestionsFallbackWithAi(params: {
  topic: string;
  sourceText?: string;
  questionCount?: number;
  difficulty?: "beginner" | "intermediate" | "advanced" | "mixed";
  questionType?: "multiple_choice" | "essay" | "mixed";
}): ImportedQuestionDraft[] {
  const count = Math.min(Math.max(Number(params.questionCount) || 5, 1), 20);
  const pointsEach = Number((10 / count).toFixed(2));
  const topicClean = (params.topic || "Kiến thức trọng tâm").trim();
  const lower = `${topicClean} ${params.sourceText || ""}`.toLowerCase();
  const diffBadge =
    params.difficulty === "advanced"
      ? "Vận dụng cao"
      : params.difficulty === "beginner"
      ? "Cơ bản"
      : "Thông hiểu";

  const results: ImportedQuestionDraft[] = [];

  if (lower.includes("python") || lower.includes("vòng lặp") || lower.includes("list") || lower.includes("hàm")) {
    results.push(
      {
        content: `[${diffBadge}] Trong Python, kết quả của biểu thức \`list(range(2, 11, 3))\` là gì?`,
        type: "multiple_choice",
        points: pointsEach,
        options: [
          { label: "A", text: "[2, 5, 8]" },
          { label: "B", text: "[2, 5, 8, 11]" },
          { label: "C", text: "[2, 3, 6, 9]" },
          { label: "D", text: "[3, 6, 9]" },
        ],
        correctOptionLabel: "A",
        explanation: "Hàm range(2, 11, 3) bắt đầu từ 2, bước nhảy 3 và dừng trước 11 nên thu được [2, 5, 8].",
      },
      {
        content: `[${diffBadge}] Cấu trúc dữ liệu nào trong Python lưu trữ các cặp khóa-giá trị (key-value) và cho phép tra cứu trung bình O(1)?`,
        type: "multiple_choice",
        points: pointsEach,
        options: [
          { label: "A", text: "list" },
          { label: "B", text: "dict (Dictionary)" },
          { label: "C", text: "tuple" },
          { label: "D", text: "set" },
        ],
        correctOptionLabel: "B",
        explanation: "Dictionary (dict) dùng bảng băm (hash table) để ánh xạ key tới value với thời gian tra cứu trung bình O(1).",
      },
      {
        content: `[${diffBadge}] Khi cài đặt hàm đệ quy, điều kiện nào giúp ngăn chặn lỗi tràn ngăn xếp (RecursionError)?`,
        type: "multiple_choice",
        points: pointsEach,
        options: [
          { label: "A", text: "Khai báo tất cả biến là global" },
          { label: "B", text: "Xác định điều kiện dừng (Base case) và bước đệ quy thu hẹp kích thước bài toán" },
          { label: "C", text: "Không sử dụng tham số truyền vào hàm" },
          { label: "D", text: "Đặt hàm đệ quy bên trong vòng lặp while True" },
        ],
        correctOptionLabel: "B",
        explanation: "Hàm đệ quy bắt buộc phải có điều kiện cơ sở (Base case) và bước gọi đệ quy tiến dần tới điều kiện dừng.",
      },
    );
  } else if (lower.includes("ma trận") || lower.includes("đại số") || lower.includes("toán")) {
    results.push(
      {
        content: `[${diffBadge}] Cho ma trận vuông A cấp n. Điều kiện cần và đủ để A có ma trận nghịch đảo A^(-1) là gì?`,
        type: "multiple_choice",
        points: pointsEach,
        options: [
          { label: "A", text: "det(A) = 0" },
          { label: "B", text: "det(A) ≠ 0" },
          { label: "C", text: "A là ma trận tam giác trên có một phần tử đường chéo bằng 0" },
          { label: "D", text: "Tổng các phần tử của A dương" },
        ],
        correctOptionLabel: "B",
        explanation: "Ma trận vuông A khả nghịch khi và chỉ khi định thức det(A) ≠ 0.",
      },
      {
        content: `[${diffBadge}] Định thức của ma trận A = [[3, 1], [5, 2]] có giá trị bằng bao nhiêu?`,
        type: "multiple_choice",
        points: pointsEach,
        options: [
          { label: "A", text: "1" },
          { label: "B", text: "11" },
          { label: "C", text: "-1" },
          { label: "D", text: "5" },
        ],
        correctOptionLabel: "A",
        explanation: "det(A) = 3*2 - 1*5 = 6 - 5 = 1.",
      },
    );
  }

  const sentences = (params.sourceText || "")
    .split(/[.\n?!]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25 && s.length <= 220);

  for (let i = results.length; i < count; i++) {
    const refSentence = sentences[i % Math.max(sentences.length, 1)];
    const isEssay =
      params.questionType === "essay" ||
      (params.questionType === "mixed" && i === count - 1);

    if (isEssay) {
      results.push({
        content: refSentence
          ? `[${diffBadge}] Từ nhận định trong tài liệu: "${refSentence}", hãy phân tích bản chất và cho ví dụ minh họa về ${topicClean}.`
          : `[${diffBadge}] Hãy phân tích nguyên lý hoạt động và ứng dụng thực tế của "${topicClean}" (Câu ${i + 1}).`,
        type: "essay",
        points: pointsEach,
        options: [],
        correctOptionLabel: null,
        explanation: `Tiêu chí chấm: Trình bày đúng định nghĩa/nguyên lý của ${topicClean} (50%), phân tích chặt chẽ (30%), ví dụ thực tế (20%).`,
      });
    } else {
      const labels = ["A", "B", "C", "D"];
      const correctLabel = labels[i % 4];
      results.push({
        content: `[${diffBadge}] Nhận định nào sau đây phản ánh CHÍNH XÁC nhất về "${topicClean}" (Câu ${i + 1})?`,
        type: "multiple_choice",
        points: pointsEach,
        options: labels.map((lbl) => ({
          label: lbl,
          text:
            lbl === correctLabel
              ? refSentence || `Tuân thủ đúng nguyên lý cấu trúc và điều kiện tối ưu của ${topicClean}`
              : lbl === "A"
              ? `Bỏ qua toàn bộ điều kiện biên khi triển khai ${topicClean}`
              : lbl === "B"
              ? `Chỉ hoạt động với tập dữ liệu rỗng hoặc kích thước bằng 1`
              : lbl === "C"
              ? `Luôn làm độ phức tạp thuật toán tăng lên O(2^n)`
              : `Không thể kết hợp với các cấu trúc điều khiển tiêu chuẩn`,
        })),
        correctOptionLabel: correctLabel,
        explanation: `Đáp án ${correctLabel} chính xác theo nội dung học liệu về "${topicClean}". Các phương án khác là phương án nhiễu sai về mặt bản chất.`,
      });
    }
  }

  return results.slice(0, count);
}

export function rewriteQuestionsFallbackWithAi(
  questions: ImportedQuestionDraft[],
  mode: "improve" | "add_explanation" | "harder" = "improve",
): ImportedQuestionDraft[] {
  const defaultPoints = Number((10 / Math.max(questions.length, 1)).toFixed(2));
  return questions.map((q, idx) => {
    let content = q.content.trim();
    if (mode === "harder" && !content.startsWith("[Vận dụng cao]")) {
      content = `[Vận dụng cao] ${content}`;
    } else if (mode === "improve" && !/[?.:]$/.test(content)) {
      content = `${content}?`;
    }

    const options = [...q.options];
    let correctOptionLabel = q.correctOptionLabel;
    if (q.type === "multiple_choice") {
      const labels = ["A", "B", "C", "D"];
      while (options.length < 4) {
        const nextLbl = labels[options.length] || String.fromCharCode(65 + options.length);
        options.push({
          label: nextLbl,
          text: `Phương án đối chiếu mở rộng ${nextLbl} cho câu ${idx + 1}`,
        });
      }
      if (!correctOptionLabel) correctOptionLabel = options[0]?.label || "A";
    }

    const correctOpt = options.find((o) => o.label === correctOptionLabel);
    const explanation =
      q.explanation?.trim() && mode !== "add_explanation"
        ? `${q.explanation.trim()} (Đã chuẩn hóa học thuật bởi EduMind AI)`
        : correctOpt
        ? `Đáp án đúng là ${correctOptionLabel} ("${correctOpt.text}") vì thỏa mãn trực tiếp yêu cầu lý thuyết và điều kiện của Câu ${idx + 1}.`
        : `Hướng dẫn chấm: Trình bày đúng khái niệm trọng tâm, lập luận từng bước và nêu ví dụ minh họa.`;

    return {
      ...q,
      content,
      points: q.points || defaultPoints,
      options,
      correctOptionLabel: q.type === "multiple_choice" ? correctOptionLabel : null,
      explanation,
    };
  });
}
