const fs = require('fs');

const topics = ["Array", "String", "Hash Table", "Linked List", "Stack", "Queue", "Tree", "Binary Tree", "Graph", "BFS", "DFS", "Sliding Window", "Two Pointers", "Binary Search", "Dynamic Programming", "DP", "Greedy", "Backtracking", "Recursion", "Math", "Sorting", "Heap", "Priority Queue", "Trie", "Matrix", "Bit Manipulation"];

const companies = ["Google", "Amazon", "Facebook", "Microsoft", "Apple", "Netflix", "Uber", "Lyft", "Airbnb", "Tesla", "LinkedIn"];

function getRandomSubset(arr, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const problems = [];
let idCounter = 1;

// Generate 80 Easy
for (let i = 1; i <= 80; i++) {
  problems.push({
    id: idCounter++,
    slug: `easy-problem-${i}`,
    title: `Easy Problem ${i}`,
    difficulty: "Easy",
    tags: getRandomSubset(topics, 1, 3),
    hint: `This is a generated hint for Easy Problem ${i}. Focus on simple iteration.`,
    preview: `Given an input for Easy Problem ${i}, return the expected output based on the constraints. You may assume that each input would have exactly one solution, and you may not use the same element twice.`.substring(0, 280),
    url: `https://leetcode.com/problems/easy-problem-${i}/`,
    companies: getRandomSubset(companies, 0, 3),
    frequency: Math.floor(Math.random() * 100)
  });
}

// Generate 70 Medium
for (let i = 1; i <= 70; i++) {
  problems.push({
    id: idCounter++,
    slug: `medium-problem-${i}`,
    title: `Medium Problem ${i}`,
    difficulty: "Medium",
    tags: getRandomSubset(topics, 2, 4),
    hint: `This is a generated hint for Medium Problem ${i}. Consider using a more advanced data structure.`,
    preview: `Given a complex input for Medium Problem ${i}, return the expected output based on the constraints. This might require an optimized approach compared to brute force, possibly involving dynamic programming or graph traversal.`.substring(0, 280),
    url: `https://leetcode.com/problems/medium-problem-${i}/`,
    companies: getRandomSubset(companies, 1, 4),
    frequency: Math.floor(Math.random() * 100)
  });
}

// Add some real ones to test parsing
const realProblems = [
  {
    "id": 1,
    "slug": "two-sum",
    "title": "Two Sum",
    "difficulty": "Easy",
    "tags": ["Array", "Hash Table"],
    "hint": "Use a hash map to store complements as you iterate.",
    "preview": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    "url": "https://leetcode.com/problems/two-sum/",
    "companies": ["Google", "Amazon", "Facebook"],
    "frequency": 95
  },
  {
    "id": 3,
    "slug": "longest-substring-without-repeating-characters",
    "title": "Longest Substring Without Repeating Characters",
    "difficulty": "Medium",
    "tags": ["Hash Table", "String", "Sliding Window"],
    "hint": "Use a sliding window and a hash set to track seen characters.",
    "preview": "Given a string s, find the length of the longest substring without repeating characters. Notice that the answer must be a substring, 'pwke' is a subsequence and not a substring.",
    "url": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    "companies": ["Amazon", "Microsoft", "Bloomberg"],
    "frequency": 88
  }
];

problems.unshift(...realProblems);

fs.mkdirSync('./data', { recursive: true });
fs.writeFileSync('./data/problems.json', JSON.stringify(problems, null, 2));
console.log('problems.json generated with', problems.length, 'entries.');
