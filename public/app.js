const state = {
  activeCandidateId: "",
  profiles: [],
};

const elements = {
  analyzeForm: document.getElementById("analyzeForm"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  name: document.getElementById("name"),
  email: document.getElementById("email"),
  targetRole: document.getElementById("targetRole"),
  candidateId: document.getElementById("candidateId"),
  resumeFile: document.getElementById("resumeFile"),
  statusText: document.getElementById("statusText"),
  lookupCandidateId: document.getElementById("lookupCandidateId"),
  loadHistoryBtn: document.getElementById("loadHistoryBtn"),
  activeCandidate: document.getElementById("activeCandidate"),
  totalScore: document.getElementById("totalScore"),
  structureScore: document.getElementById("structureScore"),
  relevanceScore: document.getElementById("relevanceScore"),
  contentScore: document.getElementById("contentScore"),
  shortlistChance: document.getElementById("shortlistChance"),
  skillsChips: document.getElementById("skillsChips"),
  projectList: document.getElementById("projectList"),
  educationList: document.getElementById("educationList"),
  suggestionList: document.getElementById("suggestionList"),
  learningList: document.getElementById("learningList"),
  coverageBar: document.getElementById("coverageBar"),
  coverageLabel: document.getElementById("coverageLabel"),
  missingSkills: document.getElementById("missingSkills"),
  importantSkills: document.getElementById("importantSkills"),
  roleList: document.getElementById("roleList"),
  jobList: document.getElementById("jobList"),
  progressMeta: document.getElementById("progressMeta"),
  historyTableBody: document.getElementById("historyTableBody"),
  progressChart: document.getElementById("progressChart"),
};

function setStatus(message, isError = false) {
  elements.statusText.textContent = message;
  elements.statusText.style.color = isError ? "#a53f1f" : "#4f5b65";
}

function formatDate(iso) {
  if (!iso) return "--";
  return new Date(iso).toLocaleString();
}

function renderList(target, items, emptyText) {
  target.innerHTML = "";
  if (!items || items.length === 0) {
    const li = document.createElement("li");
    li.textContent = emptyText;
    target.appendChild(li);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
}

function renderSkills(skills) {
  elements.skillsChips.innerHTML = "";
  if (!skills || skills.length === 0) {
    const note = document.createElement("p");
    note.textContent = "No recognizable skills extracted.";
    elements.skillsChips.appendChild(note);
    return;
  }

  skills.forEach((skill) => {
    const chip = document.createElement("span");
    chip.textContent = skill;
    elements.skillsChips.appendChild(chip);
  });
}

function renderRoles(roles) {
  elements.roleList.innerHTML = "";
  if (!roles || roles.length === 0) {
    renderList(elements.roleList, [], "No role recommendations available.");
    return;
  }

  roles.forEach((role) => {
    const li = document.createElement("li");
    li.textContent = `${role.role} - ${role.matchScore}% match (${role.reason})`;
    elements.roleList.appendChild(li);
  });
}

function renderListings(listings) {
  elements.jobList.innerHTML = "";
  if (!listings || listings.length === 0) {
    renderList(elements.jobList, [], "No listings available for this profile.");
    return;
  }

  listings.forEach((job) => {
    const li = document.createElement("li");
    li.textContent = `${job.title} at ${job.company} (${job.location}) - ${job.summary}`;
    elements.jobList.appendChild(li);
  });
}

function renderProgressChart(history) {
  const svg = elements.progressChart;
  const width = 620;
  const height = 220;
  const padX = 38;
  const padY = 25;

  svg.innerHTML = "";

  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", String(width));
  bg.setAttribute("height", String(height));
  bg.setAttribute("fill", "#fff9f0");
  svg.appendChild(bg);

  for (let i = 0; i <= 4; i += 1) {
    const y = padY + ((height - 2 * padY) * i) / 4;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(padX));
    line.setAttribute("x2", String(width - padX));
    line.setAttribute("y1", String(y));
    line.setAttribute("y2", String(y));
    line.setAttribute("stroke", "#e8dece");
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", "8");
    label.setAttribute("y", String(y + 4));
    label.setAttribute("font-size", "11");
    label.setAttribute("fill", "#6a737a");
    label.textContent = String(100 - i * 25);
    svg.appendChild(label);
  }

  if (!history || history.length === 0) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "50%");
    text.setAttribute("y", "50%");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "#7a8188");
    text.textContent = "Upload resumes to display score progression";
    svg.appendChild(text);
    return;
  }

  const points = history.map((item, idx) => {
    const x = history.length === 1
      ? width / 2
      : padX + (idx * (width - 2 * padX)) / (history.length - 1);
    const y = padY + ((100 - item.totalScore) * (height - 2 * padY)) / 100;
    return { x, y, score: item.totalScore };
  });

  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute(
    "points",
    points.map((p) => `${p.x},${p.y}`).join(" ")
  );
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", "#d94f2b");
  polyline.setAttribute("stroke-width", "3");
  svg.appendChild(polyline);

  points.forEach((point, idx) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", String(point.x));
    circle.setAttribute("cy", String(point.y));
    circle.setAttribute("r", "4.5");
    circle.setAttribute("fill", "#0c7c79");
    svg.appendChild(circle);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(point.x));
    label.setAttribute("y", String(point.y - 9));
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "11");
    label.setAttribute("fill", "#3d454d");
    label.textContent = String(point.score);
    svg.appendChild(label);

    const xTick = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xTick.setAttribute("x", String(point.x));
    xTick.setAttribute("y", String(height - 8));
    xTick.setAttribute("text-anchor", "middle");
    xTick.setAttribute("font-size", "10");
    xTick.setAttribute("fill", "#768088");
    xTick.textContent = `V${idx + 1}`;
    svg.appendChild(xTick);
  });
}

function renderHistory(history) {
  elements.historyTableBody.innerHTML = "";

  if (!history || history.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = "<td colspan='7'>No history yet.</td>";
    elements.historyTableBody.appendChild(row);
    renderProgressChart([]);
    return;
  }

  history
    .slice()
    .reverse()
    .forEach((entry) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatDate(entry.uploadedAt)}</td>
        <td>${entry.fileName}</td>
        <td>${entry.totalScore}</td>
        <td>${entry.structureScore}</td>
        <td>${entry.relevanceScore}</td>
        <td>${entry.contentQualityScore}</td>
        <td>${entry.shortlistProbability}%</td>
      `;
      elements.historyTableBody.appendChild(tr);
    });

  renderProgressChart(history);
}

function renderDashboard(data) {
  const analysis = data?.latest?.analysis;
  if (!analysis) {
    return;
  }

  elements.totalScore.textContent = analysis.totalScore;
  elements.structureScore.textContent = analysis.structureScore;
  elements.relevanceScore.textContent = analysis.relevanceScore;
  elements.contentScore.textContent = analysis.contentQualityScore;
  elements.shortlistChance.textContent = `${analysis.shortlistPrediction.probability}% (${analysis.shortlistPrediction.label})`;

  renderSkills(analysis.extracted.skills);
  renderList(elements.projectList, analysis.extracted.projects, "No clear project descriptions found.");
  renderList(elements.educationList, analysis.extracted.education, "No education section extracted.");
  renderList(elements.suggestionList, analysis.suggestions, "No suggestions available.");
  renderList(elements.learningList, analysis.skillGap.nextLearningSteps, "No learning suggestions right now.");
  renderList(elements.missingSkills, analysis.skillGap.missingSkills, "No core skill gaps detected.");
  renderList(elements.importantSkills, analysis.skillGap.importantMissing, "No important gaps detected.");

  elements.coverageBar.style.width = `${analysis.skillGap.coverage}%`;
  elements.coverageLabel.textContent = `${analysis.skillGap.coverage}% coverage for ${analysis.skillGap.role}`;

  renderRoles(analysis.recommendations.roles);
  renderListings(analysis.recommendations.listings);

  renderHistory(data.history || []);

  const progress = data.progress || {};
  elements.progressMeta.textContent = `Uploads: ${progress.uploads || 0} | Trend: ${progress.trend || "Stable"} | Score change: ${
    progress.scoreDelta || 0
  }`;

  state.activeCandidateId = data.candidateId;
  elements.activeCandidate.textContent = `Candidate ID: ${data.candidateId} | ${data.profile?.name || "Unnamed"} | Target Role: ${
    data.profile?.targetRole || "N/A"
  }`;
  elements.lookupCandidateId.value = data.candidateId;
  elements.candidateId.value = data.candidateId;
}

async function loadProfiles() {
  const response = await fetch("/api/job-profiles");
  const payload = await response.json();
  state.profiles = payload.profiles || [];

  elements.targetRole.innerHTML = "";
  state.profiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.key;
    option.textContent = profile.label;
    elements.targetRole.appendChild(option);
  });
}

async function analyzeResume(event) {
  event.preventDefault();

  const file = elements.resumeFile.files?.[0];
  if (!file) {
    setStatus("Please choose a resume file first.", true);
    return;
  }

  const formData = new FormData();
  formData.append("resume", file);
  formData.append("name", elements.name.value.trim());
  formData.append("email", elements.email.value.trim());
  formData.append("targetRole", elements.targetRole.value);

  const candidateId = elements.candidateId.value.trim();
  if (candidateId) {
    formData.append("candidateId", candidateId);
  }

  elements.analyzeBtn.disabled = true;
  setStatus("Analyzing resume with NLP pipeline...");

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Analysis failed");
    }

    renderDashboard(data);
    setStatus("Analysis complete. Review your suggestions and progress trend.");
  } catch (error) {
    setStatus(error.message || "Unable to analyze resume", true);
  } finally {
    elements.analyzeBtn.disabled = false;
  }
}

async function loadCandidateHistory() {
  const candidateId = elements.lookupCandidateId.value.trim();
  if (!candidateId) {
    setStatus("Enter a candidate ID to load history.", true);
    return;
  }

  setStatus("Loading candidate history...");

  try {
    const response = await fetch(`/api/candidates/${candidateId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Candidate not found");
    }

    renderDashboard({
      candidateId,
      profile: data.profile,
      latest: data.latest,
      history: data.history,
      progress: data.progress,
    });

    setStatus("Candidate history loaded.");
  } catch (error) {
    setStatus(error.message || "Unable to fetch candidate history", true);
  }
}

elements.analyzeForm.addEventListener("submit", analyzeResume);
elements.loadHistoryBtn.addEventListener("click", loadCandidateHistory);

loadProfiles().catch(() => {
  setStatus("Unable to load target roles from server.", true);
});
