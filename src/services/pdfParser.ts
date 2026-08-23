import * as pdfjsLib from "pdfjs-dist";
import { ProblemGoal, ProblemGoalSchema } from "../schemas/problem";
import problemsBank from "../../data/problems.json";

// Configure pdfjs worker if in browser environment
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export function computeTokenSimilarity(line: string, targetTitle: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const lineTokens = new Set(normalize(line));
  const targetTokens = normalize(targetTitle);

  if (lineTokens.size === 0 || targetTokens.length === 0) return 0;

  let matched = 0;
  for (const token of targetTokens) {
    if (lineTokens.has(token)) matched++;
  }

  return matched / targetTokens.length;
}

export interface ParseResult {
  goals: ProblemGoal[];
  suggestedGoals: ProblemGoal[];
  topicPreferences: string[];
  totalDetected: number;
  warnings: string[];
}

const KNOWN_TOPICS = [
  "Array", "String", "Hash Table", "Linked List", "Stack", "Queue",
  "Tree", "Binary Tree", "Graph", "BFS", "DFS", "Sliding Window",
  "Two Pointers", "Binary Search", "Dynamic Programming", "DP", "Greedy",
  "Backtracking", "Recursion", "Math", "Sorting", "Heap", "Priority Queue",
  "Trie", "Matrix", "Bit Manipulation"
];

export async function parsePdfStudyPlan(
  fileBuffer: ArrayBuffer,
  onProgress?: (status: string) => void
): Promise<ParseResult> {
  const problems = problemsBank as ProblemGoal[];
  const warnings: string[] = [];

  onProgress?.("Extracting PDF pages...");
  const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  if (fullText.trim().length < 50) {
    warnings.push("PDF appears to have little or no text. It might be a scanned image.");
  }

  onProgress?.("Running 4-pass detection engine...");
  const detectedGoals: ProblemGoal[] = [];
  const suggestedGoals: ProblemGoal[] = [];
  const topicPreferences: Set<string> = new Set();
  const seenIds = new Set<number>();

  // Pass A: URL Detection
  const urlRegex = /leetcode\.com\/problems\/([\w-]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(fullText)) !== null) {
    const slug = match[1].toLowerCase();
    const found = problems.find((p) => p.slug.toLowerCase() === slug);
    if (found && !seenIds.has(found.id)) {
      seenIds.add(found.id);
      detectedGoals.push({ ...found, confidence: "url" });
    }
  }

  // Pass B: Problem Number Detection (#1, LC 217, Problem 45)
  const numberRegex = /(?:#|LC|Problem|No\.?)\s*(\d{1,4})\b/gi;
  while ((match = numberRegex.exec(fullText)) !== null) {
    const num = parseInt(match[1], 10);
    const found = problems.find((p) => p.id === num);
    if (found && !seenIds.has(found.id)) {
      seenIds.add(found.id);
      detectedGoals.push({ ...found, confidence: "number" });
    }
  }

  // Pass C: Line-by-line Fuzzy Title Matching
  const lines = fullText.split("\n");
  for (const line of lines) {
    if (line.trim().length < 3) continue;

    for (const prob of problems) {
      if (seenIds.has(prob.id)) continue;
      const score = computeTokenSimilarity(line, prob.title);
      if (score >= 0.75) {
        seenIds.add(prob.id);
        detectedGoals.push({ ...prob, confidence: "title_match" });
      } else if (score >= 0.6) {
        seenIds.add(prob.id);
        suggestedGoals.push({ ...prob, confidence: "suggested" });
      }
    }

    // Pass D: Topic Extraction
    for (const topic of KNOWN_TOPICS) {
      if (line.toLowerCase().includes(topic.toLowerCase())) {
        topicPreferences.add(topic);
      }
    }
  }

  onProgress?.("Validating parsed goals against Zod schema...");
  const validatedGoals = ProblemGoalSchema.array().parse(detectedGoals);
  const validatedSuggested = ProblemGoalSchema.array().parse(suggestedGoals);

  return {
    goals: validatedGoals,
    suggestedGoals: validatedSuggested,
    topicPreferences: Array.from(topicPreferences),
    totalDetected: validatedGoals.length + validatedSuggested.length,
    warnings
  };
}
