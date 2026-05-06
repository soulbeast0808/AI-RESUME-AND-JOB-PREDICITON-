const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 4000;
const STORE_PATH = path.join(__dirname, "data", "store.json");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

const JOB_PROFILES = {
  "software-engineer": {
    label: "Software Engineer",
    requiredSkills: ["javascript", "typescript", "react", "node.js", "sql", "git", "rest api"],
    importantSkills: ["system design", "testing", "docker", "aws", "ci/cd"],
    keywords: ["scalable", "microservices", "performance", "api", "backend", "frontend"],
    learningResources: ["Data structures and algorithms", "System design basics", "REST API best practices"],
  },
  "data-analyst": {
    label: "Data Analyst",
    requiredSkills: ["sql", "python", "excel", "power bi", "statistics", "data visualization"],
    importantSkills: ["tableau", "pandas", "a/b testing", "business intelligence"],
    keywords: ["insights", "dashboards", "kpi", "reporting", "forecasting"],
    learningResources: ["SQL for analytics", "Statistics for decision making", "Dashboard storytelling"],
  },
  "data-scientist": {
    label: "Data Scientist",
    requiredSkills: ["python", "machine learning", "statistics", "pandas", "numpy", "sql"],
    importantSkills: ["deep learning", "nlp", "model deployment", "feature engineering"],
    keywords: ["model", "prediction", "classification", "regression", "evaluation"],
    learningResources: ["Supervised learning workflows", "Model validation and tuning", "ML deployment fundamentals"],
  },
  "product-manager": {
    label: "Product Manager",
    requiredSkills: ["roadmap", "stakeholder management", "analytics", "communication", "user research"],
    importantSkills: ["a/b testing", "agile", "go-to-market", "prioritization"],
    keywords: ["product strategy", "user outcomes", "metrics", "launch", "feature adoption"],
    learningResources: ["Product discovery methods", "Experiment design", "Outcome-driven roadmapping"],
  },
  "frontend-developer": {
    label: "Frontend Developer",
    requiredSkills: ["html", "css", "javascript", "react", "typescript", "responsive design"],
    importantSkills: ["accessibility", "performance", "testing", "next.js"],
    keywords: ["ui", "ux", "component", "state management", "design systems"],
    learningResources: ["Advanced React patterns", "Web accessibility", "Frontend performance optimization"],
  },
};

const JOB_LISTINGS = [
  {
    id: "job-101",
    role: "software-engineer",
    title: "Backend Engineer",
    company: "Nexa Labs",
    location: "Bangalore",
    summary: "Build scalable APIs and distributed services.",
  },
  {
    id: "job-102",
    role: "software-engineer",
    title: "Full Stack Developer",
    company: "Orbit Stack",
    location: "Hyderabad",
    summary: "Own product features across React and Node.js.",
  },
  {
    id: "job-103",
    role: "data-analyst",
    title: "Business Data Analyst",
    company: "Insightly",
    location: "Pune",
    summary: "Create KPI dashboards and uncover business trends.",
  },
  {
    id: "job-104",
    role: "data-scientist",
    title: "Applied ML Scientist",
    company: "PatternGrid",
    location: "Bangalore",
    summary: "Build and deploy predictive models for customer intelligence.",
  },
  {
    id: "job-105",
    role: "product-manager",
    title: "Associate Product Manager",
    company: "Streamline",
    location: "Remote",
    summary: "Drive product discovery and launch experiments.",
  },
  {
    id: "job-106",
    role: "frontend-developer",
    title: "Frontend Engineer",
    company: "Pixel Harbor",
    location: "Chennai",
    summary: "Deliver polished, accessible, and responsive interfaces.",
  },
];

const SKILL_LIBRARY = [
  "javascript",
  "typescript",
  "react",
  "node.js",
  "express",
  "python",
  "java",
  "c++",
  "sql",
  "mongodb",
  "postgresql",
  "mysql",
  "git",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "gcp",
  "html",
  "css",
  "next.js",
  "tailwind",
  "power bi",
  "tableau",
  "excel",
  "statistics",
  "machine learning",
  "deep learning",
  "nlp",
  "pandas",
  "numpy",
  "scikit-learn",
  "rest api",
  "graphql",
  "system design",
  "testing",
  "ci/cd",
  "agile",
  "stakeholder management",
  "user research",
  "roadmap",
  "data visualization",
  "communication",
  "problem solving",
  "leadership",
  "a/b testing",
  "feature engineering",
  "responsive design",
  "accessibility",
  "performance",
  "business intelligence",
  "go-to-market",
  "prioritization",
];

const ACTION_VERBS = [
  "built",
  "developed",
  "designed",
  "implemented",
  "optimized",
  "delivered",
  "led",
  "improved",
  "increased",
  "reduced",
  "created",
  "launched",
  "automated",
  "analyzed",
  "managed",
  "collaborated",
  "deployed",
  "engineered",
];

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readStore() {
  if (!fs.existsSync(STORE_PATH)) {
    return { candidates: {} };
  }

  const raw = fs.readFileSync(STORE_PATH, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (_err) {
    return { candidates: {} };
  }
}

function writeStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(text) {
  return text
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function cleanLine(line) {
  return line.replace(/[\u2022\-*]/g, " ").replace(/\s+/g, " ").trim();
}

function isSectionHeading(line) {
  return /^(summary|profile|skills|technical skills|projects|experience|work experience|professional experience|education|certifications?)\s*:?$/.test(
    line.toLowerCase().trim()
  );
}

function normalizeHeading(line) {
  const value = line.toLowerCase().trim().replace(/:$/, "");
  if (value === "technical skills") return "skills";
  if (value === "profile") return "summary";
  if (value === "work experience" || value === "professional experience") return "experience";
  if (value === "certification") return "certifications";
  return value;
}

function extractSections(text) {
  const lines = text.split("\n");
  const sections = {
    summary: [],
    skills: [],
    projects: [],
    experience: [],
    education: [],
    certifications: [],
    other: [],
  };

  let current = "other";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (isSectionHeading(trimmed)) {
      current = normalizeHeading(trimmed);
      if (!sections[current]) {
        sections[current] = [];
      }
      continue;
    }

    sections[current].push(trimmed);
  }

  const sectionText = {};
  for (const key of Object.keys(sections)) {
    sectionText[key] = sections[key].join("\n");
  }

  return sectionText;
}

function extractSkills(text) {
  const lower = ` ${text.toLowerCase()} `;
  const found = [];

  for (const skill of SKILL_LIBRARY) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, "i");
    if (regex.test(lower)) {
      found.push(skill);
    }
  }

  return [...new Set(found)].sort();
}

function extractEducation(text) {
  const lines = text.split("\n").map((line) => cleanLine(line)).filter(Boolean);
  const degreeRegex = /(b\.tech|m\.tech|b\.e|m\.e|bachelor|master|phd|mba|bsc|msc|computer science|engineering)/i;
  const institutionRegex = /(university|college|institute|school)/i;

  const entries = lines.filter((line) => degreeRegex.test(line) || institutionRegex.test(line));
  return [...new Set(entries)].slice(0, 6);
}

function extractProjects(projectText, fallbackText) {
  const source = projectText && projectText.trim().length > 0 ? projectText : fallbackText;
  const lines = source
    .split("\n")
    .map((line) => cleanLine(line))
    .filter((line) => line.length > 0);

  const projectLines = lines.filter((line) => {
    return /project|built|developed|created|application|platform|system/i.test(line);
  });

  const projectDescriptions = projectLines.slice(0, 8);

  const qualitySignals = projectDescriptions.map((line) => {
    const hasMetric = /\d+%|\d+\s*(users|clients|ms|hours|days|x|k)/i.test(line);
    const hasVerb = ACTION_VERBS.some((verb) => new RegExp(`\\b${verb}\\b`, "i").test(line));
    const detailWords = line.split(/\s+/).length;
    const detailScore = detailWords >= 10 ? 1 : 0;
    return (hasMetric ? 1 : 0) + (hasVerb ? 1 : 0) + detailScore;
  });

  const avgProjectStrength = qualitySignals.length
    ? qualitySignals.reduce((sum, value) => sum + value, 0) / qualitySignals.length
    : 0;

  return {
    projectDescriptions,
    avgProjectStrength,
  };
}

function extractExperience(experienceText, fullText) {
  const source = experienceText && experienceText.trim().length > 0 ? experienceText : fullText;
  const lower = source.toLowerCase();

  let maxYears = 0;
  const yearsMatches = source.match(/(\d{1,2})\+?\s*(years|yrs)/gi) || [];
  for (const token of yearsMatches) {
    const value = Number(token.match(/\d{1,2}/)?.[0] || 0);
    if (value > maxYears) {
      maxYears = value;
    }
  }

  const roleMentions = ["engineer", "developer", "analyst", "manager", "scientist", "intern"].reduce(
    (count, role) => count + (lower.match(new RegExp(`\\b${role}\\b`, "g")) || []).length,
    0
  );

  const bulletCount = source.split("\n").filter((line) => /^[\-\u2022]/.test(line.trim())).length;

  return {
    yearsOfExperience: maxYears,
    roleMentions,
    bulletCount,
  };
}

function computeStructureScore(sections, fullText) {
  const requiredSections = ["skills", "projects", "experience", "education"];
  const presentCount = requiredSections.reduce((sum, key) => {
    return sum + (sections[key] && sections[key].trim().length > 0 ? 1 : 0);
  }, 0);

  const summaryPresent = sections.summary && sections.summary.trim().length > 0 ? 1 : 0;
  const sectionCoverage = (presentCount / requiredSections.length) * 70 + summaryPresent * 10;

  const lineCount = fullText.split("\n").filter((line) => line.trim()).length;
  const lengthScore = lineCount >= 25 && lineCount <= 120 ? 10 : 5;

  const bulletCount = fullText.split("\n").filter((line) => /^\s*[\-\u2022]/.test(line)).length;
  const bulletScore = bulletCount >= 6 ? 10 : 4;

  return clamp(Math.round(sectionCoverage + lengthScore + bulletScore), 0, 100);
}

function computeRelevanceScore(skills, fullText, targetRole) {
  const profile = JOB_PROFILES[targetRole] || JOB_PROFILES["software-engineer"];
  const lowerSkills = new Set(skills.map((skill) => skill.toLowerCase()));

  const requiredMatch = profile.requiredSkills.filter((skill) => lowerSkills.has(skill.toLowerCase())).length;
  const importantMatch = profile.importantSkills.filter((skill) => lowerSkills.has(skill.toLowerCase())).length;

  const requiredCoverage = (requiredMatch / profile.requiredSkills.length) * 65;
  const importantCoverage = (importantMatch / profile.importantSkills.length) * 20;

  const lowerText = fullText.toLowerCase();
  const keywordHits = profile.keywords.reduce((sum, keyword) => {
    return sum + (lowerText.includes(keyword.toLowerCase()) ? 1 : 0);
  }, 0);
  const keywordCoverage = (keywordHits / profile.keywords.length) * 15;

  return clamp(Math.round(requiredCoverage + importantCoverage + keywordCoverage), 0, 100);
}

function computeContentQualityScore(fullText, projects, experienceData) {
  const lower = fullText.toLowerCase();

  const actionVerbHits = ACTION_VERBS.reduce((sum, verb) => {
    return sum + (lower.match(new RegExp(`\\b${verb}\\b`, "g")) || []).length;
  }, 0);

  const metricHits = (fullText.match(/\d+%|\d+\s*(users|clients|projects|hours|days|ms|k|m|x)/gi) || []).length;
  const qualityLength = fullText.split(/\s+/).length;

  const verbScore = clamp(actionVerbHits * 3, 0, 30);
  const metricScore = clamp(metricHits * 6, 0, 30);
  const lengthScore = qualityLength >= 250 ? 20 : qualityLength >= 150 ? 14 : 8;
  const projectScore = clamp(Math.round(projects.avgProjectStrength * 10), 0, 20);

  const experienceDepth = clamp(experienceData.bulletCount * 2, 0, 10);

  return clamp(Math.round(verbScore + metricScore + lengthScore + projectScore + experienceDepth), 0, 100);
}

function buildSuggestions(analysis, targetRole) {
  const suggestions = [];
  const profile = JOB_PROFILES[targetRole] || JOB_PROFILES["software-engineer"];

  if (analysis.structureScore < 65) {
    suggestions.push("Improve resume structure by adding clear section headers for Skills, Experience, Projects, and Education.");
  }

  if (analysis.contentQualityScore < 65) {
    suggestions.push("Strengthen bullet points with impact metrics (for example percentage improvements, scale, or time saved).");
  }

  if (analysis.projects.projectDescriptions.length < 2) {
    suggestions.push("Add at least 2 project descriptions that explain your role, tech stack, and measurable outcomes.");
  }

  if (analysis.skillGap.missingSkills.length > 0) {
    suggestions.push(`Add or build experience in missing skills for ${profile.label}: ${analysis.skillGap.missingSkills.slice(0, 5).join(", ")}.`);
  }

  if (analysis.experience.yearsOfExperience === 0) {
    suggestions.push("If you are a fresher, highlight internships, freelance work, open-source, or academic projects in an experience-style section.");
  }

  if (analysis.relevanceScore < 60) {
    suggestions.push(`Tailor the resume keywords and project stories toward the target role: ${profile.label}.`);
  }

  if (suggestions.length === 0) {
    suggestions.push("Resume quality is strong. Keep updating with recent achievements and role-specific keywords.");
  }

  return suggestions;
}

function analyzeSkillGap(skills, targetRole) {
  const profile = JOB_PROFILES[targetRole] || JOB_PROFILES["software-engineer"];
  const skillSet = new Set(skills.map((skill) => skill.toLowerCase()));

  const missingSkills = profile.requiredSkills.filter((skill) => !skillSet.has(skill.toLowerCase()));
  const importantMissing = profile.importantSkills.filter((skill) => !skillSet.has(skill.toLowerCase()));
  const matchedRequired = profile.requiredSkills.length - missingSkills.length;

  const coverage = clamp(Math.round((matchedRequired / profile.requiredSkills.length) * 100), 0, 100);

  const nextLearningSteps = [
    ...missingSkills.slice(0, 3),
    ...profile.learningResources.slice(0, 2),
    ...importantMissing.slice(0, 2),
  ].slice(0, 6);

  return {
    role: profile.label,
    missingSkills,
    importantMissing,
    coverage,
    nextLearningSteps,
  };
}

function recommendRoles(skills, baseScore) {
  const skillSet = new Set(skills.map((skill) => skill.toLowerCase()));

  const rankedRoles = Object.entries(JOB_PROFILES)
    .map(([key, profile]) => {
      const requiredHits = profile.requiredSkills.filter((skill) => skillSet.has(skill.toLowerCase())).length;
      const importantHits = profile.importantSkills.filter((skill) => skillSet.has(skill.toLowerCase())).length;

      const skillMatch =
        (requiredHits / profile.requiredSkills.length) * 80 +
        (importantHits / Math.max(profile.importantSkills.length, 1)) * 20;

      const blended = Math.round(skillMatch * 0.65 + baseScore * 0.35);

      return {
        key,
        role: profile.label,
        matchScore: clamp(blended, 0, 100),
        reason: `Matches ${requiredHits}/${profile.requiredSkills.length} core skills`,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 4);

  const recommendedRoleKeys = new Set(rankedRoles.map((role) => role.key));
  const roleListings = JOB_LISTINGS.filter((job) => recommendedRoleKeys.has(job.role)).slice(0, 6);

  return {
    roles: rankedRoles,
    listings: roleListings,
  };
}

function predictShortlistChance(totalScore, skillCoverage, contentQuality, yearsOfExperience) {
  const weighted = totalScore * 0.5 + skillCoverage * 0.3 + contentQuality * 0.15 + Math.min(yearsOfExperience * 4, 20) * 0.05;
  const probability = clamp(Math.round(weighted), 1, 99);

  let label = "Low";
  if (probability >= 70) {
    label = "High";
  } else if (probability >= 45) {
    label = "Medium";
  }

  return {
    probability,
    label,
    note: "Heuristic estimate based on resume quality and role fit. Use as directional guidance.",
  };
}

function buildProgressSummary(history) {
  if (!history || history.length === 0) {
    return {
      uploads: 0,
      trend: "No data",
      scoreDelta: 0,
      latestScore: 0,
    };
  }

  const latest = history[history.length - 1];
  const first = history[0];
  const scoreDelta = latest.totalScore - first.totalScore;
  const trend = scoreDelta > 0 ? "Improving" : scoreDelta < 0 ? "Declining" : "Stable";

  return {
    uploads: history.length,
    trend,
    scoreDelta,
    latestScore: latest.totalScore,
  };
}

function analyzeResume(text, targetRole) {
  const normalized = normalizeText(text);
  const sections = extractSections(normalized);
  const skills = extractSkills(normalized);
  const education = extractEducation(sections.education || normalized);
  const projects = extractProjects(sections.projects, normalized);
  const experience = extractExperience(sections.experience, normalized);

  const structureScore = computeStructureScore(sections, normalized);
  const relevanceScore = computeRelevanceScore(skills, normalized, targetRole);
  const contentQualityScore = computeContentQualityScore(normalized, projects, experience);

  const totalScore = clamp(Math.round(structureScore * 0.3 + relevanceScore * 0.4 + contentQualityScore * 0.3), 0, 100);

  const skillGap = analyzeSkillGap(skills, targetRole);
  const recommendations = recommendRoles(skills, totalScore);
  const shortlistPrediction = predictShortlistChance(
    totalScore,
    skillGap.coverage,
    contentQualityScore,
    experience.yearsOfExperience
  );

  const analysis = {
    extracted: {
      skills,
      projects: projects.projectDescriptions,
      experienceHighlights: sections.experience
        ? sections.experience.split("\n").filter(Boolean).slice(0, 6)
        : [],
      education,
    },
    projects,
    experience,
    structureScore,
    relevanceScore,
    contentQualityScore,
    totalScore,
    skillGap,
    recommendations,
    shortlistPrediction,
  };

  analysis.suggestions = buildSuggestions(analysis, targetRole);
  return analysis;
}

async function parseResumeFile(file) {
  const ext = path.extname(file.originalname || "").toLowerCase();

  if (ext === ".pdf") {
    const parsed = await pdfParse(file.buffer);
    return parsed.text || "";
  }

  if (ext === ".docx") {
    const extracted = await mammoth.extractRawText({ buffer: file.buffer });
    return extracted.value || "";
  }

  if (ext === ".txt") {
    return file.buffer.toString("utf-8");
  }

  throw new Error("Unsupported file type. Upload PDF, DOCX, or TXT.");
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get("/api/job-profiles", (_req, res) => {
  const profiles = Object.entries(JOB_PROFILES).map(([key, profile]) => ({
    key,
    label: profile.label,
  }));
  res.json({ profiles });
});

app.get("/api/candidates/:candidateId", (req, res) => {
  const { candidateId } = req.params;
  const store = readStore();
  const candidate = store.candidates[candidateId];

  if (!candidate) {
    return res.status(404).json({ error: "Candidate not found" });
  }

  const history = candidate.history || [];

  return res.json({
    candidateId,
    profile: candidate.profile,
    latest: candidate.latest,
    history,
    progress: buildProgressSummary(history),
  });
});

app.post("/api/analyze", upload.single("resume"), async (req, res) => {
  try {
    const { candidateId: incomingCandidateId, name, email, targetRole } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Please upload a resume file" });
    }

    const parsedText = await parseResumeFile(req.file);
    if (!parsedText || parsedText.trim().length < 40) {
      return res.status(400).json({
        error: "Could not extract enough text from the resume. Please upload a clearer file.",
      });
    }

    const normalizedTargetRole = JOB_PROFILES[targetRole] ? targetRole : "software-engineer";
    const analysis = analyzeResume(parsedText, normalizedTargetRole);

    const store = readStore();
    const candidateId = incomingCandidateId && store.candidates[incomingCandidateId] ? incomingCandidateId : uuidv4();

    if (!store.candidates[candidateId]) {
      store.candidates[candidateId] = {
        profile: {
          name: name || "Unnamed Candidate",
          email: email || "",
          targetRole: normalizedTargetRole,
          createdAt: new Date().toISOString(),
        },
        history: [],
        latest: null,
      };
    } else {
      if (name) store.candidates[candidateId].profile.name = name;
      if (email) store.candidates[candidateId].profile.email = email;
      store.candidates[candidateId].profile.targetRole = normalizedTargetRole;
    }

    const entry = {
      resumeId: uuidv4(),
      uploadedAt: new Date().toISOString(),
      fileName: req.file.originalname,
      totalScore: analysis.totalScore,
      structureScore: analysis.structureScore,
      relevanceScore: analysis.relevanceScore,
      contentQualityScore: analysis.contentQualityScore,
      shortlistProbability: analysis.shortlistPrediction.probability,
      missingSkills: analysis.skillGap.missingSkills,
      topRecommendedRoles: analysis.recommendations.roles.map((role) => ({
        role: role.role,
        matchScore: role.matchScore,
      })),
    };

    store.candidates[candidateId].latest = {
      targetRole: normalizedTargetRole,
      analysis,
      uploadedAt: entry.uploadedAt,
    };
    store.candidates[candidateId].history.push(entry);

    writeStore(store);

    return res.json({
      candidateId,
      profile: store.candidates[candidateId].profile,
      latest: store.candidates[candidateId].latest,
      history: store.candidates[candidateId].history,
      progress: buildProgressSummary(store.candidates[candidateId].history),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unable to analyze resume" });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Resume Analyzer is running on http://localhost:${PORT}`);
});
