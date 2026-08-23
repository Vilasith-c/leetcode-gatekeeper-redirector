/**
 * PDF Parser Module
 * Runs in the popup context to process uploaded study plans.
 */

// Simple Levenshtein distance
function getLevenshteinDistance(a, b) {
    const matrix = [];
    let i, j;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function getSimilarity(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    return (longerLength - getLevenshteinDistance(longer, shorter)) / parseFloat(longerLength);
}

const TOPIC_TAGS = ["Array","String","Hash Table","Linked List","Stack","Queue",
    "Tree","Binary Tree","Graph","BFS","DFS","Sliding Window","Two Pointers","Binary Search",
    "Dynamic Programming","DP","Greedy","Backtracking","Recursion","Math","Sorting","Heap",
    "Priority Queue","Trie","Matrix","Bit Manipulation"];

export async function parsePDF(file, problemsBank, progressCallback) {
    progressCallback("Extracting text...");
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + "\n";
    }
    
    if (fullText.trim().length < 100) {
        throw new Error("This PDF appears to be a scanned image or empty. Mad Coder Pro needs a text-based PDF.");
    }
    
    progressCallback("Detecting problems...");
    
    const lines = fullText.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(l => l.length > 0);
    
    const goals = [];
    const suggestedGoals = [];
    const topicPreferences = [];
    let currentWeekGroup = null;
    let currentDayGroup = null;
    
    const urlRegex = /leetcode\.com\/problems\/([\w-]+)/gi;
    const numRegex = /(?:#|LC|Problem|No\.?)\s*(\d{1,4})\b/gi;
    const numOnlyRegex = /^\s*#?(\d{1,4})\s*$/;
    
    for (const line of lines) {
        // Grouping
        const weekMatch = line.match(/Week\s*(\d+)/i);
        if (weekMatch) currentWeekGroup = `Week ${weekMatch[1]}`;
        
        const dayMatch = line.match(/(?:Day|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*(\d*)/i);
        if (dayMatch && !weekMatch) currentDayGroup = line.trim();
        
        // Topic Pass
        for (const topic of TOPIC_TAGS) {
            if (line.toLowerCase().includes(topic.toLowerCase()) && !topicPreferences.includes(topic)) {
                topicPreferences.push(topic);
            }
        }
        
        let foundMatch = null;
        
        // Pass A - URL
        let urlM;
        while ((urlM = urlRegex.exec(line)) !== null) {
            const slug = urlM[1].toLowerCase();
            const p = problemsBank.find(prob => prob.slug === slug);
            if (p) {
                foundMatch = { ...p, confidence: "url", confidenceScore: 1.0 };
                break; // Break on first found
            }
        }
        
        // Pass B - Number
        if (!foundMatch) {
            let numM;
            while ((numM = numRegex.exec(line)) !== null) {
                const id = parseInt(numM[1], 10);
                const p = problemsBank.find(prob => prob.id === id);
                if (p) {
                    foundMatch = { ...p, confidence: "number", confidenceScore: 1.0 };
                    break;
                }
            }
        }
        
        // Try loose number matching at start of line (e.g., "1. Two Sum")
        if (!foundMatch) {
            const startNum = line.match(/^(\d{1,4})\./);
            if (startNum) {
                const id = parseInt(startNum[1], 10);
                const p = problemsBank.find(prob => prob.id === id);
                if (p) {
                    foundMatch = { ...p, confidence: "number", confidenceScore: 0.9 };
                }
            }
        }
        
        // Pass C - Title match
        if (!foundMatch) {
            // Strip out common structural words to compare titles
            const cleanLine = line.replace(/^(Day|Week)\s*\d+[:\-\.]?\s*/i, '').replace(/^\d+[\.\-\)]\s*/, '').toLowerCase();
            
            if (cleanLine.length > 5) { // don't match on tiny fragments
                let bestP = null;
                let bestScore = 0;
                
                for (const p of problemsBank) {
                    const sim = getSimilarity(cleanLine, p.title.toLowerCase());
                    if (sim > bestScore) {
                        bestScore = sim;
                        bestP = p;
                    }
                }
                
                if (bestScore >= 0.75 && bestP) {
                    foundMatch = { ...bestP, confidence: "title_match", confidenceScore: bestScore };
                } else if (bestScore >= 0.6 && bestP) {
                    suggestedGoals.push({
                        ...bestP,
                        confidence: "suggested",
                        confidenceScore: bestScore,
                        weekGroup: currentWeekGroup,
                        dayGroup: currentDayGroup,
                        sourceText: line
                    });
                }
            }
        }
        
        if (foundMatch) {
            // Dedup check (don't add if already in goals list)
            if (!goals.some(g => g.id === foundMatch.id)) {
                goals.push({
                    ...foundMatch,
                    weekGroup: currentWeekGroup,
                    dayGroup: currentDayGroup
                });
            }
        }
    }
    
    progressCallback("Done");
    
    if (goals.length === 0 && suggestedGoals.length === 0) {
        throw new Error("No LeetCode problems detected in this PDF. Try a PDF with problem titles, numbers, or links.");
    }
    
    return {
        goals,
        suggestedGoals,
        topicPreferences,
        totalDetected: goals.length,
        parseWarnings: []
    };
}
